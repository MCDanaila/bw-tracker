-- Migration: 003_onboarding.sql
-- Adds plan/onboarding columns, athlete_preferences columns, one-active-coach
-- constraint, invitations table with RLS, and DOB→age recompute trigger.

-- ============================================================
-- 1. profiles table additions
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'self_coached'
    CHECK (plan IN ('self_coached', 'self_coached_ai', 'coach', 'coach_pro')),
  ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dob DATE,
  ADD COLUMN IF NOT EXISTS goal_rate TEXT NOT NULL DEFAULT 'moderate'
    CHECK (goal_rate IN ('conservative', 'moderate', 'aggressive')),
  ADD COLUMN IF NOT EXISTS gym_days_per_week INTEGER
    CHECK (gym_days_per_week BETWEEN 0 AND 7);

-- ============================================================
-- 2. athlete_preferences additions
-- ============================================================

ALTER TABLE athlete_preferences
  ADD COLUMN IF NOT EXISTS diet_framework TEXT NOT NULL DEFAULT 'omnivore'
    CHECK (diet_framework IN ('omnivore', 'pescatarian', 'vegetarian', 'vegan')),
  ADD COLUMN IF NOT EXISTS meal_frequency INTEGER NOT NULL DEFAULT 3
    CHECK (meal_frequency BETWEEN 2 AND 6);

-- ============================================================
-- 3. One-active-coach constraint per athlete
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_coach_per_athlete
  ON coach_athletes (athlete_id)
  WHERE status = 'active';

-- ============================================================
-- 4. Invitations table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.invitations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  token         UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches manage own invitations" ON invitations;
CREATE POLICY "Coaches manage own invitations"
  ON invitations FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_coach ON invitations(coach_id, status);

-- ============================================================
-- 5. DOB→age recompute trigger
-- ============================================================

-- Function to recompute age from dob
CREATE OR REPLACE FUNCTION recompute_age()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.dob IS NOT NULL THEN
    NEW.age := EXTRACT(year FROM age(NEW.dob))::integer;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on profiles insert/update
DROP TRIGGER IF EXISTS trg_recompute_age ON profiles;
CREATE TRIGGER trg_recompute_age
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION recompute_age();

-- ============================================================
-- 6. pg_cron expiry job (must be run manually in Supabase dashboard)
-- ============================================================

-- Run daily via Supabase pg_cron (enable extension first if not enabled):
-- SELECT cron.schedule('expire-invitations', '0 0 * * *',
--   $$UPDATE invitations SET status = 'expired' WHERE status = 'pending' AND expires_at < NOW()$$);
