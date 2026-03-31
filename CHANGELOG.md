# Changelog

All notable changes to the BW Tracker project will be documented in this file.

## [Unreleased] - Current State

### 🚀 Features (Onboarding & Public Pages — 2026-03-28)

#### Public Pages (Performance Manifesto Design System)
- **LandingPage** (`src/apps/public/LandingPage.tsx`): Full manifesto landing with 5 sections:
  - Hero: full-bleed black gradient, oversized right-aligned LEONIDA wordmark, PERFORM. in `#b52619` red, 4px white section rules
  - Method: `01 / 02 / 03` editorial grid (TRACK / ANALYSE / ADJUST)
  - Plans: 4 cards with tonal stacking (self_coached → self_coached_ai → coach → coach_pro)
  - Pull Quote: full-bleed black manifesto quote block
  - Footer: links, legal copy
  - Sticky glassmorphism nav (activates at 80px scroll), `LEONIDA_RED` constant, `SectionRule` shared component
- **LoginPage** (`src/apps/public/LoginPage.tsx`): Manifesto sign-in form; role-based redirect (coach → `/dashboard`, others → `/tracker`)
- **RegistrationPage** (`src/apps/public/RegistrationPage.tsx`): 4-step onboarding wizard targeting <60s completion
  - Step 0 (Account): email duplicate check on blur (`POST /auth/check-email`), min-8 password
  - Step 1 (BODY): SEX segmented buttons, DOB + auto-calculated age, height/weight sliders with metric/imperial toggle, GOAL segmented, collapsible workout intensity
  - Step 2 (FUEL): diet framework chips, meals/day stepper, HARD NO'S chip multi-select (NONE pre-selected, mutual exclusion)
  - Step 3 (DRIVE): lifestyle activity rows, gym days per week, FINISH in Leonida Red
  - Plan badge (`?plan=` query param) and invitation badge (`?invite=` query param)
  - Accept/Decline UI for existing sessions arriving from a coaching invite
  - Animated scan-line completion state (CSS `@keyframes scan`, no spinner)

#### Plan System
- **4-tier plan**: `self_coached` | `self_coached_ai` | `coach` | `coach_pro`
- `PLAN_ROLE_MAP` in FastAPI: maps plan → (role, ai_enabled) tuple
- `profiles` gains: `plan`, `ai_enabled`, `dob`, `goal_rate`, `gym_days_per_week`

#### Session-Aware Routing (`src/shell/AppRouter.tsx`)
- `RootRedirect` component: loading state → spinner, unauthenticated → `LandingPage`, coach → `/dashboard`, others → `/tracker`
- `UnauthenticatedOnly` guard wraps `/login` and `/register` — redirects authenticated users
- No flash for already-authenticated users: `if (!role) return <Navigate to="/tracker" replace />`

#### Backend: Auth Endpoints (`backend/app/routers/auth.py`)
- `POST /auth/check-email` — public; checks `profiles.email` for duplicates before sign-up
- `POST /auth/complete-registration` — authenticated; upserts `profiles` (plan, role, ai_enabled, dob, height, weight, etc.), upserts `athlete_preferences` (diet framework, meal frequency, allergies), links invitation token when present

#### Backend: Invitation Endpoints (`backend/app/routers/invitations.py`)
- `POST /invitations/send` — coach only; enforces per-plan athlete cap (5 for `coach`, 25 for `coach_pro`); sends invite email via Supabase Auth SMTP with `invite_token` + redirect URL in metadata
- `GET /invitations/{token}` — public; returns coach name + invitee email, auto-expires overdue pending invitations
- `GET /invitations` — coach only; lists all invitations for the calling coach
- `DELETE /invitations/{id}` — coach only; cancels a pending invitation
- `POST /invitations/accept` — authenticated user; validates email match, queries `profiles` for authoritative role (not JWT app_metadata), creates `coach_athletes` row

#### Schema Migration (`supabase/migrations/003_onboarding.sql`)
- `profiles`: added `plan`, `ai_enabled`, `dob`, `goal_rate`, `gym_days_per_week` columns
- `athlete_preferences`: added `diet_framework`, `meal_frequency` columns
- `invitations` table: token (UUID default), status enum, 7-day expiry default, RLS policies for coaches + public token lookup
- `recompute_age()` trigger: auto-updates `profiles.age` from `dob` on INSERT/UPDATE
- Unique index: one active coach per athlete (`coach_athletes WHERE status='active'`)

#### TypeScript Types (`src/core/types/database.ts`)
- `UserProfile`: added `plan`, `ai_enabled`, `dob`, `goal_rate`, `gym_days_per_week`
- New `Invitation` interface: id, coach_id, invitee_email, token, status, created_at, expires_at
- `AthletePreferences`: added `diet_framework`, `meal_frequency`

#### Fonts & Theme (`src/index.css`, `package.json`)
- Manifesto font tri-system: `font-display` (Newsreader), `font-body` (Source Serif 4), `font-mono-manifesto` (JetBrains Mono)
- Installed `@fontsource/newsreader`, `@fontsource-variable/source-serif-4`, `@fontsource/jetbrains-mono`
- Scoped to public pages only — tracker and dashboard keep Geist

---

### 🤖 Features (AI Diet Planner RAG System — 2026-03-26)

#### Phase 0: User Input Expansion & Bug Fixes
- **Athlete Preferences Table**: New `athlete_preferences` table (PostgreSQL) with comprehensive dietary context:
  - Arrays: allergies, intolerances, dietary_restrictions, food_dislikes, food_preferences, cuisine_preferences, supplement_use
  - Scalars: meal_timing_notes, digestion_issues, cooking_skill (enum: none/basic/intermediate/advanced), meal_prep_time (enum: minimal/moderate/flexible), budget_level (enum: budget/moderate/premium), additional_notes
  - RLS: athletes read own; coaches read+write for their athletes
- **Preferences UI Tab**: New "Preferences" tab in `AthleteDetailPage` with:
  - Form-based editor (react-hook-form) with comma-separated tag input for arrays
  - Display mode showing all preferences with proper formatting
  - Inline helper text marking allergies/intolerances/restrictions as required for AI
- **Swap Persistence Fix**: `DailyMeals.tsx` now saves food swaps to `meal_adherence` table via Supabase upsert. Toast message changed from "not saved permanently yet" to "Swap saved."
- **Template Assignment UI**: New `AssignTemplateDialog` component with selectable template cards. Added "Assign Template" button to DietTab (visible both when empty and as secondary action).
- **New Hooks**: `useAthletePreferences()` and `useSetAthletePreferences()` following TanStack Query patterns.

#### Phase 1: RAG Infrastructure (pgvector + Knowledge Base)
- **Vector Extension**: Enabled PostgreSQL `pgvector` extension for Supabase vector storage
- **Knowledge Tables**:
  - `knowledge_documents`: coach-uploaded documents with `source_type` (pdf/text), char_count, is_active flag
  - `knowledge_chunks`: chunked document content with `embedding vector(768)`, token_count, chunk_index
  - `ai_suggestions`: generated diet plans with status workflow (pending→approved→applied), context_snapshot JSONB, retrieved_chunk_ids
  - `ai_suggestion_feedback`: 5-star ratings, feedback text, was_followed boolean per (suggestion, user) pair
- **RLS Policies**: Coaches manage own documents; edge functions write chunks server-side; athletes view approved/applied suggestions only
- **RPC Function**: `match_knowledge_chunks(query_embedding, match_count, coach_id)` for vector similarity search with coach filtering
- **IVFFlat Index**: Prepared on knowledge_chunks.embedding for fast similarity search (lists=100)
- **New Types**: `KnowledgeDocument`, `KnowledgeChunk`, `AiSuggestion`, `AiSuggestionFeedback` in `database.ts`

#### Phase 2: Gemini API Integration (Edge Functions + Frontend)
- **embed-document Edge Function** (`/supabase/edge-functions/embed-document`):
  - Chunks content on paragraph boundaries, merges short chunks, caps at ~1500 chars
  - Calls Google Gemini `text-embedding-004` to generate 768-dim embeddings
  - Stores chunks in `knowledge_chunks` table with embedding vectors
  - Handles errors gracefully; returns chunk count on success
- **generate-diet-suggestion Edge Function** (`/supabase/edge-functions/generate-diet-suggestion`):
  - Validates caller is coach of athlete via `is_coach_of()` RPC
  - Assembles athlete context: profile, current goal, preferences, last 7 daily logs biofeedback, meal plans
  - Embeds query via Gemini; retrieves top 5 knowledge chunks via `match_knowledge_chunks()`
  - Builds structured prompt with athlete context, preferences, knowledge excerpts, food sample
  - Calls Gemini `gemini-1.5-flash` to generate JSON weekly meal plan (7 days, 3-4 meals/day, macros per meal)
  - Handles rate limiting (429), missing preferences (422), and auth errors (403)
  - Inserts suggestion into `ai_suggestions` table with status `pending`
- **aiDietService.ts**: Thin wrapper exporting `generateDietSuggestion()`, `updateSuggestionStatus()`, `submitSuggestionFeedback()`
- **useAiDietSuggestions Hook**:
  - `useAiSuggestions(athleteId)` — fetches suggestions ordered by created_at DESC
  - `useGenerateDietSuggestion()` — mutation calling Edge Function, invalidates suggestions cache
  - `useUpdateSuggestionStatus()` — updates status (pending→approved/rejected/applied)
  - `useSubmitSuggestionFeedback()` — upserts user feedback with rating + text

#### Phase 3: Diet Planner MVP UI
- **Sidebar Navigation**: Added "AI Planner" nav item (Sparkles icon) to `SidebarNav.tsx`, marked `coachOnly: true`
- **Routing**: Added `/dashboard/ai-planner` route with lazy-loaded `AiPlannerPage`
- **AiPlannerPage**: Placeholder page with instructions; ready for component integration
- **AiPlannerControls Component**:
  - Textarea query input with "Generate Plan" button
  - Preference readiness check with warning if allergies/intolerances/restrictions empty
  - Scrollable history list showing past suggestions with status badge
  - Rate limit & error toast handling
- **AiSuggestionViewer Component**:
  - Summary card + coaching notes
  - 7-day tabbed meal plan (Mon-Sun) with meals, foods, macros per meal + day totals
  - Status badges (pending/approved/rejected/applied)
  - Action buttons: [Approve][Reject] when pending, [Apply to Meal Plan] when approved
  - Knowledge sources attribution card
- **KnowledgeBasePanel Component** (Sheet):
  - List of coach's documents with is_active toggle, delete button
  - "Add Text Document" dialog (title, description, content textarea) → chunks & embeds via Edge Function
  - "Add PDF" button (disabled, marked "Coming Soon")
  - Document char count display
- **useKnowledgeDocuments Hook**:
  - `useKnowledgeDocuments()` — fetches coach's docs
  - `useCreateKnowledgeDocument()` — inserts doc + invokes embed-document Edge Function
  - `useDeleteKnowledgeDocument()` — cascades chunk deletion
  - `useToggleDocumentActive()` — soft-delete via is_active flag
- **SuggestionFoodMatchDialog**: Placeholder showing suggested foods; ready for fuzzy matching logic
- **SuggestionFeedbackDialog**: 5-star rating + "Was followed?" checkbox + feedback textarea; calls `useSubmitSuggestionFeedback()`

#### Implementation Status
- **Complete (23/25 tasks)**:
  - ✅ All SQL schemas created
  - ✅ All TypeScript types defined
  - ✅ Both Edge Functions fully implemented with error handling
  - ✅ All frontend hooks with TanStack Query
  - ✅ All UI components created (5 components + 1 dialog)
  - ✅ Integration points wired (routes, sidebar, dialogs)
  - ✅ Preferences tab integrated into athlete detail page
  - ✅ Swap persistence fixed in tracker diet view

- **Pending (2/25 tasks)**:
  - ⏳ Manual: Set `GEMINI_API_KEY` secret in Supabase dashboard
  - ⏳ Manual: Deploy SQL schemas to Supabase & test Edge Functions

#### Architecture Notes
- **Knowledge Base Language**: English-only for AI UI (coach-authored, not athlete-facing at this stage)
- **Offline**: No offline queue for AI suggestions (coaches must be online); meal plan edits still use Dexie queue
- **Cost**: Google Gemini free tier (embeddings + text-davinci-003 equivalent); no budget concerns at MVP scale
- **Future Work**: Coach prompt editing (feature flag), AI suggestions on mobile tracker app, PDF upload + parsing

### 🐛 Bug Fixes & Polish (Browser QA Pass — 2026-03-19)

- **Critical: Conditional `React.useId()` in `slider.tsx`** (UI-002/CE-001): Moved `React.useId()` to an unconditional top-level call (`const generatedId = React.useId()`), then uses it as fallback via `id ?? generatedId`. Fixes Rules of Hooks violation that caused runtime errors in `TrainingFlowView` and `EditLogModal`.
- **Double "BW Tracker" header** (UI-001): Removed duplicate `<span>BW Tracker</span>` from `TrackerApp`'s top bar. `SyncHeader` is now the single source of truth for the app title.
- **Muscle Soreness mis-mapped to stress emojis** (UI-003): Added `SORENESS_OPTIONS` constant (💪→🔴, values 1–5, None→Severe) to `constants.ts`. Updated `MorningFlowView` and `DailySummaryCard` to use it instead of `STRESS_OPTIONS`.
- **Recovery score normalization mismatch** (UI-004): Fixed `useRecoveryScore.ts` to normalize soreness over the correct 1–5 range (`(5-v)/4`) and stress as `(v-1)/4` to match `STRESS_OPTIONS` semantics (5=relaxed=best). Applied to both latest log and 7-day trend.
- **`setState` in `useEffect` body in `RoleContext.tsx`** (CE-003): Eliminated the `useState+useEffect` pattern entirely — context value is now a derived value computed inline each render, removing the extra render cycle.
- **Pending sync count missing** (UI-005): `SyncHeader` now shows `{pendingCount} pending` text next to the spinner when items are queued.
- **`pb-safe` class without plugin** (UI-006): Replaced with `style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}` in bottom nav — works cross-browser without `tailwindcss-safe-area`.
- **Error states invisible in dark mode** (UI-007/UI-008): Replaced `bg-red-50 text-red-600/text-red-500` with `bg-destructive/10 text-destructive` design token classes in `DietView`, `HistoryView`, and `DashboardView`.
- **No error feedback on diet save** (UI-010): Wrapped `DietEditorPage.handleSaveItems` in try/catch with `toast.success()` / `toast.error()` feedback.
- **`fetchTodayLog` stale closure** (CE-002): Wrapped `fetchTodayLog` in `useCallback([user])` and added it to the `useEffect` dependency array in `DailyLogHub`.
- **Missing `aria-label` on icon-only buttons** (UI-011/UI-012): Added `aria-label="Go back"` to all back icon buttons and `aria-label="Open settings"` + `aria-expanded` to the settings avatar button.
- **`let weeklyAvgSum` should be `const`** (UI-015): Fixed in `useDietData.ts`.
- **Dead empty `DailyLogHubProps` interface** (UI-009): Removed unused empty exported interface from `DailyLogHub.tsx`.

### ♿ Accessibility & UX Polish (UI/UX Audit Pass — 2026-03-19)

- **Icon-only buttons labeled** (A11Y-001): Added `aria-label="Toggle sidebar menu"` to hamburger in `TopHeader`, `aria-label="Deselect athlete"` to X button in `AthleteSelector`.
- **Search inputs labeled** (A11Y-002): Added `aria-label="Search food by name"` to `FoodSearchModal` input and `aria-label="Search athletes"` to `AthleteSelector` input.
- **Info icon made keyboard-accessible** (A11Y-003): Replaced non-interactive `<span title="...">ⓘ</span>` in `ComplianceHeatmap` with a focusable `<button type="button" aria-label="...">`.
- **`title` replaced with `aria-label`** (A11Y-004): Replaced `title` attributes on `ComplianceHeatmap` data cells and `MacroSummaryBar` macro bars with `aria-label` for reliable screen reader announcement.
- **Swap button bilingual labels** (A11Y-005): Added `aria-label="Swap food"` alongside existing `title="Sostituisci"` in `DailyMeals`.
- **Macro color tokens** (CON-001): Added `--color-macro-protein`, `--color-macro-carbs`, `--color-macro-fat` CSS custom properties to `@theme` in `index.css`.
- **`text-2xs` design token** (CON-004): Added `--text-2xs: 0.625rem` to `@theme`. Replaced all 15 occurrences of `text-[10px]` across 8 files with `text-2xs`.
- **`PageSpinner` component extracted** (CON-007): Created `src/core/components/ui/PageSpinner.tsx`. Replaced duplicated inline `<Loader2 className="animate-spin" />` patterns in `DietView`, `HistoryView`, and `DailyLogHub`.
- **Silent mutation errors surfaced** (UX-002): Added `onError` toast handlers to `saveMutation` and `deleteMutation` in `FoodDatabasePage`.
- **Macro warning on submit button** (UX-004): `FoodFormDialog` submit button turns amber when macro calculation warning is active.
- **Empty state for filtered food database** (UX-005): `FoodDatabasePage` now shows `EmptyState` component with helpful message when search/filter returns zero results.

### ✨ Features (Tracker - Daily Log Queue)
- **Single Queue Entry Per Day**: Refactored daily flow to merge section saves into one queue entry per date instead of creating separate entries for Morning/Training/End-of-Day. Uses new `upsertTodayQueueEntry()` helper in `src/core/lib/db.ts` that:
  - Checks for existing pending entry for the date
  - Merges new data with existing payload (no data loss across sections)
  - Uses Dexie's `.update()` to avoid duplicate entries

### 💅 Polish (Sync UI)
- **Simplified Pending Indicator**: Replaced "{N} Pending" count text with a pulsing amber dot badge on sync icon. SyncHeader now shows:
  - When synced: `CheckCircle2` icon + "Synced" label
  - When pending: `RefreshCw` icon with pulsing amber dot + "Sync Now" button (no number)
  - Reduces visual clutter while maintaining clear sync state awareness

### 🐛 Bug Fixes (Dashboard)
- **Sidebar Responsive Layout (768px < width < 1024px)**: Added dynamic breakpoint detection using `window.matchMedia()` to properly handle icon-rail mode at md breakpoint (768-1024px). Sidebar now correctly collapses when not at lg+ breakpoint, fixing layout issues in tablet viewport.

### 💅 Polish (Sidebar)
- **Menu Item Indentation**: Increased padding on sidebar nav items for better visual hierarchy and spacing:
  - Nav outer padding: `px-2 py-2` → `px-3 py-3`
  - NavLink indentation: `px-3 py-2` → `px-4 py-2.5`
  - Gap between items: `gap-1` → `gap-2`

### ✨ Features (Tracker - End of Day)
- **Salt Intake Tracking**: Added "Salt (Grams)" stepper field in Hydration section. Accepts 0-20g with 1g steps, stored in `salt_grams` field.
- **Removed Water Goal Display**: Eliminated "Goal: 4L" and compliance percentage from water section for cleaner UI.
- **Standardized Diet Adherence Colors**: Updated all three Diet Adherence buttons (Perfect, Minor Deviation, Cheat Meal) to use consistent `variant="default"` when selected, matching ButtonGroup styling across the form.
- **Reordered Diet & Digestion Section**: Moved Hunger Level to appear first, before Diet Adherence, for better logical flow (hunger → diet choice → digestion → libido).

## [0.10.0] - Workout Log App Phase 0: Foundation

### ✨ Features

- **Workout App Entry Point** (`src/apps/workout/WorkoutApp.tsx`): New mobile-first app with 4-tab navigation (Log, History, Programs, Stats). Auth-gated via `useAuth()` context with logout button in header. Fixed bottom navigation with icon buttons matching tracker app pattern. Lazy-loaded from `/workout` route.

### 🧭 Routing & Integration

- **App Router Update** (`src/shell/AppRouter.tsx`): Added `/workout/*` route with lazy-loaded `WorkoutApp` component. Shell now routes three apps: `/` (tracker), `/dashboard/*` (dashboard), `/workout/*` (workout).
- **Tracker App Link** (`src/apps/tracker/TrackerApp.tsx`): Added "Workout" button (Dumbbell icon) to bottom nav as 5th tab, linking to `/workout`. Styling follows existing tab pattern with gap-1 and text-xs labels.

### 📱 Component Structure

- **Log Workout** (`src/apps/workout/components/log/LogWorkoutView.tsx`): WIP stub. Planned: Exercise form with sets, reps, weight, RPE; voice notes; offline sync to Dexie.
- **Workout History** (`src/apps/workout/components/history/WorkoutHistoryView.tsx`): WIP stub. Planned: Timeline of past sessions, expandable exercise cards, edit/delete, filters by program/date, exercise search.
- **Programs** (`src/apps/workout/components/programs/ProgramsView.tsx`): WIP stub. Planned: Weekly program templates, exercise management with target sets/reps/rest, clone/activate features, coach assignment.
- **Stats** (`src/apps/workout/components/stats/WorkoutStatsView.tsx`): WIP stub. Planned: Volume charts, 1RM estimates (Brzycki formula), exercise frequency heatmap, consistency streaks, progress tracking for key lifts.

### 📋 Documentation

- **WORKOUT_APP_WIP.md**: Comprehensive 200+ line specification including:
  - Data models: `WorkoutSession`, `WorkoutExercise`, `WorkoutSet`, `WorkoutProgram`, `ProgramDay`, `ProgramExercise`
  - Full feature breakdown for each tab with planned metrics and capabilities
  - Integration points: routing, database schema (planned), offline support via Dexie
  - Todo checklist covering data layer, hooks, components, and styling
  - Performance considerations (lazy-load charts, paginate history, debounce search)
  - Future enhancements (push notifications, wearable integration, volume auto-regulation, health app sync)

- **Architecture Documentation** (`.claude/CLAUDE.md`): Updated to document multi-app shell architecture with shell/AppRouter.tsx, core layer, and three apps (tracker, dashboard, workout).

### 💅 Architecture

- **Multi-App Monorepo Pattern**: Established consistent structure mirroring tracker/dashboard: app entry point → lazy-loaded routes → 4-tab state navigation → component tree per tab.
- **Offline-First Ready**: Workout app designed to use same Dexie IndexedDB sync queue pattern as tracker and dashboard apps.

## [0.9.0] - Dashboard Phase 5: UX Polish & Refinement

### ✨ Features

- **Settings Page** (`/dashboard/settings`): Fully rebuilt from placeholder. Sections: Profile (editable display name, read-only email, role badge with avatar initials), Preferences (unit system selector saved to `profiles` table via `useUpdateProfile`; default chart date range saved to `localStorage`), Coach-only Athlete Management (live status dropdowns — active/paused/terminated — with direct `coach_athletes` Supabase mutations), Account (Sign Out via `useAuth.signOut`, "Back to Mobile App" link to `/`). Loading skeleton on profile fetch.

### 🦴 Loading States (Skeletons)

- **Centralized `Skeletons.tsx`** (`src/components/dashboard-panel/components/Skeletons.tsx`): 6 dimension-accurate skeleton variants replacing ad-hoc `animate-pulse` divs across the dashboard:
  - `StatCardSkeleton` — matches StatCard card dimensions
  - `ChartSkeleton` — height-configurable rectangular placeholder
  - `TableSkeleton` — header + N row bars
  - `RadarSkeleton` — circular placeholder for `BiofeedbackRadar`
  - `GaugeSkeleton` — circular placeholder for `RecoveryGauge`
  - `RingsSkeleton` — concentric circles placeholder for `ComplianceRings`
- All variants include `aria-busy="true"` and descriptive `aria-label` for screen reader support.
- Applied to: `RecoveryGauge`, `ComplianceRings`, `BiofeedbackRadar`, `WeightTrendChart`, `StepsBarChart`, `ProgressPage` log table, and `SettingsPage`.

### 🛡️ Error Boundaries

- **Per-route error isolation** via `BoundaryLayout` in `routes.tsx`: wraps `<Outlet />` with `<ErrorBoundary key={location.pathname}>`, so error boundaries reset automatically on navigation. Removed the single global boundary from `DashboardApp.tsx`.

### 📱 Responsive Audit & Polish

- **`MealPlanEditor` day tabs**: Wrapped `TabsList` in `overflow-x-auto` horizontal scroll container on mobile. All day tab triggers get `min-h-[44px] min-w-[56px]` for WCAG-compliant touch targets. Action buttons (Copy Day, Save Changes) reflow to a full-width row on mobile.
- **`ComplianceHeatmap`**: Athlete name buttons get `min-h-[44px]` for touch compliance.
- **Settings Page CTAs**: All interactive buttons in SettingsPage enforce `min-h-[44px]`.
- Confirmed all Recharts charts (`WeightTrendChart`, `StepsBarChart`, `BiofeedbackRadar`) already use `<ResponsiveContainer width="100%">` — no changes needed.

### 📋 Empty States

Updated and standardized contextual empty states across all lists and tables:

| Location | Empty State |
|---|---|
| Athletes list (no athletes) | "No athletes assigned yet. Share your coach link to get started." |
| Athletes table (filtered) | "No athletes match your filters" |
| Food Database (empty DB) | "No foods yet" — "Add Food" action (coach only) |
| Food Database (no results) | "No foods match your filters." |
| Diet Templates | "No templates yet" — "Create Template" action |
| Athlete Diet View | "No diet plan assigned" |
| Alert Feed | "No active alerts" (CheckCircle icon, "Everything looks good!") |
| Progress Logs (empty period) | "No data for this period" |

### 💅 Architecture
- `ProgressPage` log table skeletons migrated from inline `animate-pulse` divs to `<Skeleton>` component.
- `AthletesPage` empty state copy now matches ROADMAP spec exactly.

## [0.8.0] - Dashboard Phase 3: Coach Multi-Athlete Panel

### Database
- **Coach RLS policies** (`006`): Coaches can read athlete profiles, daily_logs, meal_adherence; full CRUD on athlete meal_plans (own-created only)
- **athlete_goals table** (`007`): Versioned goal tracking with partial unique index for current goal, phase/macro targets, RLS for athletes and coaches, backfill from existing profile goals
- **get_latest_logs_for_athletes** (`008`): Postgres RPC function using `DISTINCT ON` pattern to avoid N+1 queries for coach roster

### Types
- Added `AthleteGoal` interface to `src/types/database.ts`

### Hooks
- **useAthletes**: Fetches coach's athlete roster with latest stats, weight sparkline data, diet/steps compliance, and status. Combines coach_athletes, profiles, RPC, and recent daily_logs
- **useAthleteGoals**: `useCurrentGoal(athleteId)`, `useGoalHistory(athleteId)`, `useSetGoal()` — versioned goal management with automatic close-previous-on-set
- **useCoachStats**: Total athletes count, logs today count, active alerts placeholder

### Components
- **AthleteSelector**: Searchable combobox in sidebar for coaches to switch between athletes. Persists selection to URL `?athlete=` param via `useSearchParams`
- **ComplianceHeatmap**: Athletes x dates matrix with color-coded compliance cells (red/amber/green), clickable athlete names, horizontally scrollable
- **AlertFeed**: Chronological alert list with severity icons/colors, acknowledge button, empty state. Placeholder for Phase 4 alert engine
- **AthleteContext upgrade**: Now persists `activeAthleteId` to URL search params, provides `activeAthlete` profile object

### Pages
- **AthletesPage** (`/dashboard/athletes`): Coach roster table with search, status filter, click-to-detail navigation
- **AthleteDetailPage** (`/dashboard/athletes/:id`): 5-tab view (Overview, Progress, Diet, Goals, Logs) reusing Phase 1/2 components parameterized by athlete ID. Goals tab supports versioned goal setting with history timeline
- **OverviewPage**: Now role-adaptive — coaches with no athlete selected see Coach Dashboard (stat cards, compact roster, compliance heatmap, alert feed); coaches with athlete selected or athletes see athlete dashboard

### Tables
- **athletes-columns**: 7 columns with inline SVG sparkline for weight trend, compliance badges, status badges
- **logs-columns**: 10 columns for daily log data (weight, steps, sleep, diet, RPE, water, energy, mood) with formatted badges

## [0.7.0] - Dashboard Phase 2: Food Database & Diet Templates

### ✨ Features
- **Food Database Page:** Full CRUD table at `/dashboard/diet/foods` with search (debounced 300ms), unit/state filter dropdowns, sortable columns, pagination, and role-gated add/edit/delete buttons (coach-only). Built on new generic `DataTable`, `DataTableToolbar`, and `DataTablePagination` components powered by `@tanstack/react-table`.
- **Food Form Dialog:** Add/edit dialog with all food fields (name, portion size, unit, calories, protein, carbs, fats, state), auto-slug ID generation, and macro consistency warning when P*4 + C*4 + F*9 deviates > 20% from entered kcal.
- **Confirm Dialog:** Reusable confirmation dialog for destructive actions with destructive/default variants, loading state, and backdrop/Escape close.
- **Empty State Component:** Reusable centered empty state with icon, title, description, and optional action button.
- **Diet Template System (Coach):** Template list view with create/delete, card grid layout showing name, description, and last updated date. Click-through to full meal plan editor per template.
- **Meal Plan Editor:** Compound editor component with 7-day tabs (MON-SUN), collapsible meal sections, inline food quantity editing, drag-and-drop reorder within meals (`@dnd-kit/core` + `@dnd-kit/sortable`), real-time macro recalculation, daily macro summary bar, "Copy Day" dialog for cloning meals across days, unsaved changes warning via `beforeunload`, and save-all persistence.
- **Macro Summary Bar:** Horizontal stacked bar showing protein (blue), carbs (amber), fats (red) proportional to calorie contribution, with text summary and optional target calorie comparison (green/amber/red color coding).
- **Food Row Editable:** Inline-editable food row with drag handle, food name, quantity input, unit label, live macro display, and delete button.
- **Meal Row:** Collapsible meal section with editable meal name, food list with drag-and-drop sorting, subtotal macros, add food button (opens existing `FoodSearchModal`), and delete meal confirmation.
- **Copy Day Dialog:** Multi-select dialog for copying all meals from one day to others, with Select All/Deselect All toggle and Italian day labels.
- **Diet Editor Page (Athlete View):** Read-only view of assigned meal plan using `MealPlanEditor` with `readOnly` mode, data from `useDietData`.
- **Diet Templates Hook:** `useDietTemplatesList`, `useDietTemplate`, `useCreateDietTemplate`, `useUpdateDietTemplate`, `useDeleteDietTemplate`, and `useAssignTemplate` (copy-on-assign from template to athlete's meal_plans).
- **Foods Query Hook:** `useFoodsQuery` with server-side search, unit/state filtering, pagination via Supabase `.range()`, sorting, and exact count.

### 💅 Schema / Architecture
- **DB Migration 003 — Diet Templates:** Created `diet_templates` and `diet_template_items` tables with RLS policies (coaches CRUD own templates, athletes have no access). Foreign key from `diet_template_items.food_id` to `foods.id`. Day-of-week CHECK constraint (`MON`-`SUN`).
- **DB Migration 004 — Meal Plans Alter:** Added `created_by` (UUID, references auth.users) and `template_id` (UUID, references diet_templates, ON DELETE SET NULL) columns to `meal_plans`. Backfilled `created_by = user_id` for existing rows.
- **DB Migration 005 — Foods Alter:** Added `created_by` (UUID) and `updated_at` (TIMESTAMPTZ) columns to `foods`. Added coach-specific RLS policy allowing coaches full CRUD on foods.
- **TypeScript Types Updated:** Added `DietTemplate` and `DietTemplateItem` interfaces. Extended `Food` with `created_by` and `updated_at`. Extended `MealPlan` with `created_by` and `template_id`.
- **New Dependencies:** `@tanstack/react-table`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.

## [0.6.0] - Dashboard Phase 1: Athlete Dashboard

### ✨ Features
- **Parameterized Hooks:** All core data hooks (`useDashboardData`, `useProfile`, `useHistoryLogs`, `useStreak`, `useDietData`) now accept an optional `userId` parameter, enabling coach-views-athlete data flow through `AthleteContext.effectiveUserId`.
- **Dashboard Stats Hook:** `useDashboardStats` derives current weight, 7-day average weight, weight delta, average steps (7d), and logging streak from `useDashboardData('3m')` + `useStreak`.
- **Recovery Score Hook:** `useRecoveryScore` computes a weighted recovery score (sleep 30%, HRV 25%, soreness 20%, stress 15%, energy 10%) with trend detection vs 7 days ago.
- **Compliance Rings Hook:** `useComplianceRings` calculates 7-day compliance percentages for diet adherence, training frequency (target 5/7), and steps-at-goal days.
- **Biofeedback Radar Hook:** `useBiofeedbackRadar` normalizes 6 biofeedback axes (Digestion, Energy, Mood, Hunger, Libido, Stress) to 0-100 for current vs previous week comparison.
- **Stat Cards:** `StatCard` component with icon, label, value, optional trend indicator (up/down/stable with color coding), and loading skeleton.
- **Recovery Gauge:** SVG 270-degree arc gauge with color zones (red/amber/green), animated fill, and trend indicator.
- **Compliance Rings:** Three concentric SVG progress rings (diet/training/steps) with percentage legend.
- **Biofeedback Radar:** Recharts `RadarChart` comparing current vs previous week across 6 axes with filled polygons.
- **Weight Trend Chart:** Recharts `ComposedChart` with raw weight dots (Scatter), 7-day and 14-day moving averages (Line), target weight reference line, and time range selector (7d/14d/1m/3m/all).
- **Steps Bar Chart:** Recharts `BarChart` with color-coded bars (green/amber/red) based on goal threshold compliance.
- **Training Calendar Strip:** 7-day horizontal strip showing workout type icons, RPE color dots, and duration badges.
- **Goal Progress Cards:** Progress bar cards for goals (target weight, daily steps, daily water) with inverted mode for weight-loss targets.
- **Overview Page:** Full athlete dashboard assembling stat cards, weight trend chart, recovery gauge, compliance rings, training calendar strip, biofeedback radar, and steps bar chart.
- **Progress Page:** Weight trend chart with raw data table (date, weight, steps, sleep, diet adherence) filtered by selected time range.
- **Goals Page:** View/edit goals (target weight, daily steps, daily water) with `react-hook-form`, inline edit form, and progress card display.

## [0.5.0] - Dashboard & Coach Panel — Phase 0: Foundation

### ✨ Features
- **Dashboard Shell & Routing:** Added `react-router-dom` with `BrowserRouter`. The existing mobile app remains at `/`, while a new desktop dashboard lives at `/dashboard/*` with 13 lazy-loaded routes (Overview, Progress, Athletes, Athlete Detail, Diet Editor, Food Database, Templates, Goals, Settings) plus a 404 fallback.
- **DashboardApp Entry Point:** Auth-guarded shell at `/dashboard` that redirects unauthenticated users to `/`, wraps content in `AthleteProvider` context and `DashboardShell` layout.
- **Responsive Sidebar Layout:** `DashboardShell` renders a sidebar (256px at xl, 224px at lg, 64px icon rail at md) alongside a scrollable content area. Below md, the sidebar is replaced by a slide-over `MobileDrawer` with backdrop, Escape-to-close, and nav-click-to-close.
- **Role-Aware Navigation:** `SidebarNav` filters nav items by user role — athletes see 5 items (Overview, Progress, My Diet, Goals, Settings), coaches see 8 items (adds Athletes, Food Database, Templates). Uses `NavLink` for active-route highlighting and tooltips in icon-rail mode.
- **Top Header Bar:** Breadcrumbs (route-aware, clickable segments), user avatar (first letter of email), and a "Coach" badge for coach users. Hamburger button visible only on mobile to trigger the drawer.
- **AthleteProvider Context (Stub):** Provides `effectiveUserId`, `activeAthleteId`, `setActiveAthleteId`, and `isCoach` — enabling the coach-views-athlete pattern for all downstream hooks. Currently defaults to the logged-in user.

### 💅 Schema / Architecture
- **DB Migration 001 — Role System:** Added `role` column (`TEXT NOT NULL DEFAULT 'athlete'`) to `profiles` with CHECK constraint. Created `get_my_role()` and `is_coach_of()` SQL helper functions (STABLE SECURITY DEFINER). Added RLS policy preventing role self-escalation via client.
- **DB Migration 002 — Coach-Athlete Relationships:** Created `coach_athletes` table with `coach_id`, `athlete_id`, `status` (active/paused/terminated), unique constraint, self-reference check, and RLS policies (coaches manage their own rows, athletes can see their own).
- **TypeScript Types Updated:** Added `CoachAthlete` interface to `database.ts`. Added `role: 'athlete' | 'coach'` to `UserProfile` in `useProfile.ts`.
- **Dashboard CSS Tokens:** Added semantic color tokens for metrics (weight, sleep, training, diet, steps, recovery), status levels (excellent, good, warning, danger, neutral), and extended chart palette (chart-6 through chart-8). Added `.grid-stats`, `.grid-panels`, `.grid-equal`, `.dashboard-content` utility classes.

## [0.4.2] - Data Integrity & Schema Alignment Pass

### 🐛 Bug Fixes
- **Digestion Rating Type Mismatch:** `digestion_rating` was stored as `TEXT` in the schema but the form saved numeric values (1–4 from `DIGESTION_OPTIONS`). `DailySummaryCard` was comparing it against hardcoded strings (`=== 'Excellent'`) which always evaluated to false, rendering digestion as `-` for every log. Fixed by changing the column to `INTEGER CHECK (1–4)`, updating the TypeScript type to `number | null`, importing `DIGESTION_OPTIONS` in `DailySummaryCard`, and replacing the broken string comparison with `getLabelByValue(DIGESTION_OPTIONS, ...)`.
- **Wrong `getScoreColor` Max Values:** `DailySummaryCard` was calling `getScoreColor(log.daily_energy, 5)`, `getScoreColor(log.stress_level, 5)`, and `getScoreColor(log.sleep_quality, 10)` — but all three fields use 1–3 discrete scales in the UI. Badge colors were always amber/red because the ratio was always < 0.5. Corrected max to `3` for all three and `4` for digestion.
- **Mock Data Out of Range:** `generate_mock_csv.py` generated values well outside what the app's selectors produce — `sleep_quality` 5–10 (form: 1–3), `stress_level` 1–4 (form: 1–3), `soreness_level` 1–8 (form: 1–3), `gym_energy`/`daily_energy` 3–5 (form: 1–3), `hunger_level` 4–10 (form: 1–5), `libido` 3–9 (form: 1–5), and `digestion_rating` as text strings instead of integers. All corrected to match UI selector ranges.
- **Wrong Workout Sessions in Mock:** Mock used `"Upper"` and `"Lower"` (not present in `WORKOUT_TYPES`) and an empty string `""` as a rest sentinel. Updated to use the canonical values `["Push", "Pull", "Legs", "Cardio", "Rest"]` with rest detection via `workout == "Rest"`.

### ✨ Features
- **Hunger Level & Libido Fields:** Added `hunger_level` (1–5) and `libido` (1–5) input fields to `EndOfDayFlowView` and `EditLogModal`. Added `HUNGER_OPTIONS` and `LIBIDO_OPTIONS` constants to `src/lib/constants.ts`.

### 💅 Schema / Architecture
- **Schema CHECK Constraint Alignment:** Tightened six `daily_logs` CHECK constraints to match the actual discrete ranges used in the UI: `sleep_quality` (0–10 → 1–3), `stress_level` (1–5 → 1–3), `soreness_level` (1–10 → 1–3), `daily_energy` (1–5 → 1–3), `gym_energy` (1–5 → 1–3), `hunger_level` (1–10 → 1–5), `libido` (1–10 → 1–5).

## [0.4.1] - Bug Fix Pass

### 🐛 Bug Fixes
- **Calendar Cell Overlays Sticky Header:** The selected day cell in `HeatmapCalendar` used `z-10 scale-110`, matching the `z-10` on `SyncHeader`. Same z-index with the calendar cell later in SUN order caused it to paint on top of the sticky header when scrolling. Fixed by bumping `SyncHeader` to `z-20`.
- **Today Dashboard Shows 0% After Sync:** `DailyLogHub` only read today's log from `localDB.syncQueue`. Once entries were synced and removed from the queue, `todayLog` was always `null` — leaving the Today dashboard at 0% with no summary card despite Supabase having full data. Fixed by adding a Supabase query for today's date as a fallback when no pending queue entry exists.
- **Editing Pending Log Shows Wrong/Incomplete Data:** Each section save (Morning, Workout, EOD) creates a separate `syncQueue` entry. Editing from `PendingLogs` opened one specific entry, which was often missing data from later saves. Fixed by merging all pending entries for the same date (oldest → newest) before populating the `EditLogModal`, so the form always shows the complete accumulated state.

## [0.4.0] - Dashboard UX Overhaul

### ✨ Features & UX Improvements
- **Unified Today View:** `TodayDashboardView` now renders a full `DailySummaryCard` (reusing the History tab component) in place of the three checkpoint menu buttons once the user has logged any data for today — providing a single, consistent read view across the app.
- **Inline Section Editing:** `DailySummaryCard` gains two new optional edit props: `onEdit` (full-log edit, used by History) and `onEditSection` (section-level navigation, used by Today). Pencil icon buttons appear in the Biofeedback, Workout, and Notes section headers, routing the user directly to the relevant flow form.
- **Edit Past Entries from History:** Tapping "Edit" on any `DailySummaryCard` in the History tab now wraps the selected log into a `SyncAction`, switches to the Tracker tab, and opens `DailyTrackerWizard` pre-filled with that day's data — completing the full round-trip edit flow.
- **Goal Progress Icons:** The Goals Progress collapsible widget now shows matching Lucide icons on each tile (`Droplets` for Water, `Moon` for Sleep, `Activity` for Steps, `Timer` for Cardio), consistent with the icons used in the History summary card.
- **Robust Recovery Score:** Replaced the 2-signal recovery score (sleep quality + stress) with a weighted 5-signal formula covering `sleep_quality` (30%), `sleep_hours` (20%), `stress_level` (25%), `mood` (15%), and `soreness_level` (10%). Available signals are re-weighted proportionally when fields are missing. Score now displays whenever at least one sleep signal is present.
- **Field-Based Completion Tracking:** Section completion in `TodayDashboardView` is now calculated from the actual percentage of fields filled (Morning: 7 fields, Training: 8 fields, End of Day: 6 fields) rather than a binary check on two key fields. A section is marked done at ≥60% filled. Each checkpoint button shows an `"X / Y fields"` subtitle. The top progress bar reflects the average of the three section percentages.

### 💅 Polish / Architecture
- **`onEditSection` / `onEdit` Props on `DailySummaryCard`:** Clean dual-prop design — `onEdit(log)` for history-level editing, `onEditSection(section)` for today's section-level navigation. Section pencil buttons prefer `onEditSection` when available, falling back to `onEdit`.
- **`buildSyncAction` Helper in `App.tsx`:** Extracted a `buildSyncAction(log: DailyLog): SyncAction` helper to consistently wrap synced logs into the local queue format when opening the edit wizard from History.
- **`HistoryView` accepts `onEditLog` prop:** `HistoryView` now forwards an optional `onEditLog` callback from `App.tsx` to `DailySummaryCard`, keeping history-level edit wiring in the top-level `App` component.

## [0.3.0] - Bug Fix & Quality Pass

### 🐛 Bug Fixes
- **Data Loss — Journal Field Mismatch:** Fixed `EndOfDayFlowView` registering the journal textarea as `"notes"` instead of `"general_notes"`, causing every journal entry to be silently dropped on save.
- **Edit Flow State Leak:** Fixed `DailyTrackerWizard` not calling `onClearEdit` after completing an edit, causing `editingLog` in `App.tsx` to never reset and the wizard to re-open in edit mode.
- **Broken Retry Guard:** Fixed `retryCount` not persisting in IndexedDB — the field was in the TypeScript interface but missing from the Dexie store column definition, so every sync retry read it as `undefined` and the 3-attempt cap was never enforced. Users' failed log entries were silently deleted without notification.
- **Zero-Value Completion Detection:** Fixed section completion checks using `!!value` which treated `0` (valid for steps on a rest day, water, etc.) as incomplete. Replaced with explicit `!== null && !== undefined` guards.
- **Hardcoded Steps Goal in Stats:** Fixed `StepsChart` receiving a hardcoded `targetSteps={10000}` instead of the user's profile `steps_goal`.
- **`window.alert` in Auth:** Replaced the only `window.alert()` call (registration success) with a Sonner `toast.success()` for visual consistency.
- **Pre-existing TypeScript Errors:** Fixed three pre-existing TS errors — partial `DailyLog` object cast, `toFixed()` returning `string` instead of `number` for 7-day averages, and `aria-valuemax` accepting `string | number` on the Slider component.

### ✨ Features & UX Improvements
- **Sync Success/Failure Feedback:** `useSync` now fires a `toast.success('All logs synced')` on successful sync and a `toast.error(...)` when a log entry exhausts all retries and is removed from the queue, instead of silently failing.
- **Auto-Sync on Reconnect:** `SyncHeader` now listens for the browser `online` event and automatically triggers sync when the device regains connectivity — no manual button press required.
- **Cache Invalidation After Sync:** `useSync` now invalidates `historyLogs` and `dashboardData` TanStack Query caches after a successful sync so the History and Stats tabs reflect freshly synced data immediately.
- **Live Streak Counter:** `useStreak` replaced its one-shot `useEffect` with Dexie's `useLiveQuery`, so the streak count updates reactively when new logs are added within the same session.
- **Dynamic Recovery Score Message:** The recovery score widget now shows contextual copy based on the actual score (low / medium / high) instead of a hardcoded "strong recovery" message.
- **Session-Only Swap Warning:** Confirming a food swap in the Diet tab now shows a toast informing the user that the swap is session-only and will not persist after navigation.
- **Removed Placeholder Tiles:** Removed the non-functional "Body / Fuel / Drive" dashboard tiles that appeared interactive but had no behaviour, eliminating false affordance.

### ♿ Accessibility
- **Emoji Button Labels:** Added `ariaLabel` field to `MOOD_OPTIONS` and `ENERGY_OPTIONS` constants and wired it through `ButtonGroup` to `aria-label` on each button, replacing emoji-only labels ("😫") with meaningful descriptions ("Very low") for screen readers.
- **Label/Select Association:** Added `htmlFor` / `id` pairs to all `<label>` + `<select>` combinations in `Onboarding` and `ProfileView` so form controls are programmatically associated for assistive technology.
- **Heatmap Touch Targets:** Increased calendar day cells from `w-7 h-7` (28px) to `w-9 h-9` (36px) and month navigation arrows from `p-1.5` to `p-2` to bring tap targets closer to the 44px minimum.
- **Settings Dropdown Keyboard Handling:** Settings dropdown now closes on outside click and on `Escape` key press, with `role="menu"` applied to the container.

### 💅 Polish / Architecture
- **Removed Dead Dependency:** Removed `zustand` from `package.json` — it was listed as a dependency but had zero stores in the codebase.
- **Fixed Invisible Pending Text:** `SyncHeader` pending status text now uses `text-muted-foreground` instead of `text-secondary`, which resolved near-zero contrast (invisible text) in light mode.
- **`retryCount` in Dexie Schema:** Added `retryCount` to both the `SyncAction` TypeScript interface and the Dexie store column list so retry state is correctly persisted across sync attempts.

## [0.2.0] - The Daily Flow Update

### ✨ Features
- **The "Daily Flow" UX Pivot:** Overhauled the monolithic `DailyLogForm` into a progressive "Daily Checkpoints" wizard (`DailyTrackerWizard`).
  - Implemented `TodayDashboardView` for home navigation.
  - Split data entry into focused micro-interactions: `MorningFlowView`, `TrainingFlowView`, and `EndOfDayFlowView`.
  - Saved form states incrementally using `localDB.syncQueue` after each micro-interaction finishes.
- **Data Integrity Constraints:** Hardened the `daily_logs` Supabase table schema with robust `CHECK` constraints mapping to UI boundaries (e.g. `workout_duration <= 600`, `sleep_hours <= 24`).
- **Shared UI Constants:** Decoupled UI option lists (Mood, Stress, Energy emojis) into a centralized `src/lib/constants.ts` file. Automatically parses numerical database values into localized emojis within the `DailySummaryCard`.
- **History & Logs View:** Added a dedicated robust tab for visualizing and analyzing past daily logs:
  - Created a dual-mode `HeatmapCalendar`:
    - **Month View:** A traditional, horizontally ordered calendar layout with month-to-month pagination arrows.
    - **90 Days View:** A continuous, github-style horizontal scrolling heatmap evaluating consistency over the last 3 months.
  - Implemented a `DailySummaryCard` to showcase detailed logging information dynamically upon selecting a day on the calendar.
  - Integrated `useHistoryLogs` hook leveraging `@tanstack/react-query` to pull user's historical `daily_logs` from Supabase.
- **Onboarding Profile Flow:** Created a new `Onboarding` screen forced for new users after registration.
  - Collects core demographic information required for fitness tracking: Gender, Age, Height, Current/Target Weight, Unit System preference, Activity Level, and Primary Goal.
  - Added new backend Supabase `profiles` table to securely store this data using Row Level Security (RLS).
  - Automatically intercepts users without a complete profile layout in the main `App` view.
- **Shadcn UI Integration:** Replaced the legacy custom `src/components/ui/` with official `shadcn/ui` components for better consistency, accessibility, and theming:
  - `Button`, `Input`, `Select`, `Slider`, `Card`, `Table`, `Tabs`, `Dialog`, `ScrollArea`, `Badge`, `Collapsible`, and `Chart`.
- **Shadcn Charts Architecture:** Refactored `WeightChart.tsx` and `StepsChart.tsx` to utilize the modern Shadcn Chart wrapper, which provides a cleaner API over Recharts and automatically syncs with the application's CSS variables.
- **Weekly Overview Redesign:** 
  - Created a dual-view system for the Weekly Diet Overview: 
    - **Charts Mode:** Visualizes weekly calorie and macro averages using interactive BarCharts.
    - **Table Mode:** Transposes the 8-column data grid into a vertical list, perfecting the experience for mobile users without horizontal scrolling.
  - Implemented a unified `Tabs` toggle in the header to switch between "Grafici" and "Tabella" views.
- **Diet Tab Enhancements:** 
  - Refactored "Daily Meals" day-of-week selection into a responsive 2-row grid for better mobile ergonomics.
  - Improved meal card aesthetics with cleaner spacing, backgrounds, and integrated Lucide icons.
- **Theme Standardization:** Standardized all UI elements to use the default Shadcn "Zinc" theme variables, ensuring unified dark/light support across charts and components.

### 🐛 Bug Fixes
- **Timezone Offset Bug:** Refactored native JS `toISOString()` date generation across the entire app with a custom `getLocalDateStr()` utility. This permanently fixed the UTC timezone-shift bug where user-logged data (like `Mar 10`) was accidentally fetching data for the previous day (`Mar 9`) inside `HistoryView` and `HeatmapCalendar`.
- **Chart Color Visibility:** Resolved an issue where chart lines and columns were rendering black by stripping redundant `hsl()` wrappers around CSS variables that already contained their own color space declarations.
- **Theme Inconsistency:** Removed hardcoded light-mode background classes (`bg-white`, `bg-gray-50`) from core layout files (`App.tsx`, `Auth.tsx`, `DailyLogForm.tsx`, etc.) to fix dark mode visual bugs.
- **Mobile Overflow:** Fixed a visual overlap bug where the daily tabs were clipping into the meal cards by introducing a padded grid container with optimized row spacing.

### 💅 Polish / Architecture
- **Component Cleanup:** Deleted obsolete prototype components (`WeeklyOverviewCharts`, `WeeklyOverviewCards`, etc.) and the old `ui-old` folder.
- **Improved Performance:** Optimized `Recharts` rendering by moving domains and averages into `useMemo` hooks.

## [0.1.0] - Initial MVP

### ✨ Features
- **Application Setup:** Initialized an offline-first responsive React app using Vite, TypeScript, and Tailwind CSS.
- **Offline Storage (`Dexie.js`):** Implemented an IndexedDB local queue (`syncQueue`) to save logs even without an internet connection.
- **Daily Log Form:** Created a comprehensive form with three distinct sections:
  - **Morning Metrics:** Fasting weight, sleep hours, sleep quality.
  - **Activity & Gym:** Daily steps, workout type, cardio tracking, RPE, gym energy, and gym mood.
  - **End of Day:** Water tracked, salt intake, digestion rating, bathroom visits, daily energy, and stress tracking.
- **Form Enhancements:** Implemented intelligent default values and live-updating `Slider` components for granular metrics (energy, mood, stress, RPE).
- **Supabase Integration:** Configured the `lib/supabase.ts` client for backend connectivity.
- **Supabase Authentication:** 
  - Created a robust `AuthContext` to manage global session and user state.
  - Built an `Auth.tsx` component handling both User Sign In and Registration.
  - App explicitly redirects unauthenticated users to the login screen.
- **Cloud Synchronization (`useSync`):** Developed a sync engine to push queued local logs to the Supabase `daily_logs` database. It explicitly requires an active user session and leverages Row Level Security (RLS) policies.
- **Pending Logs Manager:** Developed `PendingLogs.tsx`, allowing users to directly view, logically edit, or permanently delete items sitting in the local offline queue before they hit the cloud server.
- **UI Component Library:** Extracted a standardized design system into `src/components/ui/` containing:
  - `Button` (with variants, sizes, and `isLoading` spinner support)
  - `Input` (with icon and error handling support)
  - `Select` (styled wrapper over native select)
  - `Slider` (styled `range` input with custom accent tracking)
- **App Navigation:** Added a responsive bottom navigation bar to switch between the 'Tracker', 'Diet', and 'Stats' views.
- **Diet View (MVP Part 1):** Built the "Today's Diet" read-only view featuring:
  - **Weekly Overview:** A summary table displaying daily total KCAL, P, C, G, and C:G ratio alongside weekly averages.
  - **Daily Meals:** A detailed daily breakdown showing grouped meals, ingredients, quantities, and per-meal macro totals.
  - **Data Fetching:** Implemented `useDietData` using TanStack Query to fetch and aggregate `meal_plans` joined with `foods` from Supabase.
  - **Type Safety:** Added normalized Supabase database types (`Food`, `MealPlan`, `MealAdherence`).
- **Smart Swaps (MVP Part 2):** Developed an intelligent food replacement engine:
  - **Food Database Search:** Added a `FoodSearchModal` backed by a cached TanStack Query hook (`useFoods`) to browse the Supabase food catalog.
  - **Swap Algorithm:** Built a utility that calculates primary macronutrient equivalency (e.g., matching the protein content of 100g Chicken with Salmon) to generate an exact new required quantity.
  - **Interactive Verification:** Added a `SwapPreviewModal` that visualizes the old vs. new food, highlights secondary macro differences, and warns users if a swap drastically alters Fats or Carbs.
  - **UI Integration:** Integrated the engine seamlessly into the Daily Meals table allowing real-time local updates.
- **Dashboard & Analytics (Phase 3):** Developed the "Stats" tab featuring interactive charts using `recharts`:
  - **Time Range Filtering:** Users can dynamically view data for the last 7 days, 14 days, 1 month, 3 months, or all time.
  - **Body Weight Trend:** A responsive `LineChart` visualizing `weight_fasting` with auto-calculating tight domains to highlight micro-fluctuations. Automatically calculates and displays the net weight change across the selected period.
  - **Daily Steps Goal:** A responsive `BarChart` displaying daily `steps` against a 10,000 step reference line, dynamically coloring bars that successfully hit the target.

### 🐛 Bug Fixes
- **TypeScript Import Error:** Fixed `import type` errors in `db.ts` stemming from `verbatimModuleSyntax` rules.
- **401 Unauthorized Fix:** Successfully replaced the dummy UUID used for data saving with the actual authenticated `user.id`. Wait-gated syncing to an authenticated `getSession()` call to bypass unauthorized errors.
- **Data Insertion:** Sanitized form data to cast empty strings from HTML number inputs into SQL-ready `null` values to fix integer type `22P02` syntax errors upon synchronization.
- **Redundant Styles:** Cleared out unused `App.css` and noisy boilerplate CSS from `index.css`.

### 💅 Polish / Architecture
- **React Hook Form:** Setup form submission utilizing refs internally to avoid bloated state re-renders.
- **Responsive Layouts:** Built simple card layouts utilizing tailwind's fluid `grid` and `flex` helpers. 
- **Lucide Icons:** Sprinkled semantic vector icons throughout the interface (Headers, Inputs, Buttons) to dramatically improve UX.
