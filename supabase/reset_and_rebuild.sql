-- ============================================================
-- DANGER: Full database reset — DEVELOPMENT ONLY.
-- Drops ALL app tables, functions, and triggers, then recreates
-- everything from the modular schema/ and functions/ files.
--
-- Usage:  psql "$DATABASE_URL" -f supabase/reset_and_rebuild.sql
-- ============================================================

BEGIN;

-- ============================================================
-- PHASE 1: DROP everything (reverse dependency order)
-- ============================================================

-- Tables (children first → parents last)
DROP TABLE IF EXISTS meal_adherence        CASCADE;
DROP TABLE IF EXISTS athlete_goals         CASCADE;
DROP TABLE IF EXISTS diet_template_items   CASCADE;
DROP TABLE IF EXISTS diet_templates        CASCADE;
DROP TABLE IF EXISTS daily_logs            CASCADE;
DROP TABLE IF EXISTS meal_plans            CASCADE;
DROP TABLE IF EXISTS coach_athletes        CASCADE;
DROP TABLE IF EXISTS foods                 CASCADE;
DROP TABLE IF EXISTS profiles              CASCADE;

-- Functions
DROP FUNCTION IF EXISTS public.get_my_role()                              CASCADE;
DROP FUNCTION IF EXISTS public.is_coach_of(UUID)                          CASCADE;
DROP FUNCTION IF EXISTS public.get_latest_logs_for_athletes(UUID[])       CASCADE;
DROP FUNCTION IF EXISTS public.get_recent_logs_for_athletes(UUID[], INT)  CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user()                          CASCADE;

-- Trigger (dropped with the function above, but be explicit)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

COMMIT;

-- ============================================================
-- PHASE 2: Recreate extensions
-- ============================================================
\i schema/00_extensions.sql

-- ============================================================
-- PHASE 3: Recreate tables (dependency order)
-- ============================================================
\i schema/01_profiles.sql
\i schema/02_foods.sql
\i schema/03_coach_athletes.sql

-- Functions needed by later table policies (is_coach_of, get_my_role)
\i functions/get_my_role.sql
\i functions/is_coach_of.sql

\i schema/07_diet_templates.sql
\i schema/04_meal_plans.sql
\i schema/05_daily_logs.sql
\i schema/06_meal_adherence.sql
\i schema/08_athlete_goals.sql

-- ============================================================
-- PHASE 4: Recreate remaining functions
-- ============================================================
\i functions/get_latest_logs_for_athletes.sql
\i functions/get_recent_logs_for_athletes.sql

-- ============================================================
-- Done!
-- ============================================================
\echo ''
\echo '✅  Database reset complete. All tables, policies, indexes, and functions recreated.'
\echo ''
