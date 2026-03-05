import { useForm } from "react-hook-form";
import { Sun, Dumbbell, Moon, Save } from "lucide-react";
import { localDB, type SyncAction } from "../lib/db";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Slider } from "./ui/Slider";
import { Button } from "./ui/Button";

interface DailyLogFormProps {
    editItem?: SyncAction | null;
    onClearEdit?: () => void;
}

// 1. Define the shape of our data
type DailyLogFormData = {
    weight_fasting: number;
    sleep_hours: number;
    sleep_quality: string;
    steps: number;
    cardio_hiit_mins: number;
    cardio_liss_mins: number;
    workout_session: string;
    gym_rpe: number;
    gym_energy: number;
    gym_mood: number;
    water_liters: number;
    salt_grams: number;
    digestion_rating: string;
    bathroom_visits: number;
    stress_level: number;
    daily_energy: number;
};

export default function DailyLogForm({ editItem, onClearEdit }: DailyLogFormProps) {
    const { user } = useAuth();
    // 2. Initialize React Hook Form with defaults
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<DailyLogFormData>({
        defaultValues: {
            weight_fasting: 85,
            sleep_hours: 7,
            sleep_quality: "Average",
            steps: 10000,
            cardio_hiit_mins: 0,
            cardio_liss_mins: 0,
            workout_session: "",
            gym_rpe: 5,
            gym_energy: 5,
            gym_mood: 5,
            water_liters: 2,
            salt_grams: 5,
            digestion_rating: "Good",
            bathroom_visits: 1,
            stress_level: 5,
            daily_energy: 5,
        }
    });

    const gymRpe = watch("gym_rpe");
    const gymEnergy = watch("gym_energy");
    const gymMood = watch("gym_mood");
    const dailyEnergy = watch("daily_energy");
    const stressLevel = watch("stress_level");

    // If an item is passed to edit, load it into the form
    useEffect(() => {
        if (editItem && editItem.payload) {
            reset(editItem.payload as DailyLogFormData);
        } else {
            reset(); // Clear form if editItem is null
        }
    }, [editItem, reset]);

    const onSubmit = async (data: DailyLogFormData) => {
        try {
            // 1. Prepare the payload for Supabase
            // Sanitize input to ensure empty strings from HTML inputs are sent as null, not '', avoiding postgres errors
            const payload = {
                ...data,
                sleep_hours: String(data.sleep_hours) === "" || isNaN(Number(data.sleep_hours)) ? null : Number(data.sleep_hours),
                steps: String(data.steps) === "" || isNaN(Number(data.steps)) ? null : Number(data.steps),
                cardio_hiit_mins: String(data.cardio_hiit_mins) === "" || isNaN(Number(data.cardio_hiit_mins)) ? null : Number(data.cardio_hiit_mins),
                cardio_liss_mins: String(data.cardio_liss_mins) === "" || isNaN(Number(data.cardio_liss_mins)) ? null : Number(data.cardio_liss_mins),
                gym_rpe: String(data.gym_rpe) === "" || isNaN(Number(data.gym_rpe)) ? null : Number(data.gym_rpe),
                gym_energy: String(data.gym_energy) === "" || isNaN(Number(data.gym_energy)) ? null : Number(data.gym_energy),
                gym_mood: String(data.gym_mood) === "" || isNaN(Number(data.gym_mood)) ? null : Number(data.gym_mood),
                water_liters: String(data.water_liters) === "" || isNaN(Number(data.water_liters)) ? null : Number(data.water_liters),
                salt_grams: String(data.salt_grams) === "" || isNaN(Number(data.salt_grams)) ? null : Number(data.salt_grams),
                bathroom_visits: String(data.bathroom_visits) === "" || isNaN(Number(data.bathroom_visits)) ? null : Number(data.bathroom_visits),
                stress_level: String(data.stress_level) === "" || isNaN(Number(data.stress_level)) ? null : Number(data.stress_level),
                daily_energy: String(data.daily_energy) === "" || isNaN(Number(data.daily_energy)) ? null : Number(data.daily_energy),
                // Automatically set today's date if no date was already on the payload
                date: editItem?.payload?.date || new Date().toISOString().split('T')[0],
                user_id: user?.id,
            };

            if (!user?.id) {
                alert("You must be logged in to save a log.");
                return;
            }

            // 2. Add to or update the local offline queue
            if (editItem && editItem.id) {
                await localDB.syncQueue.update(editItem.id, {
                    payload: payload
                });
                alert("Log updated locally! Press Sync to push to the cloud.");
                if (onClearEdit) onClearEdit();
            } else {
                await localDB.syncQueue.add({
                    mutation_type: 'UPSERT_DAILY_LOG',
                    payload: payload,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                });
                alert("Saved locally! Press Sync to push to the cloud.");
            }

            // 3. Reset form
            reset();

        } catch (error) {
            console.error("Failed to save locally:", error);
            alert("Something went wrong saving locally.");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-24">

            {/* --- MORNING METRICS --- */}
            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4 text-blue-600">
                    <Sun size={20} />
                    <h2 className="font-semibold text-gray-800">Morning Check-in</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Weight (kg)"
                        type="number" step="0.1"
                        placeholder="e.g. 84.5"
                        {...register("weight_fasting", { required: true })}
                        error={errors.weight_fasting ? "Weight is required" : undefined}
                    />
                    <Input
                        label="Sleep (hrs)"
                        type="number" step="0.5"
                        placeholder="e.g. 7.5"
                        {...register("sleep_hours")}
                    />
                    <div className="col-span-2">
                        <Select
                            label="Sleep Quality"
                            options={[
                                { label: "Select...", value: "" },
                                { label: "Good", value: "Good" },
                                { label: "Average", value: "Average" },
                                { label: "Poor", value: "Poor" }
                            ]}
                            {...register("sleep_quality")}
                        />
                    </div>
                </div>
            </section>

            {/* --- ACTIVITY & GYM --- */}
            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4 text-orange-500">
                    <Dumbbell size={20} />
                    <h2 className="font-semibold text-gray-800">Activity & Gym</h2>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Daily Steps"
                            type="number"
                            placeholder="e.g. 10000"
                            {...register("steps")}
                        />
                        <Input
                            label="Workout Type"
                            type="text"
                            placeholder="e.g. Push Day"
                            {...register("workout_session")}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Cardio HIIT (mins)"
                            type="number"
                            placeholder="e.g. 15"
                            {...register("cardio_hiit_mins")}
                        />
                        <Input
                            label="Cardio LISS (mins)"
                            type="number"
                            placeholder="e.g. 30"
                            {...register("cardio_liss_mins")}
                        />
                    </div>

                    <Slider
                        label="RPE (Rate of Perceived Exertion: 1-10)"
                        min="1" max="10" step="0.5"
                        value={gymRpe}
                        {...register("gym_rpe")}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Slider
                            label="Gym Energy (1-10)"
                            min="1" max="10" step="0.5"
                            value={gymEnergy}
                            {...register("gym_energy")}
                        />
                        <Slider
                            label="Gym Mood (1-10)"
                            min="1" max="10" step="0.5"
                            value={gymMood}
                            {...register("gym_mood")}
                        />
                    </div>
                </div>
            </section>

            {/* --- EVENING METRICS --- */}
            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4 text-indigo-500">
                    <Moon size={20} />
                    <h2 className="font-semibold text-gray-800">End of Day</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Water (Liters)"
                        type="number" step="0.1"
                        placeholder="e.g. 4.5"
                        {...register("water_liters")}
                    />
                    <Input
                        label="Salt (Grams)"
                        type="number" step="0.1"
                        placeholder="e.g. 5.5"
                        {...register("salt_grams")}
                    />
                    <div className="col-span-2">
                        <Select
                            label="Digestion Rating"
                            options={[
                                { label: "Select...", value: "" },
                                { label: "Excellent", value: "Excellent" },
                                { label: "Good", value: "Good" },
                                { label: "Average", value: "Average" },
                                { label: "Poor", value: "Poor" }
                            ]}
                            {...register("digestion_rating")}
                        />
                    </div>
                    <Input
                        label="Bathroom Visits"
                        type="number"
                        placeholder="e.g. 2"
                        {...register("bathroom_visits")}
                    />
                    <Slider
                        label="Daily Energy (1-10)"
                        min="1" max="10" step="0.5"
                        value={dailyEnergy}
                        {...register("daily_energy")}
                        className="col-span-2 sm:col-span-1"
                    />
                    <div className="col-span-2 sm:col-span-1">
                        <Slider
                            label="Stress (1-10)"
                            min="1" max="10" step="0.5"
                            value={stressLevel}
                            {...register("stress_level")}
                        />
                    </div>
                </div>
            </section>

            {/* Submit Button */}
            {/* Submit & Cancel Buttons */}
            <div className="flex gap-4">
                <Button
                    type="submit"
                    variant="primary"
                    className="flex-1 text-sm sm:text-base gap-2"
                >
                    <Save size={18} />
                    {editItem ? "Update Log" : "Save Today's Log"}
                </Button>
                {editItem && (
                    <Button
                        type="button"
                        onClick={onClearEdit}
                        variant="secondary"
                        className="px-6 text-sm sm:text-base"
                    >
                        Cancel
                    </Button>
                )}
            </div>

        </form>
    );
}