import { useForm } from "react-hook-form";
import { ChevronLeft } from "lucide-react";
import { getLocalDateStr } from "@/core/lib/utils";
import { Button } from "@/core/components/ui/button";
import { ButtonGroup } from "@/core/components/ui/button-group";
import { Stepper } from "@/core/components/ui/stepper";
import { DIGESTION_OPTIONS, HUNGER_OPTIONS, LIBIDO_OPTIONS } from "@/core/lib/constants";
import { saveDailyLog } from "@/core/lib/db";
import { useAuth } from "@/core/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Textarea } from "@/core/components/ui/textarea";

interface EndOfDayFlowViewProps {
    existingData: any;
    onBack: () => void;
    onSave: (updatedPayload: any) => void;
}



export function EndOfDayFlowView({ existingData, onBack, onSave }: EndOfDayFlowViewProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm({
        defaultValues: {
            ...existingData,
            water_liters: existingData?.water_liters || 0,
            salt_grams: existingData?.salt_grams || 0,
            digestion_rating: existingData?.digestion_rating || 0,
            diet_adherence: existingData?.diet_adherence || "perfect",
            hunger_level: existingData?.hunger_level || 0,
            libido: existingData?.libido || 0,
        }
    });

    const waterLiters = watch("water_liters");
    const saltGrams = watch("salt_grams");
    const digestionRating = watch("digestion_rating");
    const dietAdherence = watch("diet_adherence");
    const hungerLevel = watch("hunger_level");
    const libido = watch("libido");

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

            // Try to save directly to Supabase; fall back to queue if offline
            const result = await saveDailyLog(payload);
            if (result === 'synced') {
                queryClient.invalidateQueries({ queryKey: ['historyLogs'] });
                queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
                toast.success("Day completed! Excellent work.");
            } else {
                toast.success("Day completed (offline — will sync)");
            }

            // Save water defaults
            const currentDefaultsStr = localStorage.getItem("bw_tracker_smart_defaults");
            const currentDefaults = currentDefaultsStr ? JSON.parse(currentDefaultsStr) : {};
            localStorage.setItem("bw_tracker_smart_defaults", JSON.stringify({
                ...currentDefaults,
                water_liters: payload.water_liters,
            }));

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
                        <Stepper
                            label="Salt (Grams)"
                            value={saltGrams}
                            onChange={(v) => setValue("salt_grams", v, { shouldDirty: true })}
                            step={1}
                            min={0}
                            max={20}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-lg font-bold text-foreground">Diet & Digestion</h3>
                    <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm space-y-6">

                        <ButtonGroup
                            label="Hunger Level"
                            options={HUNGER_OPTIONS}
                            value={hungerLevel}
                            onChange={(v) => setValue("hunger_level", v, { shouldDirty: true })}
                        />

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
                                placeholder="Any final notes about today? How did you feel overall?"
                                className="min-h-[100px] rounded-2xl bg-background resize-none p-4 shadow-sm border-border/50"
                                {...register("general_notes")}
                            />
                        </div>
                    </div>
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
