/**
 * React Query hooks for admin/org API data.
 * API functions live in `services/adminService.ts`; hooks live here.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { adminService, type AuditLogsQuery } from '../../../services/adminService';

function useOrgId() {
  return useAuthStore((s) => s.context?.orgId ?? s.user?.orgId);
}

function useIsCompanyAdmin() {
  return useAuthStore((s) => s.context?.orgRole === 'COMPANY_ADMIN');
}

export const useDashboardState = () => {
  const orgId = useOrgId();
  const activeGroupId = useAuthStore((s) => s.context?.activeGroupId ?? '');
  return useQuery({
    queryKey: ['dashboard-state', orgId, activeGroupId],
    queryFn: adminService.getDashboardState,
    enabled: !!orgId,
    staleTime: 60 * 1000,
  });
};

export const useAdminStats = () => {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ['admin-stats', orgId],
    queryFn: adminService.getStats,
    enabled: !!orgId,
  });
};

export const useOrgAiSettings = (opts?: { enabled?: boolean }) => {
  const orgId = useOrgId();
  const isCompanyAdmin = useIsCompanyAdmin();
  return useQuery({
    queryKey: ['org-ai-settings', orgId],
    queryFn: adminService.getOrgAiSettings,
    enabled: opts?.enabled !== false && !!orgId && isCompanyAdmin,
    staleTime: 60 * 1000,
  });
};

export const useOrgSharePointSettings = (opts?: { enabled?: boolean }) => {
  const orgId = useOrgId();
  const isCompanyAdmin = useIsCompanyAdmin();
  return useQuery({
    queryKey: ['org-sharepoint-settings', orgId],
    queryFn: adminService.getOrgSharePointSettings,
    enabled: opts?.enabled !== false && !!orgId && isCompanyAdmin,
    staleTime: 60 * 1000,
  });
};

export const useUsers = () => {
  const orgId = useOrgId();
  const isCompanyAdmin = useIsCompanyAdmin();
  return useQuery({
    queryKey: ['users', orgId],
    queryFn: adminService.getUsers,
    enabled: !!orgId && isCompanyAdmin,
  });
};

export const useAuditLogs = (query: AuditLogsQuery = {}, opts?: { enabled?: boolean }) => {
  const orgId = useOrgId();
  const isCompanyAdmin = useIsCompanyAdmin();
  return useQuery({
    queryKey: ['audit-logs', orgId, query],
    queryFn: () => adminService.getAuditLogs(query),
    enabled: opts?.enabled !== false && !!orgId && isCompanyAdmin,
  });
};
