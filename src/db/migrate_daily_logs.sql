-- Migration: Add missing columns to daily_logs
-- Safe to run multiple times — IF NOT EXISTS is a no-op if the column already exists.
-- Run this in the Supabase SQL Editor.

ALTER TABLE daily_logs
    ADD COLUMN IF NOT EXISTS sleep_score     NUMERIC CHECK (sleep_score >= 0 AND sleep_score <= 100),
    ADD COLUMN IF NOT EXISTS steps_goal      INTEGER,
    ADD COLUMN IF NOT EXISTS soreness_level  NUMERIC CHECK (soreness_level >= 1 AND soreness_level <= 10),
    ADD COLUMN IF NOT EXISTS diet_adherence  TEXT CHECK (diet_adherence IN ('perfect', 'minor_deviation', 'cheat_meal')),
    ADD COLUMN IF NOT EXISTS digestion_comments TEXT,
    ADD COLUMN IF NOT EXISTS hunger_level    NUMERIC CHECK (hunger_level >= 1 AND hunger_level <= 10),
    ADD COLUMN IF NOT EXISTS libido          NUMERIC CHECK (libido >= 1 AND libido <= 10),
    ADD COLUMN IF NOT EXISTS cycle_day       INTEGER CHECK (cycle_day >= 1 AND cycle_day <= 50),
    ADD COLUMN IF NOT EXISTS blood_glucose   NUMERIC,
    ADD COLUMN IF NOT EXISTS sys_bp          INTEGER,
    ADD COLUMN IF NOT EXISTS dia_bp          INTEGER;
