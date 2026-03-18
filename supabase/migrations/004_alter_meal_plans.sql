-- P2-T02: Add created_by and template_id columns to meal_plans

ALTER TABLE meal_plans
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES diet_templates(id) ON DELETE SET NULL;

-- Backfill existing rows: created_by = user_id
UPDATE meal_plans SET created_by = user_id WHERE created_by IS NULL;
