-- ============================================================
-- BW-TRACKER SEED DATA
-- Realistic seed for a single Italian male athlete.
--
-- ⚠️  IMPORTANT: Replace every occurrence of
--     '00000000-0000-0000-0000-000000000001'
--     with your actual Supabase auth.users id BEFORE running.
--
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- The auth user must already exist (sign up first, then seed).
-- ============================================================

--\set USER_ID '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'

-- ============================================================
-- 1. PROFILE
-- ============================================================

INSERT INTO public.profiles (
  id, username, email, gender, age, unit_system,
  height, initial_weight, target_weight,
  activity_level, goal,
  steps_goal, water_goal, salt_goal,
  role,
  created_at, updated_at
) VALUES (
  '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d',
  'marco_atletico',
  'skymik7@gmail.com',
  'male',
  28,
  'metric',
  180,
  82,
  76,
  'moderately_active',
  'lose_fat',
  10000,
  3.5,
  5.0,
  'self_coached',
  NOW(),
  NOW()
),
(
  'f119519c-d96b-496f-89a2-4690406cd2ea', -- COACH
  'coach_tattie',
  'elena@gmail.com',
  'female',
  36,
  'metric',
  165,
  60,
  58,
  'very_active',
  'maintain_weight',
  12000,
  3.0,
  4.5,
  'coach',
  NOW(),
  NOW()
),
(
  'e56b40c0-6d45-41f9-8526-73c5db57f3d5', -- ATHLETE 2
  'ale_pwr',
  'at1@gmail.com',
  'male',
  24,
  'metric',
  175,
  85,
  90,
  'very_active',
  'build_muscle',
  10000,
  4.0,
  75.0, -- wait, previous was 6.0? line 75 was salt_goal. wait, salt_goal 6.0
  'athlete',
  NOW(),
  NOW()
),
(
  '78ccb3b9-f2a8-4fc0-8164-4f5541710594', -- ATHLETE 3
  'giulia_fit',
  'at2@gmail.com',
  'female',
  26,
  'metric',
  160,
  55,
  52,
  'lightly_active',
  'lose_fat',
  8000,
  2.5,
  4.0,
  'athlete',
  NOW(),
  NOW()
),
(
  '3b8f612d-1dbf-4d3e-a7fd-473495c1ff17', -- SELF-COACHED
  'nino_pro',
  'micheledanaila@gmail.com',
  'male',
  31,
  'metric',
  185,
  95,
  88,
  'moderately_active',
  'lose_fat',
  10000,
  3.5,
  5.0,
  'self_coached',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  username       = EXCLUDED.username,
  email          = EXCLUDED.email,
  gender         = EXCLUDED.gender,
  age            = EXCLUDED.age,
  unit_system    = EXCLUDED.unit_system,
  height         = EXCLUDED.height,
  initial_weight = EXCLUDED.initial_weight,
  target_weight  = EXCLUDED.target_weight,
  activity_level = EXCLUDED.activity_level,
  goal           = EXCLUDED.goal,
  steps_goal     = EXCLUDED.steps_goal,
  water_goal     = EXCLUDED.water_goal,
  salt_goal      = EXCLUDED.salt_goal,
  role           = EXCLUDED.role,
  updated_at     = NOW();


-- ============================================================
-- 1b. COACH-ATHLETE LINKS
-- ============================================================

INSERT INTO public.coach_athletes (coach_id, athlete_id, status) VALUES
  ('f119519c-d96b-496f-89a2-4690406cd2ea', 'e56b40c0-6d45-41f9-8526-73c5db57f3d5', 'active'),
  ('f119519c-d96b-496f-89a2-4690406cd2ea', '78ccb3b9-f2a8-4fc0-8164-4f5541710594', 'active')
ON CONFLICT (coach_id, athlete_id) DO NOTHING;


-- ============================================================
-- 2. FOODS (25 common Italian/fitness foods)
--    Per-100g macros unless otherwise noted.
--    created_by is set to the athlete for self-tracked foods.
-- ============================================================

INSERT INTO foods (id, name, portion_size, unit, calories, protein, carbs, fats, state, created_by) VALUES
  ('petto_pollo',          'Petto di Pollo',               100, 'g', 165,  31.0,  0.0,  3.6, 'Peso da Crudo',        '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('riso_basmati',         'Riso Basmati',                 100, 'g', 350,   7.0, 78.0,  0.7, 'Peso da Crudo',        '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('pasta_integrale',      'Pasta Integrale',              100, 'g', 337,  13.0, 65.0,  2.5, 'Peso da Crudo',        '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('uova_intere',          'Uova Intere',                  100, 'g', 155,  13.0,  1.1, 11.0, 'N/A',                  '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('albumi',               'Albumi d''uovo',               100, 'g',  52,  11.0,  0.7,  0.2, 'N/A',                  '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('tonno_sgocciolato',    'Tonno al Naturale',            100, 'g', 116,  25.5,  0.0,  1.0, 'Peso sgocciolato',     '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('salmone',              'Salmone Fresco',               100, 'g', 208,  20.0,  0.0, 13.6, 'Peso da Crudo',        '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('olio_oliva',           'Olio Extra Vergine di Oliva',  100, 'g', 884,   0.0,  0.0, 99.9, 'N/A',                  '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('fiocchi_avena',        'Fiocchi d''Avena',             100, 'g', 379,  13.0, 66.0,  7.0, 'Peso da Crudo',        '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('patate',               'Patate',                       100, 'g',  77,   2.0, 17.0,  0.1, 'Peso da Crudo',        '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('pane_integrale',       'Pane Integrale',               100, 'g', 247,   9.5, 44.0,  3.5, 'Peso confezionato',    '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('ricotta_magra',        'Ricotta Magra',                100, 'g', 136,  11.0,  4.0,  8.0, 'N/A',                  '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('yogurt_greco_0',       'Yogurt Greco 0%',              100, 'g',  57,  10.0,  3.6,  0.1, 'N/A',                  '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('lenticchie',           'Lenticchie',                   100, 'g', 340,  24.0, 57.0,  1.1, 'Peso da Crudo',        '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('spinaci',              'Spinaci',                      100, 'g',  23,   2.9,  1.4,  0.4, 'Peso da Crudo',        '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('broccoli',             'Broccoli',                     100, 'g',  34,   2.8,  6.6,  0.4, 'Peso da Crudo',        '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('zucchine',             'Zucchine',                     100, 'g',  17,   1.2,  3.1,  0.2, 'Peso da Crudo',        '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('mozzarella_light',     'Mozzarella Light',             100, 'g', 188,  18.0,  1.0, 12.0, 'N/A',                  '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('pancetta_cotta',       'Pancetta Cotta',               100, 'g', 215,  15.0,  1.5, 17.0, 'Peso confezionato',    '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('mandorle',             'Mandorle',                     100, 'g', 579,  21.1, 22.0, 49.9, 'Peso da sgusciato',    '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('banana',               'Banana',                       100, 'g',  89,   1.1, 22.8,  0.3, 'Peso da sgusciato',    '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('mela',                 'Mela',                         100, 'g',  52,   0.3, 14.0,  0.2, 'Peso da sgusciato',    '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('whey_protein',         'Whey Protein (vaniglia)',      100, 'g', 385,  78.0, 10.0,  5.0, 'Peso confezionato',    '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('creatina',             'Creatina Monoidrato',            5, 'g',   0,   0.0,  0.0,  0.0, 'Peso confezionato',    '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d'),
  ('latte_parziale',       'Latte Parzialmente Scremato',  100, 'ml',  46,   3.5,  5.0,  1.5, 'N/A',                 '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d')
ON CONFLICT (id) DO UPDATE SET
  name          = EXCLUDED.name,
  portion_size  = EXCLUDED.portion_size,
  unit          = EXCLUDED.unit,
  calories      = EXCLUDED.calories,
  protein       = EXCLUDED.protein,
  carbs         = EXCLUDED.carbs,
  fats          = EXCLUDED.fats,
  state         = EXCLUDED.state;


-- ============================================================
-- 1c. DIET TEMPLATES (Created by Coach Tattie)
-- ============================================================

INSERT INTO public.diet_templates (id, coach_id, name, description, is_active) VALUES
  ('20000000-0000-0000-0000-000000000001', 'f119519c-d96b-496f-89a2-4690406cd2ea', 'Bulk Massa Pulita', 'Template per fase di ipertrofia controllata, ~3200 kcal.', true),
  ('20000000-0000-0000-0000-000000000002', 'f119519c-d96b-496f-89a2-4690406cd2ea', 'Cut Definizione Estiva', 'Template per fase di cut, focus protein high, ~2000 kcal.', true)
ON CONFLICT (id) DO NOTHING;

-- Generic template items for Bulk Massa Pulita (MON example)
INSERT INTO public.diet_template_items (template_id, day_of_week, meal_name, food_id, target_quantity, sort_order) VALUES
  ('20000000-0000-0000-0000-000000000001', 'MON', 'MEAL 1 (PRE)', 'fiocchi_avena',  100, 1),
  ('20000000-0000-0000-0000-000000000001', 'MON', 'MEAL 1 (PRE)', 'whey_protein',   30, 2),
  ('20000000-0000-0000-0000-000000000001', 'MON', 'MEAL 2',       'riso_basmati',  120, 3),
  ('20000000-0000-0000-0000-000000000001', 'MON', 'MEAL 2',       'petto_pollo',   200, 4),
  ('20000000-0000-0000-0000-000000000001', 'MON', 'MEAL 3 (POST)', 'banana',        120, 5),
  ('20000000-0000-0000-0000-000000000001', 'MON', 'MEAL 4',       'pasta_integrale',120, 6)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 3. MEAL PLANS  (7 days × 5 meals)
--    Macro targets (cut):  ~2200 kcal, 185g P, 220g C, 65g F
--    Days: MON TUE WED THU FRI SAT SUN
--    Meals: MEAL 1 (PRE) | MEAL 2 | MEAL 3 | MEAL 4 | MEAL 5
--
--    Training days (MON/TUE/WED/THU/FRI): higher carb
--    Rest days (SAT/SUN): lower carb
-- ============================================================

-- We use deterministic UUIDs so adherence records can reference them reliably.
-- Format: meal_plan_<day>_<meal> as a comment only; actual UUID is generated below.

DO $$
DECLARE
  uid UUID := '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d';
BEGIN

-- ── MONEDÌ (Training — Push) ───────────────────────────────
INSERT INTO meal_plans (id, user_id, day_of_week, meal_name, food_id, target_quantity, created_by) VALUES
  ('10000001-0000-0000-0000-000000000001', uid, 'MON', 'MEAL 1 (PRE)', 'fiocchi_avena',      80,  uid),
  ('10000001-0000-0000-0000-000000000002', uid, 'MON', 'MEAL 1 (PRE)', 'albumi',            150,  uid),
  ('10000001-0000-0000-0000-000000000003', uid, 'MON', 'MEAL 1 (PRE)', 'banana',            100,  uid),
  ('10000001-0000-0000-0000-000000000004', uid, 'MON', 'MEAL 2',       'petto_pollo',       180,  uid),
  ('10000001-0000-0000-0000-000000000005', uid, 'MON', 'MEAL 2',       'riso_basmati',      100,  uid),
  ('10000001-0000-0000-0000-000000000006', uid, 'MON', 'MEAL 2',       'spinaci',           150,  uid),
  ('10000001-0000-0000-0000-000000000007', uid, 'MON', 'MEAL 3 (POST)','whey_protein',       40,  uid),
  ('10000001-0000-0000-0000-000000000008', uid, 'MON', 'MEAL 3 (POST)','banana',             80,  uid),
  ('10000001-0000-0000-0000-000000000009', uid, 'MON', 'MEAL 4',       'petto_pollo',       180,  uid),
  ('10000001-0000-0000-0000-000000000010', uid, 'MON', 'MEAL 4',       'patate',            200,  uid),
  ('10000001-0000-0000-0000-000000000011', uid, 'MON', 'MEAL 4',       'broccoli',          200,  uid),
  ('10000001-0000-0000-0000-000000000012', uid, 'MON', 'MEAL 4',       'olio_oliva',         10,  uid),
  ('10000001-0000-0000-0000-000000000013', uid, 'MON', 'MEAL 5 (SERA)','tonno_sgocciolato', 160,  uid),
  ('10000001-0000-0000-0000-000000000014', uid, 'MON', 'MEAL 5 (SERA)','yogurt_greco_0',    150,  uid),
  ('10000001-0000-0000-0000-000000000015', uid, 'MON', 'MEAL 5 (SERA)','mandorle',           20,  uid)
ON CONFLICT (id) DO UPDATE SET target_quantity = EXCLUDED.target_quantity;

-- ── MARTEDÌ (Training — Pull) ──────────────────────────────
INSERT INTO meal_plans (id, user_id, day_of_week, meal_name, food_id, target_quantity, created_by) VALUES
  ('10000002-0000-0000-0000-000000000001', uid, 'TUE', 'MEAL 1 (PRE)', 'fiocchi_avena',      80,  uid),
  ('10000002-0000-0000-0000-000000000002', uid, 'TUE', 'MEAL 1 (PRE)', 'uova_intere',       150,  uid),
  ('10000002-0000-0000-0000-000000000003', uid, 'TUE', 'MEAL 1 (PRE)', 'pane_integrale',     60,  uid),
  ('10000002-0000-0000-0000-000000000004', uid, 'TUE', 'MEAL 2',       'tonno_sgocciolato', 160,  uid),
  ('10000002-0000-0000-0000-000000000005', uid, 'TUE', 'MEAL 2',       'pasta_integrale',   100,  uid),
  ('10000002-0000-0000-0000-000000000006', uid, 'TUE', 'MEAL 2',       'zucchine',          150,  uid),
  ('10000002-0000-0000-0000-000000000007', uid, 'TUE', 'MEAL 3 (POST)','whey_protein',       40,  uid),
  ('10000002-0000-0000-0000-000000000008', uid, 'TUE', 'MEAL 3 (POST)','latte_parziale',    200,  uid),
  ('10000002-0000-0000-0000-000000000009', uid, 'TUE', 'MEAL 4',       'salmone',           180,  uid),
  ('10000002-0000-0000-0000-000000000010', uid, 'TUE', 'MEAL 4',       'riso_basmati',       80,  uid),
  ('10000002-0000-0000-0000-000000000011', uid, 'TUE', 'MEAL 4',       'spinaci',           150,  uid),
  ('10000002-0000-0000-0000-000000000012', uid, 'TUE', 'MEAL 4',       'olio_oliva',         10,  uid),
  ('10000002-0000-0000-0000-000000000013', uid, 'TUE', 'MEAL 5 (SERA)','ricotta_magra',     200,  uid),
  ('10000002-0000-0000-0000-000000000014', uid, 'TUE', 'MEAL 5 (SERA)','mandorle',           20,  uid),
  ('10000002-0000-0000-0000-000000000015', uid, 'TUE', 'MEAL 5 (SERA)','mela',              150,  uid)
ON CONFLICT (id) DO UPDATE SET target_quantity = EXCLUDED.target_quantity;

-- ── MERCOLEDÌ (Training — Legs) ────────────────────────────
INSERT INTO meal_plans (id, user_id, day_of_week, meal_name, food_id, target_quantity, created_by) VALUES
  ('10000003-0000-0000-0000-000000000001', uid, 'WED', 'MEAL 1 (PRE)', 'fiocchi_avena',      90,  uid),
  ('10000003-0000-0000-0000-000000000002', uid, 'WED', 'MEAL 1 (PRE)', 'albumi',            200,  uid),
  ('10000003-0000-0000-0000-000000000003', uid, 'WED', 'MEAL 1 (PRE)', 'banana',            100,  uid),
  ('10000003-0000-0000-0000-000000000004', uid, 'WED', 'MEAL 2',       'petto_pollo',       200,  uid),
  ('10000003-0000-0000-0000-000000000005', uid, 'WED', 'MEAL 2',       'riso_basmati',      110,  uid),
  ('10000003-0000-0000-0000-000000000006', uid, 'WED', 'MEAL 2',       'broccoli',          200,  uid),
  ('10000003-0000-0000-0000-000000000007', uid, 'WED', 'MEAL 3 (POST)','whey_protein',       40,  uid),
  ('10000003-0000-0000-0000-000000000008', uid, 'WED', 'MEAL 3 (POST)','banana',            100,  uid),
  ('10000003-0000-0000-0000-000000000009', uid, 'WED', 'MEAL 4',       'petto_pollo',       180,  uid),
  ('10000003-0000-0000-0000-000000000010', uid, 'WED', 'MEAL 4',       'patate',            250,  uid),
  ('10000003-0000-0000-0000-000000000011', uid, 'WED', 'MEAL 4',       'zucchine',          150,  uid),
  ('10000003-0000-0000-0000-000000000012', uid, 'WED', 'MEAL 4',       'olio_oliva',         10,  uid),
  ('10000003-0000-0000-0000-000000000013', uid, 'WED', 'MEAL 5 (SERA)','tonno_sgocciolato', 160,  uid),
  ('10000003-0000-0000-0000-000000000014', uid, 'WED', 'MEAL 5 (SERA)','yogurt_greco_0',    200,  uid),
  ('10000003-0000-0000-0000-000000000015', uid, 'WED', 'MEAL 5 (SERA)','mandorle',           20,  uid)
ON CONFLICT (id) DO UPDATE SET target_quantity = EXCLUDED.target_quantity;

-- ── GIOVEDÌ (Training — Push) ──────────────────────────────
INSERT INTO meal_plans (id, user_id, day_of_week, meal_name, food_id, target_quantity, created_by) VALUES
  ('10000004-0000-0000-0000-000000000001', uid, 'THU', 'MEAL 1 (PRE)', 'fiocchi_avena',      80,  uid),
  ('10000004-0000-0000-0000-000000000002', uid, 'THU', 'MEAL 1 (PRE)', 'albumi',            150,  uid),
  ('10000004-0000-0000-0000-000000000003', uid, 'THU', 'MEAL 1 (PRE)', 'mela',              150,  uid),
  ('10000004-0000-0000-0000-000000000004', uid, 'THU', 'MEAL 2',       'petto_pollo',       180,  uid),
  ('10000004-0000-0000-0000-000000000005', uid, 'THU', 'MEAL 2',       'pasta_integrale',   100,  uid),
  ('10000004-0000-0000-0000-000000000006', uid, 'THU', 'MEAL 2',       'spinaci',           150,  uid),
  ('10000004-0000-0000-0000-000000000007', uid, 'THU', 'MEAL 3 (POST)','whey_protein',       40,  uid),
  ('10000004-0000-0000-0000-000000000008', uid, 'THU', 'MEAL 3 (POST)','banana',             80,  uid),
  ('10000004-0000-0000-0000-000000000009', uid, 'THU', 'MEAL 4',       'salmone',           180,  uid),
  ('10000004-0000-0000-0000-000000000010', uid, 'THU', 'MEAL 4',       'riso_basmati',       90,  uid),
  ('10000004-0000-0000-0000-000000000011', uid, 'THU', 'MEAL 4',       'broccoli',          200,  uid),
  ('10000004-0000-0000-0000-000000000012', uid, 'THU', 'MEAL 4',       'olio_oliva',         10,  uid),
  ('10000004-0000-0000-0000-000000000013', uid, 'THU', 'MEAL 5 (SERA)','ricotta_magra',     200,  uid),
  ('10000004-0000-0000-0000-000000000014', uid, 'THU', 'MEAL 5 (SERA)','mandorle',           20,  uid),
  ('10000004-0000-0000-0000-000000000015', uid, 'THU', 'MEAL 5 (SERA)','mela',              150,  uid)
ON CONFLICT (id) DO UPDATE SET target_quantity = EXCLUDED.target_quantity;

-- ── VENERDÌ (Training — Pull) ──────────────────────────────
INSERT INTO meal_plans (id, user_id, day_of_week, meal_name, food_id, target_quantity, created_by) VALUES
  ('10000005-0000-0000-0000-000000000001', uid, 'FRI', 'MEAL 1 (PRE)', 'fiocchi_avena',      80,  uid),
  ('10000005-0000-0000-0000-000000000002', uid, 'FRI', 'MEAL 1 (PRE)', 'uova_intere',       150,  uid),
  ('10000005-0000-0000-0000-000000000003', uid, 'FRI', 'MEAL 1 (PRE)', 'pane_integrale',     60,  uid),
  ('10000005-0000-0000-0000-000000000004', uid, 'FRI', 'MEAL 2',       'petto_pollo',       180,  uid),
  ('10000005-0000-0000-0000-000000000005', uid, 'FRI', 'MEAL 2',       'riso_basmati',       90,  uid),
  ('10000005-0000-0000-0000-000000000006', uid, 'FRI', 'MEAL 2',       'zucchine',          150,  uid),
  ('10000005-0000-0000-0000-000000000007', uid, 'FRI', 'MEAL 3 (POST)','whey_protein',       40,  uid),
  ('10000005-0000-0000-0000-000000000008', uid, 'FRI', 'MEAL 3 (POST)','latte_parziale',    200,  uid),
  ('10000005-0000-0000-0000-000000000009', uid, 'FRI', 'MEAL 4',       'tonno_sgocciolato', 160,  uid),
  ('10000005-0000-0000-0000-000000000010', uid, 'FRI', 'MEAL 4',       'patate',            200,  uid),
  ('10000005-0000-0000-0000-000000000011', uid, 'FRI', 'MEAL 4',       'spinaci',           150,  uid),
  ('10000005-0000-0000-0000-000000000012', uid, 'FRI', 'MEAL 4',       'olio_oliva',         10,  uid),
  ('10000005-0000-0000-0000-000000000013', uid, 'FRI', 'MEAL 5 (SERA)','yogurt_greco_0',    200,  uid),
  ('10000005-0000-0000-0000-000000000014', uid, 'FRI', 'MEAL 5 (SERA)','mandorle',           20,  uid),
  ('10000005-0000-0000-0000-000000000015', uid, 'FRI', 'MEAL 5 (SERA)','mela',              150,  uid)
ON CONFLICT (id) DO UPDATE SET target_quantity = EXCLUDED.target_quantity;

-- ── SABATO (Rest — lower carb) ─────────────────────────────
INSERT INTO meal_plans (id, user_id, day_of_week, meal_name, food_id, target_quantity, created_by) VALUES
  ('10000006-0000-0000-0000-000000000001', uid, 'SAT', 'MEAL 1',       'uova_intere',       200,  uid),
  ('10000006-0000-0000-0000-000000000002', uid, 'SAT', 'MEAL 1',       'pane_integrale',     60,  uid),
  ('10000006-0000-0000-0000-000000000003', uid, 'SAT', 'MEAL 2',       'petto_pollo',       200,  uid),
  ('10000006-0000-0000-0000-000000000004', uid, 'SAT', 'MEAL 2',       'spinaci',           200,  uid),
  ('10000006-0000-0000-0000-000000000005', uid, 'SAT', 'MEAL 2',       'olio_oliva',         15,  uid),
  ('10000006-0000-0000-0000-000000000006', uid, 'SAT', 'MEAL 3',       'tonno_sgocciolato', 160,  uid),
  ('10000006-0000-0000-0000-000000000007', uid, 'SAT', 'MEAL 3',       'ricotta_magra',     150,  uid),
  ('10000006-0000-0000-0000-000000000008', uid, 'SAT', 'MEAL 3',       'mela',              150,  uid),
  ('10000006-0000-0000-0000-000000000009', uid, 'SAT', 'MEAL 4',       'salmone',           180,  uid),
  ('10000006-0000-0000-0000-000000000010', uid, 'SAT', 'MEAL 4',       'broccoli',          250,  uid),
  ('10000006-0000-0000-0000-000000000011', uid, 'SAT', 'MEAL 4',       'olio_oliva',         12,  uid),
  ('10000006-0000-0000-0000-000000000012', uid, 'SAT', 'MEAL 5 (SERA)','yogurt_greco_0',    200,  uid),
  ('10000006-0000-0000-0000-000000000013', uid, 'SAT', 'MEAL 5 (SERA)','mandorle',           25,  uid)
ON CONFLICT (id) DO UPDATE SET target_quantity = EXCLUDED.target_quantity;

-- ── DOMENICA (Rest — refeed optional) ─────────────────────
INSERT INTO meal_plans (id, user_id, day_of_week, meal_name, food_id, target_quantity, created_by) VALUES
  ('10000007-0000-0000-0000-000000000001', uid, 'SUN', 'MEAL 1',       'fiocchi_avena',      70,  uid),
  ('10000007-0000-0000-0000-000000000002', uid, 'SUN', 'MEAL 1',       'latte_parziale',    200,  uid),
  ('10000007-0000-0000-0000-000000000003', uid, 'SUN', 'MEAL 1',       'banana',            100,  uid),
  ('10000007-0000-0000-0000-000000000004', uid, 'SUN', 'MEAL 2',       'petto_pollo',       200,  uid),
  ('10000007-0000-0000-0000-000000000005', uid, 'SUN', 'MEAL 2',       'riso_basmati',       80,  uid),
  ('10000007-0000-0000-0000-000000000006', uid, 'SUN', 'MEAL 2',       'zucchine',          150,  uid),
  ('10000007-0000-0000-0000-000000000007', uid, 'SUN', 'MEAL 2',       'olio_oliva',         10,  uid),
  ('10000007-0000-0000-0000-000000000008', uid, 'SUN', 'MEAL 3',       'tonno_sgocciolato', 160,  uid),
  ('10000007-0000-0000-0000-000000000009', uid, 'SUN', 'MEAL 3',       'yogurt_greco_0',    150,  uid),
  ('10000007-0000-0000-0000-000000000010', uid, 'SUN', 'MEAL 3',       'mela',              150,  uid),
  ('10000007-0000-0000-0000-000000000011', uid, 'SUN', 'MEAL 4',       'salmone',           200,  uid),
  ('10000007-0000-0000-0000-000000000012', uid, 'SUN', 'MEAL 4',       'patate',            180,  uid),
  ('10000007-0000-0000-0000-000000000013', uid, 'SUN', 'MEAL 4',       'broccoli',          200,  uid),
  ('10000007-0000-0000-0000-000000000014', uid, 'SUN', 'MEAL 4',       'olio_oliva',         10,  uid),
  ('10000007-0000-0000-0000-000000000015', uid, 'SUN', 'MEAL 5 (SERA)','ricotta_magra',     200,  uid)
ON CONFLICT (id) DO UPDATE SET target_quantity = EXCLUDED.target_quantity;

END $$;


-- ============================================================
-- 4. DAILY LOGS — 90 days (generated with deterministic noise)
--
--    Base date: TODAY - 90 days
--    Weekly pattern (0=Mon … 6=Sun):
--      0 MON → Push  ✓ gym
--      1 TUE → Pull  ✓ gym
--      2 WED → Legs  ✓ gym
--      3 THU → Push  ✓ gym
--      4 FRI → Pull  ✓ gym
--      5 SAT → REST
--      6 SUN → REST
--
--    Weight: 82.0 → ~79.0 over 90 days + ±0.4 daily noise
--    HRV:    55–72 baseline ± noise, dips after hard days
--    Diet adherence: 70% perfect / 20% minor / 10% cheat
-- ============================================================

DO $$
DECLARE
  uid         UUID    := '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d';
  base_date   DATE    := CURRENT_DATE - 89;  -- 90 days window ending today
  d           DATE;
  i           INTEGER;
  dow         INTEGER;  -- 0=Mon, 1=Tue … 6=Sun
  is_gym_day  BOOLEAN;

  -- Weight: linear trend + noise via hash-based determinism
  weight_base NUMERIC;
  weight_noise NUMERIC;
  w           NUMERIC;

  -- HRV
  hrv_base    NUMERIC;
  hrv_val     NUMERIC;

  -- Sleep
  sl_hours    NUMERIC;
  sl_quality  NUMERIC;
  sl_score    NUMERIC;

  -- Activity
  steps_val   INTEGER;
  active_kcal_val INTEGER;
  cardio_liss INTEGER;
  workout_txt TEXT;
  workout_dur INTEGER;
  gym_rpe_val NUMERIC;
  gym_energy_val NUMERIC;
  gym_mood_val NUMERIC;
  soreness_val NUMERIC;

  -- Evening
  water_val   NUMERIC;
  salt_val    NUMERIC;
  diet_adh    TEXT;
  digestion_val INTEGER;
  stress_val  NUMERIC;
  energy_val  NUMERIC;
  hunger_val  NUMERIC;
  libido_val  NUMERIC;
  mood_val    NUMERIC;

  -- Deterministic "random" helpers
  h           BIGINT;
  notes_arr   TEXT[]  := ARRAY[
    NULL, NULL, NULL, NULL, NULL,  -- most days: no note
    'Ottima sessione, feeling forte',
    'Un po'' stanco, ma allenamento completato',
    'Sonno scarso ieri, energie al minimo',
    'Peso stabile, dieta rispettata',
    'Bella giornata, passo MONgo',
    'Crampi al polpaccio durante squat',
    'Nuovo PR alla panca piana',
    'Weekend fuori città, passi alti',
    'Stress lavorativo elevato oggi',
    'Digestione lenta, forse il salmone'
  ];

BEGIN
  FOR i IN 0..89 LOOP
    d   := base_date + i;
    dow := EXTRACT(DOW FROM d)::INTEGER;  -- 0=Sun, 1=Mon … 6=Sat (Postgres)
    -- Remap: Postgres DOW 1=Mon … 5=Fri, 6=Sat, 0=Sun
    --   gym days: Mon(1) Tue(2) Wed(3) Thu(4) Fri(5)
    is_gym_day := dow IN (1, 2, 3, 4, 5);

    -- Deterministic noise seed (large prime mix)
    h := (i * 1000003 + 17) % 997;

    -- ── Weight ──────────────────────────────────────────────
    weight_base  := 82.0 - (i::NUMERIC / 89.0) * 3.0;   -- 82→79 linear
    weight_noise := ((h % 80) - 40)::NUMERIC / 100.0;    -- ±0.40 kg
    w            := ROUND((weight_base + weight_noise)::NUMERIC, 1);

    -- ── HRV ─────────────────────────────────────────────────
    hrv_base := 62.0 + ((h % 18) - 9)::NUMERIC;          -- 53–71
    -- Dip day after heavy leg day (Wed → dip Thu)
    IF dow = 4 THEN hrv_base := hrv_base - 5.0; END IF;
    hrv_val  := ROUND(hrv_base, 0);

    -- ── Sleep ────────────────────────────────────────────────
    IF (h % 7) = 0 THEN
      sl_hours := 6.0;   -- occasional short night
    ELSIF (h % 7) = 1 THEN
      sl_hours := 6.5;
    ELSIF (h % 7) = 6 THEN
      sl_hours := 8.5;
    ELSE
      sl_hours := 7.5 + ((h % 3) - 1)::NUMERIC * 0.5;  -- 7.0 / 7.5 / 8.0
    END IF;

    sl_quality := CASE
      WHEN sl_hours >= 8.0 THEN 5
      WHEN sl_hours >= 7.0 THEN 4
      WHEN sl_hours >= 6.5 THEN 3
      ELSE 2
    END;

    sl_score   := ROUND((sl_quality * 16 + (h % 10))::NUMERIC, 0);  -- 40–90

    -- ── Activity ─────────────────────────────────────────────
    IF is_gym_day THEN
      steps_val       := 8000  + (h % 4000);               -- 8000–11999
      active_kcal_val := 350   + (h % 150);                -- 350–499
      cardio_liss     := CASE WHEN (h % 3) = 0 THEN 20 WHEN (h % 3) = 1 THEN 30 ELSE 0 END;

      workout_txt := CASE dow
        WHEN 1 THEN 'Push A (Petto/Tricipiti/Spalle)'
        WHEN 2 THEN 'Pull A (Schiena/Bicipiti)'
        WHEN 3 THEN 'Legs (Squat/RDL/Leg Press)'
        WHEN 4 THEN 'Push B (Panca/OHP/Cavi)'
        WHEN 5 THEN 'Pull B (Trazioni/Rematore/Curl)'
        ELSE 'Allenamento Generico'
      END;

      workout_dur    := 60 + (h % 30);                     -- 60–89 min
      gym_rpe_val    := ROUND((7.0 + ((h % 6) - 3) * 0.5)::NUMERIC, 1);  -- 5.5–8.5
      gym_energy_val := CASE WHEN (h % 3) = 0 THEN 1 WHEN (h % 3) = 1 THEN 2 ELSE 3 END;
      gym_mood_val   := 2 + (h % 4);                       -- 2–5
      soreness_val   := CASE dow
        WHEN 1 THEN 2                     -- fresh after rest
        WHEN 2 THEN 2 + (h % 2)          -- 2–3
        WHEN 3 THEN 3 + (h % 2)          -- 3–4 (after chest/back)
        WHEN 4 THEN 2 + (h % 2)          -- 2–3 (legs DOMS kicks in)
        WHEN 5 THEN 3 + (h % 2)          -- 3–4
        ELSE 2
      END;
    ELSE
      -- Rest day
      steps_val       := 5000 + (h % 3000);                -- 5000–7999
      active_kcal_val := 150  + (h % 100);                 -- 150–249
      cardio_liss     := CASE WHEN (h % 2) = 0 THEN 20 ELSE 0 END;
      workout_txt     := NULL;
      workout_dur     := NULL;
      gym_rpe_val     := NULL;
      gym_energy_val  := NULL;
      gym_mood_val    := NULL;
      soreness_val    := CASE WHEN dow = 6 THEN 2 + (h % 3) ELSE 1 + (h % 2) END;
    END IF;

    -- ── Evening biofeedback ───────────────────────────────────
    water_val := ROUND((3.0 + ((h % 10) - 5)::NUMERIC * 0.1)::NUMERIC, 1);  -- 2.5–3.5 L
    salt_val  := ROUND((4.5 + ((h % 5)  - 2)::NUMERIC * 0.5)::NUMERIC, 1);  -- 3.5–5.5 g

    -- Diet adherence: 70% perfect, 20% minor, 10% cheat
    diet_adh := CASE
      WHEN (h % 10) >= 8 THEN 'cheat_meal'
      WHEN (h % 10) >= 6 THEN 'minor_deviation'
      ELSE                     'perfect'
    END;

    digestion_val := 2 + (h % 3);  -- 2–4  (1=poor, 4=excellent)

    stress_val  := CASE
      WHEN (h % 5) = 0 THEN 4
      WHEN (h % 5) = 1 THEN 1
      ELSE 2 + (h % 2)
    END;

    energy_val  := CASE
      WHEN sl_hours < 6.5 OR stress_val >= 4 THEN 1
      WHEN is_gym_day AND gym_rpe_val IS NOT NULL AND gym_rpe_val >= 8.0 THEN 2
      ELSE 2 + (h % 2)
    END;

    hunger_val  := CASE
      WHEN diet_adh = 'cheat_meal' THEN 1
      WHEN diet_adh = 'perfect'    THEN 3 + (h % 2)
      ELSE 2 + (h % 2)
    END;

    libido_val  := 2 + (h % 4);   -- 2–5
    mood_val    := CASE
      WHEN stress_val >= 4 THEN 2
      WHEN energy_val >= 3 THEN 4 + (h % 2)
      ELSE 3 + (h % 2)
    END;

    INSERT INTO daily_logs (
      id,
      user_id,
      date,
      weight_fasting,
      measurement_time,
      sleep_hours,
      sleep_quality,
      hrv,
      sleep_score,
      steps,
      steps_goal,
      active_kcal,
      cardio_liss_mins,
      cardio_hiit_mins,
      workout_session,
      workout_start_time,
      workout_duration,
      gym_rpe,
      gym_energy,
      gym_mood,
      soreness_level,
      water_liters,
      salt_grams,
      diet_adherence,
      digestion_rating,
      stress_level,
      daily_energy,
      hunger_level,
      libido,
      mood,
      general_notes,
      created_at,
      updated_at
    ) VALUES (
      uuid_generate_v4(),
      uid,
      d,
      w,
      '07:00',
      sl_hours,
      sl_quality,
      hrv_val,
      sl_score,
      steps_val,
      10000,
      active_kcal_val,
      cardio_liss,
      0,  -- no HIIT in this block
      workout_txt,
      CASE WHEN is_gym_day THEN '07:30' ELSE NULL END,
      workout_dur,
      gym_rpe_val,
      gym_energy_val,
      gym_mood_val,
      soreness_val,
      water_val,
      salt_val,
      diet_adh,
      digestion_val,
      stress_val,
      energy_val,
      hunger_val,
      libido_val,
      mood_val,
      notes_arr[1 + (h % array_length(notes_arr, 1))],
      NOW() - ((89 - i) || ' days')::INTERVAL,
      NOW() - ((89 - i) || ' days')::INTERVAL
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
      weight_fasting    = EXCLUDED.weight_fasting,
      sleep_hours       = EXCLUDED.sleep_hours,
      sleep_quality     = EXCLUDED.sleep_quality,
      hrv               = EXCLUDED.hrv,
      sleep_score       = EXCLUDED.sleep_score,
      steps             = EXCLUDED.steps,
      active_kcal       = EXCLUDED.active_kcal,
      cardio_liss_mins  = EXCLUDED.cardio_liss_mins,
      workout_session   = EXCLUDED.workout_session,
      workout_start_time= EXCLUDED.workout_start_time,
      workout_duration  = EXCLUDED.workout_duration,
      gym_rpe           = EXCLUDED.gym_rpe,
      gym_energy        = EXCLUDED.gym_energy,
      gym_mood          = EXCLUDED.gym_mood,
      soreness_level    = EXCLUDED.soreness_level,
      water_liters      = EXCLUDED.water_liters,
      salt_grams        = EXCLUDED.salt_grams,
      diet_adherence    = EXCLUDED.diet_adherence,
      digestion_rating  = EXCLUDED.digestion_rating,
      stress_level      = EXCLUDED.stress_level,
      daily_energy      = EXCLUDED.daily_energy,
      hunger_level      = EXCLUDED.hunger_level,
      libido            = EXCLUDED.libido,
      mood              = EXCLUDED.mood,
      general_notes     = EXCLUDED.general_notes,
      updated_at        = NOW();

  END LOOP;
END $$;


-- ============================================================
-- 5. MEAL ADHERENCE — last 30 days only (realistic subset)
--
--    We insert one adherence row per meal plan per day.
--    Completion follows the diet_adherence pattern:
--      perfect → all 5 meals completed
--      minor   → 4/5 completed (last meal skipped)
--      cheat   → 2-3/5 completed
--
--    Uses the same deterministic hash to stay consistent
--    with the daily_logs diet_adherence column.
-- ============================================================

DO $$
DECLARE
  uid       UUID    := '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d';
  base_date DATE    := CURRENT_DATE - 29;   -- last 30 days
  d         DATE;
  i         INTEGER;
  dow       INTEGER;
  h         BIGINT;
  diet_adh  TEXT;
  meals_completed INTEGER;

  -- Map Postgres DOW to Italian day codes
  dow_map   TEXT[]  := ARRAY['SUN','MON','TUE','WED','THU','FRI','SAT'];  -- index 0=Sun

  day_code  TEXT;
  mp_id     UUID;
  meal_seq  INTEGER;  -- 1..15 rows per day

  -- Meal plan ID prefix table (deterministic UUIDs from section 3)
  -- prefix_map[1]=MON … prefix_map[7]=SUN
  prefix_map TEXT[] := ARRAY[
    '10000001','10000002','10000003','10000004','10000005','10000006','10000007'
  ];
  prefix TEXT;
  -- MON/TUE/WED/THU/FRI have 15 rows; SAT has 13; SUN has 15
  row_count INTEGER;
BEGIN
  FOR i IN 0..29 LOOP
    d   := base_date + i;
    dow := EXTRACT(DOW FROM d)::INTEGER;   -- 0=Sun … 6=Sat
    day_code := dow_map[dow + 1];           -- 0-indexed array

    -- Re-derive same hash as daily_logs block
    h := ((89 - 29 + i) * 1000003 + 17) % 997;

    diet_adh := CASE
      WHEN (h % 10) >= 8 THEN 'cheat_meal'
      WHEN (h % 10) >= 6 THEN 'minor_deviation'
      ELSE                     'perfect'
    END;

    meals_completed := CASE
      WHEN diet_adh = 'perfect'          THEN 15  -- all rows completed
      WHEN diet_adh = 'minor_deviation'  THEN 13  -- last 2 meals skipped
      ELSE                                    8   -- cheat: roughly half
    END;

    -- Map day_code to prefix index (MON=1 … SUN=7)
    prefix := CASE day_code
      WHEN 'MON' THEN prefix_map[1]
      WHEN 'TUE' THEN prefix_map[2]
      WHEN 'WED' THEN prefix_map[3]
      WHEN 'THU' THEN prefix_map[4]
      WHEN 'FRI' THEN prefix_map[5]
      WHEN 'SAT' THEN prefix_map[6]
      WHEN 'SUN' THEN prefix_map[7]
    END;

    row_count := CASE day_code WHEN 'SAT' THEN 13 ELSE 15 END;

    FOR meal_seq IN 1..row_count LOOP
      mp_id := (prefix || '-0000-0000-0000-' || LPAD(meal_seq::TEXT, 12, '0'))::UUID;

      INSERT INTO meal_adherence (
        id, user_id, date, meal_plan_id, is_completed, created_at, updated_at
      ) VALUES (
        uuid_generate_v4(),
        uid,
        d,
        mp_id,
        meal_seq <= meals_completed,
        NOW() - ((29 - i) || ' days')::INTERVAL,
        NOW() - ((29 - i) || ' days')::INTERVAL
      )
      ON CONFLICT (user_id, date, meal_plan_id) DO UPDATE SET
        is_completed = EXCLUDED.is_completed,
        updated_at   = NOW();
    END LOOP;

  END LOOP;
END $$;


-- ============================================================
-- 6. ADDITIONAL DATA FOR ALE, GIULIA, NINO
--    90 days of logs, 7-day meal plans, 30 days adherence.
-- ============================================================

DO $$
DECLARE
  users       UUID[] := ARRAY[
                'e56b40c0-6d45-41f9-8526-73c5db57f3d5'::UUID, -- Ale (Bulk)
                '78ccb3b9-f2a8-4fc0-8164-4f5541710594'::UUID, -- Giulia (Cut)
                '3b8f612d-1dbf-4d3e-a7fd-473495c1ff17'::UUID  -- Nino (Self-Coached)
              ];
  u           UUID;
  target_w    NUMERIC;
  start_w     NUMERIC;
  curr_w      NUMERIC;
  base_date   DATE := CURRENT_DATE - 89;
  d           DATE;
  i           INTEGER;
  j           INTEGER;
  h           BIGINT;
  is_gym      BOOLEAN;
  dow         INTEGER;
  
  -- Meal Plan Refs
  mp_ids      UUID[];
BEGIN
  -- Iterate through each user
  FOREACH u IN ARRAY users LOOP
    -- Define weight trend based on user
    IF u = 'e56b40c0-6d45-41f9-8526-73c5db57f3d5' THEN -- Ale
      start_w := 85.0; target_w := 88.0; -- Bulking
    ELSIF u = '78ccb3b9-f2a8-4fc0-8164-4f5541710594' THEN -- Giulia
      start_w := 55.0; target_w := 52.0; -- Cutting
    ELSE -- Nino
      start_w := 95.0; target_w := 92.0; -- Cutting
    END IF;

    -- 6a. MEAL PLANS (Simple 7-day structure)
    FOR i IN 0..6 LOOP
      INSERT INTO meal_plans (user_id, day_of_week, meal_name, food_id, target_quantity, created_by)
      VALUES 
        (u, (ARRAY['MON','TUE','WED','THU','FRI','SAT','SUN'])[i+1], 'Pasto 1', 'fiocchi_avena', 80, u),
        (u, (ARRAY['MON','TUE','WED','THU','FRI','SAT','SUN'])[i+1], 'Pasto 2', 'petto_pollo', 150, u),
        (u, (ARRAY['MON','TUE','WED','THU','FRI','SAT','SUN'])[i+1], 'Pasto 3', 'riso_basmati', 100, u)
      ON CONFLICT DO NOTHING;
    END LOOP;

    -- 6b. DAILY LOGS (90 Days)
    FOR i IN 0..89 LOOP
      d := base_date + i;
      dow := EXTRACT(DOW FROM d)::INTEGER;
      is_gym := (dow BETWEEN 1 AND 5);
      h := ABS(hashtext(u::text) + i * 13) % 1000; -- User-specific deterministic noise
      
      -- Weight trend
      curr_w := start_w + (target_w - start_w) * (i::NUMERIC / 89.0) + ((h % 40) - 20)::NUMERIC / 100.0;
      
      INSERT INTO daily_logs (
        user_id, date, weight_fasting, sleep_hours, sleep_quality, hrv, sleep_score,
        steps, steps_goal, active_kcal, workout_session, workout_duration,
        diet_adherence, daily_energy, hunger_level, mood
      ) VALUES (
        u, d, ROUND(curr_w, 1), 
        7.0 + (h % 20)::NUMERIC / 10.0, 3 + (h % 3), 
        50 + (h % 30), 60 + (h % 30),
        7000 + (h * 10 % 5000), 10000, 300 + (h % 300),
        CASE WHEN is_gym THEN 'Sessione ' || (ARRAY['Push','Pull','Legs'])[ (h % 3) + 1 ] ELSE NULL END,
        CASE WHEN is_gym THEN 60 + (h % 30) ELSE NULL END,
        CASE WHEN (h % 10) > 7 THEN 'minor_deviation' ELSE 'perfect' END,
        2 + (h % 3), 2 + (h % 3), 3 + (h % 3)
      ) ON CONFLICT (user_id, date) DO NOTHING;
    END LOOP;

    -- 6c. MEAL ADHERENCE (30 Days)
    FOR i IN 60..89 LOOP
      d := base_date + i;
      -- Link to the meal plans we just created
      INSERT INTO meal_adherence (user_id, date, meal_plan_id, is_completed)
      SELECT u, d, id, true
      FROM meal_plans
      WHERE user_id = u AND day_of_week = (ARRAY['SUN','MON','TUE','WED','THU','FRI','SAT'])[EXTRACT(DOW FROM d)::INTEGER + 1]
      ON CONFLICT DO NOTHING;
    END LOOP;

  END LOOP;
END $$;


-- ============================================================
-- 7. ATHLETE GOALS
-- ============================================================

INSERT INTO public.athlete_goals (
  athlete_id, set_by, phase, target_weight, steps_goal, water_goal,
  target_calories, target_protein, target_carbs, target_fats,
  effective_from, notes
) VALUES
  (
    '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d', -- Marco
    '8ffaf05a-1e08-4ece-a31e-4b69843f2a3d',
    'cut', 76, 10000, 3.5, 2200, 180, 220, 60,
    CURRENT_DATE - 90, 'Obiettivo estivo: mantenimento massa magra e perdita grasso.'
  ),
  (
    'e56b40c0-6d45-41f9-8526-73c5db57f3d5', -- Ale
    'f119519c-d96b-496f-89a2-4690406cd2ea', -- Set by Coach Tattie
    'bulk', 90, 10000, 4.0, 3200, 200, 400, 80,
    CURRENT_DATE - 90, 'Fase di massa pulita. Focus su progressione carichi.'
  ),
  (
    '78ccb3b9-f2a8-4fc0-8164-4f5541710594', -- Giulia
    'f119519c-d96b-496f-89a2-4690406cd2ea', -- Set by Coach Tattie
    'cut', 52, 10000, 3.0, 1800, 140, 180, 55,
    CURRENT_DATE - 60, 'Definizione. Cardio LISS 30min 3v/settimana.'
  ),
  (
    '3b8f612d-1dbf-4d3e-a7fd-473495c1ff17', -- Nino
    '3b8f612d-1dbf-4d3e-a7fd-473495c1ff17',
    'maintenance', 92, 10000, 3.5, 2600, 190, 300, 70,
    CURRENT_DATE - 30, 'Mantenimento post-cut. Focus su volume allenamento.'
  )
ON CONFLICT (athlete_id) WHERE effective_until IS NULL DO UPDATE SET
  target_weight   = EXCLUDED.target_weight,
  steps_goal      = EXCLUDED.steps_goal,
  water_goal       = EXCLUDED.water_goal,
  target_calories = EXCLUDED.target_calories,
  target_protein  = EXCLUDED.target_protein,
  target_carbs    = EXCLUDED.target_carbs,
  target_fats     = EXCLUDED.target_fats,
  phase           = EXCLUDED.phase,
  notes           = EXCLUDED.notes;


-- ============================================================
-- ✅  Seed complete.
--     Expanded data for Coach, 3 Athletes (1 Self-Coached).
-- ============================================================
