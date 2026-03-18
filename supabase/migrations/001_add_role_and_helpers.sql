-- Migration: Add role column and helper functions for coach/athlete system
-- Created: 2026-03-18

-- 1. Add role column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'athlete'
  CHECK (role IN ('athlete', 'coach'));

-- 2. Helper function: get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    (SELECT role FROM public.profiles WHERE id = auth.uid())
  );
$$;

-- 3. Helper function: check if current user is coach of a given athlete
CREATE OR REPLACE FUNCTION public.is_coach_of(target_athlete_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_athletes
    WHERE coach_id = auth.uid()
      AND athlete_id = target_athlete_id
      AND status = 'active'
  );
$$;

-- 4. Prevent role self-escalation via client
CREATE POLICY "Users cannot change their own role"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()))
  );
