-- Migration: Create athlete_goals table for versioned goal tracking

CREATE TABLE public.athlete_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  set_by UUID NOT NULL REFERENCES auth.users(id),
  target_weight NUMERIC(5,2),
  steps_goal INTEGER,
  water_goal NUMERIC(3,1),
  target_calories INTEGER,
  target_protein INTEGER,
  target_carbs INTEGER,
  target_fats INTEGER,
  phase TEXT CHECK (phase IN ('bulk', 'cut', 'maintenance', 'reverse_diet')),
  notes TEXT,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial unique index: only one current (open-ended) goal per athlete
CREATE UNIQUE INDEX idx_athlete_goals_current
  ON athlete_goals (athlete_id)
  WHERE effective_until IS NULL;

ALTER TABLE athlete_goals ENABLE ROW LEVEL SECURITY;

-- Athletes can read their own goals
CREATE POLICY "Athletes read own goals"
  ON athlete_goals FOR SELECT
  USING (athlete_id = auth.uid());

-- Coaches can read their athletes' goals
CREATE POLICY "Coaches read athlete goals"
  ON athlete_goals FOR SELECT
  USING (public.is_coach_of(athlete_id));

-- Coaches can insert goals for their athletes
CREATE POLICY "Coaches insert athlete goals"
  ON athlete_goals FOR INSERT
  WITH CHECK (public.is_coach_of(athlete_id) AND set_by = auth.uid());

-- Coaches can update goals for their athletes (to close previous goal)
CREATE POLICY "Coaches update athlete goals"
  ON athlete_goals FOR UPDATE
  USING (public.is_coach_of(athlete_id));

-- Athletes can set their own goals
CREATE POLICY "Athletes set own goals"
  ON athlete_goals FOR INSERT
  WITH CHECK (athlete_id = auth.uid() AND set_by = auth.uid());

CREATE POLICY "Athletes update own goals"
  ON athlete_goals FOR UPDATE
  USING (athlete_id = auth.uid());

-- Backfill existing profile goals
INSERT INTO athlete_goals (athlete_id, set_by, target_weight, steps_goal, water_goal, effective_from)
SELECT id, id, target_weight, steps_goal, water_goal, CURRENT_DATE
FROM profiles
WHERE target_weight IS NOT NULL OR steps_goal IS NOT NULL OR water_goal IS NOT NULL;
