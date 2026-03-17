# UI Interaction Schema

> Generated from source code analysis. Covers every screen, navigation path, conditional branch, user action, and data flow.

```
[App Entry Point — App.tsx]
  │
  ├─ loading=true OR (session exists AND needsOnboarding=null)
  │    └─ [Spinner Screen]
  │
  ├─ loading=false AND session=null
  │    └─ [Auth Screen]
  │         ├─ Toggle link → [Register mode] ↔ [Login mode]
  │         ├─ [Login mode] submit
  │         │    ├─ success → session created → App re-renders
  │         │    └─ error → inline error banner
  │         └─ [Register mode] submit
  │              ├─ success → toast.success (stays on Auth)
  │              └─ error → inline error banner
  │
  ├─ session + needsOnboarding=true
  │    └─ [Onboarding Screen] (no skip/back — hard gate)
  │         ├─ unit_system change → labels update (cm/kg ↔ in/lbs)
  │         └─ submit
  │              ├─ success → needsOnboarding=false → [App Shell]
  │              └─ error → inline error banner
  │
  └─ session + needsOnboarding=false
       └─ [App Shell]
            │
            ├─ [Top Header Bar]
            │    └─ Avatar button → [Settings Dropdown]
            │         ├─ Daily Reminders toggle → requestPermission / scheduleDailyReminder
            │         │    └─ [if enabled] "Send Test Notification" button
            │         ├─ "Edit Profile" → showProfile=true → [Profile View]
            │         │    ├─ Back → showProfile=false
            │         │    ├─ field edit → isDirty=true
            │         │    └─ "Save Profile" → upsert → toast.success → onBack()
            │         └─ "Logout" → signOut() → [Auth Screen]
            │         (click outside / Escape → dropdown closes)
            │
            ├─ [SyncHeader]
            │    ├─ pendingCount=0 → "Synced" status (no button)
            │    ├─ pendingCount>0 → "N Pending" + "Sync Now" button → mutate()
            │    └─ browser 'online' event → auto mutate()
            │
            ├─ [Bottom Nav] — Log | History | Diet | Stats
            │
            └─ [Main Content]
                 │
                 ├─ showProfile=true → [Profile View] (see above)
                 │
                 ├─ tab='tracker'
                 │    ├─ [DailyTrackerWizard] ──── see Wizard subtree below ────
                 │    └─ [PendingLogs]
                 │         ├─ empty → renders nothing
                 │         ├─ "Edit" → editingLog=SyncAction → Wizard edit mode
                 │         └─ "Delete" → confirm() → localDB.delete(id)
                 │
                 ├─ tab='history'
                 │    └─ [HistoryView]
                 │         ├─ isLoading → Spinner
                 │         ├─ error → red banner
                 │         └─ data loaded
                 │              ├─ Stats bar (read-only)
                 │              ├─ [HeatmapCalendar]
                 │              │    ├─ ◀ / ▶ → prev/next month
                 │              │    └─ day cell tap → selectedDate → DailySummaryCard updates
                 │              └─ [DailySummaryCard] (onEdit provided, onEditSection absent)
                 │                   ├─ log=null → "No log for this date"
                 │                   └─ log exists
                 │                        ├─ Header "Edit" → onEdit(log)
                 │                        ├─ Biofeedback pencil → onEdit(log)
                 │                        ├─ Workout pencil → onEdit(log)
                 │                        └─ Notes pencil → onEdit(log)
                 │                             └─ handleEditHistoryLog
                 │                                  → editingLog = buildSyncAction(log)
                 │                                  → currentTab = 'tracker'
                 │                                  → Wizard opens in edit mode
                 │
                 ├─ tab='diet'
                 │    └─ [DietView]
                 │         ├─ isLoading → Spinner
                 │         ├─ error → red banner
                 │         └─ data loaded
                 │              ├─ [WeeklyOverview] (read-only)
                 │              └─ [DailyMeals] + day tab selector
                 │                   └─ day tap → selectedDay → meals re-render
                 │
                 └─ tab='stats'
                      └─ [DashboardView]
                           ├─ range tab (7d / 14d / 1m / 3m / All) → refetch
                           ├─ isLoading → Spinner
                           └─ data → [WeightChart] + [StepsChart] (read-only)


═══════════════════════════════════════════════════════════════════
DailyTrackerWizard Subtree
═══════════════════════════════════════════════════════════════════

[DailyTrackerWizard]
  │  On mount: fetch today's syncQueue entry / smart defaults / Supabase history
  │
  ├─ isLoading → "Loading today's flow..."
  │
  ├─ editItem provided → todayLog = editItem.payload
  │
  ├─ activeView='dashboard'
  │    └─ [TodayDashboardView]
  │         ├─ Progress bar (avg of 3 section %)
  │         ├─ todayLog=null → [MenuButtons]
  │         │    ├─ "Morning Check-In" (X / 7 fields) → activeView='morning'
  │         │    ├─ "Workout Log"      (X / 8 fields) → activeView='training'
  │         │    └─ "End of Day"       (X / 6 fields) → activeView='end_of_day'
  │         ├─ todayLog≠null → [DailySummaryCard] (onEditSection provided, onEdit absent)
  │         │    ├─ Biofeedback pencil → onEditSection('morning')   → activeView='morning'
  │         │    ├─ Workout pencil     → onEditSection('training')  → activeView='training'
  │         │    └─ Notes pencil       → onEditSection('end_of_day')→ activeView='end_of_day'
  │         ├─ Streak badge (read-only)
  │         ├─ Recovery Score ring
  │         │    └─ shown if sleep_quality OR sleep_hours present
  │         │       5-signal formula: sleep_quality(30%) + sleep_hours(20%)
  │         │                         + stress_level(25%) + mood(15%) + soreness(10%)
  │         │       thresholds: <40 low / 40–69 medium / ≥70 high (read-only)
  │         └─ Goals Progress collapsible
  │              └─ "Toggle" → expand/collapse
  │                   Water | Sleep | Steps | Cardio tiles (all read-only progress bars)
  │
  ├─ activeView='morning'
  │    └─ [MorningFlowView]
  │         ├─ Back → activeView='dashboard'
  │         ├─ Sleep ButtonGroup (6 / 6.5 / 7 / 7.5 / 8h / Other)
  │         │    └─ "Other" → custom Stepper visible (0–24h, step=0.5)
  │         ├─ Sleep Quality ButtonGroup  → sleep_quality
  │         ├─ Mood ButtonGroup           → mood
  │         ├─ Stress ButtonGroup         → stress_level
  │         ├─ Weight Stepper (30–200kg, step=0.1)
  │         │    └─ contextual hints: yesterday's weight + 7-day avg
  │         ├─ Time input                 → measurement_time
  │         ├─ HRV number input           → hrv
  │         │    └─ contextual hint: 7-day HRV baseline
  │         ├─ Soreness ButtonGroup       → soreness_level
  │         └─ "Save Morning" submit
  │              → merge(existingData, formData, date, user_id)
  │              → localDB.syncQueue.add(UPSERT_DAILY_LOG, pending)
  │              → localStorage smart defaults updated (weight, sleep, stress, hrv)
  │              → toast.success("Morning check-in saved!")
  │              → onSave(payload) → todayLog updated → activeView='dashboard'
  │              → onClearEdit?.()
  │
  ├─ activeView='training'
  │    └─ [TrainingFlowView]
  │         ├─ Back → activeView='dashboard'
  │         ├─ Workout Type ButtonGroup
  │         │    ├─ 'Rest' selected → isRest=true
  │         │    │    └─ hides: Duration, Start Time, Active kcal, Performance section
  │         │    └─ 'cardio' in value → isCardio=true
  │         │         └─ shows: HIIT mins + LISS mins inputs
  │         ├─ Steps input + Steps Goal input
  │         │    └─ contextual hint: yesterday's steps
  │         ├─ [if !isRest] Duration input    → workout_duration
  │         ├─ [if !isRest] Start Time input  → workout_start_time
  │         ├─ [if !isRest] Active kcal input → active_kcal
  │         ├─ [if isCardio] HIIT mins        → cardio_hiit_mins
  │         ├─ [if isCardio] LISS mins        → cardio_liss_mins
  │         ├─ [if !isRest] Gym Mood ButtonGroup    → gym_mood
  │         ├─ [if !isRest] Gym Energy ButtonGroup  → gym_energy
  │         ├─ [if !isRest] RPE Slider (1–10, step=0.5) → gym_rpe
  │         └─ "Save Workout" submit
  │              → merge(existingData, formData, date, user_id)
  │              → localDB.syncQueue.add(UPSERT_DAILY_LOG, pending)
  │              → localStorage smart defaults updated (steps)
  │              → toast.success("Workout logged!")
  │              → onSave(payload) → todayLog updated → activeView='dashboard'
  │              → onClearEdit?.()
  │
  └─ activeView='end_of_day'
       └─ [EndOfDayFlowView]
            ├─ Back → activeView='dashboard'
            ├─ Water Stepper (0–10L, step=0.5)
            │    └─ % of waterGoal shown reactively below
            ├─ Diet Adherence buttons (Perfect / Minor Deviation / Cheat Meal)
            │    └─ → diet_adherence
            ├─ Digestion Quality ButtonGroup → digestion_rating
            ├─ Journal Textarea (optional)  → general_notes
            └─ "Finish Day" submit
                 → merge(existingData, formData, date, user_id)
                 → localDB.syncQueue.add(UPSERT_DAILY_LOG, pending)
                 → localStorage smart defaults updated (water_liters)
                 → toast.success("Day completed! Excellent work.")
                 → onSave(payload) → todayLog updated → activeView='dashboard'
                 → onClearEdit?.()


═══════════════════════════════════════════════════════════════════
Cross-Cutting Data Flows
═══════════════════════════════════════════════════════════════════

Write path:
  form submit
    → localDB.syncQueue.add({ UPSERT_DAILY_LOG, status: 'pending' })
    → SyncHeader pendingCount increments reactively
    → "Sync Now" tap  OR  browser 'online' event (auto)
         → useSync() → Supabase upsert(daily_logs, onConflict: user_id, date)
              ├─ success → syncQueue.delete(id)
              │    → toast.success("All logs synced")
              │    → TanStack cache invalidated: historyLogs + dashboardData
              └─ error → retryCount++
                   └─ retryCount ≥ 3 → syncQueue.delete(id) + toast.error(...)

Edit from History tab:
  DailySummaryCard "Edit" tap
    → onEditLog(log) → buildSyncAction(log) → editingLog state set
    → currentTab = 'tracker'
    → DailyTrackerWizard: editItem = editingLog → todayLog = editItem.payload
    → forms pre-filled with historical data
    → on save → new UPSERT_DAILY_LOG queued
    → onClearEdit() → editingLog = null

Edit from PendingLogs:
  "Edit" tap → onEdit(syncAction) → editingLog = syncAction
  → same Wizard pre-fill flow as above

Smart defaults (localStorage key: 'bw_tracker_smart_defaults'):
  Written by:
    MorningFlowView  → weight_fasting, sleep_hours, stress_level, hrv
    TrainingFlowView → steps
    EndOfDayFlowView → water_liters
  Read by:
    DailyTrackerWizard on mount when no syncQueue entry exists for today

Onboarding gate (runs on every session start):
  SELECT height, initial_weight FROM profiles WHERE id = user.id
    ├─ no row (PGRST116) OR fields null → needsOnboarding=true → [Onboarding Screen]
    ├─ both fields present              → needsOnboarding=false → [App Shell]
    └─ other DB error                  → needsOnboarding=false → [App Shell] (fail-open)
```
