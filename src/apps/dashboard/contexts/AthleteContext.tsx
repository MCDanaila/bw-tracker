// eslint-disable-next-line react-refresh/only-export-components
import { createContext, useContext, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/core/contexts/AuthContext';
import { useProfile } from '@/core/hooks/useProfile';
import { useRole } from '@/core/contexts/RoleContext';
import type { UserProfile } from '@/core/types/database';

export interface AthleteContextValue {
  activeAthleteId: string | null;
  setActiveAthleteId: (id: string | null) => void;
  canManageAthletes: boolean;
  effectiveUserId: string;
  activeAthlete: UserProfile | null;
}

export const AthleteContext = createContext<AthleteContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAthleteContext() {
  const ctx = useContext(AthleteContext);
  if (!ctx) throw new Error('useAthleteContext must be used within AthleteProvider');
  return ctx;
}

export function AthleteProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { capabilities } = useRole();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeAthleteId = searchParams.get('athlete') || null;

  const setActiveAthleteId = useCallback((id: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (id) {
        next.set('athlete', id);
      } else {
        next.delete('athlete');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const effectiveUserId = activeAthleteId ?? user?.id ?? '';

  // Fetch the active athlete's profile when one is selected
  const { data: athleteProfile } = useProfile(activeAthleteId ?? undefined);

  return (
    <AthleteContext.Provider
      value={{
        activeAthleteId,
        setActiveAthleteId,
        canManageAthletes: capabilities.canManageAthletes,
        effectiveUserId,
        activeAthlete: activeAthleteId ? (athleteProfile ?? null) : null,
      }}
    >
      {children}
    </AthleteContext.Provider>
  );
}
