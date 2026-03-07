import type { Food, MealPlan } from '@/types/database';
import { calculateItemMacros, type DayOfWeek } from '@/hooks/useDietData';
import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import FoodSearchModal from '@/components/diet/FoodSearchModal';
import SwapPreviewModal from '@/components/diet/SwapPreviewModal';
import { type SwapResult } from '@/lib/swapAlgorithm';

interface DailyMealsProps {
    day: DayOfWeek;
    mealPlans: MealPlan[]; // Expected to be filtered for the specific day by the parent
}

export default function DailyMeals({ day, mealPlans }: DailyMealsProps) {
    const [swapState, setSwapState] = useState<{
        isSearchOpen: boolean;
        isPreviewOpen: boolean;
        activePlan: MealPlan | null;
        selectedNewFood: Food | null;
    }>({
        isSearchOpen: false,
        isPreviewOpen: false,
        activePlan: null,
        selectedNewFood: null,
    });

    // Local state to track confirmed swaps for the UI since we aren't saving to DB yet
    // Record<MealPlan.id, { newFood: Food, newQuantity: number }>
    const [localSwaps, setLocalSwaps] = useState<Record<string, { food: Food; quantity: number }>>({});

    const handleOpenSwapSearch = (plan: MealPlan) => {
        setSwapState({ ...swapState, isSearchOpen: true, activePlan: plan });
    };

    const handleSelectNewFood = (food: Food) => {
        setSwapState({ 
            ...swapState, 
            isSearchOpen: false, 
            isPreviewOpen: true, 
            selectedNewFood: food 
        });
    };

    const handleConfirmSwap = (result: SwapResult) => {
        if (swapState.activePlan) {
            setLocalSwaps(prev => ({
                ...prev,
                [swapState.activePlan!.id]: {
                    food: result.newFood,
                    quantity: result.newQuantity
                }
            }));
        }
        
        setSwapState({
            isSearchOpen: false,
            isPreviewOpen: false,
            activePlan: null,
            selectedNewFood: null
        });
    };

    const formatNumber = (num: number, maxDecimals: number = 1) => {
        // If it's a whole number, don't show decimals. If it's not, show up to maxDecimals
        return Number.isInteger(num)
            ? num.toString()
            : num.toLocaleString('it-IT', { maximumFractionDigits: maxDecimals });
    };

    // Group items by meal_name
    const { mealsByGroup, mealNames } = useMemo(() => {
        const groups: Record<string, MealPlan[]> = {};
        const names: string[] = [];

        // Simple sort to keep meals in order (MEAL 1, INTRA, MEAL 2 etc based on creation or alphabetical)
        // Ideally there's a meal order index in the DB, but for now we trust the DB order or sort by name
        const sortedPlans = [...mealPlans].sort((a, b) => a.meal_name.localeCompare(b.meal_name));

        sortedPlans.forEach(plan => {
            if (!groups[plan.meal_name]) {
                groups[plan.meal_name] = [];
                names.push(plan.meal_name);
            }
            groups[plan.meal_name].push(plan);
        });

        // Try to properly order specific known meal names if present
        const orderedNames = [...names].sort((a, b) => {
            const getOrder = (name: string) => {
                if (name.includes('PRE') || name.includes('MEAL 1')) return 1;
                if (name.includes('INTRA') || name.includes('MEAL 2')) return 2;
                if (name.includes('POST')) return 3;
                if (name.includes('MEAL 3')) return 4;
                if (name.includes('MEAL 4')) return 5;
                if (name.includes('MEAL 5')) return 6;
                return 99; // unknown goes last
            };
            return getOrder(a) - getOrder(b);
        });

        return { mealsByGroup: groups, mealNames: orderedNames };
    }, [mealPlans]);

    if (mealPlans.length === 0) {
        return (
            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500">Nessun piano alimentare per {day}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header Title */}
            <div className="bg-[#8b76c8] text-white text-center py-2 rounded-t-xl font-bold uppercase tracking-wider shadow-sm">
                {day}
            </div>

            {/* Render Each Meal Group */}
            {mealNames.map((mealName) => {
                const items = mealsByGroup[mealName];

                // Calculate Meal Totals
                const mealTotals = items.reduce((acc, plan) => {
                    const localSwap = localSwaps[plan.id];
                    const activeFood = localSwap ? localSwap.food : plan.foods;
                    const activeQuantity = localSwap ? localSwap.quantity : plan.target_quantity;
                    
                    const macros = calculateItemMacros(activeFood, activeQuantity);
                    return {
                        kcal: acc.kcal + macros.kcal,
                        p: acc.p + macros.p,
                        c: acc.c + macros.c,
                        g: acc.g + macros.g
                    };
                }, { kcal: 0, p: 0, c: 0, g: 0 });

                return (
                    <div key={mealName} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="bg-[#8b76c8] text-white text-xs text-center border-b border-[#9b88d2]">
                                        <th className="p-2 w-24 border-r border-[#9b88d2] font-semibold">{mealName.toUpperCase()}</th>
                                        <th className="p-2 border-r border-[#9b88d2] font-semibold border-b border-b-white/20">ALIMENTO</th>
                                        <th className="p-2 border-r border-[#9b88d2] font-semibold border-b border-b-white/20">QUANTITÀ</th>
                                        <th className="p-2 border-r border-[#9b88d2] font-semibold text-[10px] leading-tight border-b border-b-white/20">UNITÀ DI<br />MISURA</th>
                                        <th className="p-2 border-r border-[#9b88d2] font-semibold border-b border-b-white/20">KCAL</th>
                                        <th className="p-2 border-r border-[#9b88d2] font-semibold border-b border-b-white/20">P</th>
                                        <th className="p-2 border-r border-[#9b88d2] font-semibold border-b border-b-white/20">C</th>
                                        <th className="p-2 font-semibold border-b border-b-white/20">G</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-700 text-center">
                                    {items.map((plan, index) => {
                                        const localSwap = localSwaps[plan.id];
                                        const isSwapped = !!localSwap;
                                        
                                        const food = isSwapped ? localSwap.food : plan.foods;
                                        const quantity = isSwapped ? localSwap.quantity : plan.target_quantity;
                                        const macros = calculateItemMacros(food, quantity);

                                        // Row style: light pink for the meal name column to match screenshot
                                        return (
                                            <tr key={plan.id} className="border-b border-gray-50">
                                                {/* Meal name column only on first row, with styling */}
                                                {index === 0 ? (
                                                    <td rowSpan={items.length + 2} className="p-2 bg-[#d797ab] text-white font-bold text-center border-r border-white align-middle">
                                                        {mealName.toUpperCase()}
                                                    </td>
                                                ) : null}

                                                {/* Note: the screenshot shows "INTEGRAZIONE" header rows. We'll simplify by just rendering items. 
                                                    If integration is heavily mixed, we'd need more complex grouping. */}
                                                <td className="p-2 border-r border-gray-100 font-medium text-left">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={isSwapped ? "text-[#8b76c8]" : ""}>
                                                            {food?.name || 'Unknown Food'}
                                                        </span>
                                                        <button 
                                                            onClick={() => handleOpenSwapSearch(plan)}
                                                            className={`p-1.5 rounded-full transition-colors ${
                                                                isSwapped 
                                                                    ? "bg-[#8b76c8]/10 text-[#8b76c8] hover:bg-[#8b76c8]/20" 
                                                                    : "text-gray-400 hover:text-[#8b76c8] hover:bg-gray-100"
                                                            }`}
                                                            title="Sostituisci"
                                                        >
                                                            <RefreshCw size={14} className={isSwapped ? "stroke-[2.5px]" : ""} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="p-2 border-r border-gray-100">
                                                    <span className={isSwapped ? "font-bold text-[#8b76c8]" : ""}>{quantity}</span>
                                                </td>
                                                <td className="p-2 border-r border-gray-100">{food?.unit || 'g'}</td>
                                                <td className="p-2 border-r border-gray-100">{formatNumber(macros.kcal)}</td>
                                                <td className="p-2 border-r border-gray-100">{formatNumber(macros.p)}</td>
                                                <td className="p-2 border-r border-gray-100">{formatNumber(macros.c)}</td>
                                                <td className="p-2">{formatNumber(macros.g)}</td>
                                            </tr>
                                        );
                                    })}

                                    {/* MEAL TOTAL ROW */}
                                    <tr className="bg-[#f2d0db] font-semibold text-[#8a1c40]">
                                        <td colSpan={3} className="p-2 text-center border-r border-white uppercase text-xs tracking-wider">
                                            MEAL TOTAL
                                        </td>
                                        <td className="p-2 border-r border-white">{formatNumber(mealTotals.kcal, 0)}</td>
                                        <td className="p-2 border-r border-white">{formatNumber(mealTotals.p, 0)}</td>
                                        <td className="p-2 border-r border-white">{formatNumber(mealTotals.c, 0)}</td>
                                        <td className="p-2">{formatNumber(mealTotals.g, 0)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
            {/* Modals placed outside the mapping */}
            <FoodSearchModal 
                isOpen={swapState.isSearchOpen} 
                onClose={() => setSwapState(s => ({ ...s, isSearchOpen: false }))}
                onSelectFood={handleSelectNewFood}
            />
            
            <SwapPreviewModal
                isOpen={swapState.isPreviewOpen}
                onClose={() => setSwapState(s => ({ ...s, isPreviewOpen: false }))}
                originalFood={swapState.activePlan?.foods || null}
                originalQuantity={swapState.activePlan?.target_quantity || 0}
                newFood={swapState.selectedNewFood}
                onConfirmSwap={handleConfirmSwap}
            />
        </div>
    );
}
