import { useForm } from "react-hook-form";
import { Sun, Dumbbell, Moon, Save } from "lucide-react";
import { localDB, type SyncAction } from "../lib/db";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

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
    // 2. Initialize React Hook Form
    const { register, handleSubmit, reset, formState: { errors } } = useForm<DailyLogFormData>();

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
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Weight (kg)</label>
                        <input
                            type="number" step="0.1"
                            {...register("weight_fasting", { required: true })}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 84.5"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Sleep (hrs)</label>
                        <input
                            type="number" step="0.5"
                            {...register("sleep_hours")}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 7.5"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Sleep Quality</label>
                        <select
                            {...register("sleep_quality")}
                            className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none"
                        >
                            <option value="">Select...</option>
                            <option value="Good">Good</option>
                            <option value="Average">Average</option>
                            <option value="Poor">Poor</option>
                        </select>
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
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Daily Steps</label>
                            <input
                                type="number"
                                {...register("steps")}
                                className="w-full p-2 border border-gray-200 rounded-lg outline-none"
                                placeholder="e.g. 10000"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Workout Type</label>
                            <input
                                type="text"
                                {...register("workout_session")}
                                className="w-full p-2 border border-gray-200 rounded-lg outline-none"
                                placeholder="e.g. Push Day"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Cardio HIIT (mins)</label>
                            <input
                                type="number"
                                {...register("cardio_hiit_mins")}
                                className="w-full p-2 border border-gray-200 rounded-lg outline-none"
                                placeholder="e.g. 15"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Cardio LISS (mins)</label>
                            <input
                                type="number"
                                {...register("cardio_liss_mins")}
                                className="w-full p-2 border border-gray-200 rounded-lg outline-none"
                                placeholder="e.g. 30"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                            RPE (Rate of Perceived Exertion: 1-10)
                        </label>
                        <input
                            type="range" min="1" max="10" step="0.5"
                            {...register("gym_rpe")}
                            className="w-full accent-orange-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Gym Energy (1-10)</label>
                            <input
                                type="number" min="1" max="10" step="0.5"
                                {...register("gym_energy")}
                                className="w-full p-2 border border-gray-200 rounded-lg outline-none"
                                placeholder="1-10"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Gym Mood (1-10)</label>
                            <input
                                type="number" min="1" max="10" step="0.5"
                                {...register("gym_mood")}
                                className="w-full p-2 border border-gray-200 rounded-lg outline-none"
                                placeholder="1-10"
                            />
                        </div>
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
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Water (Liters)</label>
                        <input
                            type="number" step="0.1"
                            {...register("water_liters")}
                            className="w-full p-2 border border-gray-200 rounded-lg outline-none"
                            placeholder="e.g. 4.5"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Salt (Grams)</label>
                        <input
                            type="number" step="0.1"
                            {...register("salt_grams")}
                            className="w-full p-2 border border-gray-200 rounded-lg outline-none"
                            placeholder="e.g. 5.5"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Digestion Rating</label>
                        <select
                            {...register("digestion_rating")}
                            className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none"
                        >
                            <option value="">Select...</option>
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Average">Average</option>
                            <option value="Poor">Poor</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Bathroom Visits</label>
                        <input
                            type="number"
                            {...register("bathroom_visits")}
                            className="w-full p-2 border border-gray-200 rounded-lg outline-none"
                            placeholder="e.g. 2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Daily Energy (1-10)</label>
                        <input
                            type="number" min="1" max="10" step="0.5"
                            {...register("daily_energy")}
                            className="w-full p-2 border border-gray-200 rounded-lg outline-none"
                            placeholder="1-10"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Stress (1-10)</label>
                        <input
                            type="number" min="1" max="10"
                            {...register("stress_level")}
                            className="w-full p-2 border border-gray-200 rounded-lg outline-none"
                            placeholder="1-10"
                        />
                    </div>
                </div>
            </section>

            {/* Submit Button */}
            {/* Submit & Cancel Buttons */}
            <div className="flex gap-4">
                <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md flex justify-center items-center gap-2 active:bg-blue-700 transition-colors"
                >
                    <Save size={20} />
                    {editItem ? "Update Log" : "Save Today's Log"}
                </button>
                {editItem && (
                    <button
                        type="button"
                        onClick={onClearEdit}
                        className="px-6 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl shadow-sm flex justify-center items-center active:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                )}
            </div>

        </form>
    );
}