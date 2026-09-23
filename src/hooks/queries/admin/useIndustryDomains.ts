import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { adminService } from '../../../services/adminService';

function useOrgId() {
  return useAuthStore((s) => s.context?.orgId ?? s.user?.orgId);
}

export const useIndustryDomains = () => {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ['industry-domains'],
    queryFn: () => adminService.listIndustryDomains(),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!orgId,
  });
};
