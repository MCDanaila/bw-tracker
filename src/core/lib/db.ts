import Dexie, { type Table } from 'dexie';
import { getLocalDateStr } from './utils';
import { supabase } from './supabase';

// Define what a pending action looks like
export interface SyncAction {
    id?: number;               // Auto-incremented local ID
    mutation_type: string;     // e.g., 'UPSERT_DAILY_LOG'
    payload: any;              // The actual data (weight, RPE, etc.)
    status: 'pending' | 'error';
    created_at: string;
    retryCount?: number;
}

export class BWTrackerDB extends Dexie {
    syncQueue!: Table<SyncAction>;

    constructor() {
        super('BWTrackerDB');

        // Define the database schema (only index the fields we need to query by)
        this.version(1).stores({
            syncQueue: '++id, mutation_type, status, created_at, retryCount'
        });
    }
}

// Export a single instance of the database to use throughout the app
export const localDB = new BWTrackerDB();

/**
 * Upsert a daily log to the sync queue, merging with any existing pending entry for the same date.
 * Ensures only one UPSERT_DAILY_LOG entry per day, avoiding multiple "pending" entries.
 */
export async function upsertTodayQueueEntry(payload: any): Promise<void> {
  const todayDate = payload.date || getLocalDateStr();

  // Find all pending UPSERT_DAILY_LOG entries
  const allPending = await localDB.syncQueue
    .where('mutation_type')
    .equals('UPSERT_DAILY_LOG')
    .toArray();

  // Filter to today's date and get the latest one (highest id)
  const existing = allPending
    .filter(a => a.status === 'pending' && a.payload?.date === todayDate)
    .at(-1);

  if (existing?.id != null) {
    // Update existing entry with merged payload
    await localDB.syncQueue.update(existing.id, {
      payload: { ...existing.payload, ...payload },
    });
  } else {
    // Create new entry
    await localDB.syncQueue.add({
      mutation_type: 'UPSERT_DAILY_LOG',
      payload,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
  }
}

/**
 * Try to save a daily log directly to Supabase.
 * Falls back to offline queue if any error occurs (network, server, etc.).
 * Returns 'synced' or 'queued' so callers can react accordingly.
 */
export async function saveDailyLog(payload: any): Promise<'synced' | 'queued'> {
  try {
    const { error } = await supabase
      .from('daily_logs')
      .upsert(payload, { onConflict: 'user_id, date' });
    if (error) throw error;
    return 'synced';
  } catch {
    await upsertTodayQueueEntry(payload);
    return 'queued';
  }
}