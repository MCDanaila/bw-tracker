-- Helper: check if current user is coach of a given athlete
CREATE OR REPLACE FUNCTION public.is_coach_of(target_athlete_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_athletes
    WHERE coach_id = auth.uid()
      AND athlete_id = target_athlete_id
      AND status = 'active'
  );
$$;
