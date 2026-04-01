import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useRbac } from '../../hooks/useRbac';

interface RoleProtectedRouteProps {
  requiredCapability?: string;
  requiredAnyCapabilities?: string[];
  requiredOrgRole?: 'COMPANY_ADMIN' | 'MEMBER';
  requiredGroupRole?: 'GROUP_ADMIN' | 'MEMBER';
  /** Member is authorized if they are group admin in at least one assigned workspace (or company admin). */
  requiredAnyGroupAdmin?: boolean;
  /** Any signed-in org user with at least one workspace membership (or company admin). */
  requiredWorkspaceMember?: boolean;
  redirectTo?: string;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  requiredCapability,
  requiredAnyCapabilities,
  requiredOrgRole,
  requiredGroupRole,
  requiredAnyGroupAdmin,
  requiredWorkspaceMember,
  redirectTo = '/forbidden'
}) => {
  const { hasCapability, orgRole, activeGroupRole, groups } = useRbac();

  const isAuthorized = () => {
    if (requiredCapability && !hasCapability(requiredCapability)) return false;
    if (requiredAnyCapabilities && requiredAnyCapabilities.length > 0) {
      const hasAny = requiredAnyCapabilities.some((cap) => hasCapability(cap));
      if (!hasAny) return false;
    }
    if (requiredOrgRole && orgRole !== requiredOrgRole) return false;
    if (requiredGroupRole && activeGroupRole !== requiredGroupRole) return false;
    if (requiredAnyGroupAdmin) {
      if (orgRole !== 'COMPANY_ADMIN' && !groups.some((g) => g.role === 'GROUP_ADMIN')) return false;
    }
    if (requiredWorkspaceMember) {
      if (orgRole !== 'COMPANY_ADMIN' && groups.length === 0) return false;
    }
    return true;
  };

  if (!isAuthorized()) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};
