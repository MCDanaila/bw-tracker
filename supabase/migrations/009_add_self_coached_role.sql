-- Migration: Add 'self_coached' role to support self-coaching athletes
-- Created: 2026-03-18
-- Purpose: Allow athletes to access dashboard and coach features for their own account

-- 1. Update the role CHECK constraint to include 'self_coached'
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check,
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('athlete', 'self_coached', 'coach'));

-- 2. Update the get_my_role() function documentation (no code change needed, already returns role as-is)
-- The function already supports any role value including 'self_coached'

-- 3. Add a comment documenting the role values
COMMENT ON COLUMN profiles.role IS 'User role: athlete (logs only), self_coached (logs + dashboard + goals), coach (manage multiple athletes)';
