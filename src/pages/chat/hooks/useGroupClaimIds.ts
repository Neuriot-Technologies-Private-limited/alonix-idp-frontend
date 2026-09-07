import { useQuery } from '@tanstack/react-query';
import { getGroupClaimIds } from '../../../services/chatApi';
import { chatQueryKeys } from './chatQueryKeys';

export function useGroupClaimIds(groupId: string) {
  const groupKey = groupId?.trim() || '';
  const query = useQuery({
    queryKey: chatQueryKeys.claimIds(groupKey),
    queryFn: async () => {
      const res = await getGroupClaimIds(groupKey);
      const ids = Array.isArray(res.data?.claimIds) ? res.data.claimIds : [];
      return ids.map((id) => String(id || '').trim()).filter(Boolean);
    },
    enabled: Boolean(groupKey),
    staleTime: 30_000,
  });

  return {
    claimIds: query.data ?? [],
    isClaimIdsLoading: query.isPending,
  };
}
