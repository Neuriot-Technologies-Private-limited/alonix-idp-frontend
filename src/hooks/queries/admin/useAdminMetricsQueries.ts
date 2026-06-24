import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { adminService } from '../../../services/adminService';

function useOrgId() {
  return useAuthStore((s) => s.context?.orgId ?? s.user?.orgId);
}

function useIsCompanyAdmin() {
  return useAuthStore((s) => s.context?.orgRole === 'COMPANY_ADMIN');
}

export const useActivitySeries = (
  query: { from?: string; to?: string; granularity?: 'day' | 'month'; groupId?: string },
  opts?: { enabled?: boolean }
) => {
  const orgId = useOrgId();
  const isCompanyAdmin = useIsCompanyAdmin();
  return useQuery({
    queryKey: ['activity-series', orgId, query],
    queryFn: () => adminService.getActivitySeries(query),
    enabled: opts?.enabled !== false && !!orgId && isCompanyAdmin,
    staleTime: 60 * 1000,
  });
};

export const useUsageSummary = (
  query?: { from?: string; to?: string },
  opts?: { enabled?: boolean }
) => {
  const orgId = useOrgId();
  const isCompanyAdmin = useIsCompanyAdmin();
  return useQuery({
    queryKey: ['usage-summary', orgId, query],
    queryFn: () => adminService.getUsageSummaryReport(query),
    enabled: opts?.enabled !== false && !!orgId && isCompanyAdmin,
    staleTime: 60 * 1000,
  });
};

export const usePipelineMetrics = (opts?: { enabled?: boolean }) => {
  const orgId = useOrgId();
  const isCompanyAdmin = useIsCompanyAdmin();
  return useQuery({
    queryKey: ['pipeline-metrics', orgId],
    queryFn: adminService.getPipelineMetrics,
    enabled: opts?.enabled !== false && !!orgId && isCompanyAdmin,
    staleTime: 30 * 1000,
  });
};

export const useMetricsByUser = (
  query?: { from?: string; to?: string; limit?: number },
  opts?: { enabled?: boolean }
) => {
  const orgId = useOrgId();
  const isCompanyAdmin = useIsCompanyAdmin();
  return useQuery({
    queryKey: ['metrics-by-user', orgId, query],
    queryFn: () => adminService.getMetricsByUser(query),
    enabled: opts?.enabled !== false && !!orgId && isCompanyAdmin,
    staleTime: 60 * 1000,
  });
};
