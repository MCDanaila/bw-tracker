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
