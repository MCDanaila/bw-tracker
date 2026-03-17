# UI/UX Refactor Tasks

Derived from findings by the Frontend Developer and UX Researcher agents.
Priority order: P0 = functional breakage → P1 = architectural correctness → P2 = polish.

---

## P0 — Functional Breakage

### Task R1 — Fix unreachable End of Day entry point

**Problem:** When `todayLog !== null`, `TodayDashboardView` replaces the three MenuButtons with `DailySummaryCard`. The Workout and Notes/Details pencil icons inside the card are conditionally rendered only when those fields already exist. A user who saves Morning first has no visible path to End of Day.

**Fix:** Keep the three section MenuButtons always visible on the dashboard regardless of `todayLog` state. `DailySummaryCard` should be shown **in addition to** the buttons as a summary, not **instead of** them. Update completion icons/subtitles on the buttons using the existing `morningPct` / `trainingPct` / `eodPct` values.

**Files:**
- `src/components/daily-flow/views/TodayDashboardView.tsx` — remove the `todayLog === null` conditional that gates the MenuButtons; always render all three buttons; render `DailySummaryCard` below them when `todayLog !== null`

---

### Task R2 — Replace edit-from-history tab-switch with a bottom sheet modal

**Problem:** Tapping "Edit" in `HistoryView` silently switches `currentTab` to `'tracker'`, losing the user's selected date and scroll context in History. There is no cancel path — once `editingLog` is set, the only exit is completing a save. All four pencil icons in `DailySummaryCard` (History context) call `onEdit(log)` identically, so section-specific pencils are a false affordance.

**Fix:** Replace the tab-switch mechanism with a `EditLogModal` bottom drawer that opens over the History tab. The drawer contains all fields from the three flow views in a single scrollable form. Tapping a section-specific pencil should pre-scroll or highlight that section. Cancel closes with no state change. Save writes to `syncQueue` and closes, leaving the user on the same date in History.

**Files to add:**
- `src/components/history/EditLogModal.tsx` — new bottom sheet component
  - Single `react-hook-form` instance with all fields from Morning + Training + EOD views merged
  - Props: `log: DailyLog | null`, `onClose: () => void`, `initialSection?: 'morning' | 'training' | 'end_of_day'`
  - Submit: merge form data with `log`, write to `localDB.syncQueue`, call `onClose()`
  - **Must NOT update `localStorage` smart defaults** (this is a historical edit, not today's log)
  - Preserve `isRest` / `isCardio` conditional fields driven by `watch("workout_session")`
  - Sticky "Update" button at the bottom; scrollable content area above

**Files to modify:**
- `src/components/history/HistoryView.tsx`
  - Add local state: `editingLog: DailyLog | null`
  - Add local state: `editSection: 'morning' | 'training' | 'end_of_day' | undefined`
  - Render `<EditLogModal log={editingLog} initialSection={editSection} onClose={() => { setEditingLog(null); setEditSection(undefined); }} />` at the bottom
  - Remove `onEditLog` prop entirely — edit is now handled locally
- `src/components/history/DailySummaryCard.tsx`
  - Change `onEdit?: (log: DailyLog) => void` to `onEdit?: (log: DailyLog, section?: 'morning' | 'training' | 'end_of_day') => void`
  - Pass the section argument on each pencil button call (Biofeedback → `'morning'`, Workout → `'training'`, Notes → `'end_of_day'`, header Edit → no section)
- `src/App.tsx`
  - Remove `editingLog` state
  - Remove `buildSyncAction` helper
  - Remove `handleEditHistoryLog` handler
  - Remove `onEditLog` prop from `<HistoryView />`
  - Remove `editItem` and `onClearEdit` props from `<DailyLogHub />` (after confirming PendingLogs edit path below — see Task R5)

---

## P1 — Architectural Correctness

### Task R3 — Rename `DailyTrackerWizard` → `DailyLogHub`

**Problem:** The component is not a wizard (no linear steps, no sequential gating). The name misleads every developer who reads the code.

**Fix:** Rename file, component, props interface, and all import sites.

**Files:**
- `src/components/daily-flow/DailyTrackerWizard.tsx` → rename to `DailyLogHub.tsx`
  - Rename default export: `DailyTrackerWizard` → `DailyLogHub`
  - Rename props interface: `DailyTrackerWizardProps` → `DailyLogHubProps`
  - `ViewState` type stays unchanged
- `src/App.tsx` — update import path and component name
- `src/components/daily-flow/views/TodayDashboardView.tsx` — update `import type { ViewState } from "../DailyTrackerWizard"` path

**Do this as a standalone commit before any structural changes.**

---

### Task R4 — Decouple smart defaults from `todayLog` state

**Problem:** When no `syncQueue` entry exists for today but `localStorage` smart defaults are present, `DailyTrackerWizard` sets `todayLog` to a partial object from those defaults. This makes the dashboard switch to `DailySummaryCard` mode before anything is actually saved today — the user sees yesterday's weight pre-displayed as today's data.

**Fix:** Use a separate `pendingDefaults` state variable for pre-filling form `defaultValues`. `todayLog` should only be non-null when a real `syncQueue` entry exists for today's date (or `editItem` is provided).

**Files:**
- `src/components/daily-flow/DailyLogHub.tsx`
  - Add `pendingDefaults: Partial<DailyLog> | null` state alongside `todayLog`
  - In `fetchTodayLog`: when no `syncQueue` entry exists, set `pendingDefaults` from localStorage (not `todayLog`)
  - Keep `todayLog = null` in this case so the dashboard shows MenuButtons
  - Pass `pendingDefaults` as `existingData` to the three flow views so forms still pre-fill
  - Pass `todayLog` (real confirmed data) to `TodayDashboardView` for the summary card

---

### Task R5 — Reassess PendingLogs edit flow after Tab R2

**Problem:** After removing `editItem` / `onClearEdit` from `DailyLogHub` (as part of R2), the `PendingLogs` edit path (which currently passes `editItem` through `App.tsx` → `DailyLogHub`) will break.

**Fix:** Decide how pending log editing works post-refactor. Two options:
- **Option A (recommended):** `PendingLogs` edit also opens `EditLogModal` — pass the pending log's `payload` as the `log` prop, with the existing pending queue item ID so the modal's save handler can `update` rather than `add` to `syncQueue`.
- **Option B:** Keep `editItem` on `DailyLogHub` only for the PendingLogs path and remove it from the History path.

Option A is cleaner — one edit surface for all edit scenarios. Implement only after R2 is working.

**Files:**
- `src/components/PendingLogs.tsx` — change "Edit" button to open `EditLogModal` with the payload
- `src/App.tsx` — remove remaining `editingLog` state if Option A is chosen
- `src/components/daily-flow/DailyLogHub.tsx` — remove `editItem` / `onClearEdit` props

---

## P2 — Polish & Accessibility

### Task R6 — Fix register success dead end

**Problem:** After successful signup, the user lands back on the Login form with only a disappearing toast as a signal. No automatic progression to login, no clear next-step instruction.

**Fix:** After `signUp()` success, auto-switch `isLogin` to `true` so the user is immediately on the login form, pre-filled with the email they just registered. Update the toast to say "Account created — please sign in."

**Files:**
- `src/components/Auth.tsx`
  - On `signUp()` success: call `setIsLogin(true)` (email is already in form state, it will persist)
  - Update `toast.success` message to "Account created! Sign in below."

---

### Task R7 — Add error state to `DailyLogHub` on mount failure

**Problem:** A Supabase or IndexedDB failure during `fetchTodayLog()` on mount silently clears the loading spinner with no error UI — the user sees an empty dashboard with no explanation.

**Fix:** Add an `error` state. On catch, set it and render a simple error card with a "Retry" button that calls `fetchTodayLog()` again.

**Files:**
- `src/components/daily-flow/DailyLogHub.tsx`
  - Add `error: string | null` state
  - In the `catch` block: `setError("Failed to load today's data. Tap to retry.")`
  - Render `<ErrorCard message={error} onRetry={fetchTodayLog} />` when `error !== null`

---

### Task R8 — Replace `window.confirm()` in PendingLogs with an inline confirmation

**Problem:** Native `window.confirm()` is an OS-level dialog — jarring on mobile, unstyled, no undo.

**Fix:** Replace with an inline "Are you sure?" confirmation row that appears in place of the item's action buttons when delete is tapped. Show "Confirm Delete" and "Cancel" buttons inline. No modal needed.

**Files:**
- `src/components/PendingLogs.tsx`
  - Add `confirmDeleteId: number | null` state
  - First "Delete" tap → `setConfirmDeleteId(id)` (shows inline confirm row)
  - "Confirm Delete" → `localDB.syncQueue.delete(id)`, `setConfirmDeleteId(null)`
  - "Cancel" → `setConfirmDeleteId(null)`

---

### Task R9 — Fix Goals Progress "Toggle" button state indicator

**Problem:** The `CollapsibleTrigger` button is labeled "Toggle" with no visual indicator of whether the widget is open or closed — no chevron, no label change, no `aria-expanded`.

**Fix:** Use a `ChevronDown` / `ChevronUp` icon that rotates based on open state, replacing the "Toggle" text label.

**Files:**
- `src/components/daily-flow/views/TodayDashboardView.tsx`
  - Add `isGoalsOpen` state (default `false`)
  - Pass `open={isGoalsOpen}` and `onOpenChange={setIsGoalsOpen}` to `<Collapsible>`
  - Replace `CollapsibleTrigger` label "Toggle" with `<ChevronDown>` / `<ChevronUp>` toggled by `isGoalsOpen`
  - Add `aria-label={isGoalsOpen ? "Collapse goals" : "Expand goals"}`

---

## Implementation Order

| # | Task | Depends on | Risk |
|---|---|---|---|
| 1 | R3 — Rename to DailyLogHub | — | Low |
| 2 | R4 — Decouple smart defaults | R3 | Medium |
| 3 | R1 — Fix EOD entry point | R3 | Low |
| 4 | R2 — EditLogModal bottom sheet | R3 | High |
| 5 | R5 — PendingLogs edit via modal | R2 | Medium |
| 6 | R6 — Register auto-redirect | — | Low |
| 7 | R7 — DailyLogHub error state | R3 | Low |
| 8 | R8 — PendingLogs inline confirm | R5 | Low |
| 9 | R9 — Goals Progress toggle icon | — | Low |
