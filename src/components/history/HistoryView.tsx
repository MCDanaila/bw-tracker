import { useState, useMemo } from 'react';
import { useHistoryLogs } from '@/hooks/useHistoryLogs';
import { Loader2, CalendarRange } from 'lucide-react';
import HeatmapCalendar from './HeatmapCalendar';
import DailySummaryCard from './DailySummaryCard';

export default function HistoryView() {
    const { data: logs, isLoading, error } = useHistoryLogs();

    // Default to today
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    });

    // Find the log for the currently selected date
    const selectedLog = useMemo(() => {
        if (!logs) return null;
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return logs.find(log => log.date === dateStr) || null;
    }, [logs, selectedDate]);

    // Simple stats
    const stats = useMemo(() => {
        if (!logs) return { total: 0, thisMonth: 0, streak: 0 };
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let thisMonthCount = 0;
        let streak = 0;
        let currentDate = new Date(now);
        currentDate.setHours(0, 0, 0, 0);

        // Simple streak calc (if they logged yesterday, today etc)
        const logDates = new Set(logs.map(l => l.date));

        for (let i = 0; i < 90; i++) {
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            if (logDates.has(dateStr)) {
                streak++;
            } else if (i > 0) {
                // If we miss a day (and it's not today yet to be logged), break streak
                // A true streak calc handles timezone edge cases, keeping it simple here
                break;
            }

            // Month count
            if (currentDate.getMonth() === currentMonth && currentDate.getFullYear() === currentYear) {
                if (logDates.has(dateStr)) thisMonthCount++;
            }

            currentDate.setDate(currentDate.getDate() - 1);
        }

        return {
            total: logs.length,
            thisMonth: thisMonthCount,
            streak
        };
    }, [logs]);


    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                Error loading history.
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
                <Loader2 className="animate-spin text-primary" size={32} />
                <span className="text-sm font-medium">Loading logs...</span>
            </div>
        );
    }

    return (
        <div className="w-full max-w-lg mx-auto p-4 pb-24 space-y-6 animate-fade-in text-foreground">

            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 text-primary rounded-xl">
                    <CalendarRange size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">History</h1>
                    <p className="text-sm text-muted-foreground">Review your past progress</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-card border border-border/50 rounded-xl p-3 text-center shadow-sm">
                    <div className="text-2xl font-bold">{stats.thisMonth}</div>
                    <div className="text-xs text-muted-foreground">Month Logs</div>
                </div>
                <div className="bg-card border border-border/50 rounded-xl p-3 text-center shadow-sm">
                    <div className="text-2xl font-bold text-primary">{stats.streak} 🔥</div>
                    <div className="text-xs text-muted-foreground">Current Streak</div>
                </div>
                <div className="bg-card border border-border/50 rounded-xl p-3 text-center shadow-sm">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <div className="text-xs text-muted-foreground">Total Logs</div>
                </div>
            </div>

            {/* Heatmap Region */}
            <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
                <HeatmapCalendar
                    logs={logs || []}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                />
            </div>

            {/* Details Region */}
            <DailySummaryCard log={selectedLog} date={selectedDate} />

        </div>
    );
}
