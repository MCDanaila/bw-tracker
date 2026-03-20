-- ============================================================
-- ATHLETE GOALS
-- Versioned goal tracking — one current (open-ended) goal per athlete.
-- ============================================================

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

-- Partial unique index: only one current goal per athlete
CREATE UNIQUE INDEX idx_athlete_goals_current
  ON athlete_goals (athlete_id)
  WHERE effective_until IS NULL;

-- RLS --
ALTER TABLE athlete_goals ENABLE ROW LEVEL SECURITY;

-- Athletes
CREATE POLICY "Athletes read own goals"
  ON athlete_goals FOR SELECT
  USING (athlete_id = auth.uid());

CREATE POLICY "Athletes set own goals"
  ON athlete_goals FOR INSERT
  WITH CHECK (athlete_id = auth.uid() AND set_by = auth.uid());

CREATE POLICY "Athletes update own goals"
  ON athlete_goals FOR UPDATE
  USING (athlete_id = auth.uid());

-- Coaches
CREATE POLICY "Coaches read athlete goals"
  ON athlete_goals FOR SELECT
  USING (public.is_coach_of(athlete_id));

CREATE POLICY "Coaches insert athlete goals"
  ON athlete_goals FOR INSERT
  WITH CHECK (public.is_coach_of(athlete_id) AND set_by = auth.uid());

CREATE POLICY "Coaches update athlete goals"
  ON athlete_goals FOR UPDATE
  USING (public.is_coach_of(athlete_id));

-- Indexes --
CREATE INDEX IF NOT EXISTS idx_athlete_goals_athlete_id
  ON athlete_goals(athlete_id);
