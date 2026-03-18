-- Migration: Create coach_athletes relationship table
-- Created: 2026-03-18

CREATE TABLE public.coach_athletes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'terminated')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  terminated_at TIMESTAMPTZ,
  UNIQUE(coach_id, athlete_id),
  CHECK (coach_id != athlete_id)
);

ALTER TABLE coach_athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches see their own relationships"
  ON coach_athletes FOR SELECT
  USING (coach_id = auth.uid() OR athlete_id = auth.uid());

CREATE POLICY "Coaches can manage relationships"
  ON coach_athletes FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());
