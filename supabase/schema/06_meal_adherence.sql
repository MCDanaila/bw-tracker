-- ============================================================
-- MEAL ADHERENCE (Meal Check-offs)
-- Tracks which meals were eaten on which day.
-- ============================================================

CREATE TABLE meal_adherence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT FALSE,
  swapped_food_id TEXT REFERENCES foods(id) ON DELETE SET NULL,
  swapped_quantity NUMERIC,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One adherence record per meal per day (crucial for offline upserts)
  UNIQUE(user_id, date, meal_plan_id)
);

-- RLS --
ALTER TABLE meal_adherence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own adherence logs"
  ON meal_adherence FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view athlete meal adherence"
  ON meal_adherence FOR SELECT
  USING (public.is_coach_of(user_id));

-- Indexes --
CREATE INDEX IF NOT EXISTS idx_meal_adherence_user_date
  ON meal_adherence(user_id, date);
