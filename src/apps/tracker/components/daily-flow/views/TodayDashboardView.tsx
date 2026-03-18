import type { ViewState } from "../DailyLogHub";
import type { DailyLog } from "@/core/types/database";
import { Progress } from "@/core/components/ui/progress";
import { ChevronRight, ChevronDown, CheckCircle2, Circle, Target, Flame, Activity, Droplets, Moon, Timer } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/core/components/ui/collapsible";
import { useState } from "react";
import { useStreak } from "@/core/hooks/useStreak";
import { useProfile, STEPS_GOAL_DEFAULT, WATER_GOAL_DEFAULT } from "@/core/hooks/useProfile";

interface TodayDashboardViewProps {
    todayLog: any;
    onNavigate: (view: ViewState) => void;
}

// Field lists for per-section completion tracking
const MORNING_FIELDS: (keyof DailyLog)[] = [
    "weight_fasting", "sleep_hours", "sleep_quality", "mood", "stress_level", "hrv", "soreness_level"
];
const TRAINING_FIELDS: (keyof DailyLog)[] = [
    "steps", "workout_session", "workout_duration", "gym_rpe", "gym_energy", "gym_mood", "cardio_liss_mins", "cardio_hiit_mins"
];
const EOD_FIELDS: (keyof DailyLog)[] = [
    "water_liters", "salt_grams", "diet_adherence", "digestion_rating", "daily_energy", "general_notes"
];

function countFilled(log: any, fields: string[]): number {
    if (!log) return 0;
    return fields.filter(f => log[f] !== null && log[f] !== undefined && log[f] !== "").length;
}

export function TodayDashboardView({ todayLog, onNavigate }: TodayDashboardViewProps) {
    const streak = useStreak();
    const { data: profile } = useProfile();
    const [isGoalsOpen, setIsGoalsOpen] = useState(false);
    const stepsGoal = profile?.steps_goal ?? todayLog?.steps_goal ?? STEPS_GOAL_DEFAULT;
    const waterGoal = profile?.water_goal ?? WATER_GOAL_DEFAULT;

    // Per-section completion percentages based on fields filled
    const morningFilled = countFilled(todayLog, MORNING_FIELDS);
    const trainingFilled = countFilled(todayLog, TRAINING_FIELDS);
    const eodFilled = countFilled(todayLog, EOD_FIELDS);

    const morningPct = Math.round((morningFilled / MORNING_FIELDS.length) * 100);
    const trainingPct = Math.round((trainingFilled / TRAINING_FIELDS.length) * 100);
    const eodPct = Math.round((eodFilled / EOD_FIELDS.length) * 100);

    const isMorningDone = morningPct >= 60;
    const isTrainingDone = trainingPct >= 60;
    const isEndOfDayDone = eodPct >= 60;

    const totalProgress = Math.round((morningPct + trainingPct + eodPct) / 3);

    // Goal Calculations based on logged data
    const waterLiters = todayLog?.water_liters || 0;
    const sleepHours = todayLog?.sleep_hours || 0;
    const steps = todayLog?.steps || 0;
    const cardioMins = (todayLog?.cardio_hiit_mins || 0) + (todayLog?.cardio_liss_mins || 0);

    const waterProgress = Math.min((waterLiters / waterGoal) * 100, 100);
    const sleepProgress = Math.min((sleepHours / 8) * 100, 100);
    const stepsProgress = Math.min((steps / stepsGoal) * 100, 100);
    const cardioProgress = Math.min((cardioMins / 150) * 100, 100);

    // Recovery Score — weighted multi-signal formula
    const signals = [
        { value: todayLog?.sleep_quality ?? null, weight: 0.30, normalize: (v: number) => (v / 10) * 100 },
        { value: todayLog?.sleep_hours ?? null,   weight: 0.20, normalize: (v: number) => Math.min(v / 8, 1) * 100 },
        { value: todayLog?.stress_level ?? null,  weight: 0.25, normalize: (v: number) => ((10 - v) / 9) * 100 },
        { value: todayLog?.mood ?? null,          weight: 0.15, normalize: (v: number) => ((v - 1) / 4) * 100 },
        { value: todayLog?.soreness_level ?? null, weight: 0.10, normalize: (v: number) => ((5 - v) / 4) * 100 },
        // TODO: add HRV delta component once 7-day baseline is available
    ];

    const available = signals.filter(s => s.value !== null && s.value !== undefined);
    const totalWeight = available.reduce((sum, s) => sum + s.weight, 0);
    const recoveryScore = available.length > 0 && (todayLog?.sleep_quality != null || todayLog?.sleep_hours != null)
        ? Math.round(available.reduce((sum, s) => sum + (s.normalize(s.value!) * s.weight), 0) / totalWeight)
        : null;

    const recoveryMessage = recoveryScore !== null
        ? recoveryScore < 40
            ? "Your body needs rest. Prioritize sleep and recovery today."
            : recoveryScore < 70
                ? "Decent recovery. Stay consistent and keep up the effort."
                : "Your recovery today was strong. Nice work!"
        : null;

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header / Total Progress */}
            <div className="flex items-center justify-between mt-4 mb-2">
                <h1 className="text-3xl font-black text-primary tracking-tight">Today</h1>
                <span className="text-sm font-bold text-muted-foreground">{totalProgress}%</span>
            </div>
            <Progress value={totalProgress} className="h-2 mb-8 bg-secondary" />

            {/* Navigation Menu — always visible */}
            <div className="space-y-3">
                <MenuButton
                    title="Morning Check-In"
                    subtitle={`${morningFilled} / ${MORNING_FIELDS.length} fields`}
                    icon={isMorningDone ? <CheckCircle2 className="text-green-500" /> : <Circle className="text-muted-foreground" />}
                    onClick={() => onNavigate("morning")}
                />
                <MenuButton
                    title="Workout Log"
                    subtitle={`${trainingFilled} / ${TRAINING_FIELDS.length} fields`}
                    icon={isTrainingDone ? <CheckCircle2 className="text-green-500" /> : <Circle className="text-muted-foreground" />}
                    onClick={() => onNavigate("training")}
                />
                <MenuButton
                    title="End of Day"
                    subtitle={`${eodFilled} / ${EOD_FIELDS.length} fields`}
                    icon={isEndOfDayDone ? <CheckCircle2 className="text-green-500" /> : <Circle className="text-muted-foreground" />}
                    onClick={() => onNavigate("end_of_day")}
                />
            </div>

            {/* Streak & Motivation */}
            <div className="flex items-center justify-center gap-2 mt-8 mb-4 bg-orange-500/10 text-orange-500 py-3 rounded-xl font-bold shadow-sm border border-orange-500/20">
                <Flame size={20} /> {streak} Day Tracking Streak
            </div>

            {/* Recovery Score */}
            {recoveryScore !== null && (
                <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-card to-card/50 border border-primary/20 shadow-md flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Recovery Score</h3>
                        <p className="text-xs text-muted-foreground max-w-[140px]">{recoveryMessage}</p>
                    </div>
                    <div className="relative flex items-center justify-center w-20 h-20">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-secondary" />
                            <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={`${(recoveryScore / 100) * 226} 226`} className="text-primary transition-all duration-1000 ease-in-out" />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-primary">{recoveryScore}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Daily Goals Progress Widget */}
            <Collapsible open={isGoalsOpen} onOpenChange={setIsGoalsOpen} className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-2xl shadow-sm border border-primary/10 mt-6 text-card-foreground">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <Target size={20} />
                        <h2 className="font-semibold text-sm uppercase tracking-wider">Goals Progress</h2>
                    </div>
                    <CollapsibleTrigger
                        onClick={() => setIsGoalsOpen(v => !v)}
                        className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors"
                        aria-label={isGoalsOpen ? "Collapse goals" : "Expand goals"}
                    >
                        <ChevronDown size={18} className={`transition-transform duration-200 ${isGoalsOpen ? 'rotate-180' : ''}`} />
                    </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-4">
                        {/* Water tile */}
                        <div className="bg-background p-3 rounded-xl border border-border/50 text-center flex flex-col items-center justify-center shadow-sm">
                            <Droplets size={16} className="text-primary mb-1" />
                            <div className="text-xs text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Water</div>
                            <div className="text-primary font-black mb-2">{waterLiters}L / {waterGoal}L</div>
                            <Progress value={waterProgress} className="h-2 w-full max-w-[80%]" />
                        </div>
                        {/* Sleep tile */}
                        <div className="bg-background p-3 rounded-xl border border-border/50 text-center flex flex-col items-center justify-center shadow-sm">
                            <Moon size={16} className="text-primary mb-1" />
                            <div className="text-xs text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Sleep</div>
                            <div className="text-primary font-black mb-2">{sleepHours}h / 8h</div>
                            <Progress value={sleepProgress} className="h-2 w-full max-w-[80%]" />
                        </div>
                        {/* Steps tile */}
                        <div className="bg-background p-3 rounded-xl border border-border/50 text-center flex flex-col items-center justify-center shadow-sm">
                            <Activity size={16} className="text-primary mb-1" />
                            <div className="text-xs text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Steps</div>
                            <div className="text-primary font-black mb-2">{steps}</div>
                            <Progress value={stepsProgress} className="h-2 w-full max-w-[80%]" />
                        </div>
                        {/* Cardio tile */}
                        <div className="bg-background p-3 rounded-xl border border-border/50 text-center flex flex-col items-center justify-center shadow-sm">
                            <Timer size={16} className="text-primary mb-1" />
                            <div className="text-xs text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Cardio</div>
                            <div className="text-primary font-black mb-2">{cardioMins}' / 150'</div>
                            <Progress value={cardioProgress} className="h-2 w-full max-w-[80%]" />
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}

interface MenuButtonProps {
    title: string;
    icon: React.ReactNode;
    onClick: () => void;
    subtitle?: string;
}

function MenuButton({ title, icon, onClick, subtitle }: MenuButtonProps) {
    return (
        <button
            onClick={onClick}
            className="w-full bg-card hover:bg-card/80 transition-colors border border-border/50 shadow-sm p-4 rounded-2xl flex items-center justify-between group active:scale-[0.98]"
        >
            <div className="flex items-center gap-3">
                {icon}
                <div className="flex flex-col items-start">
                    <span className="font-semibold text-lg">{title}</span>
                    {subtitle && (
                        <span className="text-xs text-muted-foreground">{subtitle}</span>
                    )}
                </div>
            </div>
            <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
    );
}
