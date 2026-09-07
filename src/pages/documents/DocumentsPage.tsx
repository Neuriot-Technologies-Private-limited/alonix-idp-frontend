import React from 'react';
import { useOrgQuota } from '../../hooks/useOrgQuota';
import { DocumentReviewDrawer } from '../../components/documents/DocumentReviewDrawer';
import { DocumentUploadModal } from './DocumentUploadModal';
import { DocumentsConnectorModal } from './DocumentsConnectorModal';
import { DocumentsPageHeader } from './DocumentsPageHeader';
import { DocumentsVaultSection } from './DocumentsVaultSection';
import {
  useConnectorBrowserModal,
  useDocumentsList,
  useDocumentPipeline,
  useDocumentActions,
  useDocumentReview,
  useDocumentUpload,
  usePipelineDocuments,
} from './hooks';

export const DocumentsPage: React.FC = () => {
  const { atCap } = useOrgQuota();
  const ingestQuotaBlocked = atCap('documentsMonth');
  const { data: documents, isLoading } = usePipelineDocuments();

  const list = useDocumentsList(documents, isLoading);
  const {
    connectorBrowserOpen,
    connectorBrowserLinkId,
    connectorDialogRef,
    openConnectorBrowserModal,
    closeConnectorBrowserModal,
  } = useConnectorBrowserModal();

  const pipeline = useDocumentPipeline(
    documents,
    list.docCanManage,
    list.context?.orgId,
    list.user?.email,
    list.context?.activeGroupId ?? list.user?.groupID ?? list.user?.groupId
  );

  const actions = useDocumentActions(list.docCanManage);
  const review = useDocumentReview();

  const upload = useDocumentUpload({
    isCompanyAdmin: list.isCompanyAdmin,
    groups: list.groups,
    adminGroupIds: list.adminGroupIds,
    orgRole: list.context?.orgRole,
    orgId: list.context?.orgId ?? list.user?.orgId ?? null,
    user: list.user,
    onUploadStarted: () => {
      list.setActiveTab('All');
      list.setCurrentPage(1);
    },
  });

  const handleDeleteDocument = (docItem: Parameters<typeof actions.handleDeleteDocument>[0]) => {
    void actions.handleDeleteDocument(docItem, (id) => {
      list.setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    });
  };

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-[max(5rem,env(safe-area-inset-bottom))]">
      <DocumentsPageHeader
        isPureViewOnly={list.isPureViewOnly}
        headerSubtitle={list.headerSubtitle}
        canUploadDocs={list.canUploadDocs}
        canIngestFromConnectors={list.canIngestFromConnectors}
        onOpenUpload={() => upload.setIsUploadModalOpen(true)}
        onOpenConnectors={openConnectorBrowserModal}
        counts={list.counts}
        search={list.search}
        onSearchChange={list.setSearch}
        pipelineTabs={list.pipelineTabs}
        activeTab={list.activeTab}
        onTabChange={list.setActiveTab}
        showConnectorBreakdown={list.showConnectorBreakdown}
        connectorBreakdown={list.connectorBreakdown}
        connectorFilterId={list.connectorFilterId}
        connectorFilterType={list.connectorFilterType}
        onConnectorFilterChange={list.setConnectorFilterId}
        onConnectorTypeFilterChange={list.setConnectorFilterType}
        onShowConnectorDocuments={() => list.openConnectorDocuments(null)}
        connectorViewAllWorkspaces={list.connectorViewAllWorkspaces}
        activeGroupName={list.activeGroupName}
      />

      <DocumentsVaultSection
        isLoading={list.isLoading}
        filtered={list.filtered}
        paginatedDocuments={list.paginatedDocuments}
        currentPage={list.currentPage}
        onPageChange={list.setCurrentPage}
        hasBulkActions={list.hasBulkActions}
        selectedIds={list.selectedIds}
        bulkBusyActive={pipeline.bulkBusyActive}
        bulkBusy={pipeline.bulkBusy}
        bulkIngestCount={list.bulkIngestCount}
        bulkExtractCount={list.bulkExtractCount}
        bulkClassifyCount={list.bulkClassifyCount}
        ingestQuotaBlocked={ingestQuotaBlocked}
        onBulkIngest={() => void pipeline.runBulkPipeline('ingest', list.selectedIds)}
        onBulkExtract={() => void pipeline.runBulkPipeline('extract', list.selectedIds)}
        onBulkClassify={() => void pipeline.runBulkPipeline('classify', list.selectedIds)}
        onSelectAllFiltered={list.selectAllFiltered}
        onClearSelection={list.clearSelection}
        headerCheckboxRef={list.headerCheckboxRef}
        allPageSelected={list.allPageSelected}
        manageableOnPage={list.manageableOnPage}
        onToggleSelectPage={list.toggleSelectPage}
        docCanManage={list.docCanManage}
        custodianNameByEmail={list.custodianNameByEmail}
        toggleSelected={list.toggleSelected}
        openDocBusyId={actions.openDocBusyId}
        onOpenDocument={(doc) => void actions.handleOpenDocument(doc)}
        actionBusyKey={pipeline.actionBusyKey}
        bustKey={pipeline.bustKey}
        runPipeline={(docId, action) => void pipeline.runPipeline(docId, action)}
        onOpenResults={(doc) => void review.handleOpenResults(doc)}
        onDeleteDocument={handleDeleteDocument}
        deleteBusyId={actions.deleteBusyId}
        resultLoadingDocId={review.resultLoadingDocId}
      />

      <DocumentsConnectorModal
        open={connectorBrowserOpen}
        connectorDialogRef={connectorDialogRef}
        initialConnectorId={connectorBrowserLinkId}
        onClose={closeConnectorBrowserModal}
        onViewIngestedDocuments={(connectorId) => {
          list.openConnectorDocuments(connectorId);
          closeConnectorBrowserModal();
        }}
      />

      <DocumentReviewDrawer
        documentItem={review.resultModal}
        reviewData={review.reviewData}
        isOpen={!!review.resultModal}
        onClose={review.closeReview}
        isLoading={Boolean(review.resultLoadingDocId)}
        allowEdit={review.resultModal ? list.docCanReviewEdit(review.resultModal) : false}
        allowExport={list.isCompanyAdmin || list.hasCapability('GROUP_DOC_VIEW')}
        extractFormat={review.extractFormat}
        onFormatChange={review.setExtractFormat}
        onExport={review.handleExport}
        onSaved={review.handleReviewSaved}
        onError={review.handleReviewError}
      />

      <DocumentUploadModal
        isOpen={upload.isUploadModalOpen}
        onClose={() => {
          upload.setIsUploadModalOpen(false);
          upload.setAttachClaimId(false);
          upload.setClaimId('');
        }}
        orgWideUpload={list.isCompanyAdmin}
        groups={upload.uploadGroupChoices}
        targetGroupId={upload.targetGroupId}
        setTargetGroupId={upload.setTargetGroupId}
        selectedFiles={upload.selectedFiles}
        setSelectedFiles={upload.setSelectedFiles}
        uploadSensitivityLevel={upload.uploadSensitivityLevel}
        onUploadSensitivityChange={upload.setUploadSensitivityLevel}
        uploadSensitivityOptions={upload.uploadSensitivityOptions}
        attachClaimId={upload.attachClaimId}
        onAttachClaimIdChange={upload.setAttachClaimId}
        claimId={upload.claimId}
        onClaimIdChange={upload.setClaimId}
        onUpload={upload.runUpload}
      />
    </div>
  );
};

export default DocumentsPage;
