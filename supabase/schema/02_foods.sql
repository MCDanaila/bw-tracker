-- ============================================================
-- FOODS (Lista Alimenti)
-- Global database of foods. Read-only for athletes, editable by coaches.
-- ============================================================

CREATE TABLE foods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  portion_size NUMERIC NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('g', 'ml', 'caps', 'compr', 'piece')),
  calories NUMERIC NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fats NUMERIC NOT NULL,
  state TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS --
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Foods are viewable by everyone"
  ON foods FOR SELECT USING (true);

CREATE POLICY "Coaches can manage foods"
  ON foods FOR ALL
  USING (public.get_my_role() = 'coach')
  WITH CHECK (public.get_my_role() = 'coach');

-- Indexes --
CREATE INDEX IF NOT EXISTS idx_foods_name_trgm
  ON foods USING gin(name gin_trgm_ops);
