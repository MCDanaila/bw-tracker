import { useState, useMemo } from 'react';
import { type DailyLog } from '@/types/database';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface HeatmapCalendarProps {
    logs: DailyLog[];
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}

// Generate the days for a specific month and year (horizontal calendar rows)
const generateMonthCalendar = (year: number, month: number) => {
    const dates: Date[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDay.getDay();

    for (let i = 0; i < startDayOfWeek; i++) {
        dates.push(new Date(0));
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
        dates.push(new Date(year, month, i));
    }

    const remainder = dates.length % 7;
    if (remainder !== 0) {
        for (let i = 0; i < 7 - remainder; i++) {
            dates.push(new Date(0));
        }
    }

    const weeks: Date[][] = [];
    for (let i = 0; i < dates.length; i += 7) {
        weeks.push(dates.slice(i, i + 7));
    }

    return weeks;
};

export default function HeatmapCalendar({ logs, selectedDate, onSelectDate }: HeatmapCalendarProps) {

    // --- Month Calendar Logic ---
    const [viewDate, setViewDate] = useState(() => {
        const d = new Date(selectedDate);
        d.setDate(1);
        return d;
    });

    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth();
    const calendarMonthWeeks = useMemo(() => generateMonthCalendar(currentYear, currentMonth), [currentYear, currentMonth]);

    // --- Common Logic ---
    const logMap = useMemo(() => {
        const map = new Map<string, DailyLog>();
        logs.forEach(log => {
            map.set(log.date, log);
        });
        return map;
    }, [logs]);

    const getIntensityClass = (date: Date) => {
        if (date.getTime() === 0) return 'opacity-0 cursor-default';

        // Correctly format local date to YYYY-MM-DD avoiding UTC shift bugs
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const log = logMap.get(dateStr);

        if (!log) return 'bg-muted/30 border-border/50 hover:border-primary/50';

        if (log.steps && log.steps >= 10000) return 'bg-primary border-primary';
        if (log.steps && log.steps >= 5000) return 'bg-primary/70 border-primary/70';
        return 'bg-primary/40 border-primary/40';
    };

    const isSelected = (date: Date) => {
        if (date.getTime() === 0) return false;
        return date.toDateString() === selectedDate.toDateString();
    };

    const handlePrevMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const monthName = viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <>
            {/* Header: Month Navigation */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                        aria-label="Previous month"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-semibold min-w-[100px] text-center text-foreground">{monthName}</span>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                        aria-label="Next month"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Heatmap Area */}
            <div className="w-full">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1.5 mb-2">
                    {weekdays.map(day => (
                        <div key={day} className="text-center text-[10px] font-medium text-muted-foreground">
                            {day}
                        </div>
                    ))}
                </div>
                {/* Calendar Grid */}
                <div className="flex flex-col gap-1.5">
                    <TooltipProvider delay={100}>
                        {calendarMonthWeeks.map((week, weekIdx) => (
                            <div key={`calweek-${weekIdx}`} className="grid grid-cols-7 gap-1.5">
                                {week.map((date, dayIdx) => {
                                    const isPad = date.getTime() === 0;
                                    let dateStr = '';
                                    if (!isPad) {
                                        const year = date.getFullYear();
                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                        const day = String(date.getDate()).padStart(2, '0');
                                        dateStr = `${year}-${month}-${day}`;
                                    }

                                    return (
                                        <div key={`calday-${weekIdx}-${dayIdx}`} className="flex items-center justify-center">
                                            <Tooltip>
                                                <TooltipTrigger
                                                    onClick={() => !isPad && onSelectDate(date)}
                                                    disabled={isPad}
                                                    className={cn(
                                                        "w-9 h-9 sm:w-10 sm:h-10 rounded-md border transition-all duration-200 flex items-center justify-center p-0 cursor-pointer",
                                                        getIntensityClass(date),
                                                        isSelected(date) ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110 z-10" : "hover:scale-105",
                                                        isPad ? "opacity-0" : ""
                                                    )}
                                                    aria-label={!isPad ? date.toDateString() : 'empty'}
                                                >
                                                    {!isPad && <span className={cn(
                                                        "text-xs font-medium cursor-pointer",
                                                        (logMap.get(dateStr)?.steps && logMap.get(dateStr)!.steps! >= 5000) ? "text-primary-foreground" : "text-foreground"
                                                    )}>{date.getDate()}</span>}
                                                </TooltipTrigger>
                                                {!isPad && (
                                                    <TooltipContent side="top" className="text-xs">
                                                        {date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long' })}
                                                        {logMap.has(dateStr) ? ` • Logged (${logMap.get(dateStr)?.steps || 0} steps)` : ' • No log'}
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </TooltipProvider>
                </div>
            </div>
        </>
    );
}
