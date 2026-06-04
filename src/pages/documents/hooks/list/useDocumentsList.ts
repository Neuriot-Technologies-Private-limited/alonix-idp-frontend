import React, { useState } from 'react';
import { membershipForGroup } from '../../../../core/rbac/capabilities';
import { mergePipeline } from '../../../../services/adminService';
import { resolveCustodianDisplay } from '../../../../utils/custodianDisplay';
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
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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

  const documentsInScope = React.useMemo(() => {
    if (!documents) return [];

    const matchesActiveWorkspace = (d: DocumentRow) => {
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
    return documents.filter((d: DocumentRow) => {
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
    setCurrentPage(1);
  }, [search, activeTab, activeGroupIdForScope]);

  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [activeGroupIdForScope]);

  React.useEffect(() => {
    if (isPureViewOnly && activeTab !== 'All') setActiveTab('All');
  }, [isPureViewOnly, activeTab]);

  React.useEffect(() => {
    if (!hasBulkActions) setSelectedIds(new Set());
  }, [hasBulkActions]);

  const filtered = React.useMemo(() => {
    if (!documents) return [];
    let list = documentsInScope.slice();

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d: DocumentRow) => {
        const { label } = resolveCustodianDisplay(d.uploader, custodianNameByEmail);
        return (
          d.fileName.toLowerCase().includes(q) ||
          String(d.uploader ?? '').toLowerCase().includes(q) ||
          label.toLowerCase().includes(q)
        );
      });
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
  }, [documentsInScope, activeTab, search, documents, custodianNameByEmail]);

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

  const counts = React.useMemo(() => {
    const scope = documentsInScope;
    if (!scope.length && !documents?.length)
      return { all: 0, ingested: 0, extracted: 0, classified: 0, failed: 0 };
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
    };
  }, [documentsInScope, documents?.length]);

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

  return {
    isLoading,
    isCompanyAdmin,
    hasBulkActions,
    canUploadDocs,
    isPureViewOnly,
    hasCapability,
    docCanManage,
    docCanReviewEdit: docCanManage,
    activeTab,
    setActiveTab,
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
  };
}
