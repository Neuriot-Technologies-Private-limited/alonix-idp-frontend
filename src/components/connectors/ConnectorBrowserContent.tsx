import React, { useState, useCallback, useEffect } from 'react';
import {
  Network, Mail, FolderOpen, Server, ChevronRight, Home,
  File, Folder, Loader2, AlertCircle, RefreshCw,
  Zap, CheckCircle2, Search, LayoutGrid, FileDown, X,
  Box, Plug,
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../../services/api/client';
import { browseConnector, ingestFile } from '../../services/connectorBrowserApi';
import type { BrowseResult, ConnectorItem } from '../../services/connectorBrowserApi';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';

export interface ConnectorBrowserContentProps {
  /** Full page hero vs compact modal header */
  variant: 'page' | 'modal';
  onClose?: () => void;
  /** Deep-link / admin “open in documents” — selects connector when set */
  initialConnectorId?: string | null;
}

interface Connector {
  _id: string;
  name: string;
  type: 'EMAIL' | 'FAX' | 'BOX' | 'API' | 'SHAREPOINT' | 'SFTP';
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  config: Record<string, unknown>;
}

const TYPE_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  EMAIL:      { icon: <Mail className="w-4 h-4" />,       color: 'text-sky-400 bg-sky-400/10',     label: 'Email' },
  SHAREPOINT: { icon: <FolderOpen className="w-4 h-4" />, color: 'text-emerald-400 bg-emerald-400/10', label: 'SharePoint' },
  SFTP:       { icon: <Server className="w-4 h-4" />,     color: 'text-amber-400 bg-amber-400/10', label: 'SFTP' },
  FAX:        { icon: <FileDown className="w-4 h-4" />, color: 'text-violet-400 bg-violet-400/10', label: 'Fax' },
  BOX:        { icon: <Box className="w-4 h-4" />,       color: 'text-blue-300 bg-blue-400/10',   label: 'Box' },
  API:        { icon: <Plug className="w-4 h-4" />,      color: 'text-cyan-300 bg-cyan-400/10',    label: 'API' },
};

function getConnectorTypeMeta(type: string): { icon: React.ReactNode; color: string; label: string } {
  const known = TYPE_META[type];
  if (known) return known;
  return {
    icon: <Network className="w-4 h-4" />,
    color: 'text-muted-foreground bg-muted/10',
    label: type ? type.replace(/_/g, ' ') : 'Connector',
  };
}

function safeBrowseErrorMessage(error: unknown): string {
  const ax = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
  const fromApi = ax.response?.data?.error || ax.response?.data?.message;
  if (typeof fromApi === 'string' && fromApi.trim()) {
    const t = fromApi.trim();
    return t.length > 220 ? `${t.slice(0, 220)}…` : t;
  }
  const msg = typeof ax.message === 'string' ? ax.message.trim() : '';
  if (msg && !/^Request failed with status code \d+/i.test(msg) && msg.length < 400) return msg;
  return 'Could not load this location. Check the connection or try again.';
}

function ingestItemKey(connectorId: string, item: ConnectorItem): string {
  const id = item.id != null ? String(item.id) : '';
  const path = item.path != null ? String(item.path) : '';
  const name = item.name != null ? String(item.name) : '';
  return `${connectorId}:${id}:${path}:${name}`;
}

function formatSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(val?: string | number): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const ConnectorBrowserContent: React.FC<ConnectorBrowserContentProps> = ({
  variant,
  onClose,
  initialConnectorId,
}) => {
  const context = useAuthStore((s) => s.context);
  const orgId = context?.orgId;

  const [selectedConnectorId, setSelectedConnectorId] = useState<string>(initialConnectorId || '');
  const [currentPath, setCurrentPath] = useState<string>('');
  const [breadcrumbs, setBreadcrumbs] = useState<{ label: string; path: string }[]>([]);
  const [selectedItem, setSelectedItem] = useState<ConnectorItem | null>(null);
  const [ingestSuccessKey, setIngestSuccessKey] = useState<string>('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (initialConnectorId) {
      setSelectedConnectorId(initialConnectorId);
      setCurrentPath('');
      setBreadcrumbs([]);
      setSelectedItem(null);
    }
  }, [initialConnectorId]);

  const { data: connectors = [], isLoading: loadingConnectors } = useQuery<Connector[]>({
    queryKey: ['connectors', orgId],
    queryFn: async () => {
      const { data } = await apiClient.get<Connector[]>(`/admin/orgs/${orgId}/connectors`);
      return data.filter((c) => c.status === 'ACTIVE');
    },
    enabled: !!orgId,
  });

  const selectedConnector = connectors.find((c) => c._id === selectedConnectorId);

  const { data: browseData, isLoading: loadingBrowse, error: browseError, refetch } = useQuery<BrowseResult>({
    queryKey: ['connector-browse', selectedConnectorId, currentPath],
    queryFn: () => browseConnector(selectedConnectorId, currentPath || undefined),
    enabled: !!selectedConnectorId,
    staleTime: 30000,
  });

  const ingestMutation = useMutation({
    mutationFn: (item: ConnectorItem) => {
      if (selectedConnector?.type === 'EMAIL') {
        return ingestFile(selectedConnectorId, { messageId: item.id });
      }
      return ingestFile(selectedConnectorId, { path: item.path, itemId: item.id });
    },
    onSuccess: (_, item) => {
      setIngestSuccessKey(ingestItemKey(selectedConnectorId, item));
      setTimeout(() => setIngestSuccessKey(''), 4000);
    },
  });

  const navigateTo = useCallback((path: string, label: string) => {
    setCurrentPath(path);
    setSelectedItem(null);
    setBreadcrumbs((prev) => {
      const idx = prev.findIndex((b) => b.path === path);
      if (idx >= 0) return prev.slice(0, idx + 1);
      return [...prev, { label, path }];
    });
  }, []);

  const navigateHome = useCallback(() => {
    setCurrentPath('');
    setBreadcrumbs([]);
    setSelectedItem(null);
  }, []);

  const selectConnector = useCallback((id: string) => {
    setSelectedConnectorId(id);
    setCurrentPath('');
    setBreadcrumbs([]);
    setSelectedItem(null);
  }, []);

  const filteredItems = (browseData?.items || []).filter((item) =>
    !search || item.name.toLowerCase().includes(search.toLowerCase())
  );

  const isModal = variant === 'modal';

  return (
    <div
      className={cn(
        'w-full animate-in fade-in duration-300',
        isModal ? 'max-h-[min(88vh,860px)] flex flex-col min-h-0' : 'max-w-7xl mx-auto pb-16'
      )}
    >
      {isModal ? (
        <div className="shrink-0 flex items-start justify-between gap-4 px-1 pb-4 border-b border-border/15">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
              <Network className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h2
                id="connector-browser-title"
                className="font-display text-lg sm:text-xl font-black tracking-tight text-foreground truncate"
              >
                Ingest from connectors
              </h2>
              <p id="connector-browser-description" className="text-[11px] sm:text-sm text-muted-foreground mt-0.5">
                Browse connected sources and queue files into the pipeline
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-2.5 rounded-xl border border-border/20 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
              aria-label="Close"
            >
              <X className="w-5 h-5" aria-hidden />
            </button>
          )}
        </div>
      ) : (
        <div className="mb-6 relative overflow-hidden rounded-3xl border border-border/20 dark:border-border/10 p-6 sm:p-8 shadow-2xl shadow-black/20 bg-gradient-to-br from-amber-500/10 via-surface-highest/20 to-background">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
              <Network className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-black tracking-tight text-foreground">Connector Browser</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Browse and ingest files from connected sources</p>
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          'grid grid-cols-1 gap-4 min-h-0',
          isModal
            ? 'flex-1 lg:grid-cols-[minmax(0,240px)_1fr_minmax(0,260px)] min-h-[420px] overflow-hidden'
            : 'lg:grid-cols-[280px_1fr_300px] min-h-[600px]'
        )}
      >
        <aside className="rounded-2xl border border-border/15 bg-surface-lowest dark:bg-surface-highest/5 overflow-hidden flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-border/10 shrink-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Active Connectors</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
            {loadingConnectors ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" /></div>
            ) : connectors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Network className="h-8 w-8 text-muted-foreground/20 mb-2" />
                <p className="text-xs text-muted-foreground">No active connectors.<br />Ask your admin to set one up.</p>
              </div>
            ) : connectors.map((c) => {
              const meta = getConnectorTypeMeta(c.type);
              const isSelected = c._id === selectedConnectorId;
              return (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => selectConnector(c._id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all',
                    isSelected
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-surface-highest/10 border border-transparent'
                  )}
                >
                  <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', meta.color)}>
                    {meta.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm font-bold truncate', isSelected ? 'text-primary' : 'text-foreground')}>{c.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{meta.label}</p>
                  </div>
                  {isSelected && <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="rounded-2xl border border-border/15 bg-surface-lowest dark:bg-surface-highest/5 overflow-hidden flex flex-col min-h-0 min-w-0">
          <div className="px-4 py-3 border-b border-border/10 flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={navigateHome}
              disabled={!selectedConnectorId}
              aria-label="Go to connector root folder"
              className="p-1.5 rounded-lg hover:bg-surface-highest/20 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            >
              <Home className="w-4 h-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={!selectedConnectorId || loadingBrowse}
              aria-label="Refresh folder contents"
              className="p-1.5 rounded-lg hover:bg-surface-highest/20 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            >
              <RefreshCw className={cn('w-4 h-4', loadingBrowse && 'animate-spin')} aria-hidden />
            </button>

            <div className="flex items-center gap-1 flex-1 overflow-x-auto text-xs text-muted-foreground min-w-0">
              <button type="button" onClick={navigateHome} className="hover:text-foreground transition-colors shrink-0 font-medium">
                {selectedConnector?.name || 'Select a connector'}
              </button>
              {breadcrumbs.map((bc, i) => {
                const isLastCrumb = i === breadcrumbs.length - 1;
                return (
                <React.Fragment key={bc.path}>
                  <ChevronRight className="w-3 h-3 shrink-0" aria-hidden />
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPath(bc.path);
                      setBreadcrumbs((prev) => prev.slice(0, i + 1));
                      setSelectedItem(null);
                    }}
                    className="hover:text-foreground transition-colors shrink-0 font-medium truncate max-w-[120px]"
                    aria-current={isLastCrumb ? 'page' : undefined}
                  >
                    {bc.label}
                  </button>
                </React.Fragment>
                );
              })}
            </div>

            <div className="relative ml-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" aria-hidden />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter…"
                aria-label="Filter files in current folder"
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border/20 bg-background focus:outline-none focus:ring-1 focus:ring-primary/40 w-28 sm:w-32"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {!selectedConnectorId ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] py-16 text-center px-8">
                <LayoutGrid className="h-10 w-10 text-muted-foreground/15 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Select a connector on the left to browse its files</p>
              </div>
            ) : loadingBrowse ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary/50 mb-3" />
                <p className="text-sm text-muted-foreground">Connecting…</p>
              </div>
            ) : browseError ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] py-16 px-8 text-center">
                <AlertCircle className="h-8 w-8 text-destructive/50 mb-3" />
                <p className="text-sm font-bold text-destructive">Connection failed</p>
                <p className="text-xs text-muted-foreground mt-1">{safeBrowseErrorMessage(browseError)}</p>
                <button type="button" onClick={() => refetch()} className="mt-4 text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  Retry
                </button>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] py-16 text-center">
                <Folder className="h-8 w-8 text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground">This folder is empty</p>
              </div>
            ) : (
              <div className="divide-y divide-border/5">
                {filteredItems.map((item, idx) => {
                  const isActive = selectedItem?.path === item.path && selectedItem?.id === item.id;
                  return (
                    <button
                      key={`${item.path}-${idx}`}
                      type="button"
                      onClick={() => {
                        if (item.type === 'folder') {
                          navigateTo(item.path!, item.name);
                        } else {
                          setSelectedItem(isActive ? null : item);
                        }
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-surface-highest/10',
                        isActive && 'bg-primary/5 border-l-2 border-primary'
                      )}
                    >
                      <div className={cn(
                        'h-7 w-7 rounded-lg flex items-center justify-center shrink-0',
                        item.type === 'folder' ? 'bg-amber-400/10 text-amber-400' : 'bg-primary/10 text-primary'
                      )}>
                        {item.type === 'folder' ? <Folder className="w-3.5 h-3.5" /> : item.type === 'email' ? <Mail className="w-3.5 h-3.5" /> : <File className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        {item.from && <p className="text-[10px] text-muted-foreground truncate">{item.from}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-muted-foreground">{formatSize(item.size)}</p>
                        <p className="text-[10px] text-muted-foreground">{formatDate(item.mtime)}</p>
                      </div>
                      {item.type === 'folder' && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {browseData && (
            <div className="px-4 py-2 border-t border-border/10 flex items-center justify-between shrink-0">
              <p className="text-[10px] text-muted-foreground">{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</p>
              {selectedConnector?.config?.autoIngest !== false && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                  <Zap className="w-2.5 h-2.5" /> Auto-ingestion on
                </span>
              )}
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-border/15 bg-surface-lowest dark:bg-surface-highest/5 overflow-hidden flex flex-col min-h-0 min-w-0">
          <div className="px-4 py-3 border-b border-border/10 shrink-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">File Details</p>
          </div>

          {!selectedItem ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center min-h-[160px]">
              <div className="h-12 w-12 rounded-2xl bg-surface-highest/10 flex items-center justify-center mb-3">
                <File className="w-5 h-5 text-muted-foreground/30" />
              </div>
              <p className="text-xs text-muted-foreground">Select a file to see details and ingest options</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto min-h-0">
              <div className="flex flex-col items-center py-4 px-2 rounded-xl bg-primary/5 border border-primary/10">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  {selectedItem.type === 'email' ? <Mail className="w-6 h-6 text-primary" /> : <File className="w-6 h-6 text-primary" />}
                </div>
                <p className="text-sm font-bold text-foreground text-center break-all">{selectedItem.name}</p>
                {selectedItem.from && <p className="text-[10px] text-muted-foreground mt-1 text-center">{selectedItem.from}</p>}
              </div>

              <div className="space-y-2">
                {[
                  { label: 'Size', value: formatSize(selectedItem.size) },
                  { label: 'Modified', value: formatDate(selectedItem.mtime) },
                  { label: 'Type', value: selectedItem.type },
                  { label: 'Path', value: selectedItem.path || selectedItem.id || '—', mono: true },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 shrink-0">{label}</span>
                    <span className={cn('text-[11px] text-foreground text-right break-all', mono && 'font-mono')}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto space-y-2">
                {ingestSuccessKey === ingestItemKey(selectedConnectorId, selectedItem) ? (
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Queued for ingestion!
                  </div>
                ) : (
                  <button
                    type="button"
                    id={`ingest-file-${selectedItem.id ?? selectedItem.path ?? selectedItem.name}`}
                    onClick={() => ingestMutation.mutate(selectedItem)}
                    disabled={ingestMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-black uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {ingestMutation.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Queuing…</>
                      : <><Zap className="w-4 h-4" /> Ingest This File</>
                    }
                  </button>
                )}
                {ingestMutation.isError && (
                  <p className="text-xs text-destructive text-center">Failed to queue. Please try again.</p>
                )}
                <p className="text-[10px] text-muted-foreground text-center">
                  File will be processed through the AI ingestion pipeline
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default ConnectorBrowserContent;
