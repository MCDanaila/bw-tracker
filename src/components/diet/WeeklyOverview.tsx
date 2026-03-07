import type { DayOfWeek, WeeklyMacros } from '@/hooks/useDietData';

interface WeeklyOverviewProps {
    weeklyTotals: WeeklyMacros;
    weeklyAverage: {
        kcal: number;
        protein: number;
        carbs: number;
        fats: number;
        cgRatio: number;
    };
    days: DayOfWeek[];
}

export default function WeeklyOverview({ weeklyTotals, weeklyAverage, days }: WeeklyOverviewProps) {
    // Format numbers to 0 decimal places for macros, 2 for ratio
    const formatNumber = (num: number, decimals: number = 0) => {
        return num.toLocaleString('it-IT', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="overflow-x-auto">
                <table className="w-full text-center text-sm">
                    <thead>
                        <tr className="bg-[#8b76c8] text-white font-medium">
                            <th className="p-2 border-b border-r border-[#9b88d2] text-left w-20"></th>
                            {days.map(day => (
                                <th key={day} className="p-2 border-b border-r border-[#9b88d2] font-semibold min-w-[3.5rem]">{day}</th>
                            ))}
                            <th className="p-2 border-b border-[#9b88d2] font-bold">SETT</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {/* KCAL Row */}
                        <tr className="border-b border-gray-100">
                            <td className="p-2 bg-[#8b76c8] text-white font-semibold text-right border-r border-[#9b88d2]">KCAL</td>
                            {days.map(day => (
                                <td key={`kcal-${day}`} className="p-2 border-r border-gray-100">
                                    {formatNumber(weeklyTotals[day].kcal)}
                                </td>
                            ))}
                            <td className="p-2 font-bold bg-gray-50">{formatNumber(weeklyAverage.kcal)}</td>
                        </tr>

                        {/* P Row */}
                        <tr className="border-b border-gray-100">
                            <td className="p-2 bg-[#8b76c8] text-white font-semibold flex items-center justify-end gap-1 border-r border-[#9b88d2]">
                                {/* Using a simple emoji/text icon as fallback for now */}
                                <span className="text-lg">🥩</span> P
                            </td>
                            {days.map(day => (
                                <td key={`p-${day}`} className="p-2 border-r border-gray-100">
                                    {formatNumber(weeklyTotals[day].protein)}
                                </td>
                            ))}
                            <td className="p-2 font-bold bg-gray-50">{formatNumber(weeklyAverage.protein)}</td>
                        </tr>

                        {/* C Row */}
                        <tr className="border-b border-gray-100">
                            <td className="p-2 bg-[#8b76c8] text-white font-semibold flex items-center justify-end gap-1 border-r border-[#9b88d2]">
                                <span className="text-lg">🍞</span> C
                            </td>
                            {days.map(day => (
                                <td key={`c-${day}`} className="p-2 border-r border-gray-100">
                                    {formatNumber(weeklyTotals[day].carbs)}
                                </td>
                            ))}
                            <td className="p-2 font-bold bg-gray-50">{formatNumber(weeklyAverage.carbs)}</td>
                        </tr>

                        {/* G Row */}
                        <tr className="border-b border-gray-100">
                            <td className="p-2 bg-[#8b76c8] text-white font-semibold flex items-center justify-end gap-1 border-r border-[#9b88d2]">
                                <span className="text-lg">🫒</span> G
                            </td>
                            {days.map(day => (
                                <td key={`g-${day}`} className="p-2 border-r border-gray-100">
                                    {formatNumber(weeklyTotals[day].fats)}
                                </td>
                            ))}
                            <td className="p-2 font-bold bg-gray-50">{formatNumber(weeklyAverage.fats)}</td>
                        </tr>

                        {/* Ratio Row */}
                        <tr>
                            <td className="p-2 bg-[#8b76c8] text-white font-semibold text-right border-r border-[#9b88d2] text-xs">C:G RATIO</td>
                            {days.map(day => (
                                <td key={`ratio-${day}`} className="p-2 border-r border-gray-100 text-xs">
                                    {formatNumber(weeklyTotals[day].cgRatio, 2)}
                                </td>
                            ))}
                            <td className="p-2 font-bold bg-gray-50 text-xs">{formatNumber(weeklyAverage.cgRatio, 2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
