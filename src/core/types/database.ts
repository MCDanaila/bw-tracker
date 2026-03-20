export interface UserProfile {
    id: string;
    username: string | null;
    gender: string | null;
    age: number | null;
    unit_system: 'metric' | 'imperial';
    height: number | null;
    initial_weight: number | null;
    target_weight: number | null;
    activity_level: string | null;
    goal: string | null;
    steps_goal: number | null;
    water_goal: number | null;
    salt_goal: number | null;
    email: string | null;
    role: 'athlete' | 'self_coached' | 'coach';
}

export interface Food {
    id: string;
    name: string;
    portion_size: number;
    unit: 'g' | 'ml' | 'caps' | 'compr' | 'piece';
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    state: 'Peso da Cotto' | 'Peso da Crudo' | 'Peso sgocciolato' | 'Peso confezionato' | 'Peso da sgusciato' | 'N/A';
    created_by: string | null;
    created_at: string;
    updated_at?: string; // column does not exist in current schema — optional to avoid silent undefined reads
}

export interface MealPlan {
    id: string;
    user_id: string;
    day_of_week: 'LUN' | 'MAR' | 'MER' | 'GIO' | 'VEN' | 'SAB' | 'DOM';
    meal_name: string;
    food_id: string | null;
    target_quantity: number;
    created_by: string | null;
    template_id: string | null;
    created_at: string;

    // Joined relation
    foods?: Food | null;
}

export interface DietTemplate {
    id: string;
    coach_id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface DietTemplateItem {
    id: string;
    template_id: string;
    day_of_week: 'LUN' | 'MAR' | 'MER' | 'GIO' | 'VEN' | 'SAB' | 'DOM';
    meal_name: string;
    food_id: string | null;
    target_quantity: number;
    sort_order: number;
    created_at: string;

    // Joined relation
    foods?: Food | null;
}

export interface CoachAthlete {
    id: string;
    coach_id: string;
    athlete_id: string;
    status: 'active' | 'paused' | 'terminated';
    assigned_at: string;
    terminated_at: string | null;
}

export interface MealAdherence {
    id: string;
    user_id: string;
    date: string;
    meal_plan_id: string;
    is_completed: boolean;
    swapped_food_id: string | null;
    swapped_quantity: number | null;
    created_at: string;
    updated_at: string;
}

export interface DailyLog {
    id: string;
    user_id: string;
    date: string;

    // Morning
    weight_fasting: number | null;
    measurement_time: string | null;
    sleep_hours: number | null;
    sleep_quality: number | null;
    hrv: number | null;
    sleep_score: number | null;

    // Activity
    steps: number | null;
    steps_goal: number | null;
    active_kcal: number | null;
    cardio_hiit_mins: number | null;
    cardio_liss_mins: number | null;
    workout_session: string | null;
    workout_start_time: string | null;
    workout_duration: number | null;
    gym_rpe: number | null;
    gym_energy: number | null;
    gym_mood: number | null;
    soreness_level: number | null;

    // Evening/Day & Biofeedback
    water_liters: number | null;
    salt_grams: number | null;
    diet_adherence: 'perfect' | 'minor_deviation' | 'cheat_meal' | null;
    digestion_rating: number | null;
    digestion_comments: string | null;
    bathroom_visits: number | null;
    stress_level: number | null;
    daily_energy: number | null;
    hunger_level: number | null;
    libido: number | null;
    mood: number | null;
    cycle_day: number | null;

    // Weekly Check-ins
    blood_glucose: number | null;
    sys_bp: number | null;
    dia_bp: number | null;
    general_notes: string | null;

    created_at: string;
    updated_at: string;
}

export interface AthleteGoal {
    id: string;
    athlete_id: string;
    set_by: string;
    target_weight: number | null;
    steps_goal: number | null;
    water_goal: number | null;
    target_calories: number | null;
    target_protein: number | null;
    target_carbs: number | null;
    target_fats: number | null;
    phase: 'bulk' | 'cut' | 'maintenance' | 'reverse_diet' | null;
    notes: string | null;
    effective_from: string;
    effective_until: string | null;
    created_at: string;
}
