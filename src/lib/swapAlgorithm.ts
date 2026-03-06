import type { Food } from '../types/database';
import { calculateItemMacros } from '../hooks/useDietData';

export type PrimaryMacro = 'P' | 'C' | 'G';

export interface SwapResult {
    originalFood: Food;
    newFood: Food;
    primaryMacro: PrimaryMacro;
    targetAmount: number; // The amount of the primary macro we need to hit
    newQuantity: number;  // The calculated weight (in grams/ml etc) for the new food
    macroDifferences: {
        kcal: number;
        p: number;
        c: number;
        g: number;
    };
    warnings: string[];
}

/**
 * Determines which macro brings the most calories to the food, 
 * or alternatively just uses absolute weight.
 * For bodybuilding diets, Protein is usually king, then Carbs.
 */
function determinePrimaryMacro(food: Food): PrimaryMacro {
    // We compare absolute grams per 100g.
    // If protein is the highest, it's a protein source.
    const { protein, carbs, fats } = food;
    
    if (protein >= carbs && protein > fats * 2.5) { // Fats have 2.25x more calories per gram, be slightly biased
        return 'P';
    } else if (fats > protein * 2 && fats > carbs) {
        return 'G';
    } else {
        return 'C';
    }
}

/**
 * Calculates the required quantity of a new food to match the primary macro of the original food portion.
 */
export function calculateSwap(originalFood: Food, originalQuantity: number, newFood: Food): SwapResult | null {
    if (!originalFood || !newFood || originalQuantity <= 0) return null;

    const primaryMacro = determinePrimaryMacro(originalFood);
    const originalMacros = calculateItemMacros(originalFood, originalQuantity);
    
    let targetAmount = 0;
    let newFoodMacroPerUnit = 0; // The amount of the primary macro per 1 unit of `portion_size` (usually 100g)

    if (primaryMacro === 'P') {
        targetAmount = originalMacros.p;
        newFoodMacroPerUnit = newFood.protein;
    } else if (primaryMacro === 'C') {
        targetAmount = originalMacros.c;
        newFoodMacroPerUnit = newFood.carbs;
    } else {
        targetAmount = originalMacros.g;
        newFoodMacroPerUnit = newFood.fats;
    }

    // Edge case: if the new food has NONE of the target macro, we can't swap
    if (newFoodMacroPerUnit <= 0) {
        return {
            originalFood,
            newFood,
            primaryMacro,
            targetAmount,
            newQuantity: 0,
            macroDifferences: { kcal: 0, p: 0, c: 0, g: 0 },
            warnings: [`${newFood.name} non contiene abbastanza ${primaryMacro} per effettuare lo scambio.`]
        };
    }

    // Calculation: (Target Macro Amount / New Food Macro Per 1g)
    // First find how much primary macro is in 1 unit of the *new* food
    const macroPerSingleUnit = newFoodMacroPerUnit / newFood.portion_size;
    
    // Then figure out how many units we need to hit the target
    const rawNewQuantity = targetAmount / macroPerSingleUnit;
    
    // Round to nearest whole number, or to 1 decimal if less than 10 (like for oils)
    const newQuantity = rawNewQuantity > 10 ? Math.round(rawNewQuantity) : Number(rawNewQuantity.toFixed(1));

    // Now calculate the *actual* macros this new quantity provides
    const newMacros = calculateItemMacros(newFood, newQuantity);

    // Calculate differences (New - Original)
    // Positive means the new food adds MORE of that macro. Negative means it has LESS.
    const diff = {
        kcal: newMacros.kcal - originalMacros.kcal,
        p: newMacros.p - originalMacros.p,
        c: newMacros.c - originalMacros.c,
        g: newMacros.g - originalMacros.g,
    };

    const warnings: string[] = [];
    
    // Generate Warnings based on differences
    if (Math.abs(diff.g) > 5) {
        warnings.push(`Attenzione: Questo scambio altera i grassi di ${diff.g > 0 ? '+' : ''}${diff.g.toFixed(1)}g`);
    }
    
    if (Math.abs(diff.c) > 15) {
        warnings.push(`Attenzione: Questo scambio altera i carboidrati di ${diff.c > 0 ? '+' : ''}${diff.c.toFixed(1)}g`);
    }

    if (Math.abs(diff.kcal) > 100) {
        warnings.push(`Attenzione: Differenza calorica significativa (${diff.kcal > 0 ? '+' : ''}${Math.round(diff.kcal)} kcal)`);
    }

    return {
        originalFood,
        newFood,
        primaryMacro,
        targetAmount,
        newQuantity,
        macroDifferences: diff,
        warnings
    };
}
