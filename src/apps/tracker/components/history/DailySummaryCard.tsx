import { type DailyLog } from '@/core/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Activity, Moon, Dumbbell, Droplets, HeartPulse, Scale, Utensils, Pencil } from 'lucide-react';
import { ENERGY_OPTIONS, MOOD_OPTIONS, STRESS_OPTIONS, SLEEP_QUALITY_OPTIONS, DIGESTION_OPTIONS, HUNGER_OPTIONS, LIBIDO_OPTIONS, getLabelByValue } from '@/core/lib/constants';

interface DailySummaryCardProps {
    log: DailyLog | null;
    date: Date;
    onEdit?: (log: DailyLog, section?: 'morning' | 'training' | 'end_of_day') => void;
    onEditSection?: (section: 'morning' | 'training' | 'end_of_day') => void;
}

export default function DailySummaryCard({ log, date, onEdit, onEditSection }: DailySummaryCardProps) {
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
        if (!score || score > 5 || score < 1) return "bg-muted text-muted-foreground"

        // Normal scale: high score = good
        // 1 (bad) → red, 2 → orange, 3 (neutral) → amber, 4 → light-green, 5 (good) → emerald
        if (score === 1) return "bg-rose-500/10 text-rose-600 border-rose-500/20";
        if (score === 2) return "bg-orange-500/10 text-orange-600 border-orange-500/20";
        if (score === 3) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
        if (score === 4) return "bg-lime-500/10 text-lime-600 border-lime-500/20";
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
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
                        <span className="text-2xl font-bold">{log.weight_fasting?.toFixed(1) || '--'} <span className="text-sm text-muted-foreground font-normal">kg</span></span>
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
                        <span className="text-2xl font-bold">{log.water_liters || '--'}<span className="text-sm text-muted-foreground font-normal">L</span> {log.salt_grams || '--'}<span className="text-sm text-muted-foreground font-normal">g</span></span>
                        <span className="text-xs text-muted-foreground mt-1">Water / Salt</span>
                    </CardContent>
                </Card>
            </div>

            {/* Morning Check-In */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                        <HeartPulse size={16} /> Morning Check-In
                        {(onEdit || onEditSection) && (
                            <button
                                onClick={() => onEditSection ? onEditSection('morning') : onEdit!(log, 'morning')}
                                className="ml-auto p-1 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Pencil size={14} />
                            </button>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={getScoreColor(log.sleep_quality)}>
                            Sleep Quality: {getLabelByValue(SLEEP_QUALITY_OPTIONS, log.sleep_quality) || '-'}
                        </Badge>
                        <Badge variant="outline" className={getScoreColor(log.mood)}>
                            Mood: {getLabelByValue(MOOD_OPTIONS, log.mood) || '-'}
                        </Badge>
                        <Badge variant="outline" className={getScoreColor(log.stress_level)}>
                            Stress: {getLabelByValue(STRESS_OPTIONS, log.stress_level) || '-'}
                        </Badge>
                        <Badge variant="outline" className={getScoreColor(log.soreness_level)}>
                            Soreness: {getLabelByValue(STRESS_OPTIONS, log.soreness_level) || '-'}
                        </Badge>
                        {log.hrv ? (
                            <Badge variant="outline" className="bg-muted text-muted-foreground">
                                HRV: {log.hrv} ms
                            </Badge>
                        ) : null}
                    </div>
                </CardContent>
            </Card>

            {/* Workout Log */}
            {(log.workout_session || log.workout_duration || log.cardio_liss_mins || log.cardio_hiit_mins || log.active_kcal) && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-primary">
                            <Dumbbell size={16} /> Workout Log
                            {(onEdit || onEditSection) && (
                                <button
                                    onClick={() => onEditSection ? onEditSection('training') : onEdit!(log, 'training')}
                                    className="ml-auto p-1 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Pencil size={14} />
                                </button>
                            )}
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
                            {log.workout_start_time ? (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Start Time:</span>
                                    <span className="font-semibold">{log.workout_start_time}</span>
                                </div>
                            ) : null}
                            {log.workout_duration ? (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Duration:</span>
                                    <span className="font-semibold">{log.workout_duration} min</span>
                                </div>
                            ) : null}
                            {log.active_kcal ? (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Active Kcal:</span>
                                    <span className="font-semibold">{log.active_kcal} kcal</span>
                                </div>
                            ) : null}
                            <div className="flex flex-wrap gap-2 mt-1">
                                {log.gym_rpe ? (
                                    <Badge variant="outline" className={getScoreColor(log.gym_rpe)}>
                                        RPE: {log.gym_rpe}
                                    </Badge>
                                ) : null}
                                {log.gym_energy ? (
                                    <Badge variant="outline" className={getScoreColor(log.gym_energy)}>
                                        Gym Energy: {getLabelByValue(ENERGY_OPTIONS, log.gym_energy)}
                                    </Badge>
                                ) : null}
                                {log.gym_mood ? (
                                    <Badge variant="outline" className={getScoreColor(log.gym_mood)}>
                                        Gym Mood: {getLabelByValue(MOOD_OPTIONS, log.gym_mood)}
                                    </Badge>
                                ) : null}
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

            {/* End of Day */}
            {(log.diet_adherence || log.general_notes || log.digestion_rating || log.hunger_level || log.libido || log.salt_grams) && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                            <Utensils size={16} /> End of Day
                            {(onEdit || onEditSection) && (
                                <button
                                    onClick={() => onEditSection ? onEditSection('end_of_day') : onEdit!(log, 'end_of_day')}
                                    className="ml-auto p-1 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Pencil size={14} />
                                </button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {log.diet_adherence && log.diet_adherence !== 'perfect' && (
                                <div className="flex items-center gap-2 text-amber-600 font-medium text-sm">
                                    <span>🍔 Diet: {log.diet_adherence.replace('_', ' ')}</span>
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                                {log.digestion_rating ? (
                                    <Badge variant="outline" className={getScoreColor(log.digestion_rating)}>
                                        Digestion: {getLabelByValue(DIGESTION_OPTIONS, log.digestion_rating) || '-'}
                                    </Badge>
                                ) : null}
                                {log.hunger_level ? (
                                    <Badge variant="outline" className={getScoreColor(log.hunger_level)}>
                                        Hunger: {getLabelByValue(HUNGER_OPTIONS, log.hunger_level) || '-'}
                                    </Badge>
                                ) : null}
                                {log.libido ? (
                                    <Badge variant="outline" className={getScoreColor(log.libido)}>
                                        Libido: {getLabelByValue(LIBIDO_OPTIONS, log.libido) || '-'}
                                    </Badge>
                                ) : null}
                            </div>
                            {log.general_notes && (
                                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md italic">
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
