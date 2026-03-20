-- ============================================================
-- PROFILES
-- One row per auth.users entry, auto-created via trigger.
-- ============================================================

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  gender TEXT,                -- 'male', 'female', 'other'
  height NUMERIC,             -- cm or inches
  initial_weight NUMERIC,     -- kg or lbs
  target_weight NUMERIC,
  age INTEGER,
  activity_level TEXT,        -- 'sedentary', 'lightly_active', 'moderately_active', 'very_active'
  goal TEXT,                  -- 'lose_fat', 'build_muscle', 'maintain_weight'
  unit_system TEXT DEFAULT 'metric',
  steps_goal INTEGER DEFAULT 10000,
  water_goal NUMERIC DEFAULT 4.0,
  salt_goal NUMERIC DEFAULT 6.0,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'athlete'
    CONSTRAINT profiles_role_check CHECK (role IN ('athlete', 'self_coached', 'coach')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

COMMENT ON COLUMN profiles.role
  IS 'User role: athlete (logs only), self_coached (logs + dashboard + goals), coach (manage multiple athletes)';

-- RLS --
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Coaches can view profiles of their athletes"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_athletes
      WHERE coach_id = auth.uid()
        AND athlete_id = public.profiles.id
    )
  );

-- Prevent role self-escalation
CREATE POLICY "Users cannot change their own role"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()))
  );

-- Auto-create profile on signup --
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, created_at, updated_at)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email,
    now(),
    now()
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
