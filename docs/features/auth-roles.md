# Auth & Role System

## Authentication

Handled entirely by **Supabase Auth**. No custom auth logic on the frontend.

- Session stored and managed by the Supabase JS client
- JWT issued on sign-in, attached automatically to all Supabase requests
- `AuthContext` (`src/core/contexts/AuthContext.tsx`) exposes `session` and `user` to the app
- Unauthenticated users are redirected to the `Auth` component before any app renders

## Role Model

Two roles: `athlete` and `coach`. Stored in `profiles.role` (default: `'athlete'`).

```sql
ALTER TABLE profiles
  ADD COLUMN role TEXT NOT NULL DEFAULT 'athlete'
  CHECK (role IN ('athlete', 'coach'));
```

Roles are read via a SQL helper to support both DB-stored and JWT-embedded values:

```sql
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    (SELECT role FROM public.profiles WHERE id = auth.uid())
  );
$$;
```

**Role self-escalation is blocked** — the `profiles` UPDATE policy prevents clients from changing their own `role` column.

## Coach–Athlete Relationship

Managed via the `coach_athletes` table:

```
coach_athletes
  id            UUID PK
  coach_id      UUID → auth.users
  athlete_id    UUID → auth.users
  status        TEXT  ('active' | 'paused' | 'terminated')
  assigned_at   TIMESTAMPTZ
  terminated_at TIMESTAMPTZ nullable
  UNIQUE(coach_id, athlete_id)
  CHECK(coach_id != athlete_id)
```

The `is_coach_of(target_athlete_id)` SQL helper returns `TRUE` when an active relationship exists — used in RLS policies to gate coach access to athlete data.

## Frontend Capability Model

`RoleContext` (`src/core/contexts/RoleContext.tsx`) is the single source of truth for what a user can do. Components check **capabilities**, not raw roles:

| Capability | Athlete | Coach |
|------------|---------|-------|
| `canLog` | ✓ | ✓ |
| `canViewDashboard` | — | ✓ |
| `canManageAthletes` | — | ✓ |

Access to `/dashboard/*` routes is guarded by `RoleGate` (`src/shell/RoleGate.tsx`).

## Backend JWT Verification

FastAPI verifies Supabase JWTs without a round-trip to Supabase on every request:

1. On first request, fetches Supabase's JWKS public keys and caches them (`dependencies.py`)
2. Each request: decodes and verifies the `Authorization: Bearer <token>` JWT locally
3. Extracts `user_id` and `role` from claims
4. Coach-only endpoints (`/ai/*`, `/diet/*`, `/knowledge/*`) reject non-coach tokens with 403

```python
# All protected endpoints receive an injected CurrentUser dependency
async def generate_diet(user: CurrentUser = Depends(require_coach)):
    ...
```

## RLS Policy Summary

All 5 tables have RLS enabled. Key patterns:

- **Athletes** can only read/write their own rows (`user_id = auth.uid()`)
- **Coaches** can read athlete rows where `is_coach_of(athlete_id)` is true
- **`foods` table** is public-readable (no user scoping needed)
- **`coach_athletes`** is readable by both coach and the athlete in the relationship
