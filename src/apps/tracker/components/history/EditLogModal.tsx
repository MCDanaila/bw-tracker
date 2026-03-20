import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { type DailyLog } from "@/core/types/database";
import { upsertTodayQueueEntry } from "@/core/lib/db";
import { supabase } from "@/core/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { ButtonGroup } from "@/core/components/ui/button-group";
import { Stepper } from "@/core/components/ui/stepper";
import { Slider } from "@/core/components/ui/slider";
import { Textarea } from "@/core/components/ui/textarea";
import { Dialog, DialogContent } from "@/core/components/ui/dialog";
import { ConfirmDialog } from "@/apps/dashboard/components/ConfirmDialog";
import {
    SLEEP_QUALITY_OPTIONS,
    STRESS_OPTIONS,
    MOOD_OPTIONS,
    ENERGY_OPTIONS,
    WORKOUT_TYPES,
    DIGESTION_OPTIONS,
    HUNGER_OPTIONS,
    LIBIDO_OPTIONS,
    SLEEP_PRESET_OPTIONS,
    DAILY_LOG_INT_FIELDS,
    getDailyLogDefaults,
} from "@/core/lib/constants";
import { toast } from "sonner";

interface EditLogModalProps {
    log: DailyLog | null;
    onClose: () => void;
    initialSection?: 'morning' | 'training' | 'end_of_day';
}

export default function EditLogModal({ log, onClose, initialSection }: EditLogModalProps) {
    const queryClient = useQueryClient();
    const { register, handleSubmit, watch, setValue, reset, formState: { isSubmitting, isDirty, errors } } = useForm({
        defaultValues: getDailyLogDefaults(log ?? undefined)
    });
    const [showConfirmSave, setShowConfirmSave] = useState(false);

    // Reset form when log changes
    useEffect(() => {
        if (log) {
            reset(getDailyLogDefaults(log));
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
    const saltGrams = watch("salt_grams");
    const digestionRating = watch("digestion_rating");
    const dietAdherence = watch("diet_adherence");
    const hungerLevel = watch("hunger_level");
    const libido = watch("libido");

    const isRest = workoutSession === "Rest";

    const formattedDate = new Date(log.date + "T00:00:00").toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const onSubmit = async (data: any) => {
        // Sanitize empty strings to null for integer/numeric fields
        const sanitized = { ...data };
        for (const field of DAILY_LOG_INT_FIELDS) {
            const v = sanitized[field];
            sanitized[field] = v === "" || v === null || v === undefined ? null : Number(v);
        }

        const merged = {
            ...log,
            ...sanitized,
            date: log.date,
            user_id: log.user_id,
        };

        // Always try Supabase first, catch all errors
        try {
            const { error } = await supabase
                .from('daily_logs')
                .upsert(merged, { onConflict: 'user_id, date' });

            if (error) throw error;

            queryClient.invalidateQueries({ queryKey: ['historyLogs'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
            toast.success('Log updated');
            onClose();
        } catch (err) {
            console.error('Direct upsert failed, falling back to queue:', err);
            try {
                await upsertTodayQueueEntry(merged);
                toast.warning('Offline — changes queued for sync');
                onClose();
            } catch (queueError) {
                console.error(queueError);
                toast.error('Failed to save log.');
            }
        }
    };

    const handleSaveClick = () => {
        if (isDirty) {
            setShowConfirmSave(true);
        } else {
            handleSubmit(onSubmit)();
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                showCloseButton={false}
                className="top-0 right-0 bottom-0 left-0 translate-x-0 translate-y-0 max-w-none sm:max-w-none h-full rounded-none sm:rounded-none flex flex-col p-0 gap-0 ring-0 sm:ring-0"
            >
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
                        <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-6">

                            <div className="space-y-3">
                                <Stepper
                                    label="Weight (kg)"
                                    value={weightFasting ?? 0}
                                    onChange={(v) => setValue("weight_fasting", v, { shouldDirty: true })}
                                    step={0.01}
                                    min={30}
                                    max={200}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Measurement Time" type="time" {...register("measurement_time")} />
                                <div className="space-y-1">
                                    <Input
                                        label="HRV (ms)"
                                        type="number"
                                        aria-invalid={!!errors.hrv}
                                        aria-describedby={errors.hrv ? "hrv-error" : undefined}
                                        {...register("hrv", { min: { value: 0, message: 'Min 0' }, max: { value: 300, message: 'Max 300' } })}
                                    />
                                    {errors.hrv && <p id="hrv-error" className="text-xs text-destructive">{errors.hrv.message as string}</p>}
                                </div>
                            </div>
                        </div>
                        <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-6">
                            <div className="space-y-3">
                                <ButtonGroup
                                    label="How long did you sleep?"
                                    options={SLEEP_PRESET_OPTIONS}
                                    value={sleepHours > 0 ? ([6, 6.5, 7, 7.5, 8].includes(sleepHours) ? sleepHours : -1) : null}
                                    onChange={(v) => setValue("sleep_hours", v, { shouldDirty: true })}
                                />
                                {(![6, 6.5, 7, 7.5, 8].includes(sleepHours) && sleepHours !== 0) && (
                                    <Stepper
                                        label="Custom Sleep (hrs)"
                                        value={sleepHours !== -1 ? sleepHours : 0}
                                        onChange={(v) => setValue("sleep_hours", v, { shouldDirty: true })}
                                        step={0.5}
                                        min={0}
                                        max={24}
                                    />
                                )}
                            </div>

                            <ButtonGroup
                                label="Sleep Quality"
                                options={SLEEP_QUALITY_OPTIONS}
                                value={sleepQuality}
                                onChange={(v) => setValue("sleep_quality", v, { shouldDirty: true })}
                            />
                        </div>
                        <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-6">
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
                    </section>

                    {/* Training Section */}
                    <section className="space-y-6">
                        <h3 id="section-training" className="text-lg font-bold text-foreground border-b border-border pb-2">
                            Workout Log
                        </h3>
                        <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-6">
                            <div className="space-y-1">
                                <Input
                                    label="Daily Steps"
                                    type="number"
                                    aria-invalid={!!errors.steps}
                                    aria-describedby={errors.steps ? "steps-error" : undefined}
                                    {...register("steps", { min: { value: 0, message: 'Min 0' } })}
                                />
                                {errors.steps && <p id="steps-error" className="text-xs text-destructive">{errors.steps.message as string}</p>}
                            </div>
                            <ButtonGroup
                                label="Workout Type"
                                options={WORKOUT_TYPES}
                                value={workoutSession}
                                onChange={(v) => setValue("workout_session", v as string, { shouldDirty: true })}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Start Time" type="time" {...register("workout_start_time")} />
                                <div className="space-y-1">
                                    <Input
                                        label="Duration (mins)"
                                        type="number"
                                        aria-invalid={!!errors.workout_duration}
                                        aria-describedby={errors.workout_duration ? "workout_duration-error" : undefined}
                                        {...register("workout_duration", { min: { value: 0, message: 'Min 0' }, max: { value: 600, message: 'Max 600' } })}
                                    />
                                    {errors.workout_duration && <p id="workout_duration-error" className="text-xs text-destructive">{errors.workout_duration.message as string}</p>}
                                </div>
                                <Input label="Active kcal" type="number" {...register("active_kcal")} />
                                <Input label="LISS (mins)" type="number" {...register("cardio_liss_mins")} />
                                <Input label="HIIT (mins)" type="number" {...register("cardio_hiit_mins")} />
                            </div>
                        </div>

                        {!isRest && (
                            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                <h3 className="text-md font-bold text-foreground">Performance</h3>
                                <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-6">
                                    <ButtonGroup
                                        label="Gym Mood"
                                        options={MOOD_OPTIONS}
                                        value={gymMood}
                                        onChange={(v) => setValue("gym_mood", v, { shouldDirty: true })}
                                    />
                                    <ButtonGroup
                                        label="Gym Energy"
                                        options={ENERGY_OPTIONS}
                                        value={gymEnergy}
                                        onChange={(v) => setValue("gym_energy", v, { shouldDirty: true })}
                                    />
                                    <Slider
                                        label="Session RPE (1-10)"
                                        min="1"
                                        max="10"
                                        step="0.5"
                                        value={gymRpe}
                                        {...register("gym_rpe")}
                                    />
                                </div>
                            </div>


                        )}
                    </section>

                    {/* End of Day Section */}
                    <section className="space-y-6">
                        <h3 id="section-end_of_day" className="text-lg font-bold text-foreground border-b border-border pb-2">
                            End of Day
                        </h3>

                        <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-3">
                            <Stepper
                                label="Water (Liters)"
                                value={waterLiters ?? 0}
                                onChange={(v) => setValue("water_liters", v, { shouldDirty: true })}
                                step={0.5}
                                min={0}
                                max={10}
                            />
                            <Stepper
                                label="Salt (Grams)"
                                value={saltGrams ?? 0}
                                onChange={(v) => setValue("salt_grams", v, { shouldDirty: true })}
                                step={1}
                                min={0}
                                max={20}
                            />
                        </div>

                        <div className="p-4 rounded-2xl bg-card border border-border/50 space-y-6">
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
                                        variant={dietAdherence === "minor_deviation" ? "default" : "outline"}
                                        onClick={() => setValue("diet_adherence", "minor_deviation", { shouldDirty: true })}
                                        className="rounded-xl shadow-none text-xs px-2"
                                    >
                                        Minor Deviation
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={dietAdherence === "cheat_meal" ? "default" : "outline"}
                                        onClick={() => setValue("diet_adherence", "cheat_meal", { shouldDirty: true })}
                                        className="rounded-xl shadow-none text-xs px-2"
                                    >
                                        Cheat Meal
                                    </Button>
                                </div>
                            </div>

                            <ButtonGroup
                                label="Hunger Level"
                                options={HUNGER_OPTIONS}
                                value={hungerLevel}
                                onChange={(v) => setValue("hunger_level", v, { shouldDirty: true })}
                            />

                            <ButtonGroup
                                label="Digestion Quality"
                                options={DIGESTION_OPTIONS}
                                value={digestionRating}
                                onChange={(v) => setValue("digestion_rating", v, { shouldDirty: true })}
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
                        onClick={handleSaveClick}
                        disabled={isSubmitting}
                        size="lg"
                        className="w-full h-14 text-lg font-bold rounded-2xl shadow-md"
                    >
                        {isSubmitting ? "Saving..." : "Update Log"}
                    </Button>
                </div>

                <ConfirmDialog
                    open={showConfirmSave}
                    onClose={() => setShowConfirmSave(false)}
                    onConfirm={() => {
                        setShowConfirmSave(false);
                        handleSubmit(onSubmit)();
                    }}
                    title="Save changes?"
                    description={`This will overwrite the log for ${formattedDate}.`}
                    confirmLabel="Save"
                    variant="default"
                />
            </DialogContent>
        </Dialog>
    );
}
