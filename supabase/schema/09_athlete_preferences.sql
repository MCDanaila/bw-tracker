-- ============================================================
-- ATHLETE PREFERENCES
-- Dietary and lifestyle preferences for AI-powered suggestions
-- Separate from profiles to support RAG context in meal planning
-- ============================================================

CREATE TABLE public.athlete_preferences (
  athlete_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  set_by UUID NOT NULL REFERENCES auth.users(id),
  allergies TEXT[] NOT NULL DEFAULT '{}',
  intolerances TEXT[] NOT NULL DEFAULT '{}',
  dietary_restrictions TEXT[] NOT NULL DEFAULT '{}',
  food_dislikes TEXT[] NOT NULL DEFAULT '{}',
  food_preferences TEXT[] NOT NULL DEFAULT '{}',
  cuisine_preferences TEXT[] NOT NULL DEFAULT '{}',
  meal_timing_notes TEXT,
  supplement_use TEXT[] NOT NULL DEFAULT '{}',
  digestion_issues TEXT,
  cooking_skill TEXT CHECK (cooking_skill IN ('none', 'basic', 'intermediate', 'advanced')),
  meal_prep_time TEXT CHECK (meal_prep_time IN ('minimal', 'moderate', 'flexible')),
  budget_level TEXT CHECK (budget_level IN ('budget', 'moderate', 'premium')),
  additional_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS --
ALTER TABLE athlete_preferences ENABLE ROW LEVEL SECURITY;

-- Athletes
CREATE POLICY "Athletes read own preferences"
  ON athlete_preferences FOR SELECT
  USING (athlete_id = auth.uid());

CREATE POLICY "Athletes update own preferences"
  ON athlete_preferences FOR UPDATE
  USING (athlete_id = auth.uid());

-- Coaches
CREATE POLICY "Coaches read athlete preferences"
  ON athlete_preferences FOR SELECT
  USING (public.is_coach_of(athlete_id));

CREATE POLICY "Coaches insert athlete preferences"
  ON athlete_preferences FOR INSERT
  WITH CHECK (public.is_coach_of(athlete_id) AND set_by = auth.uid());

CREATE POLICY "Coaches update athlete preferences"
  ON athlete_preferences FOR UPDATE
  USING (public.is_coach_of(athlete_id));

-- Service role (for Edge Functions)
CREATE POLICY "Service role can query preferences"
  ON athlete_preferences FOR SELECT
  USING (auth.role() = 'service_role');

-- Indexes --
CREATE INDEX IF NOT EXISTS idx_athlete_preferences_set_by
  ON athlete_preferences(set_by);
