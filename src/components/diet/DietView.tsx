import { useState, useMemo } from 'react';
import { useDietData, useWeeklyOverview, type DayOfWeek } from '@/hooks/useDietData';
import WeeklyOverview from '@/components/diet/WeeklyOverview';
import DailyMeals from '@/components/diet/DailyMeals';
import { Loader2 } from 'lucide-react';

export default function DietView() {
    const { data: mealPlans, isLoading, error } = useDietData();

    // Get current day of week in Italian abbreviation
    const getCurrentDayOfWeek = (): DayOfWeek => {
        const days: DayOfWeek[] = ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB'];
        const date = new Date();
        // getDay() returns 0 for Sunday
        return days[date.getDay()];
    };

    const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getCurrentDayOfWeek());

    const overviewData = useWeeklyOverview(mealPlans || []);

    const selectedDayMeals = useMemo(() => {
        if (!mealPlans) return [];
        return mealPlans.filter(plan => plan.day_of_week === selectedDay);
    }, [mealPlans, selectedDay]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p>Caricamento piano alimentare...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl m-4">
                Error loading diet data: {error.message}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800">Piano Alimentare</h2>

            <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Weekly Overview
                </h3>
                <WeeklyOverview {...overviewData} />
            </section>

            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                        Daily View &gt; {selectedDay}
                    </h3>

                    {/* Day Selector (for testing / viewing other days) */}
                    <div className="flex gap-1 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0">
                        {overviewData.days.map(day => (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`
                                    px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors
                                    ${selectedDay === day
                                        ? 'bg-[#8b76c8] text-white shadow-sm'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }
                                `}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </div>

                <DailyMeals day={selectedDay} mealPlans={selectedDayMeals} />
            </section>
        </div>
    );
}
