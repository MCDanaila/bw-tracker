-- Get recent daily logs for a set of athletes (last N days)
CREATE OR REPLACE FUNCTION get_recent_logs_for_athletes(
  athlete_ids uuid[],
  days_back int DEFAULT 7
)
RETURNS TABLE (LIKE daily_logs)
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY date DESC) AS rn
    FROM daily_logs
    WHERE user_id = ANY(athlete_ids)
      AND date >= (CURRENT_DATE - days_back)
  ) ranked
  WHERE rn <= days_back;
$$;
