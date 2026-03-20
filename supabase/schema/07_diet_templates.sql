-- ============================================================
-- DIET TEMPLATES & ITEMS
-- Reusable diet blueprints created by coaches.
-- ============================================================

CREATE TABLE diet_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE diet_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES diet_templates(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL
    CHECK (day_of_week IN ('LUN','MAR','MER','GIO','VEN','SAB','DOM')),
  meal_name TEXT NOT NULL,
  food_id TEXT REFERENCES foods(id),
  target_quantity NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS --
ALTER TABLE diet_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own templates"
  ON diet_templates FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can manage own template items"
  ON diet_template_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diet_templates dt
      WHERE dt.id = diet_template_items.template_id
        AND dt.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diet_templates dt
      WHERE dt.id = diet_template_items.template_id
        AND dt.coach_id = auth.uid()
    )
  );

-- Indexes --
CREATE INDEX idx_diet_templates_coach
  ON diet_templates(coach_id);
CREATE INDEX idx_diet_template_items_template
  ON diet_template_items(template_id);
CREATE INDEX idx_diet_template_items_food
  ON diet_template_items(food_id);
