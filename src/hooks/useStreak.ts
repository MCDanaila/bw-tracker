import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useHistoryLogs } from './useHistoryLogs';
import { localDB } from '@/lib/db';
import { getLocalDateStr } from '@/lib/utils';

/**
 * Computes the current consecutive-day logging streak.
 * Merges Supabase remote logs with locally pending (unsynced) logs
 * so the streak is accurate even when offline.
 * Uses useLiveQuery so the streak updates reactively when new logs are added.
 */
export function useStreak(): number {
    const { data: remoteLogs } = useHistoryLogs();
    const localActions = useLiveQuery(
        () => localDB.syncQueue
            .where('mutation_type')
            .equals('UPSERT_DAILY_LOG')
            .toArray(),
        []
    );

    return useMemo(() => {
        const localDates = new Set(
            (localActions || [])
                .filter(a => a.payload?.date)
                .map(a => a.payload.date as string)
        );
        const remoteDates = new Set((remoteLogs || []).map(l => l.date));
        const allDates = new Set([...remoteDates, ...localDates]);

        let count = 0;
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (let i = 0; i < 90; i++) {
            const dateStr = getLocalDateStr(currentDate);
            if (allDates.has(dateStr)) {
                count++;
            } else if (i > 0) {
                // Allow today to be unlogged yet; break on any other missing day
                break;
            }
            currentDate.setDate(currentDate.getDate() - 1);
        }

        return count;
    }, [remoteLogs, localActions]);
}
