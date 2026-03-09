import { useForm } from "react-hook-form";
import { ChevronLeft } from "lucide-react";
import { getLocalDateStr } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Stepper } from "@/components/ui/stepper";
import { DIGESTION_OPTIONS } from "@/lib/constants";
import { localDB } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface EndOfDayFlowViewProps {
    existingData: any;
    onBack: () => void;
    onSave: (updatedPayload: any) => void;
}



export function EndOfDayFlowView({ existingData, onBack, onSave }: EndOfDayFlowViewProps) {
    const { user } = useAuth();

    const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm({
        defaultValues: {
            ...existingData,
            water_liters: existingData?.water_liters || 0,
            digestion_rating: existingData?.digestion_rating || 0,
            cheat_meals: existingData?.cheat_meals || false,
        }
    });

    const waterLiters = watch("water_liters");
    const digestionRating = watch("digestion_rating");
    const cheatMeals = watch("cheat_meals");

    const onSubmit = async (data: any) => {
        if (!user) {
            toast.error("You must be logged in to save.");
            return;
        }

        try {
            const payload = {
                ...existingData,
                ...data, // overwrite with form data
                date: existingData?.date || getLocalDateStr(),
                user_id: user.id,
            };

            await localDB.syncQueue.add({
                mutation_type: 'UPSERT_DAILY_LOG',
                payload: payload,
                status: 'pending',
                created_at: new Date().toISOString(),
            });

            // Save water defaults
            const currentDefaultsStr = localStorage.getItem("bw_tracker_smart_defaults");
            const currentDefaults = currentDefaultsStr ? JSON.parse(currentDefaultsStr) : {};
            localStorage.setItem("bw_tracker_smart_defaults", JSON.stringify({
                ...currentDefaults,
                water_liters: payload.water_liters,
            }));

            toast.success("Day completed! Excellent work.");
            onSave(payload);

        } catch (error) {
            console.error(error);
            toast.error("Failed to save end-of-day log.");
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
                    <h2 className="text-xl font-bold tracking-tight">End of Day</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-12">

                <div className="space-y-3">
                    <h3 className="text-lg font-bold text-foreground">Hydration</h3>
                    <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm space-y-6">
                        <Stepper
                            label="Water (Liters)"
                            value={waterLiters}
                            onChange={(v) => setValue("water_liters", v, { shouldDirty: true })}
                            step={0.5}
                            min={0}
                            max={10}
                        />
                        <div className="flex justify-between items-center bg-background p-3 rounded-lg border border-border/30">
                            <span className="text-sm font-medium text-muted-foreground">Goal: 4.0L</span>
                            <span className="text-sm font-bold text-primary">{Math.round((waterLiters / 4) * 100)}%</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-lg font-bold text-foreground">Diet & Digestion</h3>
                    <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm space-y-6">

                        <div>
                            <p className="text-sm font-semibold mb-3">Diet Adherence</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant={cheatMeals === false ? "default" : "outline"}
                                    onClick={() => setValue("cheat_meals", false, { shouldDirty: true })}
                                    className="rounded-xl shadow-none"
                                >
                                    Perfect
                                </Button>
                                <Button
                                    type="button"
                                    variant={cheatMeals === true ? "destructive" : "outline"}
                                    onClick={() => setValue("cheat_meals", true, { shouldDirty: true })}
                                    className="rounded-xl shadow-none"
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
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-lg font-bold text-foreground">Journal</h3>
                    <Textarea
                        placeholder="Any final notes about today? How did you feel overall?"
                        className="min-h-[120px] rounded-2xl bg-card resize-none p-4 shadow-sm border-border/50"
                        {...register("notes")}
                    />
                </div>

                <div className="pt-6">
                    <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmitting}
                        className="w-full h-14 text-lg font-bold rounded-2xl shadow-md border-b-4 border-green-600/20 bg-green-600 hover:bg-green-700 active:border-b-0 active:translate-y-1 transition-all"
                    >
                        {isSubmitting ? "Finishing..." : "Finish Day"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
