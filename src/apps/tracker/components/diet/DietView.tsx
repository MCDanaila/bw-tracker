import { useState, useMemo } from 'react';
import { useDietData, useWeeklyOverview, type DayOfWeek } from '@/core/hooks/useDietData';
import WeeklyOverview from './WeeklyOverview';
import DailyMeals from './DailyMeals';
import { PageSpinner } from '@/core/components/ui/PageSpinner';
import { Tabs, TabsList, TabsTrigger } from "@/core/components/ui/tabs";

export default function DietView() {
    const { data: mealPlans, isLoading, error } = useDietData();

    // Get current day of week in Italian abbreviation
    const getCurrentDayOfWeek = (): DayOfWeek => {
        const days: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
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
        return <PageSpinner message="Caricamento piano alimentare..." />;
    }

    if (error) {
        return (
            <div className="p-4 bg-destructive/10 text-destructive rounded-xl m-4">
                Error loading diet data: {error.message}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-foreground">
            <h2 className="text-xl font-bold">Piano Alimentare</h2>

            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Weekly Overview
                    </h3>
                </div>
                <WeeklyOverview {...overviewData} />
            </section>

            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Daily Meals
                    </h3>
                </div>
                <div className="w-full mb-4">
                    <Tabs
                        value={selectedDay}
                        onValueChange={(val) => setSelectedDay(val as DayOfWeek)}
                        className="w-full"
                    >
                        <div className="w-full rounded-2xl bg-muted p-2">
                            <TabsList className="grid w-full !h-auto grid-cols-4 md:grid-cols-7 gap-2 bg-transparent p-0">                                {overviewData.days.map((day) => (
                                <TabsTrigger
                                    key={day}
                                    value={day}
                                    className="w-full min-h-[44px] rounded-xl px-3 py-2 text-sm font-semibold
             data-[state=active]:bg-background
             data-[state=active]:text-foreground
             data-[state=active]:shadow-sm"
                                >
                                    {day}
                                </TabsTrigger>
                            ))}
                            </TabsList>
                        </div>
                    </Tabs>
                </div>

                <DailyMeals day={selectedDay} mealPlans={selectedDayMeals} />
            </section>
        </div>
    );
}
