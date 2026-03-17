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
    created_at: string;
}

export interface MealPlan {
    id: string;
    user_id: string;
    day_of_week: 'LUN' | 'MAR' | 'MER' | 'GIO' | 'VEN' | 'SAB' | 'DOM';
    meal_name: string;
    food_id: string | null;
    target_quantity: number;
    created_at: string;

    // Joined relation
    foods?: Food | null;
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
