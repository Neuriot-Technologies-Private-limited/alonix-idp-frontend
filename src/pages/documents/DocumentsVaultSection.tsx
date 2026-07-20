import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatDiscoveryUploadedAt } from '../../utils/formatDateTime';
import { Loader } from '../../components/ui/Loader';
import { Pagination } from '../../components/ui/Pagination';
import { DocumentAssetIdentity } from './DocumentAssetIdentity';
import { DocumentCustodian } from './DocumentCustodian';
import { DocumentPipelineLifecycle } from './DocumentPipelineLifecycle';
import { DocumentPipelineActions } from './DocumentPipelineActions';
import { DOCUMENTS_ITEMS_PER_PAGE, type DocumentRow } from './types/documentRow';

type DocumentsVaultSectionProps = {
  isLoading: boolean;
  filtered: DocumentRow[];
  paginatedDocuments: DocumentRow[];
  currentPage: number;
  onPageChange: (page: number) => void;
  hasBulkActions: boolean;
  selectedIds: Set<string>;
  bulkBusyActive: boolean;
  bulkBusy: 'ingest' | 'extract' | 'classify' | null;
  bulkIngestCount: number;
  bulkExtractCount: number;
  bulkClassifyCount: number;
  ingestQuotaBlocked: boolean;
  onBulkIngest: () => void;
  onBulkExtract: () => void;
  onBulkClassify: () => void;
  onSelectAllFiltered: () => void;
  onClearSelection: () => void;
  headerCheckboxRef: React.RefObject<HTMLInputElement | null>;
  allPageSelected: boolean;
  manageableOnPage: DocumentRow[];
  onToggleSelectPage: () => void;
  docCanManage: (d: DocumentRow) => boolean;
  custodianNameByEmail: Map<string, string>;
  toggleSelected: (id: string) => void;
  openDocBusyId: string | null;
  onOpenDocument: (doc: DocumentRow) => void;
  actionBusyKey: string | null;
  bustKey: (docId: string, action: string) => string;
  runPipeline: (docId: string, action: 'ingest' | 'extract' | 'classify') => void;
  onOpenResults: (doc: DocumentRow) => void;
  onDeleteDocument: (doc: DocumentRow) => void;
  deleteBusyId: string | null;
  resultLoadingDocId: string | null;
};

export const DocumentsVaultSection: React.FC<DocumentsVaultSectionProps> = ({
  isLoading,
  filtered,
  paginatedDocuments,
  currentPage,
  onPageChange,
  hasBulkActions,
  selectedIds,
  bulkBusyActive,
  bulkBusy,
  bulkIngestCount,
  bulkExtractCount,
  bulkClassifyCount,
  ingestQuotaBlocked,
  onBulkIngest,
  onBulkExtract,
  onBulkClassify,
  onSelectAllFiltered,
  onClearSelection,
  headerCheckboxRef,
  allPageSelected,
  manageableOnPage,
  onToggleSelectPage,
  docCanManage,
  custodianNameByEmail,
  toggleSelected,
  openDocBusyId,
  onOpenDocument,
  actionBusyKey,
  bustKey,
  runPipeline,
  onOpenResults,
  onDeleteDocument,
  deleteBusyId,
  resultLoadingDocId,
}) => (
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
        <Loader variant="section" label="Syncing assets..." />
      </div>
    ) : null}
    <div className={cn(isLoading && 'pointer-events-none select-none opacity-[0.38]')}>
      <div className="px-3 sm:px-6 py-3 border-b border-border/30 dark:border-border/45 bg-gradient-to-r from-primary/14 via-primary/6 to-transparent flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/65 dark:text-muted-foreground/55 tabular-nums order-2 sm:order-1">
          {filtered.length} document{filtered.length !== 1 ? 's' : ''}
          {filtered.length > 0 ? (
            <span className="text-muted-foreground/35">
              {' · '}page {currentPage} of {Math.max(1, Math.ceil(filtered.length / DOCUMENTS_ITEMS_PER_PAGE))}
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
              title={
                ingestQuotaBlocked
                  ? 'Document quota reached for this month'
                  : bulkIngestCount
                    ? `Run ingest on ${bulkIngestCount} document(s)`
                    : 'No selected documents need ingest'
              }
              disabled={bulkBusyActive || bulkIngestCount === 0 || ingestQuotaBlocked}
              onClick={onBulkIngest}
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
              onClick={onBulkExtract}
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
              onClick={onBulkClassify}
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
                onClick={onSelectAllFiltered}
                className="px-2 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-primary border border-transparent hover:border-border/10 transition-all"
              >
                Select all {filtered.length}
              </button>
            )}
            <button
              type="button"
              onClick={onClearSelection}
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
                    onChange={onToggleSelectPage}
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
            {paginatedDocuments.map((docItem) => {
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
                      fileName={docItem.fileName ?? ''}
                      type={docItem.type ?? ''}
                      size={docItem.size ?? ''}
                      density="table"
                      sensitivityLevel={docItem.sensitivityLevel}
                      canOpenFile={Boolean(docItem?.id)}
                      isOpening={openDocBusyId === String(docItem?.id)}
                      onFileNameClick={() => onOpenDocument(docItem)}
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
                      onOpenResults={onOpenResults}
                      onDeleteDocument={onDeleteDocument}
                      deleteBusyId={deleteBusyId}
                      resultsLoadingDocId={resultLoadingDocId}
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
          paginatedDocuments.map((docItem) => {
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
                      fileName={docItem.fileName ?? ''}
                      type={docItem.type ?? ''}
                      size={docItem.size ?? ''}
                      density="card"
                      sensitivityLevel={docItem.sensitivityLevel}
                      canOpenFile={Boolean(docItem?.id)}
                      isOpening={openDocBusyId === String(docItem?.id)}
                      onFileNameClick={() => onOpenDocument(docItem)}
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
                        onOpenResults={onOpenResults}
                        onDeleteDocument={onDeleteDocument}
                        deleteBusyId={deleteBusyId}
                        resultsLoadingDocId={resultLoadingDocId}
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
        totalPages={Math.ceil(filtered.length / DOCUMENTS_ITEMS_PER_PAGE)}
        onPageChange={onPageChange}
        totalItems={filtered.length}
        itemsPerPage={DOCUMENTS_ITEMS_PER_PAGE}
      />
    </div>
  </section>
);
