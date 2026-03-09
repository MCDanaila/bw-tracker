import type { ViewState } from "../DailyTrackerWizard";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, CheckCircle2, Circle, Target, Flame } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TodayDashboardViewProps {
    todayLog: any;
    onNavigate: (view: ViewState) => void;
}

export function TodayDashboardView({ todayLog, onNavigate }: TodayDashboardViewProps) {
    // Determine completion statuses based on the existing DB payload
    const isMorningDone = !!todayLog?.weight_fasting && !!todayLog?.sleep_hours;
    const isTrainingDone = !!todayLog?.steps && !!todayLog?.workout_session;
    const isEndOfDayDone = !!todayLog?.water_liters && !!todayLog?.digestion_rating;

    // Calculate overall completion percentage for the top bar
    let completedSections = 0;
    if (isMorningDone) completedSections++;
    if (isTrainingDone) completedSections++;
    if (isEndOfDayDone) completedSections++;
    const totalProgress = Math.round((completedSections / 3) * 100);

    // Goal Calculations bounds based on mocked goals or defaults if log exists
    const waterLiters = todayLog?.water_liters || 0;
    const sleepHours = todayLog?.sleep_hours || 0;
    const steps = todayLog?.steps || 0;
    const cardioMins = (todayLog?.cardio_hiit_mins || 0) + (todayLog?.cardio_liss_mins || 0);

    const waterProgress = Math.min((waterLiters / 4) * 100, 100);
    const sleepProgress = Math.min((sleepHours / 8) * 100, 100);
    const stepsProgress = Math.min((steps / (todayLog?.steps_goal || 10000)) * 100, 100);
    const cardioProgress = Math.min((cardioMins / 150) * 100, 100);

    // Phase 2: Recovery Score
    const stressScore = todayLog?.stress_level ? (11 - todayLog.stress_level) * 10 : 0;
    const sleepQualityScore = todayLog?.sleep_quality ? todayLog.sleep_quality * 10 : 0;
    const recoveryScore = (todayLog?.sleep_quality && todayLog?.stress_level)
        ? Math.round((sleepQualityScore * 0.6) + (stressScore * 0.4))
        : null;

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header / Total Progress */}
            <div className="flex items-center justify-between mt-4 mb-2">
                <h1 className="text-3xl font-black text-primary tracking-tight">Today</h1>
                <span className="text-sm font-bold text-muted-foreground">{totalProgress}%</span>
            </div>
            <Progress value={totalProgress} className="h-2 mb-8 bg-secondary" />

            {/* Navigation Menu */}
            <div className="space-y-3">
                <MenuButton
                    title="Morning Check-In"
                    icon={isMorningDone ? <CheckCircle2 className="text-green-500" /> : <Circle className="text-muted-foreground" />}
                    onClick={() => onNavigate("morning")}
                />
                <MenuButton
                    title="Workout Log"
                    icon={isTrainingDone ? <CheckCircle2 className="text-green-500" /> : <Circle className="text-muted-foreground" />}
                    onClick={() => onNavigate("training")}
                />
                <MenuButton
                    title="End of Day"
                    icon={isEndOfDayDone ? <CheckCircle2 className="text-green-500" /> : <Circle className="text-muted-foreground" />}
                    onClick={() => onNavigate("end_of_day")}
                />
            </div>

            {/* Streak & Motivation */}
            <div className="flex items-center justify-center gap-2 mt-8 mb-4 bg-orange-500/10 text-orange-500 py-3 rounded-xl font-bold shadow-sm border border-orange-500/20">
                <Flame size={20} /> 12 Day Tracking Streak
            </div>

            {/* Dashboard Tiles (Body, Fuel, Drive) - Conceptual / Future usage */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-card p-3 rounded-xl border border-border/50 text-center shadow-sm flex flex-col items-center justify-center aspect-square">
                    <span className="text-2xl mb-1">💪</span>
                    <span className="text-xs font-semibold text-muted-foreground">Body</span>
                </div>
                <div className="bg-card p-3 rounded-xl border border-border/50 text-center shadow-sm flex flex-col items-center justify-center aspect-square">
                    <span className="text-2xl mb-1">🥩</span>
                    <span className="text-xs font-semibold text-muted-foreground">Fuel</span>
                </div>
                <div className="bg-card p-3 rounded-xl border border-border/50 text-center shadow-sm flex flex-col items-center justify-center aspect-square">
                    <span className="text-2xl mb-1">🧠</span>
                    <span className="text-xs font-semibold text-muted-foreground">Drive</span>
                </div>
            </div>

            {/* Recovery Score */}
            {recoveryScore !== null && (
                <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-card to-card/50 border border-primary/20 shadow-md flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Recovery Score</h3>
                        <p className="text-xs text-muted-foreground max-w-[140px]">Your recovery today was strong. Nice work!</p>
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

            {/* --- DAILY GOALS PROGRESS WIDGET --- */}
            <Collapsible className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-2xl shadow-sm border border-primary/10 mt-6 text-card-foreground">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <Target size={20} />
                        <h2 className="font-semibold text-sm uppercase tracking-wider">Goals Progress</h2>
                    </div>
                    <CollapsibleTrigger className="text-primary hover:bg-primary/10 text-sm font-bold px-3 py-1.5 rounded-lg transition-colors">
                        Toggle
                    </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-4">
                        <div className="bg-background p-3 rounded-xl border border-border/50 text-center flex flex-col items-center justify-center shadow-sm">
                            <div className="text-xs text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Water</div>
                            <div className="text-primary font-black mb-2">{waterLiters}L / 4L</div>
                            <Progress value={waterProgress} className="h-2 w-full max-w-[80%]" />
                        </div>
                        <div className="bg-background p-3 rounded-xl border border-border/50 text-center flex flex-col items-center justify-center shadow-sm">
                            <div className="text-xs text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Sleep</div>
                            <div className="text-primary font-black mb-2">{sleepHours}h / 8h</div>
                            <Progress value={sleepProgress} className="h-2 w-full max-w-[80%]" />
                        </div>
                        <div className="bg-background p-3 rounded-xl border border-border/50 text-center flex flex-col items-center justify-center shadow-sm">
                            <div className="text-xs text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Steps</div>
                            <div className="text-primary font-black mb-2">{steps}</div>
                            <Progress value={stepsProgress} className="h-2 w-full max-w-[80%]" />
                        </div>
                        <div className="bg-background p-3 rounded-xl border border-border/50 text-center flex flex-col items-center justify-center shadow-sm">
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

function MenuButton({ title, icon, onClick }: { title: string, icon: React.ReactNode, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full bg-card hover:bg-card/80 transition-colors border border-border/50 shadow-sm p-4 rounded-2xl flex items-center justify-between group active:scale-[0.98]"
        >
            <div className="flex items-center gap-3">
                {icon}
                <span className="font-semibold text-lg">{title}</span>
            </div>
            <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
    );
}
