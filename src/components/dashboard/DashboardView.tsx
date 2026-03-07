import { useState } from 'react';
import { useDashboardData, type TimeRange } from '../../hooks/useDashboardData';
import { Loader2 } from 'lucide-react';
import WeightChart from './WeightChart';
import StepsChart from './StepsChart';

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
        <div className="w-full max-w-md mx-auto p-4 pb-24 space-y-6 animate-fade-in">
            {/* Header & Range Selector */}
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">Statistiche</h1>
                
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    {TIME_RANGES.map((r) => (
                        <button
                            key={r.value}
                            onClick={() => setRange(r.value)}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                range === r.value 
                                    ? 'bg-white text-[#8b76c8] shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Charts Loading State */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
                    <Loader2 className="animate-spin text-[#8b76c8]" size={32} />
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
