import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Loader2,
  Files,
  DatabaseZap,
  ScanSearch,
  Tags,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatDiscoveryUploadedAt } from '../../utils/formatDateTime';
import { usePipelineDocuments } from '../../hooks/useDocuments';
import { Loader } from '../../components/ui/Loader';
import { useAuthStore } from '../../stores/authStore';
import { useRbac } from '../../hooks/useRbac';
import { membershipForGroup } from '../../core/rbac/capabilities';
import {
  triggerIngest,
  triggerExtract,
  triggerClassify,
  uploadDocument,
  deleteDocument,
  getDocumentResults,
  getDocumentAccessUrl,
} from '../../services/chatApi';
import { connectSocket, getSocket } from '../../services/chatSocket';
import { Pagination } from '../../components/ui/Pagination';
import { mergePipeline, useGroupHealth } from '../../services/adminService';
import { useUsers } from '../../services/userService';
import { resolveCustodianDisplay } from '../../utils/custodianDisplay';
import { MetricStateCard, MetricStateGrid } from '../../components/ui/MetricStateCard';
import { SearchToolbarRow } from '../../components/ui/SearchToolbarRow';
import { DocumentAssetIdentity } from './DocumentAssetIdentity';
import { DocumentCustodian } from './DocumentCustodian';
import { DocumentPipelineLifecycle } from './DocumentPipelineLifecycle';
import { DocumentPipelineActions } from './DocumentPipelineActions';
import { DocumentResultModal } from './DocumentResultModal';
import { DocumentUploadModal } from './DocumentUploadModal';
import { useAlert } from '../../components/alert';

export const DocumentsPage: React.FC = () => {
  const { confirm, alert: appAlert } = useAlert();
  const queryClient = useQueryClient();
  const { data: documents, isLoading } = usePipelineDocuments();
  const { hasCapability, orgRole, groups, adminGroupIds } = useRbac();
  const { data: groupHealthList = [] } = useGroupHealth();
  const { data: directoryUsers = [] } = useUsers();
  const isCompanyAdmin = orgRole === 'COMPANY_ADMIN';
  const hasBulkActions = isCompanyAdmin || (adminGroupIds?.length ?? 0) > 0;
  const canUploadDocs = isCompanyAdmin || (adminGroupIds?.length ?? 0) > 0;
  const isPureViewOnly = !canUploadDocs;

  const docCanManage = React.useCallback(
    (d: any) => {
      if (isCompanyAdmin) return true;
      const m = membershipForGroup(groups, d.groupId, d.group);
      return m?.role === 'GROUP_ADMIN';
    },
    [isCompanyAdmin, groups]
  );

  const [activeTab, setActiveTab] = useState<'All' | 'Ingest' | 'Extract' | 'Classify'>('All');
  const [resultModal, setResultModal] = useState<any | null>(null);
  const [resultLoadingDocId, setResultLoadingDocId] = useState<string | null>(null);
  const [extractFormat, setExtractFormat] = useState<'json' | 'csv' | 'md'>('json');
  const [search, setSearch] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [targetGroupId, setTargetGroupId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkBusy, setBulkBusy] = useState<'ingest' | 'extract' | 'classify' | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [openDocBusyId, setOpenDocBusyId] = useState<string | null>(null);
  const headerCheckboxRef = React.useRef<HTMLInputElement>(null);
  const itemsPerPage = 8;

  const context = useAuthStore((s) => s.context);
  const user = useAuthStore((s) => s.user);
  const activeGroupIdForScope = context?.activeGroupId ?? null;
  const activeGroup = groups.find((g) => g.groupId === activeGroupIdForScope);
  const activeGroupNameNorm = activeGroup?.groupName?.trim().toLowerCase() ?? '';

  const custodianNameByEmail = React.useMemo(() => {
    const m = new Map<string, string>();
    if (user?.email) {
      const label = (user.displayName || user.name || user.username || '').trim();
      if (label) m.set(user.email.toLowerCase(), label);
    }
    for (const row of directoryUsers) {
      if (row.email && row.name) m.set(row.email.toLowerCase(), row.name);
    }
    return m;
  }, [user, directoryUsers]);

  const uploadGroupChoices = React.useMemo(() => {
    if (isCompanyAdmin) {
      return groupHealthList.map((h) => ({ groupId: h.id, groupName: h.name }));
    }
    return groups.filter((g) => g.role === 'GROUP_ADMIN');
  }, [isCompanyAdmin, groupHealthList, groups]);

  const groupIdSet = React.useMemo(
    () => new Set(groups.map((g) => g.groupId.toLowerCase())),
    [groups]
  );
  const groupNameSet = React.useMemo(
    () => new Set(groups.map((g) => g.groupName.trim().toLowerCase())),
    [groups]
  );

  const bustKey = (docId: string, action: string) => `${docId}:${action}`;

  const handleDeleteDocument = React.useCallback(
    async (docItem: any) => {
      if (!docCanManage(docItem)) return;
      const name = docItem.fileName || 'this document';
      const ok = await confirm({
        title: 'Remove from vault?',
        description: (
          <>
            Remove <span className="font-semibold text-foreground/95">“{name}”</span> from the vault? This cannot be
            undone.
          </>
        ),
        variant: 'danger',
        confirmLabel: 'Remove',
        cancelLabel: 'Cancel',
      });
      if (!ok) return;
      setDeleteBusyId(docItem.id);
      try {
        const gid = docItem.groupId ? String(docItem.groupId) : undefined;
        await deleteDocument(docItem.id, gid || null);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(docItem.id);
          return next;
        });
        await queryClient.invalidateQueries({ queryKey: ['pipeline-documents'] });
        await queryClient.invalidateQueries({ queryKey: ['documents'] });
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { error?: string } }; message?: string };
        const msg = ax.response?.data?.error || ax.message || 'Could not delete document.';
        await appAlert({ title: 'Could not delete', description: msg, variant: 'danger' });
      } finally {
        setDeleteBusyId(null);
      }
    },
    [appAlert, confirm, docCanManage, queryClient]
  );

  const handleOpenDocument = React.useCallback(
    async (docItem: any) => {
      setOpenDocBusyId(String(docItem.id));
      try {
        const gid = docItem.groupId ? String(docItem.groupId) : undefined;
        const access = await getDocumentAccessUrl(String(docItem.id), gid || null);
        const url = String(access?.data?.url || '').trim();
        if (!url) throw new Error('Document URL is unavailable');

        const fileName = String(docItem.fileName || 'document');
        const lower = fileName.toLowerCase();
        const isPdf = lower.endsWith('.pdf') || String(docItem.type || '').toUpperCase() === 'PDF';

        const a = document.createElement('a');
        a.href = url;
        if (isPdf) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        } else {
          a.download = fileName;
        }
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e: unknown) {
        const ax = e as { response?: { data?: { message?: string; error?: string } }; message?: string };
        await appAlert({
          title: 'Could not open document',
          description:
            ax.response?.data?.message ||
            ax.response?.data?.error ||
            ax.message ||
            'Unable to load this document right now.',
          variant: 'danger',
        });
      } finally {
        setOpenDocBusyId(null);
      }
    },
    [appAlert]
  );

  const runPipeline = async (docId: string, action: 'ingest' | 'extract' | 'classify') => {
    const docRow = documents?.find((d: any) => d.id === docId);
    if (docRow && !docCanManage(docRow)) return;
    const gid = docRow?.groupId ? String(docRow.groupId) : undefined;
    const collectionName = (docRow?.group && String(docRow.group)) || gid || docId;
    const k = bustKey(docId, action);
    setActionBusyKey(k);
    try {
      if (action === 'ingest') {
        await triggerIngest(docId, { collectionName }, gid || null);
      } else if (action === 'extract') {
        await triggerExtract(docId, gid || null);
      } else {
        await triggerClassify(docId, gid || null);
      }
      await queryClient.invalidateQueries({ queryKey: ['pipeline-documents'] });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string; detail?: string } }; message?: string };
      const msg =
        ax.response?.data?.detail ||
        ax.response?.data?.error ||
        ax.message ||
        `Could not start ${action}.`;
      await appAlert({
        title: `Could not start ${action}`,
        description: msg,
        variant: 'danger',
      });
    } finally {
      setActionBusyKey(null);
    }
  };

  const bulkBusyActive = bulkBusy !== null;

  const toggleSelected = (id: string) => {
    const row = documents?.find((d: any) => d.id === id);
    if (row && !docCanManage(row)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const runBulkPipeline = async (action: 'ingest' | 'extract' | 'classify') => {
    if (selectedIds.size === 0) return;
    setBulkBusy(action);
    try {
      for (const id of selectedIds) {
        const docItem = documents?.find((d: any) => d.id === id);
        if (!docItem?.pipeline || !docCanManage(docItem)) continue;
        const p = docItem.pipeline;
        if (action === 'ingest' && (p.ingestion.status === 'processing' || p.ingestion.status === 'done')) continue;
        if (action === 'extract' && (p.extraction.status === 'processing' || p.extraction.status === 'done')) continue;
        if (action === 'classify' && (p.classification.status === 'processing' || p.classification.status === 'done')) continue;
        const docRow = documents?.find((d: any) => d.id === id);
        const gid = docRow?.groupId ? String(docRow.groupId) : undefined;
        const collectionName = (docRow?.group && String(docRow.group)) || gid || id;
        if (action === 'ingest') {
          await triggerIngest(id, { collectionName }, gid || null);
        } else if (action === 'extract') {
          await triggerExtract(id, gid || null);
        } else {
          await triggerClassify(id, gid || null);
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['pipeline-documents'] });
    } finally {
      setBulkBusy(null);
    }
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab, activeGroupIdForScope]);

  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [activeGroupIdForScope]);

  React.useEffect(() => {
    if (isUploadModalOpen && !isCompanyAdmin && adminGroupIds?.length) {
      setTargetGroupId((prev) =>
        prev && adminGroupIds.includes(prev) ? prev : adminGroupIds[0]
      );
    }
  }, [isUploadModalOpen, isCompanyAdmin, adminGroupIds]);

  const documentsInScope = React.useMemo(() => {
    if (!documents) return [];

    const matchesActiveWorkspace = (d: any) => {
      if (!activeGroupIdForScope) return true;
      const gid = String(d.groupId || '').trim();
      if (gid && gid === activeGroupIdForScope) return true;
      const gname = String(d.group || '').trim().toLowerCase();
      if (activeGroupNameNorm && gname === activeGroupNameNorm) return true;
      return false;
    };

    if (isCompanyAdmin) {
      return documents.filter(matchesActiveWorkspace);
    }
    return documents.filter((d: any) => {
      const docGroupId = String(d.groupId || '').toLowerCase();
      const docGroupName = String(d.group || '').trim().toLowerCase();
      const inMembership =
        (docGroupId && groupIdSet.has(docGroupId)) ||
        (docGroupName && groupNameSet.has(docGroupName));
      if (!inMembership) return false;
      return matchesActiveWorkspace(d);
    });
  }, [
    documents,
    isCompanyAdmin,
    groupIdSet,
    groupNameSet,
    activeGroupIdForScope,
    activeGroupNameNorm,
  ]);

  React.useEffect(() => {
    if (isPureViewOnly && activeTab !== 'All') setActiveTab('All');
  }, [isPureViewOnly, activeTab]);

  React.useEffect(() => {
    if (!hasBulkActions) setSelectedIds(new Set());
  }, [hasBulkActions]);

  React.useEffect(() => {
    const email = String(user?.email || '').trim();
    const gid = String(context?.activeGroupId || user?.groupID || user?.groupId || '').trim();
    if (!email) return;

    connectSocket(email, gid);
    const socket = getSocket();
    if (!socket) return;

    const onJobUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: ['pipeline-documents'] });
      void queryClient.invalidateQueries({ queryKey: ['documents'] });
    };

    socket.on('job.update', onJobUpdate);
    return () => {
      socket.off('job.update', onJobUpdate);
    };
  }, [context?.activeGroupId, queryClient, user?.email, user?.groupID, user?.groupId]);

  const filtered = React.useMemo(() => {
    if (!documents) return [];
    let list = documentsInScope.slice();

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d: any) => {
        const { label } = resolveCustodianDisplay(d.uploader, custodianNameByEmail);
        return (
          d.fileName.toLowerCase().includes(q) ||
          String(d.uploader ?? '').toLowerCase().includes(q) ||
          label.toLowerCase().includes(q)
        );
      });
    }

    if (activeTab === 'All') return list;

    return list.filter((d: any) => {
      const p = mergePipeline(d.pipeline);
      if (activeTab === 'Ingest') return p.ingestion.status === 'processing' || p.ingestion.status === 'idle';
      if (activeTab === 'Extract')
        return p.ingestion.status === 'done' && (p.extraction.status === 'processing' || p.extraction.status === 'idle');
      if (activeTab === 'Classify')
        return p.extraction.status === 'done' && (p.classification.status === 'processing' || p.classification.status === 'idle');
      return true;
    });
  }, [documentsInScope, activeTab, search, documents, custodianNameByEmail]);

  const paginatedDocuments = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const manageableOnPage = React.useMemo(
    () => paginatedDocuments.filter((d: any) => docCanManage(d)),
    [paginatedDocuments, docCanManage]
  );

  const selectedDocs = React.useMemo(
    () => filtered.filter((d: any) => selectedIds.has(d.id) && docCanManage(d)),
    [filtered, selectedIds, docCanManage]
  );

  const bulkIngestCount = selectedDocs.filter((d: any) => {
    const p = mergePipeline(d.pipeline);
    return p.ingestion.status !== 'processing' && p.ingestion.status !== 'done';
  }).length;
  const bulkExtractCount = selectedDocs.filter((d: any) => {
    const p = mergePipeline(d.pipeline);
    return p.extraction.status !== 'processing' && p.extraction.status !== 'done';
  }).length;
  const bulkClassifyCount = selectedDocs.filter((d: any) => {
    const p = mergePipeline(d.pipeline);
    return p.classification.status !== 'processing' && p.classification.status !== 'done';
  }).length;

  const allPageSelected =
    manageableOnPage.length > 0 && manageableOnPage.every((d: any) => selectedIds.has(d.id));
  const somePageSelected = manageableOnPage.some((d: any) => selectedIds.has(d.id));

  const toggleSelectPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        manageableOnPage.forEach((d: any) => next.delete(d.id));
      } else {
        manageableOnPage.forEach((d: any) => next.add(d.id));
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filtered.filter((d: any) => docCanManage(d)).map((d: any) => d.id)));
  };

  React.useEffect(() => {
    const el = headerCheckboxRef.current;
    if (el) el.indeterminate = somePageSelected && !allPageSelected;
  }, [somePageSelected, allPageSelected]);

  const counts = React.useMemo(() => {
    const scope = documentsInScope;
    if (!scope.length && !documents?.length)
      return { all: 0, ingested: 0, extracted: 0, classified: 0, failed: 0 };
    return {
      all: scope.length,
      ingested: scope.filter((d: any) => mergePipeline(d.pipeline).ingestion.status === 'done').length,
      extracted: scope.filter((d: any) => mergePipeline(d.pipeline).extraction.status === 'done').length,
      classified: scope.filter((d: any) => mergePipeline(d.pipeline).classification.status === 'done').length,
      failed: scope.filter((d: any) => {
        const p = mergePipeline(d.pipeline);
        return (
          p.ingestion.status === 'error' ||
          p.extraction.status === 'error' ||
          p.classification.status === 'error'
        );
      }).length,
    };
  }, [documentsInScope, documents?.length]);

  const getExtractionText = (res: any, fmt: string) => {
    if (!res) return '';

    const formats = res?.formats && typeof res.formats === 'object' ? res.formats : null;
    if (formats && typeof formats[fmt] === 'string') {
      return formats[fmt] as string;
    }
    if (formats && formats[fmt] && fmt === 'json') {
      return JSON.stringify(formats[fmt], null, 2);
    }

    if (fmt === 'json') return JSON.stringify(res, null, 2);

    const pages = Array.isArray(res?.pages) ? res.pages : [];
    const toCellString = (value: unknown) => {
      if (value == null) return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      return JSON.stringify(value);
    };
    const getPageNumber = (page: any, idx: number) => {
      const candidate =
        page?.page_number ??
        page?.page ??
        page?.pageIndex ??
        page?.index ??
        page?.page_content?.page_number;
      const n = Number(candidate);
      return Number.isFinite(n) && n > 0 ? n : idx + 1;
    };
    const getPageKeyValues = (page: any): Record<string, unknown> | null => {
      const kv =
        page?.key_value_pairs ??
        page?.page_content?.key_value_pairs ??
        page?.fields;
      if (!kv || typeof kv !== 'object' || Array.isArray(kv)) return null;
      return kv as Record<string, unknown>;
    };
    const kvRows: Array<{ page: number; key: string; value: unknown }> = [];
    const pageChunks: Array<{ page: number; keyValues: Record<string, unknown> }> = [];
    pages.forEach((p: any, idx: number) => {
      const pageNum = getPageNumber(p, idx);
      const keyValues = getPageKeyValues(p);
      if (keyValues) {
        pageChunks.push({ page: pageNum, keyValues });
        for (const [k, v] of Object.entries(keyValues)) {
          kvRows.push({ page: pageNum, key: String(k), value: v });
        }
      }
    });

    if (fmt === 'csv') {
      if (kvRows.length > 0) {
        return [
          'page,key,value',
          ...kvRows.map((r) => `${r.page},"${r.key.replace(/"/g, '""')}","${toCellString(r.value).replace(/"/g, '""')}"`),
        ].join('\n');
      }
      if (res && typeof res === 'object' && !Array.isArray(res)) {
        return (
          Object.keys(res).join(',') +
          '\n' +
          Object.values(res)
            .map((v) => (Array.isArray(v) ? `"${v.join(';')}"` : `"${v}"`))
            .join(',')
        );
      }
      return String(res);
    }

    if (fmt === 'md') {
      if (pageChunks.length > 0) {
        return pageChunks
          .map(({ page, keyValues }) =>
            [`### Page ${page}`, ...Object.entries(keyValues).map(([k, v]) => `- **${k}**: ${toCellString(v)}`)].join('\n')
          )
          .join('\n\n');
      }
      if (pages.length > 0) {
        return pages
          .map((p: any, idx: number) => {
            const pageNum = getPageNumber(p, idx);
            return `### Page ${pageNum}\n\`\`\`json\n${JSON.stringify(p, null, 2)}\n\`\`\``;
          })
          .join('\n\n');
      }
      if (res && typeof res === 'object' && !Array.isArray(res)) {
        return Object.entries(res)
          .map(([k, v]) => `**${k}**: ${Array.isArray(v) ? v.map(toCellString).join(', ') : toCellString(v)}`)
          .join('\n\n');
      }
      return String(res);
    }
    return '';
  };

  const handleExport = (data: any, fmt: string, filename: string) => {
    const text = getExtractionText(data, fmt);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_extracted.${fmt}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenResults = React.useCallback(
    async (docItem: any) => {
      if (!docItem?.id) return;
      const gid = docItem?.groupId ? String(docItem.groupId) : undefined;
      setResultLoadingDocId(String(docItem.id));
      try {
        const { data } = await getDocumentResults(String(docItem.id), gid || null);
        setResultModal({
          ...docItem,
          ...data,
          extractionResult: (data as any).extractionResult ?? (data as any).extractedData ?? docItem.extractionResult,
          classificationData: (data as any).classificationData ?? docItem.classificationData,
          jobs: Array.isArray((data as any).jobs) ? (data as any).jobs : docItem.jobs,
        });
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { error?: string } }; message?: string };
        await appAlert({
          title: 'Could not fetch results',
          description: ax.response?.data?.error || ax.message || 'Please try again.',
          variant: 'danger',
        });
      } finally {
        setResultLoadingDocId(null);
      }
    },
    [appAlert]
  );

  const headerSubtitle = isCompanyAdmin
    ? 'Organization-wide vault: ingest, run pipeline stages, and review AI outputs across all workspaces.'
    : isPureViewOnly
      ? 'View documents and AI extraction or classification results for workspaces assigned to you. Pipeline actions are limited to administrators.'
      : 'Manage the document pipeline for workspaces where you are a group admin; other assigned workspaces are view-only.';

  const pipelineTabs = isPureViewOnly
    ? [{ id: 'All' as const, label: 'All', count: counts.all }]
    : [
        { id: 'All' as const, label: 'All', count: counts.all },
        { id: 'Ingest' as const, label: 'Ingest', count: counts.ingested },
        { id: 'Extract' as const, label: 'Extract', count: counts.extracted },
        { id: 'Classify' as const, label: 'Classify', count: counts.classified },
      ];

  return (
    <div className="w-full space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-[max(5rem,env(safe-area-inset-bottom))]">
      <section className="flex flex-col sm:flex-row justify-between items-stretch sm:items-start gap-4">
        <div className="space-y-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-black font-display text-foreground tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent flex flex-wrap items-center gap-2.5">
            Documents
            {isPureViewOnly ? (
              <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg bg-surface-highest/5 border border-border/10 text-muted-foreground/80 shrink-0">
                View only
              </span>
            ) : null}
          </h1>
          <p className="text-muted-foreground font-medium text-[11px] sm:text-[12px] tracking-wide max-w-lg">
            {headerSubtitle}
          </p>
        </div>
        {canUploadDocs ? (
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-primary hover:opacity-90 transition-all text-primary-foreground font-bold text-[11px] uppercase tracking-widest px-5 py-3 rounded-xl flex items-center justify-center gap-2 border border-border/10 active:scale-95 shrink-0 group shadow-lg shadow-primary/10 w-full sm:w-auto"
          >
            <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            Upload Assets
          </button>
        ) : null}
      </section>

      <MetricStateGrid>
        <MetricStateCard label="Total Documents" value={counts.all} tone="primary" icon={Files} />
        <MetricStateCard label="Ingested" value={counts.ingested} tone="emerald" icon={DatabaseZap} />
        <MetricStateCard label="Extracted" value={counts.extracted} tone="violet" icon={ScanSearch} />
        <MetricStateCard label="Classified" value={counts.classified} tone="amber" icon={Tags} />
        <MetricStateCard label="Failed" value={counts.failed} tone="rose" icon={AlertTriangle} />
      </MetricStateGrid>

      <SearchToolbarRow
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search by file name, email, or custodian name…',
        }}
        end={
          <div className="flex min-w-max items-center gap-1 bg-surface-highest/30 dark:bg-surface-highest/20 p-1 rounded-xl border border-border/35 dark:border-border/50 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)] shrink-0">
            {pipelineTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as 'All' | 'Ingest' | 'Extract' | 'Classify')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all relative flex items-center gap-2',
                  activeTab === t.id
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                    : 'text-muted-foreground/65 dark:text-muted-foreground/55 hover:text-foreground'
                )}
              >
                {t.label}
                {t.count > 0 && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-md text-[8px] font-black',
                      activeTab === t.id
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-surface-highest/50 text-muted-foreground/55 dark:text-muted-foreground/45'
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        }
      />

      <section
        id="documents-vault-table"
        className={cn(
          'bg-gradient-to-b from-surface-highest/25 via-surface-highest/12 to-transparent rounded-2xl overflow-hidden border border-border/35 dark:border-border/50 backdrop-blur-xl shadow-xl relative scroll-mt-24',
          isLoading && 'min-h-[min(420px,52vh)]'
        )}
      >
        {isLoading ? (
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 rounded-2xl bg-background/70 backdrop-blur-md"
            aria-busy="true"
            aria-label="Loading documents"
          >
            <Loader variant="section" label="Syncing vault assets..." />
          </div>
        ) : null}
        <div className={cn(isLoading && 'pointer-events-none select-none opacity-[0.38]')}>
        <div className="px-3 sm:px-6 py-3 border-b border-border/30 dark:border-border/45 bg-gradient-to-r from-primary/14 via-primary/6 to-transparent flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/65 dark:text-muted-foreground/55 tabular-nums order-2 sm:order-1">
            {filtered.length} document{filtered.length !== 1 ? 's' : ''}
            {filtered.length > 0 ? (
              <span className="text-muted-foreground/35">
                {' · '}page {currentPage} of {Math.max(1, Math.ceil(filtered.length / itemsPerPage))}
              </span>
            ) : null}
          </p>

          {hasBulkActions && selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center justify-end gap-2 order-1 sm:order-2 w-full sm:w-auto">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary tabular-nums shrink-0">
                {selectedIds.size} selected
              </span>
              <button
                type="button"
                title={bulkIngestCount ? `Run ingest on ${bulkIngestCount} document(s)` : 'No selected documents need ingest'}
                disabled={bulkBusyActive || bulkIngestCount === 0}
                onClick={() => void runBulkPipeline('ingest')}
                className={cn(
                  'px-3 py-2 rounded-xl font-black text-[8px] uppercase tracking-widest border transition-all flex items-center gap-1.5',
                  bulkBusyActive || bulkIngestCount === 0
                    ? 'bg-surface-highest/10 text-muted-foreground/35 border-border/10'
                    : 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                )}
              >
                {bulkBusy === 'ingest' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Bulk ingest{bulkIngestCount ? ` (${bulkIngestCount})` : ''}
              </button>
              <button
                type="button"
                title={bulkExtractCount ? `Run extract on ${bulkExtractCount} document(s)` : 'No selected documents need extract'}
                disabled={bulkBusyActive || bulkExtractCount === 0}
                onClick={() => void runBulkPipeline('extract')}
                className={cn(
                  'px-3 py-2 rounded-xl font-black text-[8px] uppercase tracking-widest border transition-all flex items-center gap-1.5',
                  bulkBusyActive || bulkExtractCount === 0
                    ? 'bg-surface-highest/10 text-muted-foreground/35 border-border/10'
                    : 'bg-violet/10 text-violet border-violet/20 hover:bg-violet/20'
                )}
              >
                {bulkBusy === 'extract' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Bulk extract{bulkExtractCount ? ` (${bulkExtractCount})` : ''}
              </button>
              <button
                type="button"
                title={bulkClassifyCount ? `Run classify on ${bulkClassifyCount} document(s)` : 'No selected documents need classify'}
                disabled={bulkBusyActive || bulkClassifyCount === 0}
                onClick={() => void runBulkPipeline('classify')}
                className={cn(
                  'px-3 py-2 rounded-xl font-black text-[8px] uppercase tracking-widest border transition-all flex items-center gap-1.5',
                  bulkBusyActive || bulkClassifyCount === 0
                    ? 'bg-surface-highest/10 text-muted-foreground/35 border-border/10'
                    : 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20'
                )}
              >
                {bulkBusy === 'classify' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Bulk classify{bulkClassifyCount ? ` (${bulkClassifyCount})` : ''}
              </button>
              {filtered.length > paginatedDocuments.length && (
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="px-2 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-primary border border-transparent hover:border-border/10 transition-all"
                >
                  Select all {filtered.length}
                </button>
              )}
              <button
                type="button"
                onClick={clearSelection}
                className="px-2 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 hover:text-destructive transition-all"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="hidden xl:block overflow-x-auto relative z-10">
          <table
            className={cn(
              'w-full table-fixed text-left border-collapse',
              hasBulkActions ? 'min-w-[1080px]' : 'min-w-[1040px]'
            )}
          >
            <colgroup>
              {hasBulkActions ? <col style={{ width: '44px' }} /> : null}
              <col style={{ width: '280px' }} />
              <col style={{ width: '180px' }} />
              <col style={{ width: '160px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '260px' }} />
            </colgroup>
            <thead className="bg-muted/5">
              <tr>
                {hasBulkActions ? (
                      <th className="w-10 px-3 py-3">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectPage}
                      disabled={manageableOnPage.length === 0}
                      className="h-3.5 w-3.5 rounded border-border/35 dark:border-border/55 bg-surface-highest/60 text-primary focus:ring-primary/30 cursor-pointer accent-primary disabled:opacity-40"
                      title="Select this page"
                    />
                  </th>
                ) : null}
                <th className="px-2 py-2 text-[9px] font-black text-muted-foreground/45 dark:text-muted-foreground/35 uppercase tracking-[0.2em]">
                  Asset Identity
                </th>
                <th className="px-2 py-2 text-[9px] font-black text-muted-foreground/45 dark:text-muted-foreground/35 uppercase tracking-[0.2em] text-center">
                  Pipeline Lifecycle
                </th>
                <th className="px-2 py-2 text-[9px] font-black text-muted-foreground/45 dark:text-muted-foreground/35 uppercase tracking-[0.2em]">
                  Custodian
                </th>
                <th className="px-2 py-2 text-[9px] font-black text-muted-foreground/45 dark:text-muted-foreground/35 uppercase tracking-[0.2em]">
                  Discovery
                </th>
                <th className="w-[260px] px-3 py-3 text-[9px] font-black text-muted-foreground/45 dark:text-muted-foreground/35 uppercase tracking-[0.2em] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20 dark:divide-border/30">
              {paginatedDocuments.map((docItem: any) => {
                const docBusy = Boolean(actionBusyKey?.startsWith(`${docItem.id}:`));
                const isSelected = selectedIds.has(docItem.id);
                return (
                  <tr
                    key={docItem.id}
                    className={cn(
                      'hover:bg-surface-highest/8 transition-all group/row',
                      isSelected && 'bg-primary/[0.04]'
                    )}
                  >
                    {hasBulkActions ? (
                      <td className="w-5 px-2 py-4 align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!docCanManage(docItem)}
                          onChange={() => toggleSelected(docItem.id)}
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            'h-3.5 w-3.5 rounded border-border/35 dark:border-border/55 bg-surface-highest/60 text-primary focus:ring-primary/30 accent-primary',
                            docCanManage(docItem) ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'
                          )}
                        />
                      </td>
                    ) : null}
                    <td className="px-2 py-4">
                      <DocumentAssetIdentity
                        fileName={docItem.fileName}
                        type={docItem.type}
                        size={docItem.size}
                        density="table"
                        canOpenFile={Boolean(docItem?.id)}
                        isOpening={openDocBusyId === String(docItem?.id)}
                        onFileNameClick={() => {
                          void handleOpenDocument(docItem);
                        }}
                      />
                    </td>
                    <td className="px-2 py-4">
                      <DocumentPipelineLifecycle pipeline={docItem.pipeline} />
                    </td>
                    <td className="px-2 py-4">
                      <DocumentCustodian
                        uploader={docItem.uploader}
                        nameByEmail={custodianNameByEmail}
                        variant="table"
                      />
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap">
                      <span className="text-[10px] font-bold text-muted-foreground/60 dark:text-muted-foreground/50 tabular-nums tracking-wide">
                        {formatDiscoveryUploadedAt(docItem.uploadedAt)}
                      </span>
                    </td>
                    <td className="px-2 py-4 text-left align-top">
                      <DocumentPipelineActions
                        docItem={docItem}
                        bulkBusyActive={bulkBusyActive}
                        docBusy={docBusy}
                        actionBusyKey={actionBusyKey}
                        bustKey={bustKey}
                        runPipeline={runPipeline}
                        onOpenResults={(doc) => {
                          void handleOpenResults(doc);
                        }}
                        onDeleteDocument={handleDeleteDocument}
                        deleteBusyId={deleteBusyId}
                        variant="table"
                        readOnly={!docCanManage(docItem)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="xl:hidden px-3 sm:px-4 py-4 space-y-3 border-t border-border/20 dark:border-border/35">
          {paginatedDocuments.length === 0 ? (
            <p className="text-center text-[12px] text-muted-foreground/50 py-12 font-medium">
              No documents match your filters.
            </p>
          ) : (
            paginatedDocuments.map((docItem: any) => {
              const docBusy = Boolean(actionBusyKey?.startsWith(`${docItem.id}:`));
              const isSelected = selectedIds.has(docItem.id);
              return (
                <article
                  key={docItem.id}
                  className={cn(
                    'rounded-2xl border border-border/35 dark:border-border/50 bg-gradient-to-br from-surface-highest/26 to-transparent p-4 shadow-sm shadow-black/5 dark:shadow-black/20 transition-all',
                    isSelected && 'ring-1 ring-primary/35 bg-primary/[0.05]'
                  )}
                >
                  <div className={cn('flex gap-3', !hasBulkActions && 'gap-0')}>
                    {hasBulkActions ? (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!docCanManage(docItem)}
                        onChange={() => toggleSelected(docItem.id)}
                        className={cn(
                          'mt-1 h-4 w-4 shrink-0 rounded border-border/35 dark:border-border/55 bg-surface-highest/60 text-primary focus:ring-primary/30 accent-primary',
                          docCanManage(docItem) ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'
                        )}
                      />
                    ) : null}
                    <div className="min-w-0 flex-1 space-y-3">
                      <DocumentAssetIdentity
                        fileName={docItem.fileName}
                        type={docItem.type}
                        size={docItem.size}
                        density="card"
                        canOpenFile={Boolean(docItem?.id)}
                        isOpening={openDocBusyId === String(docItem?.id)}
                        onFileNameClick={() => {
                          void handleOpenDocument(docItem);
                        }}
                      />
                      <DocumentPipelineLifecycle
                        pipeline={docItem.pipeline}
                        className="flex flex-col items-center justify-center gap-2 py-1"
                      />
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground/70">
                        <DocumentCustodian
                          uploader={docItem.uploader}
                          nameByEmail={custodianNameByEmail}
                          variant="card"
                        />
                        <span className="text-[10px] font-bold tracking-wide text-muted-foreground/60 dark:text-muted-foreground/50 tabular-nums">
                          {formatDiscoveryUploadedAt(docItem.uploadedAt)}
                        </span>
                      </div>
                      <div className="pt-1 border-t border-border/20 dark:border-border/35">
                        <DocumentPipelineActions
                          docItem={docItem}
                          bulkBusyActive={bulkBusyActive}
                          docBusy={docBusy}
                          actionBusyKey={actionBusyKey}
                          bustKey={bustKey}
                          runPipeline={runPipeline}
                          onOpenResults={(doc) => {
                            void handleOpenResults(doc);
                          }}
                          onDeleteDocument={handleDeleteDocument}
                          deleteBusyId={deleteBusyId}
                          variant="card"
                          readOnly={!docCanManage(docItem)}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filtered.length / itemsPerPage)}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
        />
        </div>
      </section>

      <DocumentResultModal
        documentItem={resultModal}
        isOpen={!!resultModal}
        onClose={() => setResultModal(null)}
        extractFormat={extractFormat}
        onFormatChange={setExtractFormat}
        onExport={handleExport}
        getExtractionText={getExtractionText}
        allowExport={hasCapability('GROUP_DOC_VIEW')}
      />
      {resultLoadingDocId ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-border/35 bg-surface-highest/80 backdrop-blur-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 shadow-xl">
          Loading results...
        </div>
      ) : null}

      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => !isUploading && setIsUploadModalOpen(false)}
        orgWideUpload={isCompanyAdmin}
        groups={uploadGroupChoices}
        targetGroupId={targetGroupId}
        setTargetGroupId={setTargetGroupId}
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
        isUploading={isUploading}
        onUpload={async () => {
          const gid = isCompanyAdmin ? targetGroupId : targetGroupId || '';
          if (!gid) {
            await appAlert({
              title: 'Choose a workspace',
              description: isCompanyAdmin
                ? 'Select a target group before uploading.'
                : 'Pick an admin workspace to upload into.',
              variant: 'warning',
            });
            return;
          }
          const userId = String(user?._id || user?.id || '').trim();
          if (!userId) {
            await appAlert({
              title: 'Session issue',
              description: 'Missing user id. Please sign in again.',
              variant: 'danger',
            });
            return;
          }
          const orgId = context?.orgId ?? user?.orgId ?? null;
          setIsUploading(true);
          try {
            for (const file of selectedFiles) {
              await uploadDocument(file, { userId, groupId: gid || null, orgId });
            }
            await queryClient.invalidateQueries({ queryKey: ['pipeline-documents'] });
            await queryClient.invalidateQueries({ queryKey: ['documents'] });
            setActiveTab('All');
            setCurrentPage(1);
            setIsUploadModalOpen(false);
            setSelectedFiles([]);
            if (isCompanyAdmin) setTargetGroupId('');
            requestAnimationFrame(() => {
              document.getElementById('documents-vault-table')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
            });
          } finally {
            setIsUploading(false);
          }
        }}
      />
    </div>
  );
};

export default DocumentsPage;
