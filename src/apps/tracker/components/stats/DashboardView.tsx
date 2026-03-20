import { useState } from 'react';
import { useDashboardData, type TimeRange } from '@/core/hooks/useDashboardData';
import { Loader2 } from 'lucide-react';
import WeightChart from './WeightChart';
import StepsChart from './StepsChart';
import { Tabs, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { useProfile, STEPS_GOAL_DEFAULT } from '@/core/hooks/useProfile';

const TIME_RANGES: { value: TimeRange; label: string }[] = [
    { value: '7d', label: '7d' },
    { value: '14d', label: '14d' },
    { value: '1m', label: '1m' },
    { value: '3m', label: '3m' },
    { value: 'all', label: 'All' }
];

export default function DashboardView() {
    const [range, setRange] = useState<TimeRange>('7d');
    const { data: logData, isLoading, error } = useDashboardData(range);
    const { data: profile } = useProfile();

    if (error) {
        return (
            <div className="p-8 text-center text-destructive">
                Error loading statistics.
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto p-4 pb-24 space-y-6 animate-fade-in text-foreground">
            {/* Header & Range Selector */}
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-black tracking-tight">Statistics</h1>

                <Tabs value={range} onValueChange={(value) => setRange(value as TimeRange)} className="w-full">
                    <TabsList className="w-full grid grid-cols-5 h-9 bg-muted/50 text-muted-foreground p-1">
                        {TIME_RANGES.map((r) => (
                            <TabsTrigger
                                key={r.value}
                                value={r.value}
                                className="text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                            >
                                {r.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            {/* Charts Loading State */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
                    <Loader2 className="animate-spin text-primary" size={32} />
                    <span className="text-sm font-medium">Processing data...</span>
                </div>
            ) : (
                <>
                    {/* Weight Chart */}
                    <WeightChart data={logData || []} />

                    {/* Steps Chart */}
                    <StepsChart data={logData || []} targetSteps={profile?.steps_goal ?? STEPS_GOAL_DEFAULT} />
                </>
            )}
        </div>
    );
}
