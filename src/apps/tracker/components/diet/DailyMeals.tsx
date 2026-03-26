import type { Food, MealPlan } from '@/core/types/database';
import { calculateItemMacros, type DayOfWeek } from '@/core/hooks/useDietData';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw, ChevronDown } from 'lucide-react';
import FoodSearchModal from './FoodSearchModal';
import SwapPreviewModal from './SwapPreviewModal';
import { type SwapResult } from '@/core/lib/swapAlgorithm';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/core/components/ui/collapsible";
import { supabase } from '@/core/lib/supabase';
import { getLocalDateStr } from '@/core/lib/utils';
import { useAuth } from '@/core/contexts/AuthContext';

interface DailyMealsProps {
    day: DayOfWeek;
    mealPlans: MealPlan[]; // Expected to be filtered for the specific day by the parent
}

export default function DailyMeals({ day, mealPlans }: DailyMealsProps) {
    const { user } = useAuth();
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

    const handleConfirmSwap = async (result: SwapResult) => {
        if (swapState.activePlan && user?.id) {
            // Update local state for UI
            setLocalSwaps(prev => ({
                ...prev,
                [swapState.activePlan!.id]: {
                    food: result.newFood,
                    quantity: result.newQuantity
                }
            }));

            // Persist to meal_adherence table
            try {
                await supabase.from('meal_adherence').upsert({
                    user_id: user.id,
                    date: getLocalDateStr(),
                    meal_plan_id: swapState.activePlan.id,
                    is_completed: true,
                    swapped_food_id: result.newFood.id,
                    swapped_quantity: result.newQuantity,
                }, { onConflict: 'user_id,date,meal_plan_id' });

                toast('Swap saved.');
            } catch (error) {
                console.error('Failed to save swap:', error);
                toast.error('Failed to save swap');
            }
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
            <div className="text-center p-8 bg-card rounded-xl shadow-sm border border-border/50 text-card-foreground">
                <p className="text-muted-foreground">No meal plan for {day}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
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
                    <Collapsible key={mealName} defaultOpen className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden text-card-foreground">
                        <div className="p-4 sm:p-5">
                            {/* Header row */}
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-foreground text-lg capitalize">
                                        {mealName.toLowerCase()}
                                    </h3>
                                    <span className="bg-primary text-primary-foreground text-2xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        {mealName}
                                    </span>
                                </div>
                            </div>

                            {/* Macros summary */}
                            <div className="text-sm font-medium text-muted-foreground mb-4 flex gap-2 flex-wrap items-center">
                                <span>C {formatNumber(mealTotals.c, 0)}g</span>
                                <span className="opacity-30">|</span>
                                <span>P {formatNumber(mealTotals.p, 0)}g</span>
                                <span className="opacity-30">|</span>
                                <span>G {formatNumber(mealTotals.g, 0)}g</span>
                                <span className="opacity-50 ml-1">•</span>
                                <span className="text-primary ml-1">{formatNumber(mealTotals.kcal, 0)} kcal</span>
                            </div>

                            {/* Separator & Trigger */}
                            <div className="border-t border-border/50 pt-3">
                                <CollapsibleTrigger className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary w-full text-left transition-colors group outline-none">
                                    <ChevronDown size={16} className="text-muted-foreground group-data-[state=open]:rotate-180 transition-transform duration-200" />
                                    Foods
                                </CollapsibleTrigger>
                            </div>

                            {/* Expanded Content */}
                            <CollapsibleContent className="CollapsibleContent">
                                <div className="space-y-4 mt-4">
                                    {items.map(plan => {
                                        const localSwap = localSwaps[plan.id];
                                        const isSwapped = !!localSwap;
                                        const food = isSwapped ? localSwap.food : plan.foods;
                                        const quantity = isSwapped ? localSwap.quantity : plan.target_quantity;

                                        return (
                                            <div key={plan.id} className="flex justify-between items-center group/item pl-6">
                                                <div className="flex items-baseline gap-2">
                                                    <span className={`text-sm font-medium ${isSwapped ? 'text-primary' : 'text-foreground'}`}>
                                                        {food?.name || 'Unknown Food'}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {quantity}{food?.unit || 'g'}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleOpenSwapSearch(plan)}
                                                    className={`p-1.5 rounded-full transition-colors shrink-0 ${isSwapped ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary hover:bg-muted/50 sm:opacity-0 group-hover/item:opacity-100"
                                                        }`}
                                                    title="Sostituisci"
                                                    aria-label="Swap food"
                                                >
                                                    <RefreshCw size={14} className={isSwapped ? "stroke-[2.5px]" : ""} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CollapsibleContent>
                        </div>
                    </Collapsible>
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
