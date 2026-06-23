import React from 'react';
import { createPortal } from 'react-dom';
import { Download, Loader2, ChevronDown, FileText, FileSpreadsheet } from 'lucide-react';
import { adminService, downloadBlob, type AuditLogsQuery } from '../../services/adminService';
import { useAlert } from '../alert';
import { cn } from '../../utils/cn';
import { useTranslation } from 'react-i18next';

export interface ReportExportMenuProps {
  from?: string;
  to?: string;
  actorEmail?: string;
  groupId?: string;
  action?: string;
}

type ExportKey =
  | 'activity-csv'
  | 'activity-pdf'
  | 'activity-excel'
  | 'metrics-csv'
  | 'metrics-pdf'
  | 'metrics-excel';

interface MenuCoords {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  openUp: boolean;
}

function makeTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

const INITIAL_LOADING: Record<ExportKey, boolean> = {
  'activity-csv': false,
  'activity-pdf': false,
  'activity-excel': false,
  'metrics-csv': false,
  'metrics-pdf': false,
  'metrics-excel': false,
};

export const ReportExportMenu: React.FC<ReportExportMenuProps> = ({
  from,
  to,
  actorEmail,
  groupId,
  action,
}) => {
  const { alert: appAlert } = useAlert();
  const { t } = useTranslation('reports');

  const [menuOpen, setMenuOpen] = React.useState(false);
  const [coords, setCoords] = React.useState<MenuCoords | null>(null);
  const [loading, setLoading] = React.useState<Record<ExportKey, boolean>>(INITIAL_LOADING);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuHeight = 340;
    const margin = 8;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
    const width = Math.max(rect.width, 260);

    setCoords({
      left: Math.min(rect.left, window.innerWidth - width - margin),
      width,
      openUp,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 6, top: undefined }
        : { top: rect.bottom + 6, bottom: undefined }),
    });
  }, []);

  React.useLayoutEffect(() => {
    if (!menuOpen) return;
    updatePosition();
  }, [menuOpen, updatePosition]);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen, updatePosition]);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [menuOpen]);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [menuOpen]);

  const isAnyLoading = Object.values(loading).some(Boolean);

  const buildQuery = (): AuditLogsQuery => ({
    from: from || undefined,
    to: to || undefined,
    actorEmail: actorEmail?.trim() || undefined,
    groupId: groupId || undefined,
    action: action || undefined,
  });

  const handleExport = async (key: ExportKey) => {
    setMenuOpen(false);
    setLoading((prev) => ({ ...prev, [key]: true }));
    const ts = makeTimestamp();
    const rangeQuery = { from, to };

    try {
      switch (key) {
        case 'activity-csv': {
          const blob = await adminService.exportActivityCsv(buildQuery());
          downloadBlob(blob, `alonix-activity-${ts}.csv`);
          break;
        }
        case 'activity-pdf': {
          const blob = await adminService.exportActivityPdf(buildQuery());
          downloadBlob(blob, `alonix-activity-${ts}.pdf`);
          break;
        }
        case 'activity-excel': {
          const blob = await adminService.exportActivityExcel(buildQuery());
          downloadBlob(blob, `alonix-activity-${ts}.xlsx`);
          break;
        }
        case 'metrics-csv': {
          const blob = await adminService.exportMetricsCsv(rangeQuery);
          downloadBlob(blob, `alonix-metrics-${ts}.csv`);
          break;
        }
        case 'metrics-pdf': {
          const blob = await adminService.exportMetricsPdf(rangeQuery);
          downloadBlob(blob, `alonix-metrics-${ts}.pdf`);
          break;
        }
        case 'metrics-excel': {
          const blob = await adminService.exportMetricsExcel(rangeQuery);
          downloadBlob(blob, `alonix-metrics-${ts}.xlsx`);
          break;
        }
        default:
          break;
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      await appAlert({
        variant: 'danger',
        title: t('export.errorTitle', { defaultValue: 'Export failed' }),
        description:
          err.message ||
          t('export.errorDescription', { defaultValue: 'Could not generate the export file.' }),
      });
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const renderItem = (
    key: ExportKey,
    label: string,
    hint: string,
    icon: React.ReactNode,
    testId: string
  ) => (
    <button
      key={key}
      type="button"
      role="menuitem"
      onClick={() => void handleExport(key)}
      disabled={loading[key]}
      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-foreground hover:bg-primary/10 transition-colors disabled:opacity-50"
      data-testid={testId}
    >
      {loading[key] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {label}
      <span className="ml-auto text-[9px] text-muted-foreground/60">{hint}</span>
    </button>
  );

  const menu =
    menuOpen && coords ? (
      <div
        ref={menuRef}
        role="menu"
        className={cn(
          'fixed z-[250] rounded-xl border border-border/30 bg-background/98 backdrop-blur-xl shadow-2xl shadow-black/30 py-1 max-h-[70vh] overflow-y-auto',
          'animate-in fade-in duration-150',
          coords.openUp ? 'slide-in-from-bottom-1' : 'slide-in-from-top-1'
        )}
        style={{
          left: coords.left,
          width: coords.width,
          top: coords.top,
          bottom: coords.bottom,
        }}
      >
        <p className="px-3 pt-2 pb-1 text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/50">
          {t('export.activitySection', { defaultValue: 'Activity log' })}
        </p>
        {renderItem('activity-csv', t('export.csv'), 'CSV', <Download className="w-3.5 h-3.5" />, 'export-activity-csv')}
        {renderItem('activity-pdf', t('export.pdf'), 'PDF', <FileText className="w-3.5 h-3.5" />, 'export-activity-pdf')}
        {renderItem(
          'activity-excel',
          t('export.excel'),
          'Excel',
          <FileSpreadsheet className="w-3.5 h-3.5" />,
          'export-activity-excel'
        )}
        <div className="my-1 border-t border-border/15" />
        <p className="px-3 pt-1 pb-1 text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/50">
          {t('export.metricsSection', { defaultValue: 'Metrics & compliance' })}
        </p>
        {renderItem('metrics-csv', t('export.csv'), 'CSV', <Download className="w-3.5 h-3.5" />, 'export-metrics-csv')}
        {renderItem('metrics-pdf', t('export.pdf'), 'PDF', <FileText className="w-3.5 h-3.5" />, 'export-metrics-pdf')}
        {renderItem(
          'metrics-excel',
          t('export.excel'),
          'Excel',
          <FileSpreadsheet className="w-3.5 h-3.5" />,
          'export-metrics-excel'
        )}
      </div>
    ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        disabled={isAnyLoading}
        className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2.5 text-sm font-bold text-primary hover:bg-primary/15 disabled:opacity-50"
        aria-label={t('export.format', { defaultValue: 'Export format' })}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        {isAnyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {t('export.button', { defaultValue: 'Export' })}
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', menuOpen && 'rotate-180')} />
      </button>
      {typeof document !== 'undefined' && menu ? createPortal(menu, document.body) : null}
    </>
  );
};
