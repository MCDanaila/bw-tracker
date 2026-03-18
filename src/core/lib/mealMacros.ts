import type { Food } from '@/core/types/database';

/**
 * Pure function: Calculate macros from a food's base per-portion values and a target quantity.
 * No React dependencies. Used by both diet hooks and swap algorithm.
 *
 * @param food Food record with portion_size and macro values
 * @param quantity Amount of the food (in grams/ml/units matching food.portion_size)
 * @returns Object with calculated kcal, p (protein), c (carbs), g (fats)
 */
export const calculateItemMacros = (food: Food | null | undefined, quantity: number) => {
    if (!food) return { kcal: 0, p: 0, c: 0, g: 0 };

    // Most items are per 100g/ml, but pieces might be per 1 unit.
    // The DB schema standard: calories/macros are for `portion_size` (usually 100 or 1).
    const ratio = quantity / food.portion_size;

    return {
        kcal: food.calories * ratio,
        p: food.protein * ratio,
        c: food.carbs * ratio,
        g: food.fats * ratio,
    };
};
