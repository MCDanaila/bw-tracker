import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { MealPlan, Food } from '@/types/database';

export type DayOfWeek = 'LUN' | 'MAR' | 'MER' | 'GIO' | 'VEN' | 'SAB' | 'DOM';

export interface DailyMacros {
    day: DayOfWeek;
    kcal: number;
    protein: number;
    carbs: number;
    fats: number;
    cgRatio: number;
}

export type WeeklyMacros = Record<DayOfWeek, DailyMacros>;

// Calculate macros from base per-100g/unit values and the target quantity
export const calculateItemMacros = (food: Food | null | undefined, quantity: number) => {
    if (!food) return { kcal: 0, p: 0, c: 0, g: 0 };

    // Most items are per 100g/ml, but pieces might be per 1 unit
    // Actually the CSV looks like calories/macros are per 100g for most things, but per 1 piece for eggs/bagels
    // Based on the DB schema standard: calories/macros are for `portion_size` (usually 100 or 1).
    const ratio = quantity / food.portion_size;

    return {
        kcal: food.calories * ratio,
        p: food.protein * ratio,
        c: food.carbs * ratio,
        g: food.fats * ratio,
    };
};

export const useDietData = (userId?: string) => {
    const { session } = useAuth();
    const targetId = userId ?? session?.user.id;

    return useQuery({
        queryKey: ['diet-plans', targetId],
        queryFn: async () => {
            if (!targetId) return [];

            const { data, error } = await supabase
                .from('meal_plans')
                .select(`
                    id,
                    user_id,
                    day_of_week,
                    meal_name,
                    food_id,
                    target_quantity,
                    created_at,
                    foods (
                        id,
                        name,
                        portion_size,
                        unit,
                        calories,
                        protein,
                        carbs,
                        fats,
                        state
                    )
                `)
                .eq('user_id', targetId);

            if (error) {
                console.error("Error fetching diet data:", error);
                throw error;
            }

            // Type cast since Supabase returns related tables as arrays or single objects based on the relationship
            // For a Many-to-One (meal -> food), it returns a single object
            return (data as unknown) as MealPlan[];
        },
        enabled: !!targetId,
    });
};

export const useWeeklyOverview = (mealPlans: MealPlan[] = []) => {
    const days: DayOfWeek[] = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

    // Initialize empty week
    const defaultDay = (day: DayOfWeek): DailyMacros => ({
        day, kcal: 0, protein: 0, carbs: 0, fats: 0, cgRatio: 0
    });

    const weeklyTotals: WeeklyMacros = days.reduce((acc, day) => {
        acc[day] = defaultDay(day);
        return acc;
    }, {} as WeeklyMacros);

    let weeklyAvgSum = { kcal: 0, p: 0, c: 0, g: 0, cgRatio: 0 };
    let activeDaysCount = 0;

    // Aggregate macros per day
    mealPlans.forEach(plan => {
        const { kcal, p, c, g } = calculateItemMacros(plan.foods, plan.target_quantity);
        const day = plan.day_of_week;

        weeklyTotals[day].kcal += kcal;
        weeklyTotals[day].protein += p;
        weeklyTotals[day].carbs += c;
        weeklyTotals[day].fats += g;
    });

    // Calculate C:G ratio and weekly averages
    days.forEach(day => {
        const totals = weeklyTotals[day];
        if (totals.kcal > 0) {
            totals.cgRatio = totals.fats > 0 ? totals.carbs / totals.fats : 0;

            weeklyAvgSum.kcal += totals.kcal;
            weeklyAvgSum.p += totals.protein;
            weeklyAvgSum.c += totals.carbs;
            weeklyAvgSum.g += totals.fats;
            weeklyAvgSum.cgRatio += totals.cgRatio;
            activeDaysCount++;
        }
    });

    const weeklyAverage = activeDaysCount > 0 ? {
        kcal: weeklyAvgSum.kcal / activeDaysCount,
        protein: weeklyAvgSum.p / activeDaysCount,
        carbs: weeklyAvgSum.c / activeDaysCount,
        fats: weeklyAvgSum.g / activeDaysCount,
        cgRatio: weeklyAvgSum.cgRatio / activeDaysCount
    } : { ...weeklyAvgSum, protein: 0, carbs: 0, fats: 0 };

    return {
        days,
        weeklyTotals,
        weeklyAverage
    };
};
