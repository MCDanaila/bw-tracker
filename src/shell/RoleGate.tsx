import type { ReactNode } from 'react';
import { useRole } from '@/core/contexts/RoleContext';

interface RoleGateProps {
  children: ReactNode;
  /** Capability required to access this content */
  requires: keyof ReturnType<typeof useRole>['capabilities'];
  /** Content shown when user lacks the required capability */
  fallback?: ReactNode;
}

/**
 * Component to guard content based on user capabilities.
 *
 * @example
 * <RoleGate requires="canManageAthletes">
 *   <AthletesManagementPanel />
 * </RoleGate>
 */
export function RoleGate({ children, requires, fallback = null }: RoleGateProps) {
  const { capabilities, isLoading } = useRole();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  const hasCapability = capabilities[requires];

  return hasCapability ? children : fallback;
}
