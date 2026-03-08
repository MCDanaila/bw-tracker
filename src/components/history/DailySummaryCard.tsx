import { type DailyLog } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Moon, Dumbbell, Droplets, HeartPulse, Scale, Utensils } from 'lucide-react';

interface DailySummaryCardProps {
    log: DailyLog | null;
    date: Date;
}

export default function DailySummaryCard({ log, date }: DailySummaryCardProps) {
    if (!log) {
        return (
            <Card className="mt-6 border-dashed bg-muted/30">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Activity size={32} className="mb-2 opacity-20" />
                    <p>No log saved for this date.</p>
                </CardContent>
            </Card>
        );
    }

    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const getScoreColor = (score: number | null) => {
        if (!score) return "bg-muted text-muted-foreground";
        if (score >= 8) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
        if (score >= 5) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
        return "bg-rose-500/10 text-rose-600 border-rose-500/20";
    };

    return (
        <div className="mt-6 space-y-4 animate-fade-in">
            {/* Header / Date */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold capitalize">{formattedDate}</h3>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="bg-card">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <Scale size={20} className="text-primary mb-2" />
                        <span className="text-2xl font-bold">{log.weight_fasting || '--'} <span className="text-sm text-muted-foreground font-normal">kg</span></span>
                        <span className="text-xs text-muted-foreground mt-1">Fasting Weight</span>
                    </CardContent>
                </Card>

                <Card className="bg-card">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <Activity size={20} className="text-primary mb-2" />
                        <span className="text-2xl font-bold">
                            {log.steps ? log.steps.toLocaleString() : '--'}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">Steps</span>
                    </CardContent>
                </Card>

                <Card className="bg-card">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <Moon size={20} className="text-primary mb-2" />
                        <span className="text-2xl font-bold">{log.sleep_hours || '--'} <span className="text-sm text-muted-foreground font-normal">h</span></span>
                        <span className="text-xs text-muted-foreground mt-1">Sleep</span>
                    </CardContent>
                </Card>

                <Card className="bg-card">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <Droplets size={20} className="text-primary mb-2" />
                        <span className="text-2xl font-bold">{log.water_liters || '--'} <span className="text-sm text-muted-foreground font-normal">L</span></span>
                        <span className="text-xs text-muted-foreground mt-1">Water</span>
                    </CardContent>
                </Card>
            </div>

            {/* Wellbeing & Biofeedback */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                        <HeartPulse size={16} /> Biofeedback
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={getScoreColor(log.daily_energy)}>
                            Energy: {log.daily_energy || '-'}
                        </Badge>
                        <Badge variant="outline" className={getScoreColor(log.mood)}>
                            Mood: {log.mood || '-'}
                        </Badge>
                        <Badge variant="outline" className={getScoreColor(log.stress_level)}>
                            Stress: {log.stress_level || '-'}
                        </Badge>
                        <Badge variant="outline" className={getScoreColor(log.sleep_quality)}>
                            Sleep Quality: {log.sleep_quality || '-'}
                        </Badge>
                        <Badge variant="outline" className={getScoreColor(log.digestion_rating === 'Excellent' ? 10 : log.digestion_rating === 'Good' ? 7 : log.digestion_rating === 'Average' ? 5 : 3)}>
                            Digestion: {log.digestion_rating || '-'}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Workout Details (If they worked out) */}
            {(log.workout_session || log.workout_duration || log.cardio_liss_mins || log.cardio_hiit_mins) && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-primary">
                            <Dumbbell size={16} /> Workout
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3">
                            {log.workout_session && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Session:</span>
                                    <span className="font-semibold">{log.workout_session}</span>
                                </div>
                            )}
                            {log.workout_duration ? (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Duration:</span>
                                    <span className="font-semibold">{log.workout_duration} min</span>
                                </div>
                            ) : null}
                            <div className="flex gap-2 mt-2">
                                {log.gym_rpe && (
                                    <Badge variant="secondary" className="bg-secondary/20">RPE: {log.gym_rpe}</Badge>
                                )}
                                {log.cardio_liss_mins ? (
                                    <Badge variant="secondary" className="bg-secondary/20">LISS: {log.cardio_liss_mins}m</Badge>
                                ) : null}
                                {log.cardio_hiit_mins ? (
                                    <Badge variant="secondary" className="bg-secondary/20">HIIT: {log.cardio_hiit_mins}m</Badge>
                                ) : null}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* End of Day Notes / Details */}
            {(log.cheat_meals || log.general_notes || log.active_kcal) && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                            <Utensils size={16} /> Notes and Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            {log.active_kcal ? (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Active Kcal:</span>
                                    <span>{log.active_kcal} kcal</span>
                                </div>
                            ) : null}
                            {log.cheat_meals && (
                                <div className="flex items-center gap-2 text-amber-600 font-medium">
                                    <span>🍔 Cheat Meal Logged</span>
                                </div>
                            )}
                            {log.general_notes && (
                                <div className="mt-2 text-muted-foreground bg-muted/50 p-3 rounded-md italic">
                                    "{log.general_notes}"
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

        </div>
    );
}
