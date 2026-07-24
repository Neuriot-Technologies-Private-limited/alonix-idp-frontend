import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { adminService } from '../../../services/adminService';

function useOrgId() {
  return useAuthStore((s) => s.context?.orgId ?? s.user?.orgId);
}

export const useGroupHealth = () => {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ['group-health', orgId],
    queryFn: adminService.getGroupHealth,
    enabled: !!orgId,
  });
};

export const useGroupDetail = (id: string) => {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ['group-detail', id, orgId],
    queryFn: () => adminService.getGroupDetail(id),
    enabled: !!id && !!orgId,
    retry: (failureCount, error) => {
      const status = (error as { status?: number } | undefined)?.status;
      if (status === 404) return false;
      return failureCount < 1;
    },
  });
};
