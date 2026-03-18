import { createContext, useContext, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

export interface AthleteContextValue {
  activeAthleteId: string | null;
  setActiveAthleteId: (id: string | null) => void;
  isCoach: boolean;
  effectiveUserId: string;
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
  const { data: profile } = useProfile();
  const [activeAthleteId, setActiveAthleteId] = useState<string | null>(null);

  const isCoach = profile?.role === 'coach';
  const effectiveUserId = activeAthleteId ?? user?.id ?? '';

  return (
    <AthleteContext.Provider
      value={{
        activeAthleteId,
        setActiveAthleteId,
        isCoach,
        effectiveUserId,
      }}
    >
      {children}
    </AthleteContext.Provider>
  );
}
