import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useProfile } from '../hooks/useProfile';
import type { UserProfile } from '../types/database';

/**
 * User capability flags derived from their profile role.
 * Single source of truth for role-based access control.
 */
export interface Capabilities {
  /** Can log daily data (morning, training, evening forms) */
  canLog: boolean;
  /** Can view and access the dashboard/stats panel */
  canViewDashboard: boolean;
  /** Can edit their own goals, diet, targets */
  canEditOwnGoals: boolean;
  /** Can manage their own meal plans and food swaps */
  canManageOwnDiet: boolean;
  /** Can manage multiple athletes (coach-only) */
  canManageAthletes: boolean;
}

export interface RoleContextValue {
  role: 'athlete' | 'self_coached' | 'coach' | null;
  capabilities: Capabilities;
  isLoading: boolean;
  profile: UserProfile | null;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

/**
 * Compute capabilities from a profile's role.
 */
function deriveCapabilities(role: string | null): Capabilities {
  return {
    canLog: role === 'athlete' || role === 'self_coached',
    canViewDashboard: role === 'self_coached' || role === 'coach',
    canEditOwnGoals: role === 'self_coached' || role === 'coach',
    canManageOwnDiet: role === 'self_coached' || role === 'coach',
    canManageAthletes: role === 'coach',
  };
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const [roleContextValue, setRoleContextValue] = useState<RoleContextValue>({
    role: null,
    capabilities: deriveCapabilities(null),
    isLoading: true,
    profile: null,
  });

  useEffect(() => {
    if (authLoading || profileLoading) {
      setRoleContextValue((prev) => ({ ...prev, isLoading: true }));
      return;
    }

    const role = (profile?.role as 'athlete' | 'self_coached' | 'coach' | null) ?? null;
    setRoleContextValue({
      role,
      capabilities: deriveCapabilities(role),
      isLoading: false,
      profile: profile ?? null,
    });
  }, [profile, authLoading, profileLoading]);

  return (
    <RoleContext.Provider value={roleContextValue}>
      {children}
    </RoleContext.Provider>
  );
}

/**
 * Hook to access the current user's role and capabilities.
 */
export function useRole(): RoleContextValue {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
