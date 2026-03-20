# DB Audit Fixes

Generated from `.claude/audits/AUDIT_DB.md` — 2026-03-19

## Status Legend
- ✅ Fixed in code
- 🛠️ Needs Supabase dashboard (SQL)
- ⏳ Pending

---

## Critical

### DB-001 — Unbounded SELECT * on daily_logs ✅
**Files:** `useHistoryLogs.ts`, `useComplianceRings.ts`, `useBiofeedbackRadar.ts`, `useRecoveryScore.ts`, `useStreak.ts`

**Fix:** Create `useRecentLogs(userId, days)` hook that selects only the 15 columns needed by metric hooks and adds a date range limit. Metric hooks and streak hook switch to this instead of the full `useHistoryLogs`.

---

## High

### DB-002 — useCoachStats makes 2 round-trips to the same table ✅
**File:** `useCoachStats.ts`

**Fix:** Merge the COUNT-only query into the data query using `{ count: 'exact' }` on the rows query. Read both `count` and `data.length` from the single response.

---

### DB-003 — useAthletes LIMIT heuristic unreliable ⏳
**File:** `useAthletes.ts`

**Fix:** Create a `get_recent_logs_for_athletes(athlete_ids uuid[], days int)` Postgres function using `ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY date DESC)`. Call via `supabase.rpc(...)`. Requires Supabase dashboard to create the function.

**SQL to apply:**
```sql
CREATE OR REPLACE FUNCTION get_recent_logs_for_athletes(
  athlete_ids uuid[],
  days_back int DEFAULT 7
)
RETURNS TABLE (LIKE daily_logs)
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY date DESC) AS rn
    FROM daily_logs
    WHERE user_id = ANY(athlete_ids)
      AND date >= (CURRENT_DATE - days_back)
  ) ranked
  WHERE rn <= days_back;
$$;
```

---

### DB-004 — Missing indexes on frequently queried columns 🛠️
**File:** `supabase/schema.sql`

**SQL to apply via Supabase dashboard:**
```sql
-- Meal data (every diet load)
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_adherence_user_date ON meal_adherence(user_id, date);

-- Coach dashboard
CREATE INDEX IF NOT EXISTS idx_coach_athletes_coach_status ON coach_athletes(coach_id, status);

-- Goal queries (current goal uses IS NULL filter on effective_until)
CREATE INDEX IF NOT EXISTS idx_athlete_goals_athlete_id ON athlete_goals(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_goals_current ON athlete_goals(athlete_id) WHERE effective_until IS NULL;

-- Food name search (ILIKE with leading wildcard needs trigram index)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_foods_name_trgm ON foods USING gin(name gin_trgm_ops);
```

---

### DB-005 — No RLS coach-read policy for athlete tables 🛠️
**File:** `supabase/schema.sql`

**SQL to apply:**
```sql
-- daily_logs: allow coaches to read their athletes' data
CREATE POLICY "Coaches can read their athletes logs" ON daily_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_athletes
      WHERE coach_athletes.coach_id = auth.uid()
        AND coach_athletes.athlete_id = daily_logs.user_id
        AND coach_athletes.status = 'active'
    )
  );

-- profiles: allow coaches to read their athletes' profiles
CREATE POLICY "Coaches can read their athletes profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_athletes
      WHERE coach_athletes.coach_id = auth.uid()
        AND coach_athletes.athlete_id = profiles.id
        AND coach_athletes.status = 'active'
    )
  );

-- meal_plans: allow coaches to read their athletes' plans
CREATE POLICY "Coaches can read their athletes meal plans" ON meal_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_athletes
      WHERE coach_athletes.coach_id = auth.uid()
        AND coach_athletes.athlete_id = meal_plans.user_id
        AND coach_athletes.status = 'active'
    )
  );
```

---

## Medium

### DB-006 — useHistoryLogs as shared data bus ✅
**Fixed as part of DB-001.** Metric hooks now use the narrow `useRecentLogs` hook instead of the full history.

---

### DB-007 — upsertTodayQueueEntry does full IndexedDB scan ✅
**File:** `db.ts`

**Fix:** Promote `date` to a top-level field on `SyncAction`. Add it to the Dexie index (version bump to 2). Query by indexed `mutation_type` + in-memory filter on `date` instead of scanning all pending entries.

---

### DB-008 — Food.updated_at in TypeScript but not in schema ✅
**File:** `database.ts`

**Fix:** Mark `updated_at` as optional (`updated_at?: string`) in the `Food` interface to reflect that the column does not exist in the current schema, eliminating silent `undefined` reads.

---

### DB-009 — profiles.sql missing role and salt_goal columns 🛠️
**File:** `supabase/profiles.sql`

The columns exist in production (app works) but are absent from the SQL file causing schema drift. Update the file to match production reality.

**SQL to add to profiles.sql:**
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'athlete'
    CHECK (role IN ('athlete', 'self_coached', 'coach')),
  ADD COLUMN IF NOT EXISTS salt_goal NUMERIC DEFAULT 6.0;
```

---

## Low

### DB-010 — meal_plans missing updated_at ⏳
Low priority. No code currently reads `meal_plans.updated_at`. Skip for now.

---

### DB-011 — Template assignment delete+insert without transaction ⏳
**File:** `useDietTemplates.ts`

**Fix:** Wrap in a Supabase RPC that does the DELETE+INSERT atomically. Requires creating a Postgres function. Deferred — low probability of failure in current single-user context.

---

### DB-012 — No timeout on Supabase client ⏳
**File:** `supabase.ts`

Low priority for single-user app. Deferred.

---

### DB-013 — schema.sql starts with DROP TABLE ✅
**Fix:** Move DROP statements to a separate `supabase/reset.sql` with clear danger warning. Remove from `schema.sql`.

---

## Summary

| ID | Severity | Status | Location |
|----|----------|--------|----------|
| DB-001 | Critical | ✅ Code | `useRecentLogs.ts` (new), 4 hooks updated |
| DB-002 | High | ✅ Code | `useCoachStats.ts` |
| DB-003 | High | ⏳ SQL needed | See SQL above |
| DB-004 | High | 🛠️ SQL needed | See SQL above |
| DB-005 | High | 🛠️ SQL needed | See SQL above |
| DB-006 | Medium | ✅ Code | Resolved by DB-001 fix |
| DB-007 | Medium | ✅ Code | `db.ts` |
| DB-008 | Medium | ✅ Code | `database.ts` |
| DB-009 | Medium | 🛠️ SQL needed | See SQL above |
| DB-010 | Low | ⏳ Deferred | — |
| DB-011 | Low | ⏳ Deferred | — |
| DB-012 | Low | ⏳ Deferred | — |
| DB-013 | Low | ✅ Code | `schema.sql` → `reset.sql` |
