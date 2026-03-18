-- Migration: Add coach RLS policies to existing tables
-- Coaches can read their athletes' data and manage meal plans

-- Coaches can read their athletes' profiles
CREATE POLICY "Coaches can view athlete profiles"
  ON profiles FOR SELECT USING (public.is_coach_of(id));

-- Coaches can read (not write) their athletes' daily logs
CREATE POLICY "Coaches can view athlete daily logs"
  ON daily_logs FOR SELECT USING (public.is_coach_of(user_id));

-- Coaches can read athlete meal adherence
CREATE POLICY "Coaches can view athlete meal adherence"
  ON meal_adherence FOR SELECT USING (public.is_coach_of(user_id));

-- Coaches can CRUD meal plans for their athletes
CREATE POLICY "Coaches view athlete meal plans"
  ON meal_plans FOR SELECT USING (public.is_coach_of(user_id));
CREATE POLICY "Coaches create athlete meal plans"
  ON meal_plans FOR INSERT WITH CHECK (public.is_coach_of(user_id));
CREATE POLICY "Coaches update athlete meal plans"
  ON meal_plans FOR UPDATE USING (public.is_coach_of(user_id) AND created_by = auth.uid());
CREATE POLICY "Coaches delete athlete meal plans"
  ON meal_plans FOR DELETE USING (public.is_coach_of(user_id) AND created_by = auth.uid());
