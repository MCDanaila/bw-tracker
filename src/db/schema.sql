-- Enable the UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop ONLY daily_logs allowing you to cleanly update its schema without losing food data
DROP TABLE IF EXISTS meal_adherence CASCADE;
DROP TABLE IF EXISTS daily_logs CASCADE;
DROP TABLE IF EXISTS meal_plans CASCADE;
DROP TABLE IF EXISTS foods CASCADE; 

-- ==========================================
-- 1. FOODS (Lista Alimenti)
-- Global database of foods (Read-only for users)
-- ==========================================
CREATE TABLE IF NOT EXISTS foods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    portion_size NUMERIC NOT NULL,
    unit TEXT NOT NULL CHECK (unit IN ('g', 'ml', 'caps', 'compr', 'piece')),
    calories NUMERIC NOT NULL,
    protein NUMERIC NOT NULL,
    carbs NUMERIC NOT NULL,
    fats NUMERIC NOT NULL,
    state TEXT CHECK (state IN ('Peso da Cotto', 'Peso da Crudo', 'Peso sgocciolato', 'Peso confezionato', 'Peso da sgusciato', 'N/A')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. MEAL PLANS (Piano Alimentare)
-- The assigned diet for the user
-- ==========================================
CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Client can generate this UUID
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM')),
    meal_name TEXT NOT NULL, -- e.g., 'MEAL 1 (PRE)', 'MEAL 2'
    food_id TEXT REFERENCES foods(id) ON DELETE SET NULL,
    target_quantity NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. DAILY LOGS (Tracker Giornaliero)
-- Daily biometrics and metrics
-- ==========================================
CREATE TABLE daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Client generates UUID for offline queue
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Morning Metrics
    weight_fasting NUMERIC CHECK (weight_fasting > 30 AND weight_fasting < 250),
    measurement_time TEXT,
    sleep_hours NUMERIC CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
    sleep_quality NUMERIC CHECK (sleep_quality >= 1 AND sleep_quality <= 3),
    hrv NUMERIC CHECK (hrv >= 0 AND hrv <= 300),
    sleep_score NUMERIC CHECK (sleep_score >= 0 AND sleep_score <= 100),
    
    -- Activity
    steps INTEGER CHECK (steps >= 0 AND steps <= 150000),
    steps_goal INTEGER, -- Store the target if it changes over time
    active_kcal INTEGER CHECK (active_kcal >= 0 AND active_kcal <= 20000),
    cardio_hiit_mins INTEGER CHECK (cardio_hiit_mins >= 0 AND cardio_hiit_mins <= 600),
    cardio_liss_mins INTEGER CHECK (cardio_liss_mins >= 0 AND cardio_liss_mins <= 600),
    workout_session TEXT,
    workout_start_time TEXT,
    workout_duration INTEGER CHECK (workout_duration >= 0 AND workout_duration <= 600),
    gym_rpe NUMERIC CHECK (gym_rpe >= 1 AND gym_rpe <= 10),
    gym_energy NUMERIC CHECK (gym_energy >= 1 AND gym_energy <= 3),
    gym_mood NUMERIC CHECK (gym_mood >= 1 AND gym_mood <= 5),
    soreness_level NUMERIC CHECK (soreness_level >= 1 AND soreness_level <= 3),
    
    -- Evening/End of Day & Biofeedback
    water_liters NUMERIC CHECK (water_liters >= 0 AND water_liters <= 15),
    salt_grams NUMERIC,
    diet_adherence TEXT CHECK (diet_adherence IN ('perfect', 'minor_deviation', 'cheat_meal')),
    digestion_rating INTEGER CHECK (digestion_rating >= 1 AND digestion_rating <= 4),
    digestion_comments TEXT,
    bathroom_visits INTEGER,
    stress_level NUMERIC CHECK (stress_level >= 1 AND stress_level <= 3),
    daily_energy NUMERIC CHECK (daily_energy >= 1 AND daily_energy <= 3),
    hunger_level NUMERIC CHECK (hunger_level >= 1 AND hunger_level <= 5),
    libido NUMERIC CHECK (libido >= 1 AND libido <= 5),
    mood NUMERIC CHECK (mood >= 1 AND mood <= 5),
    cycle_day INTEGER CHECK (cycle_day >= 1 AND cycle_day <= 50),
    
    -- Weekly Check-ins (Optional)
    blood_glucose NUMERIC,
    sys_bp INTEGER,
    dia_bp INTEGER,
    general_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- CRUCIAL FOR OFFLINE UPSERTS:
    -- Ensures we can uniquely identify a log to update it if it already exists
    UNIQUE(user_id, date) 
);

-- ==========================================
-- 4. ADHERENCE LOGS (Meal Check-offs)
-- Tracks which meals were eaten on which day
-- ==========================================
CREATE TABLE IF NOT EXISTS meal_adherence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Client generated
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    swapped_food_id TEXT REFERENCES foods(id) ON DELETE SET NULL, -- If they used the Smart Swap
    swapped_quantity NUMERIC, -- The new quantity calculated by the app
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- CRUCIAL FOR OFFLINE UPSERTS:
    -- A user can only have one adherence record per meal per day
    UNIQUE(user_id, date, meal_plan_id)
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- Ensures users can only access their own data
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_adherence ENABLE ROW LEVEL SECURITY;

-- Foods: Everyone can read the food database, but only admins can edit (assuming you'll add an admin role later, for now just read)
CREATE POLICY "Foods are viewable by everyone" ON foods FOR SELECT USING (true);

-- Meal Plans: Users can only see and manage their own meal plans
CREATE POLICY "Users manage their own meal plans" ON meal_plans
    FOR ALL USING (auth.uid() = user_id);

-- Daily Logs: Users can only see and manage their own logs
CREATE POLICY "Users manage their own daily logs" ON daily_logs
    FOR ALL USING (auth.uid() = user_id);

-- Adherence: Users can only see and manage their own adherence
CREATE POLICY "Users manage their own adherence logs" ON meal_adherence
    FOR ALL USING (auth.uid() = user_id);