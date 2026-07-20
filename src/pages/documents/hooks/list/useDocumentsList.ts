import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { membershipForGroup } from '../../../../core/rbac/capabilities';
import { mergePipeline } from '../../../../services/adminService';
import { listOrgConnectors, type OrgConnector } from '../../../../services/connectorBrowserApi';
import { resolveCustodianDisplay } from '../../../../utils/custodianDisplay';
import {
  buildConnectorBreakdown,
  isConnectorSourcedDoc,
  resolveConnectorSourceType,
  type ConnectorListItem,
} from '../../../../utils/connectorDocumentSource';
import { isConnectorPendingDocumentId } from '../../../../utils/connectorIngestOptimistic';
import { useUsers } from '../../../../services/userService';
import { useRbac } from '../../../../hooks/useRbac';
import { useAuthStore } from '../../../../stores/authStore';
import {
  DOCUMENTS_ITEMS_PER_PAGE,
  type DocumentPipelineTab,
  type DocumentRow,
} from '../../types/documentRow';

export type { DocumentPipelineTab, DocumentRow };
export { DOCUMENTS_ITEMS_PER_PAGE };

export function useDocumentsList(documents: DocumentRow[] | undefined, isLoading: boolean) {
  const { hasCapability, orgRole, groups, adminGroupIds } = useRbac();
  const { data: directoryUsers = [] } = useUsers();
  const user = useAuthStore((s) => s.user);
  const context = useAuthStore((s) => s.context);

  const isCompanyAdmin = orgRole === 'COMPANY_ADMIN';
  const hasBulkActions = isCompanyAdmin || (adminGroupIds?.length ?? 0) > 0;
  const canUploadDocs = isCompanyAdmin || (adminGroupIds?.length ?? 0) > 0;
  const isPureViewOnly = !canUploadDocs;

  const docCanManage = React.useCallback(
    (d: DocumentRow) => {
      if (isCompanyAdmin) return true;
      const m = membershipForGroup(groups, d.groupId, d.group);
      return m?.role === 'GROUP_ADMIN';
    },
    [isCompanyAdmin, groups]
  );

  const [activeTab, setActiveTab] = useState<DocumentPipelineTab>('All');
  const [connectorFilterId, setConnectorFilterId] = useState<string | null>(null);
  const [connectorFilterType, setConnectorFilterType] = useState<string | null>(null);
  const [connectorViewAllWorkspaces, setConnectorViewAllWorkspaces] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const orgId = context?.orgId ?? user?.orgId ?? null;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const headerCheckboxRef = React.useRef<HTMLInputElement>(null);

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

  const groupIdSet = React.useMemo(
    () => new Set(groups.map((g) => g.groupId.toLowerCase())),
    [groups]
  );
  const groupNameSet = React.useMemo(
    () => new Set(groups.map((g) => g.groupName.trim().toLowerCase())),
    [groups]
  );

  const orgWideDocumentsInScope = React.useMemo(() => {
    if (!documents) return [];
    if (isCompanyAdmin) return documents;
    return documents.filter((d: DocumentRow) => {
      const docGroupId = String(d.groupId || '').toLowerCase();
      const docGroupName = String(d.group || '').trim().toLowerCase();
      return (
        (docGroupId && groupIdSet.has(docGroupId)) ||
        (docGroupName && groupNameSet.has(docGroupName))
      );
    });
  }, [documents, isCompanyAdmin, groupIdSet, groupNameSet]);

  const documentsInScope = React.useMemo(() => {
    if (!documents) return [];

    const skipWorkspaceScope = connectorViewAllWorkspaces;

    const matchesActiveWorkspace = (d: DocumentRow) => {
      if (skipWorkspaceScope) return true;
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
    return orgWideDocumentsInScope.filter(matchesActiveWorkspace);
  }, [
    documents,
    isCompanyAdmin,
    orgWideDocumentsInScope,
    activeGroupIdForScope,
    activeGroupNameNorm,
    connectorViewAllWorkspaces,
  ]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab, activeGroupIdForScope, connectorFilterId, connectorFilterType]);

  React.useEffect(() => {
    if (activeTab !== 'Connectors') {
      setConnectorFilterId(null);
      setConnectorFilterType(null);
      setConnectorViewAllWorkspaces(false);
    }
  }, [activeTab]);

  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [activeGroupIdForScope]);

  React.useEffect(() => {
    if (isPureViewOnly && activeTab !== 'All' && activeTab !== 'Connectors') setActiveTab('All');
  }, [isPureViewOnly, activeTab]);

  React.useEffect(() => {
    if (!hasBulkActions) setSelectedIds(new Set());
  }, [hasBulkActions]);

  const { data: connectors = [] } = useQuery<OrgConnector[]>({
    queryKey: ['connectors', orgId],
    queryFn: () => listOrgConnectors(orgId || undefined),
    enabled: Boolean(orgId),
    staleTime: 60_000,
  });

  const connectorById = React.useMemo(
    () => new Map(connectors.map((c) => [String(c._id), c as ConnectorListItem])),
    [connectors]
  );

  const filtered = React.useMemo(() => {
    if (!documents) return [];
    let list = documentsInScope.slice();

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d: DocumentRow) => {
        const { label } = resolveCustodianDisplay(d.uploader, custodianNameByEmail);
        return (
          d.fileName?.toLowerCase().includes(q) ||
          String(d.uploader ?? '').toLowerCase().includes(q) ||
          label.toLowerCase().includes(q)
        );
      });
    }

    if (activeTab === 'Connectors') {
      list = list.filter((d: DocumentRow) => isConnectorSourcedDoc(d));
      if (connectorFilterType) {
        list = list.filter(
          (d: DocumentRow) => resolveConnectorSourceType(d, connectorById) === connectorFilterType
        );
      }
      if (connectorFilterId) {
        list = list.filter((d: DocumentRow) => String(d.connectorId || '') === connectorFilterId);
      }
      return list;
    }

    if (activeTab === 'All') return list;

    return list.filter((d: DocumentRow) => {
      const p = mergePipeline(d.pipeline);
      if (activeTab === 'Ingest') return p.ingestion.status === 'processing' || p.ingestion.status === 'idle';
      if (activeTab === 'Extract')
        return (
          p.ingestion.status === 'done' &&
          (p.extraction.status === 'processing' || p.extraction.status === 'idle')
        );
      if (activeTab === 'Classify')
        return (
          p.extraction.status === 'done' &&
          (p.classification.status === 'processing' || p.classification.status === 'idle')
        );
      return true;
    });
  }, [
    documentsInScope,
    activeTab,
    connectorFilterId,
    connectorFilterType,
    connectorById,
    search,
    documents,
    custodianNameByEmail,
  ]);

  const paginatedDocuments = React.useMemo(() => {
    const start = (currentPage - 1) * DOCUMENTS_ITEMS_PER_PAGE;
    return filtered.slice(start, start + DOCUMENTS_ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const manageableOnPage = React.useMemo(
    () => paginatedDocuments.filter((d: DocumentRow) => docCanManage(d)),
    [paginatedDocuments, docCanManage]
  );

  const selectedDocs = React.useMemo(
    () => filtered.filter((d: DocumentRow) => selectedIds.has(d.id) && docCanManage(d)),
    [filtered, selectedIds, docCanManage]
  );

  const bulkIngestCount = selectedDocs.filter((d: DocumentRow) => {
    if (isConnectorPendingDocumentId(d.id)) return false;
    const p = mergePipeline(d.pipeline);
    return p.ingestion.status !== 'processing' && p.ingestion.status !== 'done';
  }).length;
  const bulkExtractCount = selectedDocs.filter((d: DocumentRow) => {
    const p = mergePipeline(d.pipeline);
    return p.extraction.status !== 'processing' && p.extraction.status !== 'done';
  }).length;
  const bulkClassifyCount = selectedDocs.filter((d: DocumentRow) => {
    const p = mergePipeline(d.pipeline);
    return p.classification.status !== 'processing' && p.classification.status !== 'done';
  }).length;

  const allPageSelected =
    manageableOnPage.length > 0 && manageableOnPage.every((d: DocumentRow) => selectedIds.has(d.id));
  const somePageSelected = manageableOnPage.some((d: DocumentRow) => selectedIds.has(d.id));

  const toggleSelected = (id: string) => {
    const row = documents?.find((d: DocumentRow) => d.id === id);
    if (row && !docCanManage(row)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const toggleSelectPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        manageableOnPage.forEach((d: DocumentRow) => next.delete(d.id));
      } else {
        manageableOnPage.forEach((d: DocumentRow) => next.add(d.id));
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filtered.filter((d: DocumentRow) => docCanManage(d)).map((d: DocumentRow) => d.id)));
  };

  React.useEffect(() => {
    const el = headerCheckboxRef.current;
    if (el) el.indeterminate = somePageSelected && !allPageSelected;
  }, [somePageSelected, allPageSelected]);

  const connectorBreakdown = React.useMemo(
    () => buildConnectorBreakdown(orgWideDocumentsInScope, connectors),
    [orgWideDocumentsInScope, connectors]
  );

  const counts = React.useMemo(() => {
    const scope = documentsInScope;
    if (!scope.length && !documents?.length)
      return { all: 0, ingested: 0, extracted: 0, classified: 0, failed: 0, fromConnectors: 0 };
    return {
      all: scope.length,
      ingested: scope.filter((d: DocumentRow) => mergePipeline(d.pipeline).ingestion.status === 'done').length,
      extracted: scope.filter((d: DocumentRow) => mergePipeline(d.pipeline).extraction.status === 'done').length,
      classified: scope.filter((d: DocumentRow) => mergePipeline(d.pipeline).classification.status === 'done')
        .length,
      failed: scope.filter((d: DocumentRow) => {
        const p = mergePipeline(d.pipeline);
        return (
          p.ingestion.status === 'error' ||
          p.extraction.status === 'error' ||
          p.classification.status === 'error'
        );
      }).length,
      fromConnectors: documentsInScope.filter((d: DocumentRow) => isConnectorSourcedDoc(d)).length,
    };
  }, [documentsInScope, documents?.length]);

  const headerSubtitle = isCompanyAdmin
    ? 'Organization-wide vault: ingest, run pipeline stages, and review AI outputs across all workspaces.'
    : isPureViewOnly
      ? 'View documents and AI extraction or classification results for workspaces assigned to you. Pipeline actions are limited to administrators.'
      : 'Manage the document pipeline for workspaces where you are a group admin; other assigned workspaces are view-only.';

  const pipelineTabs = isPureViewOnly
    ? [
        { id: 'All' as const, label: 'All', count: counts.all },
        { id: 'Connectors' as const, label: 'Connectors', count: counts.fromConnectors },
      ]
    : [
        { id: 'All' as const, label: 'All', count: counts.all },
        { id: 'Connectors' as const, label: 'Connectors', count: counts.fromConnectors },
        { id: 'Ingest' as const, label: 'Ingest', count: counts.ingested },
        { id: 'Extract' as const, label: 'Extract', count: counts.extracted },
        { id: 'Classify' as const, label: 'Classify', count: counts.classified },
      ];

  const showConnectorBreakdown = counts.fromConnectors > 0;

  const openConnectorDocuments = React.useCallback(
    (connectorId?: string | null) => {
      setConnectorViewAllWorkspaces(true);
      setActiveTab('Connectors');
      setConnectorFilterType(null);
      setConnectorFilterId(connectorId ? String(connectorId) : null);
      setCurrentPage(1);
    },
    []
  );

  const handleSetActiveTab = React.useCallback((tab: DocumentPipelineTab) => {
    setActiveTab(tab);
  }, []);

  const isGroupAdmin = (adminGroupIds !== null && (adminGroupIds?.length ?? 0) > 0);

  return {
    isLoading,
    isCompanyAdmin,
    canIngestFromConnectors: isCompanyAdmin || isGroupAdmin,
    hasBulkActions,
    canUploadDocs,
    isPureViewOnly,
    hasCapability,
    docCanManage,
    docCanReviewEdit: docCanManage,
    activeTab,
    setActiveTab: handleSetActiveTab,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    selectedIds,
    setSelectedIds,
    headerCheckboxRef,
    custodianNameByEmail,
    filtered,
    paginatedDocuments,
    counts,
    connectorBreakdown,
    connectorFilterId,
    setConnectorFilterId,
    connectorFilterType,
    setConnectorFilterType,
    showConnectorBreakdown,
    connectorViewAllWorkspaces,
    openConnectorDocuments,
    pipelineTabs,
    headerSubtitle,
    toggleSelected,
    clearSelection,
    toggleSelectPage,
    selectAllFiltered,
    allPageSelected,
    somePageSelected,
    manageableOnPage,
    bulkIngestCount,
    bulkExtractCount,
    bulkClassifyCount,
    user,
    context,
    groups,
    adminGroupIds,
    activeGroupName: activeGroup?.groupName ?? null,
  };
}
