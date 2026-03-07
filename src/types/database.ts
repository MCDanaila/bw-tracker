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
    weight_fasting: number | null;
    measurement_time: string | null;
    sleep_hours: number | null;
    sleep_quality: number | null;
    time_asleep: string | null;
    time_awake: string | null;
    hrv: number | null;
    blood_glucose: number | null;
    sleep_score: number | null;
    steps: number | null;
    cardio_hiit_mins: number | null;
    cardio_liss_mins: number | null;
    workout_session: string | null;
    workout_start_time: string | null;
    workout_duration: number | null;
    gym_rpe: number | null;
    gym_energy: number | null;
    workout_feel: number | null;
    water_liters: number | null;
    salt_grams: number | null;
    cheat_meals: boolean | null;
    digestion_rating: string | null;
    digestion_comments: string | null;
    bathroom_visits: number | null;
    stress_level: number | null;
    daily_energy: number | null;
    hunger_level: number | null;
    libido: number | null;
    mood: number | null;
    spo2: number | null;
    sys_bp: number | null;
    dia_bp: number | null;
    general_notes: string | null;
    created_at: string;
    updated_at: string;
}
