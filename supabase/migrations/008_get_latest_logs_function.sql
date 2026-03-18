-- Migration: Create function to get latest daily log for each athlete
-- Used by coach roster to avoid N+1 queries

CREATE OR REPLACE FUNCTION public.get_latest_logs_for_athletes(athlete_ids UUID[])
RETURNS TABLE (
  user_id UUID,
  date DATE,
  weight_fasting NUMERIC,
  steps INTEGER,
  water_liters NUMERIC,
  diet_adherence TEXT,
  sleep_quality INTEGER,
  daily_energy INTEGER
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT DISTINCT ON (dl.user_id)
    dl.user_id,
    dl.date,
    dl.weight_fasting,
    dl.steps,
    dl.water_liters,
    dl.diet_adherence,
    dl.sleep_quality,
    dl.daily_energy
  FROM daily_logs dl
  WHERE dl.user_id = ANY(athlete_ids)
    AND public.is_coach_of(dl.user_id)
  ORDER BY dl.user_id, dl.date DESC;
$$;
