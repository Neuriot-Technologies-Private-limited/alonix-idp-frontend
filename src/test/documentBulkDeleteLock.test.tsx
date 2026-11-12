import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, within } from '@testing-library/react';
import { DocumentsVaultSection } from '../pages/documents/DocumentsVaultSection';
import type { DocumentRow } from '../pages/documents/types/documentRow';

const deletingDoc: DocumentRow = {
  id: 'doc-deleting',
  fileName: 'policy-deleting.pdf',
  type: 'PDF',
  size: '12 KB',
  uploadedAt: '2026-01-15T10:00:00.000Z',
  pipeline: {
    ingestion: { status: 'done' },
    extraction: { status: 'done' },
    classification: { status: 'idle' },
  },
};

const otherDoc: DocumentRow = {
  id: 'doc-other',
  fileName: 'notes-other.pdf',
  type: 'PDF',
  size: '4 KB',
  uploadedAt: '2026-01-16T10:00:00.000Z',
  pipeline: {
    ingestion: { status: 'idle' },
    extraction: { status: 'idle' },
    classification: { status: 'idle' },
  },
};

describe('documents vault during bulk delete', () => {
  it('disables selection and every action on documents included in the delete', () => {
    const onOpenDocument = vi.fn();
    const runPipeline = vi.fn();
    const onOpenResults = vi.fn();
    const onDeleteDocument = vi.fn();

    const { container } = render(
      <DocumentsVaultSection
        isLoading={false}
        filtered={[deletingDoc, otherDoc]}
        paginatedDocuments={[deletingDoc, otherDoc]}
        currentPage={1}
        onPageChange={() => {}}
        hasBulkActions
        selectedIds={new Set(['doc-deleting'])}
        bulkBusyActive={false}
        bulkBusy={null}
        bulkIngestCount={0}
        bulkExtractCount={0}
        bulkClassifyCount={1}
        bulkDeleteCount={1}
        bulkDeleteBusy
        bulkDeletingIds={new Set(['doc-deleting'])}
        ingestQuotaBlocked={false}
        onBulkIngest={() => {}}
        onBulkExtract={() => {}}
        onBulkClassify={() => {}}
        onBulkDelete={() => {}}
        onSelectAllFiltered={() => {}}
        onClearSelection={() => {}}
        headerCheckboxRef={createRef()}
        allPageSelected={false}
        manageableOnPage={[deletingDoc, otherDoc]}
        onToggleSelectPage={() => {}}
        docCanManage={() => true}
        custodianNameByEmail={new Map()}
        toggleSelected={() => {}}
        openDocBusyId={null}
        onOpenDocument={onOpenDocument}
        actionBusyKey={null}
        bustKey={(docId, action) => `${docId}:${action}`}
        runPipeline={runPipeline}
        onOpenResults={onOpenResults}
        onDeleteDocument={onDeleteDocument}
        deleteBusyId={null}
        resultLoadingDocId={null}
      />
    );

    const table = container.querySelector('table');
    expect(table).toBeTruthy();
    const rows = within(table as HTMLElement).getAllByRole('row');
    const deletingRow = rows[1];
    const otherRow = rows[2];

    for (const name of [/Ingest —/i, /Extract —/i, /Classify —/i, 'Delete document', 'Deleting this document']) {
      expect(within(deletingRow).getByRole('button', { name })).toBeDisabled();
    }
    expect(within(deletingRow).getByRole('button', { name: /policy-deleting.pdf/i })).toBeDisabled();
    expect(within(deletingRow).getByRole('checkbox')).toBeDisabled();
    expect(within(table as HTMLElement).getAllByRole('checkbox')[0]).toBeDisabled();
    expect(within(container).getByRole('button', { name: 'Clear' })).toBeDisabled();
    expect(within(container).getByRole('button', { name: /Bulk delete/i })).toBeDisabled();

    expect(within(otherRow).getByRole('button', { name: /Ingest — run ingestion/i })).toBeEnabled();
    expect(within(otherRow).getByRole('button', { name: /notes-other.pdf/i })).toBeEnabled();
  });
});
