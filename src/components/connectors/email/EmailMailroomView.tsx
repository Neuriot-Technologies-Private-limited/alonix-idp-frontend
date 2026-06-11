import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Mail, Loader2, AlertCircle, RefreshCw, Search, ChevronRight,
  FileText, Image, Archive, File, CheckCircle2, XCircle, Clock, Presentation,
  Zap, Inbox, Paperclip, ArrowRight, X,
} from 'lucide-react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  browseConnector,
  fetchEmailDetail,
  ingestEmailAttachments,
} from '../../../services/connectorBrowserApi';
import type {
  ConnectorItem,
  EmailAttachmentPreview,
  EmailDetail,
} from '../../../services/connectorBrowserApi';
import { cn } from '../../../utils/cn';
import { quotaErrorMessage } from '../../../utils/billingQuota';
import { billingSubscriptionQueryKey, useOrgQuota } from '../../../hooks/useOrgQuota';
import { useAuthStore } from '../../../stores/authStore';
import { triggerIngest } from '../../../services/chatApi';
import { refreshDocumentsAfterConnectorIngest } from '../../../utils/connectorIngestFeedback';
import {
  clearOptimisticConnectorDocuments,
  optimisticAppendConnectorDocuments,
  resolveSelectedIngestFileNames,
} from '../../../utils/connectorIngestOptimistic';
import type { EmailIngestResult } from '../../../services/connectorBrowserApi';
import { sanitizeEmailHtml } from '../../../utils/sanitizeChatHtml';

export interface EmailMailroomViewProps {
  connectorId: string;
  /** Mailbox ID for the split-model API; when provided, API calls are scoped to this mailbox */
  mailboxId?: string;
  connectorName: string;
  variant?: 'page' | 'modal';
  onViewIngestedDocuments?: (connectorId: string) => void;
}

type IngestFeedback = {
  mode: 'queued' | 'completed';
  processed: number;
  skipped: number;
  selectedCount: number;
};

type BodyTab = 'text' | 'html';

function formatSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(val?: string | number): string {
  if (!val) return '—';
  return new Date(val).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function kindIcon(kind: string) {
  if (kind === 'pdf') return <FileText className="w-3.5 h-3.5" />;
  if (kind === 'image') return <Image className="w-3.5 h-3.5" />;
  if (kind === 'archive') return <Archive className="w-3.5 h-3.5" />;
  if (kind === 'text') return <FileText className="w-3.5 h-3.5" />;
  if (kind === 'presentation') return <Presentation className="w-3.5 h-3.5" />;
  return <File className="w-3.5 h-3.5" />;
}

function statusBadge(status: string, errorMessage?: string | null) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    ingested: { label: 'Ingested', className: 'bg-success/10 text-success border-success/20', icon: <CheckCircle2 className="w-3 h-3" /> },
    pending: { label: 'Processing', className: 'bg-amber-400/10 text-amber-500 border-amber-400/20', icon: <Clock className="w-3 h-3" /> },
    failed: { label: 'Failed', className: 'bg-destructive/10 text-destructive border-destructive/20', icon: <XCircle className="w-3 h-3" /> },
    not_ingested: { label: 'Not ingested', className: 'bg-muted/30 text-muted-foreground border-border/30', icon: null },
  };
  const meta = map[status] || map.not_ingested;
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border', meta.className)}
      title={status === 'failed' && errorMessage ? errorMessage : undefined}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}

function ingestionItemForKey(detail: EmailDetail | undefined, sourceKey: string) {
  return detail?.ingestion.items.find((i) => i.sourceKey === sourceKey);
}

const EmailMailroomView: React.FC<EmailMailroomViewProps> = ({
  connectorId,
  mailboxId,
  connectorName,
  variant = 'page',
  onViewIngestedDocuments,
}) => {
  const orgId = useAuthStore((s) => s.context?.orgId);
  const activeGroupId = useAuthStore((s) => s.context?.activeGroupId ?? null);
  const queryClient = useQueryClient();
  const { atCap, capMessage, blocksUsage } = useOrgQuota();
  const ingestBlocked = blocksUsage || atCap('documentsMonth');

  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const listEndRef = useRef<HTMLLIElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [bodyTab, setBodyTab] = useState<BodyTab>('text');
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<Set<string>>(new Set());
  const [selectedArchivePaths, setSelectedArchivePaths] = useState<Set<string>>(new Set());
  const [ingestError, setIngestError] = useState('');
  const [ingestFeedback, setIngestFeedback] = useState<IngestFeedback | null>(null);
  const [isPollingIngest, setIsPollingIngest] = useState(false);

  const isModal = variant === 'modal';

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const inboxQueryKey = ['connector-browse', connectorId, mailboxId ?? 'INBOX', debouncedSearch] as const;

  const {
    data: inboxPages,
    isLoading: loadingInbox,
    error: inboxError,
    refetch: refetchInbox,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: inboxQueryKey,
    queryFn: ({ pageParam }) =>
      browseConnector(connectorId, undefined, mailboxId, {
        beforeUid: pageParam as string | undefined,
        limit: 50,
        search: debouncedSearch || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextBeforeUid ? lastPage.nextBeforeUid : undefined,
    enabled: !!connectorId,
    staleTime: 30000,
  });

  const browseData = inboxPages?.pages[0];
  const inboxEmails = useMemo(() => {
    const seen = new Set<string>();
    const merged: ConnectorItem[] = [];
    for (const page of inboxPages?.pages ?? []) {
      for (const item of page.items) {
        const uid = String(item.id || item.path || '');
        if (!uid || seen.has(uid)) continue;
        seen.add(uid);
        merged.push(item);
      }
    }
    return merged;
  }, [inboxPages?.pages]);

  useEffect(() => {
    const root = scrollContainerRef.current;
    const target = listEndRef.current;
    if (!root || !target || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchNextPage();
        }
      },
      { root, rootMargin: '120px', threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, inboxEmails.length, debouncedSearch]);

  const { data: emailDetail, isLoading: loadingDetail, error: detailError, refetch: refetchDetail } = useQuery({
    queryKey: ['email-detail', mailboxId ?? connectorId, selectedUid],
    queryFn: () => fetchEmailDetail(connectorId, selectedUid!, mailboxId),
    enabled: !!connectorId && !!selectedUid,
    staleTime: 5000,
    refetchInterval: (query) => {
      if (!isPollingIngest) return false;
      const detail = query.state.data as EmailDetail | undefined;
      const pending = detail?.ingestion.items.some((item) => item.status === 'pending') ?? false;
      return pending ? 2000 : false;
    },
  });

  const hasPendingIngestion = useMemo(
    () => emailDetail?.ingestion.items.some((item) => item.status === 'pending') ?? false,
    [emailDetail?.ingestion.items]
  );

  useEffect(() => {
    if (!isPollingIngest) return;
    const safetyStop = window.setTimeout(() => {
      setIsPollingIngest(false);
      void refreshDocumentsAfterConnectorIngest(queryClient, orgId);
    }, 90_000);
    return () => window.clearTimeout(safetyStop);
  }, [isPollingIngest, queryClient, orgId]);

  useEffect(() => {
    if (!isPollingIngest || !ingestFeedback || !emailDetail) return;
    if (hasPendingIngestion) return;
    const hasIngested = emailDetail.ingestion.items.some((item) => item.status === 'ingested');
    if (ingestFeedback.mode === 'queued' && !hasIngested) return;
    setIsPollingIngest(false);
    void refreshDocumentsAfterConnectorIngest(queryClient, orgId);
  }, [
    emailDetail,
    hasPendingIngestion,
    ingestFeedback,
    isPollingIngest,
    queryClient,
    orgId,
  ]);

  const selectEmail = useCallback((item: ConnectorItem) => {
    const uid = item.id || item.path;
    if (!uid) return;
    setSelectedUid(String(uid));
    setSelectedAttachmentIds(new Set());
    setSelectedArchivePaths(new Set());
    setIngestError('');
    setIngestFeedback(null);
    setIsPollingIngest(false);
    setBodyTab('text');
  }, []);

  const toggleAttachment = (att: EmailAttachmentPreview) => {
    if (!att.ingestable) return;
    setSelectedAttachmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(att.id)) next.delete(att.id);
      else next.add(att.id);
      return next;
    });
  };

  const toggleArchivePath = (sourceKey: string) => {
    setSelectedArchivePaths((prev) => {
      const next = new Set(prev);
      if (next.has(sourceKey)) next.delete(sourceKey);
      else next.add(sourceKey);
      return next;
    });
  };

  const failedIngestionItems = useMemo(
    () =>
      emailDetail?.ingestion.items.filter(
        (item) => item.status === 'failed' && item.documentId
      ) ?? [],
    [emailDetail?.ingestion.items]
  );

  const retryFailedMutation = useMutation({
    mutationFn: async () => {
      for (const item of failedIngestionItems) {
        await triggerIngest(item.documentId!, { collectionName: item.fileName }, null);
      }
    },
    onSuccess: async () => {
      setIngestError('');
      await refreshDocumentsAfterConnectorIngest(queryClient, orgId, undefined, activeGroupId);
      void refetchDetail();
      onViewIngestedDocuments?.(connectorId);
    },
    onError: (err: unknown) => {
      setIngestError(quotaErrorMessage(err, 'Failed to retry ingestion.'));
    },
  });

  const ingestableAttachmentCount = useMemo(() => {
    if (!emailDetail) return 0;
    let count = 0;
    for (const att of emailDetail.attachments) {
      if (att.archiveEntries?.length) {
        count += att.archiveEntries.filter((e) => e.ingestable).length;
      } else if (att.ingestable) count += 1;
    }
    return count;
  }, [emailDetail]);

  const handleIngestSuccess = useCallback(
    (result: EmailIngestResult, selectedForIngest: number, ingestAll: boolean) => {
      setIngestError('');
      const queued = result.status === 'queued';
      const processed = result.processed ?? 0;
      const skipped = result.skipped ?? 0;

      setIngestFeedback({
        mode: queued ? 'queued' : 'completed',
        processed,
        skipped,
        selectedCount: ingestAll ? ingestableAttachmentCount : selectedForIngest,
      });
      setIsPollingIngest(queued || processed > 0);

      void queryClient.invalidateQueries({ queryKey: ['email-detail', mailboxId ?? connectorId, selectedUid] });
      void queryClient.invalidateQueries({ queryKey: ['connector-browse', connectorId, mailboxId ?? 'INBOX'] });
      void queryClient.invalidateQueries({ queryKey: billingSubscriptionQueryKey(orgId) });
      const created = (result.documents || []).map((doc) => ({
        documentId: doc.documentId,
        fileName: doc.fileName,
        connectorId,
        connectorType: 'EMAIL',
        existing: doc.existing,
      }));
      void refreshDocumentsAfterConnectorIngest(queryClient, orgId, created, activeGroupId);

      if (created.length > 0 || processed > 0) {
        onViewIngestedDocuments?.(connectorId);
      }

      if (!queued && processed === 0 && skipped > 0) {
        const quotaDetail = result.skippedDetails?.find((d) =>
          /QUOTA|STORAGE|SUBSCRIPTION/i.test(String(d.code || ''))
        );
        if (quotaDetail?.error) {
          setIngestError(quotaDetail.error);
        } else if (created.length > 0) {
          setIngestError('Selected files were already ingested from this mailbox.');
        } else {
          setIngestError('No new files were ingested (already processed or skipped).');
        }
      }
    },
    [
      activeGroupId,
      connectorId,
      ingestableAttachmentCount,
      onViewIngestedDocuments,
      orgId,
      queryClient,
      selectedUid,
      mailboxId,
    ]
  );

  const ingestMutation = useMutation({
    mutationFn: (payload: { ingestAllIngestable?: boolean }) => {
      const ingestAll = Boolean(payload.ingestAllIngestable);
      const selectedForIngest = ingestAll
        ? ingestableAttachmentCount
        : selectedAttachmentIds.size + selectedArchivePaths.size;
      return ingestEmailAttachments(connectorId, selectedUid!, {
        attachmentIds: ingestAll ? undefined : Array.from(selectedAttachmentIds),
        archivePaths: ingestAll ? undefined : Array.from(selectedArchivePaths),
        ingestAllIngestable: ingestAll,
      }, mailboxId).then((result) => ({ result, selectedForIngest, ingestAll }));
    },
    onMutate: (payload) => {
      const ingestAll = Boolean(payload.ingestAllIngestable);
      const fileNames = resolveSelectedIngestFileNames(emailDetail, {
        ingestAllIngestable: ingestAll,
        attachmentIds: ingestAll ? undefined : Array.from(selectedAttachmentIds),
        archivePaths: ingestAll ? undefined : Array.from(selectedArchivePaths),
      });
      optimisticAppendConnectorDocuments(
        queryClient,
        fileNames.map((fileName) => ({
          fileName,
          connectorId,
          connectorType: 'EMAIL',
        })),
        orgId,
        activeGroupId
      );
      return { fileNames };
    },
    onSuccess: ({ result, selectedForIngest, ingestAll }) => {
      handleIngestSuccess(result, selectedForIngest, ingestAll);
    },
    onError: (err: unknown) => {
      clearOptimisticConnectorDocuments(queryClient, orgId);
      setIngestError(quotaErrorMessage(err, 'Failed to ingest attachments.'));
    },
  });

  const selectedCount =
    selectedAttachmentIds.size +
    selectedArchivePaths.size;

  return (
    <div className={cn('flex flex-1 min-h-0 min-w-0', isModal ? 'flex-col lg:flex-row' : 'flex-col lg:flex-row gap-0')}>
      {/* Inbox list */}
      <section
        className={cn(
          'flex flex-col min-h-0 border-border/35',
          isModal ? 'lg:w-[min(300px,34%)] border-b lg:border-b-0 lg:border-r' : 'lg:w-[320px] rounded-l-2xl border border-r-0'
        )}
      >
        <header className="shrink-0 px-4 py-3 border-b border-border/35 bg-surface-high/20 flex items-center gap-2">
          <Inbox className="w-4 h-4 text-sky-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate">{connectorName}</p>
            {browseData?.mailboxStats && (
              <p className="text-[10px] text-muted-foreground">
                {browseData.mailboxStats.total} messages · {browseData.mailboxStats.unseen} unseen
                {debouncedSearch && browseData.resultCount != null
                  ? ` · ${browseData.resultCount} match${browseData.resultCount === 1 ? '' : 'es'}`
                  : ''}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => refetchInbox()}
            disabled={loadingInbox}
            className="p-1.5 rounded-lg hover:bg-surface-highest/20 text-muted-foreground"
            aria-label="Refresh inbox"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loadingInbox && 'animate-spin')} />
          </button>
        </header>

        <div className="px-3 py-2 shrink-0 border-b border-border/25">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subject, sender name, or email…"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border/25 bg-background focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0">
          {loadingInbox ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground/40" /></div>
          ) : inboxError ? (
            <div className="p-6 text-center">
              <AlertCircle className="w-6 h-6 text-destructive/50 mx-auto mb-2" />
              <p className="text-xs text-destructive">Could not load inbox</p>
            </div>
          ) : inboxEmails.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-12">
              {debouncedSearch ? 'No messages match your search' : 'No messages'}
            </p>
          ) : (
            <ul className="divide-y divide-border/10">
              {inboxEmails.map((item) => {
                const uid = String(item.id || item.path);
                const active = selectedUid === uid;
                return (
                  <li key={uid}>
                    <button
                      type="button"
                      onClick={() => selectEmail(item)}
                      className={cn(
                        'w-full text-left px-4 py-3 transition-colors hover:bg-surface-highest/10',
                        active && 'bg-primary/8 border-l-2 border-primary',
                        !item.seen && !active && 'bg-sky-400/[0.04]'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <Mail className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', item.seen ? 'text-muted-foreground/50' : 'text-sky-400')} />
                        <div className="min-w-0 flex-1">
                          <p className={cn('text-xs font-semibold truncate', !item.seen && 'text-foreground', item.seen && 'text-foreground/90')}>
                            {item.subject || item.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {item.fromName || item.from || item.fromAddress}
                          </p>
                          {item.fromName && item.fromAddress ? (
                            <p className="text-[10px] text-muted-foreground/60 truncate">{item.fromAddress}</p>
                          ) : null}
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5">{formatDate(item.mtime)}</p>
                        </div>
                        <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0 mt-1" />
                      </div>
                    </button>
                  </li>
                );
              })}
              <li ref={listEndRef} className="py-3 flex justify-center">
                {isFetchingNextPage ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/50" />
                ) : hasNextPage ? (
                  <span className="text-[10px] text-muted-foreground/60">Scroll for older messages…</span>
                ) : inboxEmails.length > 0 ? (
                  <span className="text-[10px] text-muted-foreground/50">End of list</span>
                ) : null}
              </li>
            </ul>
          )}
        </div>
      </section>

      {/* Detail panel */}
      <section className="flex flex-col flex-1 min-h-0 min-w-0">
        {!selectedUid ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16">
            <div className="h-14 w-14 rounded-2xl bg-sky-400/10 flex items-center justify-center mb-4">
              <Mail className="w-7 h-7 text-sky-400/70" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Select an email to preview and ingest attachments</p>
          </div>
        ) : loadingDetail ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
          </div>
        ) : detailError ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <AlertCircle className="w-8 h-8 text-destructive/50 mb-2" />
            <p className="text-sm text-destructive">Failed to load email</p>
            <button type="button" onClick={() => refetchDetail()} className="mt-3 text-xs text-primary">Retry</button>
          </div>
        ) : emailDetail ? (
          <>
            <header className="shrink-0 px-5 py-4 border-b border-border/30 bg-gradient-to-r from-surface-high/30 to-transparent">
              <h3 className="text-sm font-bold text-foreground leading-snug">{emailDetail.subject}</h3>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                <span><span className="font-semibold text-foreground/70">From</span> {emailDetail.from}</span>
                <span><span className="font-semibold text-foreground/70">Date</span> {formatDate(emailDetail.date)}</span>
              </div>
              {emailDetail.ingestion.failedCount > 0 ? (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-destructive/25 bg-destructive/[0.06] px-3 py-2.5">
                  <p className="text-[11px] text-destructive font-medium flex-1">
                    {emailDetail.ingestion.failedCount} attachment(s) failed pipeline processing. Retry from
                    here or open Documents → Connectors to re-ingest.
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={retryFailedMutation.isPending || failedIngestionItems.length === 0}
                      onClick={() => retryFailedMutation.mutate()}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-wider border border-destructive/20 hover:bg-destructive/15 disabled:opacity-50"
                    >
                      {retryFailedMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      Retry failed
                    </button>
                    {onViewIngestedDocuments ? (
                      <button
                        type="button"
                        onClick={() => onViewIngestedDocuments(connectorId)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/30 text-[10px] font-bold uppercase tracking-wider hover:bg-surface-highest/20"
                      >
                        Open Connectors
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </header>

            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Body */}
              <div className="px-5 py-4 border-b border-border/20">
                <div className="flex items-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setBodyTab('text')}
                    className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md', bodyTab === 'text' ? 'bg-primary/15 text-primary' : 'text-muted-foreground')}
                  >
                    Plain text
                  </button>
                  {emailDetail.body.html && (
                    <button
                      type="button"
                      onClick={() => setBodyTab('html')}
                      className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md', bodyTab === 'html' ? 'bg-primary/15 text-primary' : 'text-muted-foreground')}
                    >
                      HTML
                    </button>
                  )}
                </div>
                {bodyTab === 'html' && emailDetail.body.html ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-xs rounded-xl border border-border/20 p-4 bg-surface-lowest/50 max-h-48 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(emailDetail.body.html) }}
                  />
                ) : (
                  <pre className="text-xs text-foreground/85 whitespace-pre-wrap font-sans leading-relaxed rounded-xl border border-border/20 p-4 bg-surface-lowest/50 max-h-48 overflow-y-auto">
                    {emailDetail.body.text || '(No text body)'}
                  </pre>
                )}
              </div>

              {/* Attachments */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                    Attachments ({emailDetail.attachments.length})
                  </p>
                </div>

                {emailDetail.attachments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No attachments</p>
                ) : (
                  <ul className="space-y-2">
                    {emailDetail.attachments.map((att) => (
                      <li
                        key={att.id}
                        className={cn(
                          'rounded-xl border border-border/25 overflow-hidden',
                          att.ingestable || att.archiveEntries?.some((e) => e.ingestable) ? 'bg-surface-lowest/40' : 'bg-muted/10 opacity-80'
                        )}
                      >
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          {att.ingestable && !att.archiveEntries?.length ? (
                            <input
                              type="checkbox"
                              checked={selectedAttachmentIds.has(att.id)}
                              onChange={() => toggleAttachment(att)}
                              className="rounded border-border/50"
                              aria-label={`Select ${att.fileName}`}
                            />
                          ) : (
                            <span className="w-4" />
                          )}
                          <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                            att.kind === 'pdf' && 'bg-red-400/10 text-red-400',
                            att.kind === 'image' && 'bg-violet-400/10 text-violet-400',
                            att.kind === 'archive' && 'bg-amber-400/10 text-amber-400',
                            att.kind === 'other' && 'bg-muted/20 text-muted-foreground',
                          )}>
                            {kindIcon(att.kind)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate">{att.fileName}</p>
                            <p className="text-[10px] text-muted-foreground">{formatSize(att.size)} · {att.mimeType}</p>
                            {att.skipReason && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">{att.skipReason}</p>
                            )}
                          </div>
                          {!att.archiveEntries?.length && (() => {
                            const item = ingestionItemForKey(emailDetail, att.sourceKey);
                            return (
                              <div className="flex flex-col items-end gap-0.5 shrink-0">
                                {statusBadge(item?.status || 'not_ingested', item?.errorMessage)}
                                {item?.status === 'failed' && item.errorMessage ? (
                                  <p className="max-w-[10rem] text-[9px] text-destructive/85 text-right line-clamp-2" title={item.errorMessage}>
                                    {item.errorMessage}
                                  </p>
                                ) : null}
                              </div>
                            );
                          })()}
                        </div>

                        {att.archiveEntries && att.archiveEntries.length > 0 && (
                          <ul className="border-t border-border/20 bg-surface-high/10 divide-y divide-border/10">
                            {att.archiveEntries.map((entry) => (
                              <li key={entry.sourceKey} className="flex items-center gap-3 pl-10 pr-3 py-2">
                                {entry.ingestable ? (
                                  <input
                                    type="checkbox"
                                    checked={selectedArchivePaths.has(entry.sourceKey) || selectedAttachmentIds.has(att.id)}
                                    disabled={selectedAttachmentIds.has(att.id)}
                                    onChange={() => toggleArchivePath(entry.sourceKey)}
                                    className="rounded border-border/50"
                                    aria-label={`Select ${entry.fileName}`}
                                  />
                                ) : (
                                  <span className="w-4" />
                                )}
                                <FileText className="w-3 h-3 text-red-400/80 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] truncate">{entry.fileName}</p>
                                  <p className="text-[10px] text-muted-foreground">{formatSize(entry.size)}</p>
                                </div>
                                {(() => {
                                  const item = ingestionItemForKey(emailDetail, entry.sourceKey);
                                  return (
                                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                                      {statusBadge(item?.status || 'not_ingested', item?.errorMessage)}
                                      {item?.status === 'failed' && item.errorMessage ? (
                                        <p className="max-w-[10rem] text-[9px] text-destructive/85 text-right line-clamp-2" title={item.errorMessage}>
                                          {item.errorMessage}
                                        </p>
                                      ) : null}
                                    </div>
                                  );
                                })()}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Ingest actions */}
            <footer className="shrink-0 px-5 py-4 border-t border-border/30 bg-surface-high/15 space-y-3">
              {ingestFeedback ? (
                <div className="rounded-xl border border-success/25 bg-success/[0.08] p-3.5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-success/15 text-success">
                      {ingestFeedback.mode === 'queued' || isPollingIngest ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-bold text-foreground">
                        {ingestFeedback.mode === 'queued' || isPollingIngest
                          ? 'Ingestion in progress'
                          : 'Ingestion complete'}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {ingestFeedback.mode === 'queued' || isPollingIngest ? (
                          <>
                            {ingestFeedback.selectedCount} file
                            {ingestFeedback.selectedCount === 1 ? '' : 's'} queued. You can keep browsing
                            mailroom — statuses update automatically.
                          </>
                        ) : ingestFeedback.processed > 0 ? (
                          <>
                            {ingestFeedback.processed} file
                            {ingestFeedback.processed === 1 ? '' : 's'} added to Documents
                            {ingestFeedback.skipped > 0 ? ` · ${ingestFeedback.skipped} skipped` : ''}.
                          </>
                        ) : (
                          'No new files were ingested (already processed or skipped).'
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIngestFeedback(null)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-highest/30"
                      aria-label="Dismiss ingestion notice"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {onViewIngestedDocuments ? (
                      <button
                        type="button"
                        onClick={() => onViewIngestedDocuments(connectorId)}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-wider"
                      >
                        View in Documents
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void refetchDetail()}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border/30 text-[11px] font-bold uppercase tracking-wider hover:bg-surface-highest/20"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', isPollingIngest && 'animate-spin')} />
                      Refresh status
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  disabled={ingestMutation.isPending || ingestBlocked || selectedCount === 0}
                  title={ingestBlocked ? capMessage('documentsMonth') : selectedCount === 0 ? 'Select attachments first' : undefined}
                  onClick={() => {
                    if (ingestBlocked) {
                      setIngestError(capMessage('documentsMonth'));
                      return;
                    }
                    setIngestError('');
                    setIngestFeedback(null);
                    ingestMutation.mutate({});
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider disabled:opacity-50"
                >
                  {ingestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Ingest selected ({selectedCount})
                </button>
                <button
                  type="button"
                  disabled={ingestMutation.isPending || ingestBlocked || ingestableAttachmentCount === 0}
                  onClick={() => {
                    if (ingestBlocked) {
                      setIngestError(capMessage('documentsMonth'));
                      return;
                    }
                    setIngestError('');
                    setIngestFeedback(null);
                    ingestMutation.mutate({ ingestAllIngestable: true });
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/5 disabled:opacity-50"
                >
                  Ingest all ingestable ({ingestableAttachmentCount})
                </button>
              </div>
              {ingestError ? <p className="text-xs text-destructive text-center">{ingestError}</p> : null}
              <p className="text-[10px] text-muted-foreground text-center">
                Selected files appear under Documents → Connectors right away while the pipeline runs.
              </p>
            </footer>
          </>
        ) : null}
      </section>
    </div>
  );
};

export default EmailMailroomView;
