import Dexie, { type Table } from 'dexie';
import { getLocalDateStr } from './utils';
import { supabase } from './supabase';
import { DAILY_LOG_INT_FIELDS } from './constants';

// Define what a pending action looks like
export interface SyncAction {
    id?: number;               // Auto-incremented local ID
    mutation_type: string;     // e.g., 'UPSERT_DAILY_LOG'
    payload: any;              // The actual data (weight, RPE, etc.)
    status: 'pending' | 'error';
    created_at: string;
    retryCount?: number;
    date?: string;             // Top-level indexed copy of payload.date for efficient lookups
}

export class LeonidaDB extends Dexie {
    syncQueue!: Table<SyncAction>;

    constructor() {
        super('LeonidaDB');

        // v1: original schema
        this.version(1).stores({
            syncQueue: '++id, mutation_type, status, created_at, retryCount'
        });

        // v2: promote date to top-level indexed field
        this.version(2).stores({
            syncQueue: '++id, mutation_type, status, created_at, retryCount, date'
        });
    }
}

// Export a single instance of the database to use throughout the app
export const localDB = new LeonidaDB();

/**
 * Upsert a daily log to the sync queue, merging with any existing pending entry for the same date.
 * Ensures only one UPSERT_DAILY_LOG entry per day, avoiding multiple "pending" entries.
 */
export async function upsertTodayQueueEntry(payload: any): Promise<void> {
  const todayDate = payload.date || getLocalDateStr();

  // Use the indexed `mutation_type` field to narrow the set, then filter by
  // the indexed `date` field — avoids a full collection scan.
  const existing = await localDB.syncQueue
    .where('mutation_type')
    .equals('UPSERT_DAILY_LOG')
    .and(a => a.status === 'pending' && (a.date === todayDate || a.payload?.date === todayDate))
    .last();

  if (existing?.id != null) {
    // Update existing entry with merged payload
    await localDB.syncQueue.update(existing.id, {
      payload: { ...existing.payload, ...payload },
      date: todayDate,
    });
  } else {
    // Create new entry — store date as top-level indexed field
    await localDB.syncQueue.add({
      mutation_type: 'UPSERT_DAILY_LOG',
      payload,
      status: 'pending',
      created_at: new Date().toISOString(),
      date: todayDate,
    });
  }
}

/**
 * Try to save a daily log directly to Supabase.
 * Falls back to offline queue if any error occurs (network, server, etc.).
 * Returns 'synced' or 'queued' so callers can react accordingly.
 */
export async function saveDailyLog(payload: any): Promise<'synced' | 'queued'> {
  const sanitized = { ...payload };
  for (const field of DAILY_LOG_INT_FIELDS) {
    const v = sanitized[field];
    sanitized[field] = v === '' || v === null || v === undefined ? null : Number(v);
  }
  try {
    const { error } = await supabase
      .from('daily_logs')
      .upsert(sanitized, { onConflict: 'user_id, date' });
    if (error) throw error;
    return 'synced';
  } catch {
    await upsertTodayQueueEntry(sanitized);
    return 'queued';
  }
}