
import { useForm } from "react-hook-form";
import { ChevronLeft } from "lucide-react";
import { getLocalDateStr } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ButtonGroup } from "@/components/ui/button-group";
import { Stepper } from "@/components/ui/stepper";
import { SLEEP_QUALITY_OPTIONS, STRESS_OPTIONS, MOOD_OPTIONS } from "@/lib/constants";
import { localDB } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MorningFlowViewProps {
    existingData: any;
    yesterdayData?: any;
    onBack: () => void;
    onSave: (updatedPayload: any) => void;
}



export function MorningFlowView({ existingData, yesterdayData, onBack, onSave }: MorningFlowViewProps) {
    const { user } = useAuth();

    // Initialize form with today's existing data (or smart defaults)
    const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm({
        defaultValues: {
            ...existingData,
            sleep_hours: existingData?.sleep_hours || 0,
            weight_fasting: existingData?.weight_fasting || 0,
            sleep_quality: existingData?.sleep_quality || 0,
            stress_level: existingData?.stress_level || 0,
            mood: existingData?.mood || 0,
        }
    });

    const sleepHours = watch("sleep_hours");
    const sleepQuality = watch("sleep_quality");
    const stressLevel = watch("stress_level");
    const mood = watch("mood");
    const weightFasting = watch("weight_fasting");
    const sorenessLevel = watch("soreness_level");

    const onSubmit = async (data: any) => {
        if (!user) {
            toast.error("You must be logged in to save.");
            return;
        }

        try {
            // Keep all existing data for today, but merge in the updated Morning fields
            const payload = {
                ...existingData, // preserve Workout or EOD fields if they exist
                ...data,
                date: existingData?.date || getLocalDateStr(),
                user_id: user.id,
            };

            // Incremental Upsert
            await localDB.syncQueue.add({
                mutation_type: 'UPSERT_DAILY_LOG',
                payload: payload,
                status: 'pending',
                created_at: new Date().toISOString(),
            });

            // Save smart defaults explicitly for Morning fields
            const currentDefaultsStr = localStorage.getItem("bw_tracker_smart_defaults");
            const currentDefaults = currentDefaultsStr ? JSON.parse(currentDefaultsStr) : {};
            localStorage.setItem("bw_tracker_smart_defaults", JSON.stringify({
                ...currentDefaults,
                weight_fasting: payload.weight_fasting,
                sleep_hours: payload.sleep_hours,
            }));

            toast.success("Morning check-in saved! 🔥");
            onSave(payload); // Push updated state back up to Wizard

        } catch (error) {
            console.error(error);
            toast.error("Failed to save morning log.");
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
                    <h2 className="text-xl font-bold tracking-tight">Morning Check-In</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-12">
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold text-foreground">How long did you sleep?</h3>
                        <ButtonGroup
                            label=""
                            options={[
                                { label: "6h", value: 6 },
                                { label: "6.5h", value: 6.5 },
                                { label: "7h", value: 7 },
                                { label: "7.5h", value: 7.5 },
                                { label: "8h", value: 8 },
                                { label: "Other", value: -1 }
                            ]}
                            value={sleepHours > 0 ? ([6, 6.5, 7, 7.5, 8].includes(sleepHours) ? sleepHours : -1) : null}
                            onChange={(v) => { if (v !== -1) setValue("sleep_hours", v, { shouldDirty: true }) }}
                        />
                        {(![6, 6.5, 7, 7.5, 8].includes(sleepHours) && sleepHours !== 0) && (
                            <div className="mt-4 p-4 rounded-xl bg-card border border-border/50">
                                <Stepper label="Custom Sleep (hrs)" value={sleepHours || 0} onChange={(v) => setValue("sleep_hours", v, { shouldDirty: true })} step={0.5} min={0} max={24} />
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 pt-2">
                        <h3 className="text-lg font-bold text-foreground">How do you feel?</h3>
                        <div className="grid grid-cols-1 gap-6 p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
                            <ButtonGroup label="Sleep Quality" options={SLEEP_QUALITY_OPTIONS} value={sleepQuality} onChange={(v) => setValue("sleep_quality", v, { shouldDirty: true })} />
                            <ButtonGroup label="Mood" options={MOOD_OPTIONS} value={mood} onChange={(v) => setValue("mood", v, { shouldDirty: true })} />
                            <ButtonGroup label="Stress Level" options={STRESS_OPTIONS} value={stressLevel} onChange={(v) => setValue("stress_level", v, { shouldDirty: true })} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-lg font-bold text-foreground">Morning Vitals</h3>
                        <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
                            <div className="col-span-2">
                                <Stepper label="Weight (kg)" value={weightFasting || 0} onChange={(v) => setValue("weight_fasting", v, { shouldDirty: true })} step={0.1} min={30} max={200} />
                                {yesterdayData?.weight_fasting && (
                                    <p className="text-xs text-muted-foreground mt-2 ml-1">Yesterday: {yesterdayData.weight_fasting}kg</p>
                                )}
                            </div>

                            <Input label="Time" type="time" {...register("measurement_time")} className="mt-2" />
                            <div className="col-span-1 mt-2">
                                <Input label="HRV (ms)" type="number" {...register("hrv")} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-lg font-bold text-foreground">Body Readiness</h3>
                        <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
                            <ButtonGroup label="Muscle Soreness" options={STRESS_OPTIONS} value={sorenessLevel} onChange={(v) => setValue("soreness_level", v, { shouldDirty: true })} />
                        </div>
                    </div>

                    <div className="pt-6">
                        <Button
                            type="submit"
                            size="lg"
                            disabled={isSubmitting}
                            className="w-full h-14 text-lg font-bold rounded-2xl shadow-md border-b-4 border-primary/20 active:border-b-0 active:translate-y-1 transition-all"
                        >
                            {isSubmitting ? "Saving..." : "Save Morning"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
