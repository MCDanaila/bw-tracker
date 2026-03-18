import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { type DailyLog } from "@/core/types/database";
import { localDB } from "@/core/lib/db";
import { supabase } from "@/core/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { ButtonGroup } from "@/core/components/ui/button-group";
import { Stepper } from "@/core/components/ui/stepper";
import { Slider } from "@/core/components/ui/slider";
import { Textarea } from "@/core/components/ui/textarea";
import {
    SLEEP_QUALITY_OPTIONS,
    STRESS_OPTIONS,
    MOOD_OPTIONS,
    ENERGY_OPTIONS,
    WORKOUT_TYPES,
    DIGESTION_OPTIONS,
    HUNGER_OPTIONS,
    LIBIDO_OPTIONS,
} from "@/core/lib/constants";
import { toast } from "sonner";

interface EditLogModalProps {
    log: DailyLog | null;
    onClose: () => void;
    initialSection?: 'morning' | 'training' | 'end_of_day';
}

export default function EditLogModal({ log, onClose, initialSection }: EditLogModalProps) {
    const queryClient = useQueryClient();
    const { register, handleSubmit, watch, setValue, reset, formState: { isSubmitting } } = useForm({
        defaultValues: {
            weight_fasting: log?.weight_fasting ?? 0,
            sleep_hours: log?.sleep_hours ?? 0,
            sleep_quality: log?.sleep_quality ?? 0,
            mood: log?.mood ?? 0,
            stress_level: log?.stress_level ?? 0,
            hrv: log?.hrv ?? "",
            measurement_time: log?.measurement_time ?? "",
            soreness_level: log?.soreness_level ?? 0,
            workout_session: log?.workout_session ?? "Rest",
            steps: log?.steps ?? "",
            workout_duration: log?.workout_duration ?? "",
            cardio_hiit_mins: log?.cardio_hiit_mins ?? "",
            cardio_liss_mins: log?.cardio_liss_mins ?? "",
            gym_rpe: log?.gym_rpe ?? 5,
            gym_energy: log?.gym_energy ?? 0,
            gym_mood: log?.gym_mood ?? 0,
            active_kcal: log?.active_kcal ?? "",
            water_liters: log?.water_liters ?? 0,
            diet_adherence: log?.diet_adherence ?? "perfect",
            digestion_rating: log?.digestion_rating ?? "",
            daily_energy: log?.daily_energy ?? 0,
            hunger_level: log?.hunger_level ?? 0,
            libido: log?.libido ?? 0,
            general_notes: log?.general_notes ?? "",
        }
    });

    // Reset form when log changes
    useEffect(() => {
        if (log) {
            reset({
                weight_fasting: log.weight_fasting ?? 0,
                sleep_hours: log.sleep_hours ?? 0,
                sleep_quality: log.sleep_quality ?? 0,
                mood: log.mood ?? 0,
                stress_level: log.stress_level ?? 0,
                hrv: log.hrv ?? "",
                measurement_time: log.measurement_time ?? "",
                soreness_level: log.soreness_level ?? 0,
                workout_session: log.workout_session ?? "Rest",
                steps: log.steps ?? "",
                workout_duration: log.workout_duration ?? "",
                cardio_hiit_mins: log.cardio_hiit_mins ?? "",
                cardio_liss_mins: log.cardio_liss_mins ?? "",
                gym_rpe: log.gym_rpe ?? 5,
                gym_energy: log.gym_energy ?? 0,
                gym_mood: log.gym_mood ?? 0,
                active_kcal: log.active_kcal ?? "",
                water_liters: log.water_liters ?? 0,
                diet_adherence: log.diet_adherence ?? "perfect",
                digestion_rating: log.digestion_rating ?? "",
                daily_energy: log.daily_energy ?? 0,
                hunger_level: log.hunger_level ?? 0,
                libido: log.libido ?? 0,
                general_notes: log.general_notes ?? "",
            });
        }
    }, [log, reset]);

    // Scroll to initialSection after mount
    useEffect(() => {
        if (initialSection) {
            // Small delay to allow render
            const timer = setTimeout(() => {
                document.getElementById(`section-${initialSection}`)?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [initialSection]);

    if (!log) return null;

    const workoutSession = watch("workout_session");
    const sleepHours = watch("sleep_hours");
    const sleepQuality = watch("sleep_quality");
    const stressLevel = watch("stress_level");
    const mood = watch("mood");
    const weightFasting = watch("weight_fasting");
    const sorenessLevel = watch("soreness_level");
    const gymRpe = watch("gym_rpe");
    const gymMood = watch("gym_mood");
    const gymEnergy = watch("gym_energy");
    const waterLiters = watch("water_liters");
    const digestionRating = watch("digestion_rating");
    const dietAdherence = watch("diet_adherence");
    const dailyEnergy = watch("daily_energy");
    const hungerLevel = watch("hunger_level");
    const libido = watch("libido");

    const formattedDate = new Date(log.date + "T00:00:00").toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const onSubmit = async (data: any) => {
        // Convert empty strings to null for optional integer/numeric fields.
        // react-hook-form returns "" for untouched number inputs; Postgres
        // rejects "" for integer columns with a 400 Bad Request.
        const intFields = [
            'hrv', 'steps', 'workout_duration',
            'cardio_hiit_mins', 'cardio_liss_mins', 'active_kcal', 'digestion_rating',
        ] as const;
        const sanitized = { ...data };
        for (const field of intFields) {
            const v = sanitized[field];
            sanitized[field] = v === "" || v === null || v === undefined ? null : Number(v);
        }

        const merged = {
            ...log,
            ...sanitized,
            date: log.date,
            user_id: log.user_id,
        };

        // Online path: write directly to Supabase
        if (navigator.onLine) {
            try {
                const { error } = await supabase
                    .from('daily_logs')
                    .upsert(merged, { onConflict: 'user_id, date' });

                if (error) throw error;

                queryClient.invalidateQueries({ queryKey: ['historyLogs'] });
                queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
                toast.success('Log updated');
                onClose();
                return;
            } catch (error) {
                console.error('Direct upsert failed, falling back to queue:', error);
            }
        }

        // Offline fallback: queue for manual sync
        try {
            await localDB.syncQueue.add({
                mutation_type: 'UPSERT_DAILY_LOG',
                payload: merged,
                status: 'pending',
                created_at: new Date().toISOString(),
            });
            toast.warning('Offline — changes queued for manual sync');
            onClose();
        } catch (queueError) {
            console.error(queueError);
            toast.error('Failed to save log.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
                <div>
                    <h2 className="text-base font-bold text-foreground">Edit Log</h2>
                    <p className="text-xs text-muted-foreground">{formattedDate}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-10">

                {/* Morning Section */}
                <section className="space-y-6">
                    <h3 id="section-morning" className="text-lg font-bold text-foreground border-b border-border pb-2">
                        Morning Check-In
                    </h3>

                    <div className="space-y-3">
                        <Stepper
                            label="Weight (kg)"
                            value={weightFasting ?? 0}
                            onChange={(v) => setValue("weight_fasting", v, { shouldDirty: true })}
                            step={0.1}
                            min={30}
                            max={200}
                        />
                    </div>

                    <div className="space-y-3">
                        <Stepper
                            label="Sleep Hours"
                            value={sleepHours ?? 0}
                            onChange={(v) => setValue("sleep_hours", v, { shouldDirty: true })}
                            step={0.5}
                            min={0}
                            max={24}
                        />
                    </div>

                    <div className="p-4 rounded-xl bg-card border border-border/50 space-y-6">
                        <ButtonGroup
                            label="Sleep Quality"
                            options={SLEEP_QUALITY_OPTIONS}
                            value={sleepQuality}
                            onChange={(v) => setValue("sleep_quality", v, { shouldDirty: true })}
                        />
                        <ButtonGroup
                            label="Mood"
                            options={MOOD_OPTIONS}
                            value={mood}
                            onChange={(v) => setValue("mood", v, { shouldDirty: true })}
                        />
                        <ButtonGroup
                            label="Stress Level"
                            options={STRESS_OPTIONS}
                            value={stressLevel}
                            onChange={(v) => setValue("stress_level", v, { shouldDirty: true })}
                        />
                        <ButtonGroup
                            label="Muscle Soreness"
                            options={STRESS_OPTIONS}
                            value={sorenessLevel}
                            onChange={(v) => setValue("soreness_level", v, { shouldDirty: true })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="HRV (ms)" type="number" {...register("hrv")} />
                        <Input label="Measurement Time" type="time" {...register("measurement_time")} />
                    </div>
                </section>

                {/* Training Section */}
                <section className="space-y-6">
                    <h3 id="section-training" className="text-lg font-bold text-foreground border-b border-border pb-2">
                        Workout Log
                    </h3>

                    <div className="p-4 rounded-xl bg-card border border-border/50 space-y-6">
                        <ButtonGroup
                            label="Workout Type"
                            options={WORKOUT_TYPES}
                            value={workoutSession}
                            onChange={(v) => setValue("workout_session", v as string, { shouldDirty: true })}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Daily Steps" type="number" {...register("steps")} />
                            <Input label="Duration (mins)" type="number" {...register("workout_duration")} />
                            <Input label="HIIT (mins)" type="number" {...register("cardio_hiit_mins")} />
                            <Input label="LISS (mins)" type="number" {...register("cardio_liss_mins")} />
                            <Input label="Active kcal" type="number" {...register("active_kcal")} />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-card border border-border/50 space-y-6">
                        <Slider
                            label="Session RPE (1-10)"
                            min="1"
                            max="10"
                            step="0.5"
                            value={gymRpe}
                            {...register("gym_rpe")}
                        />
                        <ButtonGroup
                            label="Gym Energy"
                            options={ENERGY_OPTIONS}
                            value={gymEnergy}
                            onChange={(v) => setValue("gym_energy", v, { shouldDirty: true })}
                        />
                        <ButtonGroup
                            label="Gym Mood"
                            options={MOOD_OPTIONS}
                            value={gymMood}
                            onChange={(v) => setValue("gym_mood", v, { shouldDirty: true })}
                        />
                    </div>
                </section>

                {/* End of Day Section */}
                <section className="space-y-6">
                    <h3 id="section-end_of_day" className="text-lg font-bold text-foreground border-b border-border pb-2">
                        End of Day
                    </h3>

                    <div className="space-y-3">
                        <Stepper
                            label="Water (Liters)"
                            value={waterLiters ?? 0}
                            onChange={(v) => setValue("water_liters", v, { shouldDirty: true })}
                            step={0.5}
                            min={0}
                            max={10}
                        />
                    </div>

                    <div className="p-4 rounded-xl bg-card border border-border/50 space-y-6">
                        <div>
                            <p className="text-sm font-semibold mb-3">Diet Adherence</p>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    type="button"
                                    variant={dietAdherence === "perfect" ? "default" : "outline"}
                                    onClick={() => setValue("diet_adherence", "perfect", { shouldDirty: true })}
                                    className="rounded-xl shadow-none text-xs px-2"
                                >
                                    Perfect
                                </Button>
                                <Button
                                    type="button"
                                    variant={dietAdherence === "minor_deviation" ? "secondary" : "outline"}
                                    onClick={() => setValue("diet_adherence", "minor_deviation", { shouldDirty: true })}
                                    className="rounded-xl shadow-none text-xs px-2"
                                >
                                    Minor Deviation
                                </Button>
                                <Button
                                    type="button"
                                    variant={dietAdherence === "cheat_meal" ? "destructive" : "outline"}
                                    onClick={() => setValue("diet_adherence", "cheat_meal", { shouldDirty: true })}
                                    className="rounded-xl shadow-none text-xs px-2"
                                >
                                    Cheat Meal
                                </Button>
                            </div>
                        </div>

                        <ButtonGroup
                            label="Digestion Quality"
                            options={DIGESTION_OPTIONS}
                            value={digestionRating}
                            onChange={(v) => setValue("digestion_rating", v, { shouldDirty: true })}
                        />

                        <ButtonGroup
                            label="Daily Energy"
                            options={ENERGY_OPTIONS}
                            value={dailyEnergy}
                            onChange={(v) => setValue("daily_energy", v, { shouldDirty: true })}
                        />

                        <ButtonGroup
                            label="Hunger Level"
                            options={HUNGER_OPTIONS}
                            value={hungerLevel}
                            onChange={(v) => setValue("hunger_level", v, { shouldDirty: true })}
                        />

                        <ButtonGroup
                            label="Libido"
                            options={LIBIDO_OPTIONS}
                            value={libido}
                            onChange={(v) => setValue("libido", v, { shouldDirty: true })}
                        />

                        <div className="pt-2">
                            <p className="text-sm font-semibold mb-3">Journal (Optional)</p>
                            <Textarea
                                placeholder="Any final notes about today?"
                                className="min-h-[100px] rounded-2xl bg-background resize-none p-4 shadow-sm border-border/50"
                                {...register("general_notes")}
                            />
                        </div>
                    </div>
                </section>
            </div>

            {/* Sticky footer */}
            <div className="shrink-0 px-4 py-4 border-t border-border bg-card">
                <Button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    size="lg"
                    className="w-full h-14 text-lg font-bold rounded-2xl shadow-md"
                >
                    {isSubmitting ? "Saving..." : "Update Log"}
                </Button>
            </div>
        </div>
    );
}
