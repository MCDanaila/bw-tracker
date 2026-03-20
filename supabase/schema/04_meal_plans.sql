-- ============================================================
-- MEAL PLANS (Piano Alimentare)
-- The assigned diet for each user, optionally created by a coach
-- from a diet template.
-- ============================================================

CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL
    CHECK (day_of_week IN ('LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM')),
  meal_name TEXT NOT NULL,
  food_id TEXT REFERENCES foods(id) ON DELETE SET NULL,
  target_quantity NUMERIC NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  template_id UUID REFERENCES diet_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS --
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own meal plans"
  ON meal_plans FOR ALL
  USING (auth.uid() = user_id);

-- Coach policies --
CREATE POLICY "Coaches view athlete meal plans"
  ON meal_plans FOR SELECT
  USING (public.is_coach_of(user_id));

CREATE POLICY "Coaches create athlete meal plans"
  ON meal_plans FOR INSERT
  WITH CHECK (public.is_coach_of(user_id));

CREATE POLICY "Coaches update athlete meal plans"
  ON meal_plans FOR UPDATE
  USING (public.is_coach_of(user_id) AND created_by = auth.uid());

CREATE POLICY "Coaches delete athlete meal plans"
  ON meal_plans FOR DELETE
  USING (public.is_coach_of(user_id) AND created_by = auth.uid());

-- Indexes --
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id
  ON meal_plans(user_id);
