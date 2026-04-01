import { type ReactNode } from 'react';
import { useRbac } from '../../hooks/useRbac';

interface CapabilityGuardProps {
  capability?: string;
  capabilities?: string[];
  operator?: 'AND' | 'OR';
  fallback?: ReactNode;
  children: ReactNode;
}

export const CapabilityGuard = ({
  capability,
  capabilities,
  operator = 'AND',
  fallback = null,
  children,
}: CapabilityGuardProps) => {
  const { hasCapability, hasAnyCapability, hasAllCapabilities } = useRbac();

  let isAuthorized = false;

  if (capability) {
    isAuthorized = hasCapability(capability);
  } else if (capabilities) {
    isAuthorized = operator === 'OR' 
      ? hasAnyCapability(capabilities) 
      : hasAllCapabilities(capabilities);
  }

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
