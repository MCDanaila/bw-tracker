import type { MealPlan } from '../../types/database';
import { calculateItemMacros, type DayOfWeek } from '../../hooks/useDietData';
import { useMemo } from 'react';

interface DailyMealsProps {
    day: DayOfWeek;
    mealPlans: MealPlan[]; // Expected to be filtered for the specific day by the parent
}

export default function DailyMeals({ day, mealPlans }: DailyMealsProps) {
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
                    const macros = calculateItemMacros(plan.foods, plan.target_quantity);
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
                                        const food = plan.foods;
                                        const macros = calculateItemMacros(food, plan.target_quantity);

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
                                                    {food?.name || 'Unknown Food'}
                                                </td>
                                                <td className="p-2 border-r border-gray-100">{plan.target_quantity}</td>
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
        </div>
    );
}
