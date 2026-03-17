# BW Tracker — Full Project Analysis Report

**Date:** 2026-03-17 | **Analysts:** Architecture · UX · UI

---

## Tech Stack Summary

| Layer | Technology | Status |
|---|---|---|
| Frontend | React/Vite | Production-ready |
| Styling | Tailwind CSS v4 | Good foundation |
| Backend/DB | Supabase (PostgreSQL + RLS + Auth) | Correct usage |
| Server state | TanStack Query | Well-used |
| Offline queue | IndexedDB / Dexie | Partial |
| Client state | Zustand | Imported, zero stores — dead dependency |
| Forms | React Hook Form | Used throughout |
| Charts | Recharts | Working |
| PWA | vite-plugin-pwa | Configured but Phase 4 incomplete |

---

## Roadmap vs. Reality

| Phase | Stated | Actual |
|---|---|---|
| Phase 1 — MVP (Daily Log, Offline, Diet View) | Done | Done |
| Phase 2 — Smart Swap Engine | Done | Done — `swapAlgorithm.ts` is the strongest code in the project |
| Phase 3 — Expanded log + charts | In progress | ~85% — charts work, but `general_notes` field broken (data loss) |
| Phase 4 — PWA manifest + push notifications | Not started | Partially done — manifest configured, notification scheduling is a non-functional stub |

---

## Critical Bugs (Data Loss)

These ship silently and corrupt user data.

### 1. Journal entries are lost on every save
`EndOfDayFlowView` registers the field as `"notes"` but the DB column is `general_notes`. Supabase silently ignores the unknown field. **Fix:** one-line change in `EndOfDayFlowView.tsx`.

### 2. `retryCount` never persists — failed syncs deleted silently
The field exists in the `SyncAction` interface but is not in the Dexie schema column list. Every retry reads it as `undefined`, computes `0 + 1`, then loses it. After 3 attempts the entry is deleted with only a `console.error`. Users never see that their data was discarded.

### 3. Edit flow doesn't clear state
`onClearEdit` prop is declared in `DailyTrackerWizardProps` but is silently dropped in destructuring. The `editingLog` in `App.tsx` never resets after editing completes — the wizard will keep reopening in edit mode.

---

## Architecture Findings

### Offline / Sync
- Queue only supports `UPSERT_DAILY_LOG` — meal adherence writes go **directly to Supabase** with no offline support for the Diet tab
- Each wizard section save **appends** a new queue entry instead of updating today's entry → 3 "pending" rows per day in `PendingLogs`
- TanStack Query cache is **not invalidated after sync** → History and Stats show stale data until the stale window expires
- No `online` event listener — user must manually press Sync when connectivity returns
- `DailyTrackerWizard` reads today's data only from Dexie, never from the synced Supabase table → multi-device use is broken

### State Management
- Zustand in `package.json`, zero stores in codebase — remove it
- `App.tsx` calls Supabase directly for the onboarding check, bypassing the TanStack Query cache — replace with `useProfile`
- `useStreak` uses `[]` dependency array (runs once on mount) instead of Dexie's `useLiveQuery` — streak count goes stale within the same session

### Navigation
- No URL router — browser back button doesn't work, pages can't be bookmarked, Profile is an invisible 5th state outside the tab model
- React Router (or TanStack Router) is the right fix; it also enables the History→edit-log flow without prop drilling

### Schema
- **Wide god-row** on `daily_logs` is fine for single-user, but every sub-flow partially fills the same row — merge logic lives entirely in JS with no schema enforcement
- Schema is split across `schema.sql` + `profiles.sql` with no migration runner — fresh deploy requires two scripts in order
- No Supabase generated types — double-cast workarounds (`data as unknown as MealPlan[]`) throughout hooks

---

## UX Findings

### Core Daily Log Flow
- **Completion detection is broken for zero values** — `!!steps` returns `false` when steps = 0, so a legitimate rest day never marks Training as "done". Same for water. Fix: use `value !== null && value !== undefined`.
- **20-second logging goal**: achievable only with smart defaults + auto-save-on-blur. Neither is fully implemented — every section requires an explicit submit tap, and the sleep "Other" stepper starts at 0 instead of a contextual guess.
- Smart defaults persist forever in `localStorage` with no expiry — week-old defaults pre-fill the form silently.

### Diet Tab
- **Food swaps are session-only** and not persisted anywhere. No warning tells the user the swap disappears on tab navigation.
- Italian strings mixed throughout an English UI: "Piano Alimentare", "Conferma Sostituzione", "Impatto Macros", "Impossibile" — inconsistent regardless of intent.

### History Tab
- Heatmap intensity is based solely on **step count**, not log completeness — a complete rest day looks the same as no log.
- No way to edit a **synced** historical entry from the History view (the `editItem` prop exists in the wizard but is never wired to History).

### Sync Feedback
- **No success toast** after sync — pressing "Sync Now" produces silence.
- Failed syncs silently delete data after 3 retries with only `console.error`.

### Other
- `window.alert()` for registration success — the only non-toast notification in the app.
- Recovery score message is hardcoded as "strong recovery" regardless of actual value.
- `targetSteps` hardcoded at 10,000 in the Stats chart, ignores `profile.steps_goal`.
- Body/Fuel/Drive dashboard tiles look interactive but do nothing (no `onClick`).

---

## UI / Design System Findings

### Design Tokens
- `--primary` is near-black, not a brand accent — feature components compensate with hardcoded `bg-orange-500/10`, `text-green-500`, `bg-emerald-500`, etc. These bypass theming entirely.
- Dark mode CSS variables are fully defined but the `.dark` class is **never applied** by any code → dark mode doesn't work.
- `text-secondary` on `bg-card` in `SyncHeader` = contrast ratio < 1.5:1 (near-invisible text) — use `text-muted-foreground`.

### Component Quality

| Component | Quality | Note |
|---|---|---|
| `Stepper` | 5/5 | Best custom component — correct blur reconciliation, accessible, right touch size |
| `ButtonGroup` | 4/5 | Good ARIA, double `role="group"` nesting |
| `Card` | 4/5 | Solid slot architecture |
| `Button` | 3/5 | Default `h-8` (32px) — below 44px mobile touch target |
| `Slider` | 2/5 | Native `<input type="range">`, fully browser-styled, inconsistent cross-browser |
| `Progress` | 2/5 | Root flex height vs track height creates size ambiguity |

### Accessibility
- **Heatmap cells: 28px** touch targets (minimum 44px)
- **Calendar nav arrows: ~19px**
- **Food swap button: ~20px**
- Emoji-only mood/energy buttons have no `aria-label` — screen reader gets Unicode names
- `<label>` elements in Onboarding and ProfileView not associated with `<select>` via `for`/`id`
- Settings dropdown is a raw `<div>` — no focus trap, no `role="dialog"`, no escape-to-close

---

## Prioritized Fix List

### P0 — Data Loss (fix now)

1. `EndOfDayFlowView`: `register("notes")` → `register("general_notes")`
2. `DailyTrackerWizard`: destructure and call `onClearEdit` in `handleFlowComplete`
3. `lib/db.ts` + `useSync.ts`: add `retryCount` to Dexie schema column list; surface sync failure to user with a toast

### P1 — Correctness

4. Fix `!!value` completion check → `value !== null && value !== undefined` in `TodayDashboardView`
5. Invalidate `historyLogs` and `dashboardData` query caches in `useSync` after successful sync
6. Use `useLiveQuery` in `useStreak` instead of one-shot `useEffect`
7. Replace `targetSteps={10000}` in `DashboardView` with `profile.steps_goal`
8. Replace `window.alert()` in `Auth.tsx` with a Sonner toast
9. Make recovery score message branch on actual score value

### P2 — UX Quality

10. Deduplicate same-day sync queue entries (update in place, don't append)
11. Add `window.addEventListener('online', ...)` to auto-trigger sync
12. Show a success toast after sync completes
13. Add sync failure warning (don't silently delete after 3 retries)
14. Remove or disable Body/Fuel/Drive placeholder tiles
15. Warn users that diet swaps are session-only until persistence is implemented

### P3 — Design System & Accessibility

16. Activate dark mode via `prefers-color-scheme` or a toggle
17. Fix `text-secondary` → `text-muted-foreground` in `SyncHeader`
18. Increase heatmap cell and nav arrow touch targets to ≥ 44px
19. Add `aria-label` to emoji-only `ButtonGroup` buttons
20. Associate `<label>` with `<select>` via `htmlFor`/`id` in Onboarding and ProfileView
21. Add focus trap + escape handler to the settings dropdown

### P4 — Architecture

22. Add React Router for URL-based navigation
23. Wire History view to `editItem` pathway in `DailyTrackerWizard`
24. Run `supabase gen types typescript` and replace manual `database.ts`
25. Remove Zustand from `package.json`
26. Add meal_adherence writes to the offline queue
