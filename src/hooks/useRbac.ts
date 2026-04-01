import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';

export const useRbac = () => {
  const context = useAuthStore((s) => s.context);
  const groups = context?.groups ?? [];
  const orgRole = context?.orgRole;

  const accessibleGroupIds = useMemo(() => groups.map((g) => g.groupId), [groups]);

  /** `null` means org admin (all groups). */
  const adminGroupIds = useMemo(() => {
    if (orgRole === 'COMPANY_ADMIN') return null as string[] | null;
    return groups.filter((g) => g.role === 'GROUP_ADMIN').map((g) => g.groupId);
  }, [groups, orgRole]);

  const hasAnyGroupAdmin = useMemo(
    () => orgRole === 'COMPANY_ADMIN' || groups.some((g) => g.role === 'GROUP_ADMIN'),
    [orgRole, groups]
  );

  const isGroupAdminFor = (groupId: string) => {
    if (orgRole === 'COMPANY_ADMIN') return true;
    const g = groups.find((x) => x.groupId === String(groupId));
    return g?.role === 'GROUP_ADMIN';
  };

  const hasCapability = (capability: string) => context?.capabilities.includes(capability) ?? false;

  const hasAnyCapability = (capabilities: string[]) =>
    capabilities.some((cap) => context?.capabilities.includes(cap));

  const hasAllCapabilities = (capabilities: string[]) =>
    capabilities.every((cap) => context?.capabilities.includes(cap));

  return {
    hasCapability,
    hasAnyCapability,
    hasAllCapabilities,
    orgRole: context?.orgRole,
    activeGroupRole: context?.activeGroupRole,
    groups,
    accessibleGroupIds,
    adminGroupIds,
    hasAnyGroupAdmin,
    isGroupAdminFor,
  };
};
