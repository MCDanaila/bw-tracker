import { useState } from 'react';
import { useDashboardData, type TimeRange } from '@/hooks/useDashboardData';
import { Loader2 } from 'lucide-react';
import WeightChart from '@/components/dashboard/WeightChart';
import StepsChart from '@/components/dashboard/StepsChart';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TIME_RANGES: { value: TimeRange; label: string }[] = [
    { value: '7d', label: '7g' },
    { value: '14d', label: '14g' },
    { value: '1m', label: '1m' },
    { value: '3m', label: '3m' },
    { value: 'all', label: 'Tutto' }
];

export default function DashboardView() {
    const [range, setRange] = useState<TimeRange>('7d');
    const { data: logData, isLoading, error } = useDashboardData(range);

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                Errore nel caricamento delle statistiche.
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto p-4 pb-24 space-y-6 animate-fade-in text-foreground">
            {/* Header & Range Selector */}
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-black tracking-tight">Statistiche</h1>

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
                    <span className="text-sm font-medium">Elaborazione dati...</span>
                </div>
            ) : (
                <>
                    {/* Weight Chart */}
                    <WeightChart data={logData || []} />

                    {/* Steps Chart */}
                    <StepsChart data={logData || []} targetSteps={10000} />
                </>
            )}
        </div>
    );
}
