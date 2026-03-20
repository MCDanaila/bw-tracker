-- ============================================================
-- DAILY LOGS (Tracker Giornaliero)
-- Daily biometrics and metrics, one row per user per day.
-- ============================================================

CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Morning Metrics
  weight_fasting NUMERIC,
  measurement_time TEXT,
  sleep_hours NUMERIC,
  sleep_quality NUMERIC,
  hrv NUMERIC,
  sleep_score NUMERIC,

  -- Activity
  steps INTEGER,
  steps_goal INTEGER,
  active_kcal INTEGER,
  cardio_hiit_mins INTEGER,
  cardio_liss_mins INTEGER,
  workout_session TEXT,
  workout_start_time TEXT,
  workout_duration INTEGER,
  gym_rpe NUMERIC,
  gym_energy NUMERIC,
  gym_mood NUMERIC,
  soreness_level NUMERIC,

  -- Evening / End of Day & Biofeedback
  water_liters NUMERIC,
  salt_grams NUMERIC,
  diet_adherence TEXT,
  digestion_rating INTEGER,
  digestion_comments TEXT,
  bathroom_visits INTEGER,
  stress_level NUMERIC,
  daily_energy NUMERIC,
  hunger_level NUMERIC,
  libido NUMERIC,
  mood NUMERIC,
  cycle_day INTEGER,

  -- Weekly Check-ins (Optional)
  blood_glucose NUMERIC,
  sys_bp INTEGER,
  dia_bp INTEGER,
  general_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One log per user per day (crucial for offline upserts)
  UNIQUE(user_id, date)
);

-- RLS --
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own daily logs"
  ON daily_logs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view athlete daily logs"
  ON daily_logs FOR SELECT
  USING (public.is_coach_of(user_id));
