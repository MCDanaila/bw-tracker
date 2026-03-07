import { useForm } from "react-hook-form";
import { Sun, Dumbbell, Moon, Save, Heart, Stethoscope, Target } from "lucide-react";
import { localDB, type SyncAction } from "@/lib/db";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";

interface DailyLogFormProps {
    editItem?: SyncAction | null;
    onClearEdit?: () => void;
}

type DailyLogFormData = {
    // Morning Check-In
    weight_fasting: number;
    measurement_time: string;
    sleep_hours: number;
    sleep_score: number;
    hrv: number;

    // Morning Biofeedback
    sleep_quality: number;
    soreness_level: number;
    stress_level: number;
    mood: number;
    hunger_level: number;
    libido: number;
    cycle_day: number;

    // Training Log
    steps: number;
    steps_goal: number;
    active_kcal: number;
    workout_session: string;
    workout_start_time: string;
    workout_duration: number;
    cardio_hiit_mins: number;
    cardio_liss_mins: number;
    gym_mood: number;
    gym_energy: number;
    gym_rpe: number;

    // End of Day
    water_liters: number;
    salt_grams: number;
    cheat_meals: boolean;
    digestion_rating: string;
    bathroom_visits: number;
    digestion_comments: string;
    daily_energy: number;

    // Weekly Check-ins (Optional)
    blood_glucose: number;
    sys_bp: number;
    dia_bp: number;
    general_notes: string;
};

export default function DailyLogForm({ editItem, onClearEdit }: DailyLogFormProps) {
    const { user } = useAuth();

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<DailyLogFormData>({
        defaultValues: {
            weight_fasting: 85,
            measurement_time: "",
            sleep_hours: 7,
            sleep_score: 0,
            hrv: 0,

            sleep_quality: 5,
            soreness_level: 5,
            stress_level: 5,
            mood: 5,
            hunger_level: 5,
            libido: 5,
            cycle_day: 0,

            steps: 10000,
            steps_goal: 10000,
            active_kcal: 0,
            workout_session: "",
            workout_start_time: "",
            workout_duration: 0,
            cardio_hiit_mins: 0,
            cardio_liss_mins: 0,
            gym_mood: 5,
            gym_energy: 5,
            gym_rpe: 5,

            water_liters: 2,
            salt_grams: 5,
            cheat_meals: false,
            digestion_rating: "Good",
            bathroom_visits: 1,
            digestion_comments: "",
            daily_energy: 5,

            blood_glucose: 0,
            sys_bp: 120,
            dia_bp: 80,
            general_notes: "",
        }
    });

    const sleepQuality = watch("sleep_quality");
    const sorenessLevel = watch("soreness_level");
    const stressLevel = watch("stress_level");
    const mood = watch("mood");
    const hungerLevel = watch("hunger_level");
    const libido = watch("libido");

    const gymMood = watch("gym_mood");
    const gymEnergy = watch("gym_energy");
    const gymRpe = watch("gym_rpe");

    const dailyEnergy = watch("daily_energy");

    useEffect(() => {
        if (editItem && editItem.payload) {
            reset(editItem.payload as DailyLogFormData);
        } else {
            reset();
        }
    }, [editItem, reset]);

    const onSubmit = async (data: DailyLogFormData) => {
        try {
            const parseNum = (val: any) => {
                const parsed = Number(val);
                if (String(val) === "" || isNaN(parsed) || parsed === 0) return null;
                return parsed;
            };

            const payload = {
                ...data,
                weight_fasting: data.weight_fasting ? Number(data.weight_fasting) : null,
                measurement_time: data.measurement_time || null,
                sleep_hours: data.sleep_hours ? Number(data.sleep_hours) : null,
                sleep_score: parseNum(data.sleep_score),
                hrv: parseNum(data.hrv),

                sleep_quality: parseNum(data.sleep_quality),
                soreness_level: parseNum(data.soreness_level),
                stress_level: parseNum(data.stress_level),
                mood: parseNum(data.mood),
                hunger_level: parseNum(data.hunger_level),
                libido: parseNum(data.libido),
                cycle_day: parseNum(data.cycle_day),

                steps: parseNum(data.steps),
                steps_goal: parseNum(data.steps_goal),
                active_kcal: parseNum(data.active_kcal),
                workout_start_time: data.workout_start_time || null,
                workout_duration: parseNum(data.workout_duration),
                cardio_hiit_mins: parseNum(data.cardio_hiit_mins),
                cardio_liss_mins: parseNum(data.cardio_liss_mins),
                gym_mood: parseNum(data.gym_mood),
                gym_energy: parseNum(data.gym_energy),
                gym_rpe: parseNum(data.gym_rpe),

                water_liters: data.water_liters ? Number(data.water_liters) : null,
                salt_grams: data.salt_grams ? Number(data.salt_grams) : null,
                cheat_meals: data.cheat_meals || false,
                bathroom_visits: data.bathroom_visits ? Number(data.bathroom_visits) : 0,
                daily_energy: parseNum(data.daily_energy),

                blood_glucose: parseNum(data.blood_glucose),
                sys_bp: parseNum(data.sys_bp),
                dia_bp: parseNum(data.dia_bp),

                date: editItem?.payload?.date || new Date().toISOString().split('T')[0],
                user_id: user?.id,
            };

            if (!user?.id) {
                alert("You must be logged in to save a log.");
                return;
            }

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

            reset();

        } catch (error) {
            console.error("Failed to save locally:", error);
            alert("Something went wrong saving locally.");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-24">

            {/* --- DAILY GOALS OVERVIEW --- */}
            <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl shadow-sm border border-blue-100 mb-6">
                <div className="flex items-center gap-2 mb-3 text-blue-800">
                    <Target size={20} />
                    <h2 className="font-semibold">Daily Goals Overview</h2>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-50 text-center">
                        <div className="text-gray-500 font-medium mb-1">Acqua / Sale</div>
                        <div className="text-blue-700 font-semibold">4-6 L / 6g</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-50 text-center">
                        <div className="text-gray-500 font-medium mb-1">Sonno (Sleep)</div>
                        <div className="text-blue-700 font-semibold">&gt; 8 hours</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-50 text-center">
                        <div className="text-gray-500 font-medium mb-1">Passi (Steps)</div>
                        <div className="text-blue-700 font-semibold">10k / day</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-50 text-center">
                        <div className="text-gray-500 font-medium mb-1">Cardio</div>
                        <div className="text-blue-700 font-semibold">150' / week</div>
                    </div>
                </div>
            </section>

            {/* --- 1. MORNING CHECK-IN --- */}
            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4 text-amber-500">
                    <Sun size={20} />
                    <h2 className="font-semibold text-gray-800">1. Morning Check-In</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Weight (kg)" type="number" step="0.1" {...register("weight_fasting", { required: true })} error={errors.weight_fasting ? "Required" : undefined} />
                    <Input label="Time (ore/min)" type="time" {...register("measurement_time")} />
                    <Input label="Sleep (hrs)" type="number" step="0.5" {...register("sleep_hours")} />
                    <Input label="Sleep Score (0-100)" type="number" {...register("sleep_score")} />
                    <Input label="HRV (ms)" type="number" {...register("hrv")} />
                </div>
            </section>

            {/* --- 2. MORNING BIOFEEDBACK --- */}
            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4 text-pink-500">
                    <Heart size={20} />
                    <h2 className="font-semibold text-gray-800">2. Morning Biofeedback</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Slider label="Sleep Quality (1-10)" min="1" max="10" step="1" value={sleepQuality} {...register("sleep_quality")} />
                    <Slider label="Soreness Level (1-10)" min="1" max="10" step="1" value={sorenessLevel} {...register("soreness_level")} />
                    <Slider label="Stress Level (1-10)" min="1" max="10" step="1" value={stressLevel} {...register("stress_level")} />
                    <Slider label="Mood (1-10)" min="1" max="10" step="1" value={mood} {...register("mood")} />
                    <Slider label="Hunger Level (1-10)" min="1" max="10" step="1" value={hungerLevel} {...register("hunger_level")} />
                    <Slider label="Libido (1-10)" min="1" max="10" step="1" value={libido} {...register("libido")} />
                    <div className="sm:col-span-2">
                        <Input label="Cycle Day (If Applicable)" type="number" {...register("cycle_day")} />
                    </div>
                </div>
            </section>

            {/* --- 3. TRAINING LOG --- */}
            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4 text-orange-500">
                    <Dumbbell size={20} />
                    <h2 className="font-semibold text-gray-800">3. Training Log</h2>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Daily Steps" type="number" {...register("steps")} />
                        <Input label="Steps Goal" type="number" {...register("steps_goal")} />
                        <Input label="Active Calories (kcal)" type="number" {...register("active_kcal")} />
                        <Input label="Session Target" type="text" placeholder="e.g. Push" {...register("workout_session")} />
                        <Input label="Workout Start" type="time" {...register("workout_start_time")} />
                        <Input label="Workout Duration (mins)" type="number" {...register("workout_duration")} />
                        <Input label="Cardio HIIT (mins)" type="number" {...register("cardio_hiit_mins")} />
                        <Input label="Cardio LISS (mins)" type="number" {...register("cardio_liss_mins")} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <Slider label="Gym Mood (1-10)" min="1" max="10" step="1" value={gymMood} {...register("gym_mood")} />
                        <Slider label="Gym Energy (1-10)" min="1" max="10" step="1" value={gymEnergy} {...register("gym_energy")} />
                        <div className="sm:col-span-2">
                            <Slider label="Gym RPE (1-10)" min="1" max="10" step="0.5" value={gymRpe} {...register("gym_rpe")} />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- 4. END OF DAY --- */}
            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4 text-indigo-500">
                    <Moon size={20} />
                    <h2 className="font-semibold text-gray-800">4. End of Day</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Water (Liters)" type="number" step="0.1" {...register("water_liters")} />
                    <Input label="Salt (Grams)" type="number" step="0.1" {...register("salt_grams")} />
                    <div className="col-span-2 sm:col-span-1 flex items-center mt-2">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" {...register("cheat_meals")} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm font-medium text-gray-700">Pasti Liberi (Cheat Meal)</span>
                        </label>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
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
                    <div className="col-span-2 sm:col-span-1">
                        <Input label="Bathroom Visits" type="number" {...register("bathroom_visits")} />
                    </div>
                    <div className="col-span-2">
                        <Input label="Digestion Comments" type="text" {...register("digestion_comments")} />
                    </div>
                    <div className="col-span-2">
                        <Slider label="Overall Daily Energy (1-10)" min="1" max="10" step="1" value={dailyEnergy} {...register("daily_energy")} />
                    </div>
                </div>
            </section>

            {/* --- 5. WEEKLY CHECK-INS (OPTIONAL) --- */}
            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4 text-emerald-500">
                    <Stethoscope size={20} />
                    <h2 className="font-semibold text-gray-800">5. Weekly Check-In (Optional)</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Fasting Blood Glucose (mg/dl)" type="number" {...register("blood_glucose")} />
                    <Input label="Systolic BP" type="number" {...register("sys_bp")} />
                    <Input label="Diastolic BP" type="number" {...register("dia_bp")} />
                    <div className="col-span-2">
                        <Input label="General Notes" type="text" {...register("general_notes")} />
                    </div>
                </div>
            </section>

            {/* Submit & Cancel Buttons */}
            <div className="flex gap-4">
                <Button type="submit" variant="primary" className="flex-1 text-sm sm:text-base gap-2">
                    <Save size={18} />
                    {editItem ? "Update Log" : "Save Today's Log"}
                </Button>
                {editItem && (
                    <Button type="button" onClick={onClearEdit} variant="secondary" className="px-6 text-sm sm:text-base">
                        Cancel
                    </Button>
                )}
            </div>

        </form>
    );
}