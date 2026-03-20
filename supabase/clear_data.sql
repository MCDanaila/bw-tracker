-- ============================================================
-- CLEAR ALL APPLICATION DATA
-- Deletes rows from all tables while preserving the schema.
-- Use this before re-running seed.sql.
-- ============================================================

-- TRUNCATE with CASCADE handles foreign key dependencies automatically.
-- We restart identity if there are any serial/identity columns.

TRUNCATE TABLE 
  public.meal_adherence,
  public.meal_plans,
  public.daily_logs,
  public.coach_athletes,
  public.diet_template_items,
  public.diet_templates,
  public.athlete_goals,
  public.foods,
  public.profiles
RESTART IDENTITY CASCADE;

-- Optional: If TRUNCATE CASCADE is not preferred, use DELETE in reverse dependency order:
/*
DELETE FROM public.meal_adherence;
DELETE FROM public.meal_plans;
DELETE FROM public.daily_logs;
DELETE FROM public.coach_athletes;
DELETE FROM public.diet_template_items;
DELETE FROM public.diet_templates;
DELETE FROM public.athlete_goals;
DELETE FROM public.foods;
DELETE FROM public.profiles;
*/

-- Verification notice:
DO $$
BEGIN
  RAISE NOTICE '✅ All application data cleared successfully.';
END $$;
