# Offline Sync

## Problem

Athletes log data at the gym where connectivity is unreliable. Writes must not be lost.

## Solution: Manual Sync Queue

Writes go to a local IndexedDB queue first. The user syncs manually when back online via a `SyncHeader` button. No background sync, no conflict resolution — simple and explicit.

## Queue Schema (Dexie)

Defined in `src/core/lib/db.ts`:

```typescript
interface SyncAction {
  id?: number          // auto-increment
  type: string         // e.g. 'create_daily_log', 'update_meal_adherence'
  payload: object      // the data to upsert
  createdAt: string
  status: 'pending' | 'synced' | 'error'
  error?: string
}
```

Single table: `syncQueue` in `BWTrackerDB`.

## Write Flow

```
User submits form
  → dispatch SyncAction to Dexie syncQueue (status: 'pending')
  → UI updates optimistically
  → SyncHeader badge shows pending count
```

No Supabase call at write time. The form never waits for the network.

## Sync Flow

```
User taps Sync button
  → useSync() hook drains syncQueue
  → for each pending action: Supabase upsert (idempotent)
  → on success: mark 'synced'
  → on failure: mark 'error', store error message
  → user can retry failed items
```

`useSync()` is in `src/core/hooks/useSync.ts`.

## Why Upserts Are Safe to Retry

`daily_logs` has a `UNIQUE(user_id, date)` constraint. Supabase upserts on this constraint mean the same action can be dispatched multiple times without creating duplicate rows — retries are always safe.

## Read Flow

Reads bypass the queue entirely — they go directly to Supabase via TanStack Query. There is no local read cache beyond TanStack Query's in-memory cache.

This means: if a write is pending in the queue but not yet synced, the UI shows the optimistic local state but a page refresh will show the server state (pre-sync). This is an accepted tradeoff for the MVP.

## Inspecting the Queue (Debug)

Open DevTools → Application → IndexedDB → BWTrackerDB → syncQueue

The browser console also logs sync errors from `useSync`.

## Known Limitations

- No background sync (Service Worker push not wired up)
- No conflict resolution — last write wins on retry
- Read-after-write inconsistency until manual sync
