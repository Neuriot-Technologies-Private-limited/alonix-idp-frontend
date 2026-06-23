import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, FileText, HardDrive, Activity, Users, CheckCircle, XCircle, Loader2, ArrowUpRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useTranslation } from 'react-i18next';
import { DateRangePicker } from '../../components/reports/DateRangePicker';
import { rangeForPreset, type DatePreset, type DateRange } from '../../utils/reportDateRange';
import { ActivitySeriesChart } from '../../components/reports/ActivitySeriesChart';
import { PipelineMetricsChart } from '../../components/reports/PipelineMetricsChart';
import { TopUsersChart } from '../../components/reports/TopUsersChart';
import { ReportExportMenu } from '../../components/reports/ReportExportMenu';
import { StatCard } from '../../components/ui/StatCard';
import { MetricStateCard, MetricStateGrid } from '../../components/ui/MetricStateCard';
import { useActivitySeries, useUsageSummary, usePipelineMetrics, useMetricsByUser } from '../../services/adminService';
import { useOrgQuota } from '../../hooks/useOrgQuota';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function quotaPercent(used: number, limit: number): number {
  if (limit <= 0 || limit === -1) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export interface ReportsPageProps {
  headerActions?: React.ReactNode;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ headerActions }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('reports');
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId') || undefined;

  const [preset, setPreset] = React.useState<DatePreset>('30d');
  const [range, setRange] = React.useState<DateRange>(() => rangeForPreset('30d'));

  const handleRangeChange = (newRange: DateRange, newPreset: DatePreset) => {
    setRange(newRange);
    setPreset(newPreset);
  };

  const { data: activitySeries, isLoading: activityLoading } = useActivitySeries({
    ...range,
    groupId,
  });

  const { data: usageSummary, isLoading: usageLoading } = useUsageSummary(range);

  const { data: pipelineMetrics, isLoading: pipelineLoading } = usePipelineMetrics();

  const { data: byUser, isLoading: usersMetricsLoading } = useMetricsByUser({
    ...range,
    limit: 10,
  });

  const { quota, isLoading: quotaLoading, saasBilling } = useOrgQuota();

  return (
    <div className="w-full max-w-6xl mx-auto pb-16 animate-in fade-in duration-500 space-y-6">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 rounded-xl border border-border/20 bg-surface-highest/10 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('page.backToDashboard')}
        </button>
      </div>

      {/* Hero Section */}
      <section
        className={cn(
          'relative overflow-visible rounded-3xl border border-border/20 dark:border-border/10 p-6 sm:p-8 shadow-2xl shadow-black/20',
          'bg-gradient-to-br from-primary/15 via-surface-highest/20 to-background'
        )}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
                {t('page.badge')}
              </span>
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {t('page.title')}
            </h1>
            <p className="mt-1 max-w-xl text-sm font-medium text-muted-foreground">
              {t('page.subtitle')}
            </p>
          </div>
          {/* export slot */}
          <div className="flex items-center gap-2 lg:self-end">
            {headerActions ?? (
              <ReportExportMenu
                from={range.from}
                to={range.to}
                groupId={groupId}
              />
            )}
          </div>
        </div>
      </section>

      {/* Date Range Picker */}
      <DateRangePicker value={preset} onChange={handleRangeChange} />

      {/* KPI Cards */}
      <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <StatCard
          label={t('kpi.documentUploads')}
          value={usageSummary?.documentUploads ?? '—'}
          icon={<FileText className="w-4 h-4" />}
          loading={usageLoading}
        />
        <StatCard
          label={t('kpi.storageAdded')}
          value={usageSummary ? formatBytes(usageSummary.storageBytesAdded) : '—'}
          icon={<HardDrive className="w-4 h-4" />}
          loading={usageLoading}
        />
        <StatCard
          label={t('kpi.auditEvents')}
          value={usageSummary?.auditEvents ?? '—'}
          icon={<Activity className="w-4 h-4" />}
          loading={usageLoading}
        />
        <StatCard
          label={t('kpi.activeUsers')}
          value={usageSummary?.activeUsers ?? '—'}
          icon={<Users className="w-4 h-4" />}
          loading={usageLoading}
        />
      </section>

      {/* Pipeline Metrics Cards */}
      <section>
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-3">
          {t('pipeline.heading')}
        </h2>
        <MetricStateGrid columns="six">
          <MetricStateCard
            label={t('pipeline.totalDocs')}
            value={pipelineMetrics?.totalDocuments ?? '—'}
            icon={FileText}
            tone="primary"
            compact
          />
          <MetricStateCard
            label={t('pipeline.successRate')}
            value={pipelineMetrics ? `${pipelineMetrics.successRatePercent}%` : '—'}
            icon={CheckCircle}
            tone="emerald"
            compact
          />
          <MetricStateCard
            label={t('pipeline.failed')}
            value={pipelineMetrics?.failedDocuments ?? '—'}
            icon={XCircle}
            tone="rose"
            compact
          />
          <MetricStateCard
            label={t('pipeline.ingestDone')}
            value={pipelineMetrics?.ingestCompleted ?? '—'}
            icon={CheckCircle}
            tone="primary"
            compact
          />
          <MetricStateCard
            label={t('pipeline.extractDone')}
            value={pipelineMetrics?.extractCompleted ?? '—'}
            icon={CheckCircle}
            tone="violet"
            compact
          />
          <MetricStateCard
            label={t('pipeline.jobsProcessing')}
            value={pipelineMetrics?.jobsProcessing ?? '—'}
            icon={Loader2}
            tone="amber"
            compact
          />
        </MetricStateGrid>
      </section>

      {/* Quota Usage */}
      {saasBilling && (
        <section className="rounded-2xl border border-border/10 bg-surface-highest/5 p-5 space-y-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
            {t('quota.heading')}
          </h2>
          {quotaLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">{t('charts.loading')}</span>
            </div>
          ) : quota ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  { key: 'documentsMonth', label: t('quota.documents') },
                  { key: 'questionsMonth', label: t('quota.questions') },
                  { key: 'storageBytes', label: t('quota.storage') },
                  { key: 'users', label: t('quota.users') },
                  { key: 'connectors', label: t('quota.connectors') },
                ] as const
              ).map(({ key, label }) => {
                const m = quota.metrics[key];
                if (!m || m.notIncluded) return null;
                const pct = m.unlimited ? 0 : quotaPercent(m.used, m.limit);
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                      <span>{label}</span>
                      <span className="tabular-nums">
                        {m.unlimited
                          ? `${m.used} / ∞`
                          : key === 'storageBytes'
                            ? `${formatBytes(m.used)} / ${formatBytes(m.limit)}`
                            : `${m.used} / ${m.limit}`}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-border/20 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          m.atCap ? 'bg-destructive' : pct > 80 ? 'bg-warning' : 'bg-primary'
                        )}
                        style={{ width: m.unlimited ? '0%' : `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>
      )}

      {/* Charts */}
      <section className="space-y-6">
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Activity Series */}
          <div className="rounded-2xl border border-border/20 bg-surface-high/40 p-5 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-4">
              {t('charts.activitySeriesTitle')}
            </h3>
            <ActivitySeriesChart data={activitySeries} loading={activityLoading} />
          </div>

          {/* Pipeline Chart */}
          <div className="rounded-2xl border border-border/20 bg-surface-high/40 p-5 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-4">
              {t('charts.pipelineTitle')}
            </h3>
            <PipelineMetricsChart data={pipelineMetrics} loading={pipelineLoading} />
          </div>
        </div>

        {/* Top Users */}
        <div className="rounded-2xl border border-border/20 bg-surface-high/40 p-5 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-4">
            {t('charts.topUsersTitle')}
          </h3>
          <TopUsersChart data={byUser?.users} loading={usersMetricsLoading} />
        </div>
      </section>

      {/* Link to Activity */}
      <section className="flex items-center">
        <button
          type="button"
          onClick={() => navigate('/activity', { state: { from: '/reports', fromLabel: 'Reports' } })}
          className="inline-flex items-center gap-2 text-primary font-bold text-xs hover:opacity-80 transition-all"
        >
          {t('page.viewFullAuditLog')}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </section>
    </div>
  );
};
