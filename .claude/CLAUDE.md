# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

---

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Only touch what's necessary. No side effects with new bugs.

---

## Development Commands

```bash
# Start dev server with hot reload
npm run dev

# Build for production (type-checks, then builds)
npm run build

# Type-check only (no build output)
npx tsc -b

# Lint with ESLint
npm run lint

# Preview production build locally
npm run preview
```

No test runner is currently configured. When adding tests, configure `vitest` and update this section.

---

## Architecture Overview

**bw-tracker** is a mobile-first Progressive Web App (PWA) for fitness/nutrition tracking, replacing an Excel spreadsheet. Single-user app for an Italian athlete.

### Tech Stack
- **Frontend:** React 19 + Vite + Tailwind CSS v4
- **Backend/DB:** Supabase (PostgreSQL + Auth + RLS)
- **State Management:** TanStack Query (server), local React state
- **Offline Queue:** Dexie 4 (IndexedDB for sync queue)
- **UI:** shadcn/ui, Base UI, Lucide icons
- **Forms:** React Hook Form
- **Charts:** Recharts
- **PWA:** vite-plugin-pwa with Workbox

### Application Flow

1. **Shell Router** ([src/shell/AppRouter.tsx](src/shell/AppRouter.tsx)): Top-level router that dispatches to one of three apps based on URL path:
   - `/` → Tracker mobile app
   - `/dashboard/*` → Coach/admin dashboard
   - `/workout/*` → Workout log app

2. **Auth Gate** ([AuthContext.tsx](src/core/contexts/AuthContext.tsx)): Redirects to `Auth` component if no session
3. **Role Gate** ([RoleContext.tsx](src/core/contexts/RoleContext.tsx)): Single source of truth for user capabilities (`canLog`, `canViewDashboard`, `canManageAthletes`, etc.)

**Tracker App Flow** ([src/apps/tracker/TrackerApp.tsx](src/apps/tracker/TrackerApp.tsx)):
1. Auth gate → shows `Auth` if no session
2. Onboarding gate → checks `profiles` for height/initial_weight
3. State-based tab router (no URL routing). Four tabs:
   - **Tracker** — Quick daily log forms (morning biometrics, gym performance, evening recovery)
   - **History** — Past logs view with sortable/filterable data table
   - **Diet** — Weekly meal plan with adherence tracking and food swap UI
   - **Stats** — Dashboard with charts and analytics
   - **Workout** — Link to `/workout` app

### Key Modules (Core Layer)

**[src/core/lib/supabase.ts](src/core/lib/supabase.ts)** — Singleton Supabase client. Initializes with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars.

**[src/core/lib/db.ts](src/core/lib/db.ts)** — Dexie IndexedDB schema with single table: `syncQueue` (SyncAction interface). Stores offline mutations pending server sync.

**[src/core/lib/mealMacros.ts](src/core/lib/mealMacros.ts)** — Pure domain logic for macro calculations. Used by both diet and swap algorithm modules.

**[src/core/lib/swapAlgorithm.ts](src/core/lib/swapAlgorithm.ts)** — Pure domain logic for food swap calculations. Given a food and macro target, calculates replacement food weight needed to match macros.

**[src/core/hooks/useSync.ts](src/core/hooks/useSync.ts)** — Drains `syncQueue` to Supabase. Called when user clicks sync button.

**[src/core/contexts/AuthContext.tsx](src/core/contexts/AuthContext.tsx)** — Session management. Manages Supabase session and auth state.

**[src/core/contexts/RoleContext.tsx](src/core/contexts/RoleContext.tsx)** — Single source of truth for user role and capabilities. Replaces scattered `isCoach` checks with capability-based model.

**[src/core/types/database.ts](src/core/types/database.ts)** — TypeScript mirrors of all Supabase tables + `UserProfile`. Manually maintained.

### Database Schema

5 tables with RLS enabled on all:
- **profiles** — User metadata (height, initial_weight, coaching notes)
- **daily_logs** — Wide flat row per (user_id, date) — UNIQUE constraint ensures one log per user per day
- **meal_plans** — Weekly meal structure (7 rows per user, one per day of week)
- **meal_adherence** — Meal checklist tracking (which meals eaten each day)
- **foods** — Food library with macro info; TEXT primary key (food name), public-readable

See [supabase/schema.sql](supabase/schema.sql) and [supabase/profiles.sql](supabase/profiles.sql) for DDL. Note: No migration runner; schema changes are manual SQL applied via Supabase dashboard.

### Directory Structure

```
src/
├── core/                      # Shared foundation layer
│   ├── components/ui/         # shadcn/ui & Base UI wrappers
│   ├── contexts/
│   │   ├── AuthContext.tsx    # Supabase auth provider
│   │   └── RoleContext.tsx    # User capabilities & role-based access
│   ├── hooks/                 # Shared data hooks
│   │   ├── useSync.ts         # Offline queue drain
│   │   ├── useProfile.ts      # Profile queries
│   │   ├── useFoods.ts        # Food library queries
│   │   ├── useHistoryLogs.ts  # Daily logs queries
│   │   └── ... (8 total)
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client singleton
│   │   ├── db.ts              # Dexie IndexedDB schema
│   │   ├── mealMacros.ts      # Macro calculation logic
│   │   ├── swapAlgorithm.ts   # Food swap algorithm
│   │   ├── constants.ts       # Form options, LUTs
│   │   └── utils.ts           # Date, formatting utilities
│   └── types/
│       └── database.ts        # All Supabase table types
│
├── apps/                      # Multi-app structure
│   ├── tracker/               # Mobile tracker PWA (/)
│   │   ├── TrackerApp.tsx
│   │   └── components/
│   │       ├── daily-flow/    # Log forms wizard
│   │       ├── history/       # Past logs heatmap
│   │       ├── diet/          # Meal plan viewer
│   │       ├── stats/         # Analytics charts
│   │       └── (Auth, Onboarding, etc.)
│   │
│   ├── dashboard/             # Coach panel (/dashboard/*)
│   │   ├── DashboardApp.tsx
│   │   ├── layout/            # Shell, sidebar, header
│   │   ├── pages/             # Overview, Progress, Athletes, etc.
│   │   ├── components/        # Charts, cards, tables
│   │   ├── hooks/             # Dashboard-specific queries
│   │   └── contexts/          # AthleteContext (app selector)
│   │
│   └── workout/               # Workout log app (/workout/*)
│       ├── WorkoutApp.tsx     # [WIP] 4-tab navigation
│       └── components/
│           ├── log/           # [WIP] Log workout form
│           ├── history/       # [WIP] Past sessions timeline
│           ├── programs/      # [WIP] Program management
│           └── stats/         # [WIP] Analytics & 1RM
│
└── shell/                     # Top-level routing & access control
    ├── AppRouter.tsx          # Routes: /, /dashboard/*, /workout/*
    └── RoleGate.tsx           # Capability-based access guard
```

### Offline-First Architecture

1. **Write Flow:** User submits form → stored in Dexie `syncQueue` → local UI updates immediately → `SyncHeader` polls for queue
2. **Sync Flow:** `useSync()` hook calls Supabase upserts for each queued action → marks as synced or error → user can retry failed items
3. **Read Flow:** All reads go directly to Supabase via TanStack Query (no local cache strategy except RQ's built-in caching)

### Key Conventions

- **Component state:** Local `useState` for UI, TanStack Query for server state
- **Mutations:** Manual upsert to Dexie queue first, then sync (no mutation library like react-query mutations)
- **Environment:** Load via `import.meta.env.VITE_*` (Vite convention)
- **Styling:** Tailwind CSS + shadcn/ui components with CVA for variants
- **Italian strings:** Diet section intentionally uses Italian (coach's language; not localization)
- **Date handling:** Use `getLocalDateStr()` utility to get `YYYY-MM-DD` in local time (avoids UTC timezone issues)

### Known Design Decisions

- **No URL routing:** Tab state is in React useState, not URL. Simpler for mobile-first UX with no back/forward nav.
- **TEXT PK for foods:** `foods.id` is the food name, not a UUID. Simplifies food swap matching logic.
- **Manual type generation:** No codegen from Postgres schema. Types in [database.ts](src/types/database.ts) are hand-maintained — keep in sync when schema changes.
- **Two SQL files:** [schema.sql](supabase/schema.sql) and [profiles.sql](supabase/profiles.sql) are separate; no migration tooling yet.
- **Zustand imported but unused:** Store library is in package.json but not used in app. Component state only.

---

## Common Tasks

### Adding a New Feature
1. Create the UI component in `src/components/`
2. Create a data hook in `src/hooks/` if fetching Supabase data
3. For mutations: dispatch to Dexie queue in `src/lib/db.ts` first, then sync via `useSync()`
4. Update `src/types/database.ts` if querying new tables
5. Test on slow connection: DevTools > Network > Throttle to 3G

### Debugging Offline Queue
- Open DevTools > Application > IndexedDB > BWTrackerDB > syncQueue to inspect pending mutations
- Check browser console for sync errors (useSync hook logs them)
- `SyncHeader` shows sync status and pending count

### Adding a Supabase Query
1. Create a hook in `src/hooks/use*.ts` with TanStack Query `useQuery`
2. Use `supabase.from('table').select()` with your filters
3. Handle loading/error states in component
4. Avoid re-fetching: TanStack Query caches by default

### Styling Tips
- Use Tailwind utility classes directly on elements
- For complex component variants, use shadcn/ui + CVA
- Dark mode: CSS custom properties via Tailwind's theme
- Test mobile: DevTools > Toggle Device Toolbar (375px width is common)
