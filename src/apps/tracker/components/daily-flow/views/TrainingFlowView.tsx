import { useForm } from "react-hook-form";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { getLocalDateStr } from "@/core/lib/utils";
import { Input } from "@/core/components/ui/input";
import { ButtonGroup } from "@/core/components/ui/button-group";
import { Slider } from "@/core/components/ui/slider";
import { WORKOUT_TYPES, MOOD_OPTIONS, ENERGY_OPTIONS } from "@/core/lib/constants";
import { saveDailyLog } from "@/core/lib/db";
import { useAuth } from "@/core/contexts/AuthContext";
import { useProfile, STEPS_GOAL_DEFAULT } from "@/core/hooks/useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface TrainingFlowViewProps {
    existingData: any;
    yesterdayData?: any;
    onBack: () => void;
    onSave: (updatedPayload: any) => void;
}



export function TrainingFlowView({ existingData, yesterdayData, onBack, onSave }: TrainingFlowViewProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { data: profile } = useProfile();
    const stepsGoalDefault = existingData?.steps_goal ?? profile?.steps_goal ?? STEPS_GOAL_DEFAULT;

    const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm({
        defaultValues: {
            ...existingData,
            workout_session: existingData?.workout_session || "Rest",
            steps: existingData?.steps || 0,
            steps_goal: stepsGoalDefault,
            cardio_hiit_mins: existingData?.cardio_hiit_mins || 0,
            cardio_liss_mins: existingData?.cardio_liss_mins || 0,
            gym_rpe: existingData?.gym_rpe || 5,
        }
    });

    const workoutSession = watch("workout_session");
    const gymMood = watch("gym_mood");
    const gymEnergy = watch("gym_energy");
    const gymRpe = watch("gym_rpe");

    const isRest = workoutSession === "Rest";

    const onSubmit = async (data: any) => {
        if (!user) {
            toast.error("You must be logged in to save.");
            return;
        }

        try {
            const payload = {
                ...existingData,
                ...data,
                date: existingData?.date || getLocalDateStr(),
                user_id: user.id,
            };

            // Try to save directly to Supabase; fall back to queue if offline
            const result = await saveDailyLog(payload);
            if (result === 'synced') {
                queryClient.invalidateQueries({ queryKey: ['historyLogs'] });
                queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
                toast.success("Workout logged! 🏋️‍♀️");
            } else {
                toast.success("Workout logged (offline — will sync)");
            }

            // Save smart defaults explicitly for Training fields (e.g. steps)
            const currentDefaultsStr = localStorage.getItem("bw_tracker_smart_defaults");
            const currentDefaults = currentDefaultsStr ? JSON.parse(currentDefaultsStr) : {};
            localStorage.setItem("bw_tracker_smart_defaults", JSON.stringify({
                ...currentDefaults,
                steps: payload.steps,
            }));

            onSave(payload);

        } catch (error) {
            console.error(error);
            toast.error("Failed to save workout log.");
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="flex items-center gap-3 mt-2 mb-6">
                <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                    <ChevronLeft size={24} />
                </Button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold tracking-tight">Workout Log</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-12">

                <div className="space-y-3">
                    <h3 className="text-lg font-bold text-foreground">Activity</h3>
                    <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm space-y-6">
                        <div>
                            <Input label="Daily Steps" type="number" {...register("steps")} />
                            {yesterdayData?.steps !== undefined && (
                                <p className="text-xs text-muted-foreground mt-2 ml-1">Yesterday: {yesterdayData.steps}</p>
                            )}
                        </div>
                        <ButtonGroup
                            label="Workout Type"
                            options={WORKOUT_TYPES}
                            value={workoutSession}
                            onChange={(v) => setValue("workout_session", v as string, { shouldDirty: true })}
                        />

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <Input label="Start Time" type="time" {...register("workout_start_time")} />
                            <Input label="Duration (mins)" type="number" {...register("workout_duration")} />
                            <Input label="Active kcal" type="number" {...register("active_kcal")} />
                            <Input label="LISS (mins)" type="number" {...register("cardio_liss_mins")} />
                            <Input label="HIIT (mins)" type="number" {...register("cardio_hiit_mins")} />
                        </div>
                    </div>
                </div>

                {!isRest && (
                    <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-foreground">Performance</h3>
                        <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm space-y-6">
                            <ButtonGroup label="Gym Mood" options={MOOD_OPTIONS} value={gymMood} onChange={(v) => setValue("gym_mood", v, { shouldDirty: true })} />
                            <ButtonGroup label="Gym Energy" options={ENERGY_OPTIONS} value={gymEnergy} onChange={(v) => setValue("gym_energy", v, { shouldDirty: true })} />

                            <div className="pt-2">
                                <Slider
                                    label="Session RPE (1-10)"
                                    min="1"
                                    max="10"
                                    step="0.5"
                                    value={gymRpe}
                                    {...register("gym_rpe")}
                                />
                                <p className="text-xs text-muted-foreground mt-2 text-center text-primary/80 font-medium">Difficulty Level</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-6">
                    <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmitting}
                        className="w-full h-14 text-lg font-bold rounded-2xl shadow-md border-b-4 border-primary/20 active:border-b-0 active:translate-y-1 transition-all"
                    >
                        {isSubmitting ? "Saving..." : "Save Workout"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
