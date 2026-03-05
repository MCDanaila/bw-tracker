import Dexie, { type Table } from 'dexie';

// Define what a pending action looks like
export interface SyncAction {
    id?: number;               // Auto-incremented local ID
    mutation_type: string;     // e.g., 'UPSERT_DAILY_LOG'
    payload: any;              // The actual data (weight, RPE, etc.)
    status: 'pending' | 'error';
    created_at: string;
}

export class BWTrackerDB extends Dexie {
    syncQueue!: Table<SyncAction>;

    constructor() {
        super('BWTrackerDB');

        // Define the database schema (only index the fields we need to query by)
        this.version(1).stores({
            syncQueue: '++id, mutation_type, status, created_at'
        });
    }
}

// Export a single instance of the database to use throughout the app
export const localDB = new BWTrackerDB();