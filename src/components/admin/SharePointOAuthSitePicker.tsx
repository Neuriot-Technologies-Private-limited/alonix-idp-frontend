import React, { useEffect, useState } from 'react';
import { FolderOpen, Loader2, Search, History, Zap } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  completeSharepointOAuth,
  listSharepointOAuthDrives,
  listSharepointOAuthSites,
  type SharePointOAuthDrive,
  type SharePointOAuthSite,
} from '../../services/connectorBrowserApi';
import { quotaErrorMessage } from '../../utils/billingQuota';
import { cn } from '../../utils/cn';

type Props = {
  sessionId: string;
  orgId?: string;
  onClose: () => void;
  onSuccess: () => void;
};

export const SharePointOAuthSitePicker: React.FC<Props> = ({
  sessionId,
  orgId,
  onClose,
  onSuccess,
}) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSite, setSelectedSite] = useState<SharePointOAuthSite | null>(null);
  const [selectedDrive, setSelectedDrive] = useState<SharePointOAuthDrive | null>(null);
  const [connectorName, setConnectorName] = useState('');
  const [ingestionMode, setIngestionMode] = useState<'new-only' | 'historic'>('new-only');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const sitesQuery = useQuery({
    queryKey: ['sharepoint-oauth-sites', sessionId, debouncedSearch, orgId],
    queryFn: () => listSharepointOAuthSites(sessionId, debouncedSearch, orgId),
    enabled: !!sessionId,
  });

  const drivesQuery = useQuery({
    queryKey: ['sharepoint-oauth-drives', sessionId, selectedSite?.id, orgId],
    queryFn: () => listSharepointOAuthDrives(sessionId, selectedSite!.id, orgId),
    enabled: !!sessionId && !!selectedSite?.id,
  });

  const completeMutation = useMutation({
    mutationFn: () =>
      completeSharepointOAuth(
        sessionId,
        {
          name: connectorName.trim(),
          siteUrl: selectedSite!.webUrl,
          siteId: selectedSite!.id,
          driveName: selectedDrive?.name,
          libraryName: selectedDrive?.name,
          ingestHistoric: ingestionMode === 'historic',
        },
        orgId
      ),
    onSuccess: () => onSuccess(),
  });

  const selectSite = (site: SharePointOAuthSite) => {
    setSelectedSite(site);
    setSelectedDrive(null);
    if (!connectorName.trim()) {
      setConnectorName(site.name || 'SharePoint');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-border/20 bg-surface-lowest shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-emerald-500" />
            Choose SharePoint site
          </h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ×
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Microsoft authorization succeeded. Pick the site and library to ingest from.
        </p>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sites…"
            className="w-full rounded-xl border border-border/20 bg-background pl-9 pr-3 py-2.5 text-sm"
          />
        </div>

        {sitesQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sitesQuery.isError ? (
          <p className="text-sm text-destructive py-4">
            {quotaErrorMessage(sitesQuery.error, 'Could not load SharePoint sites.')}
          </p>
        ) : (
          <div className="space-y-1 max-h-40 overflow-y-auto rounded-xl border border-border/15 p-1 mb-4">
            {(sitesQuery.data?.sites || []).length === 0 ? (
              <p className="text-xs text-muted-foreground p-3">No sites found. Try a different search.</p>
            ) : (
              sitesQuery.data?.sites.map((site) => (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => selectSite(site)}
                  className={cn(
                    'w-full text-left rounded-lg px-3 py-2 text-sm transition-colors',
                    selectedSite?.id === site.id
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'hover:bg-surface-highest/20'
                  )}
                >
                  <div className="font-semibold truncate">{site.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{site.webUrl}</div>
                </button>
              ))
            )}
          </div>
        )}

        {selectedSite && (
          <div className="mb-4">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
              Document library (optional)
            </label>
            {drivesQuery.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <select
                value={selectedDrive?.id || ''}
                onChange={(e) => {
                  const drive = drivesQuery.data?.drives.find((d) => d.id === e.target.value) || null;
                  setSelectedDrive(drive);
                }}
                className="w-full rounded-lg border border-border/20 bg-background px-3 py-2 text-sm"
              >
                <option value="">Default library</option>
                {(drivesQuery.data?.drives || []).map((drive) => (
                  <option key={drive.id} value={drive.id}>
                    {drive.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Ingestion scope
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="sharepoint-oauth-ingestion-new-only"
              onClick={() => setIngestionMode('new-only')}
              className={cn(
                'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all',
                ingestionMode === 'new-only'
                  ? 'border-emerald-500/40 bg-emerald-500/8 ring-1 ring-emerald-500/25'
                  : 'border-border/20 bg-surface-highest/10 hover:border-border/40'
              )}
            >
              <div className="flex items-center gap-2">
                <Zap className={cn('h-3 w-3', ingestionMode === 'new-only' ? 'text-emerald-500' : 'text-muted-foreground')} />
                <span className={cn('text-[10px] font-bold', ingestionMode === 'new-only' ? 'text-emerald-500' : 'text-foreground')}>
                  New only
                </span>
              </div>
              <p className="text-[9px] text-muted-foreground leading-relaxed">Only files added after setup.</p>
            </button>
            <button
              type="button"
              id="sharepoint-oauth-ingestion-historic"
              onClick={() => setIngestionMode('historic')}
              className={cn(
                'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all',
                ingestionMode === 'historic'
                  ? 'border-violet/40 bg-violet/8 ring-1 ring-violet/25'
                  : 'border-border/20 bg-surface-highest/10 hover:border-border/40'
              )}
            >
              <div className="flex items-center gap-2">
                <History className={cn('h-3 w-3', ingestionMode === 'historic' ? 'text-violet' : 'text-muted-foreground')} />
                <span className={cn('text-[10px] font-bold', ingestionMode === 'historic' ? 'text-violet' : 'text-foreground')}>
                  + Existing files
                </span>
              </div>
              <p className="text-[9px] text-muted-foreground leading-relaxed">Backfill files already in the library.</p>
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
            Connector name
          </label>
          <input
            value={connectorName}
            onChange={(e) => setConnectorName(e.target.value)}
            placeholder="e.g. HR SharePoint"
            className="w-full rounded-xl border border-border/20 bg-background px-3 py-2.5 text-sm"
          />
        </div>

        <button
          type="button"
          disabled={!selectedSite || !connectorName.trim() || completeMutation.isPending}
          onClick={() => completeMutation.mutate()}
          className="w-full py-3 rounded-xl bg-foreground text-background font-black uppercase tracking-wider text-xs hover:opacity-90 disabled:opacity-50"
        >
          {completeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Create connector'}
        </button>

        {completeMutation.isError && (
          <p className="text-xs text-destructive text-center mt-2">
            {quotaErrorMessage(completeMutation.error, 'Failed to create connector.')}
          </p>
        )}
      </div>
    </div>
  );
};
