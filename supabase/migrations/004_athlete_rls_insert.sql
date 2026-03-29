-- Migration: 004_athlete_rls_insert.sql
-- Allows athletes to create their own athlete_preferences row.
-- Required for ProfileView upsert when no preferences row exists yet
-- (affects users created before the new registration flow).

DROP POLICY IF EXISTS "Athletes insert own preferences" ON athlete_preferences;
CREATE POLICY "Athletes insert own preferences"
  ON athlete_preferences FOR INSERT
  WITH CHECK (athlete_id = auth.uid() AND set_by = auth.uid());
