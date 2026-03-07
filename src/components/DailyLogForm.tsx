import { useForm } from "react-hook-form";
import { Sun, Dumbbell, Moon, Save, Activity, Heart, Stethoscope } from "lucide-react";
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

// 1. Define the shape of our data (35 fields)
type DailyLogFormData = {
    // Base (Morning)
    weight_fasting: number;
    measurement_time: string;
    sleep_hours: number;
    water_liters: number;
    salt_grams: number;

    // Digestione & Evacuazioni
    cheat_meals: boolean;
    digestion_rating: string;
    bathroom_visits: number;
    digestion_comments: string;

    // Recupero (Recovery)
    time_asleep: string;
    time_awake: string;
    hrv: number;
    blood_glucose: number;
    sleep_score: number;
    sleep_quality: number;

    // Attività (Activity)
    steps: number;
    cardio_hiit_mins: number;
    cardio_liss_mins: number;
    workout_session: string;
    workout_start_time: string;
    workout_duration: number;
    workout_feel: number;
    gym_energy: number;
    gym_rpe: number;

    // Bio Feedback
    hunger_level: number;
    daily_energy: number;
    stress_level: number;
    libido: number;
    mood: number;

    // Notes & Health
    spo2: number;
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
            water_liters: 2,
            salt_grams: 5,

            cheat_meals: false,
            digestion_rating: "Good",
            bathroom_visits: 1,
            digestion_comments: "",

            time_asleep: "",
            time_awake: "",
            hrv: 0,
            blood_glucose: 0,
            sleep_score: 0,
            sleep_quality: 5,

            steps: 10000,
            cardio_hiit_mins: 0,
            cardio_liss_mins: 0,
            workout_session: "",
            workout_start_time: "",
            workout_duration: 0,
            workout_feel: 5,
            gym_energy: 5,
            gym_rpe: 5,

            hunger_level: 5,
            daily_energy: 5,
            stress_level: 5,
            libido: 5,
            mood: 5,

            spo2: 0,
            sys_bp: 120,
            dia_bp: 80,
            general_notes: "",
        }
    });

    const sleepQuality = watch("sleep_quality");
    const workoutFeel = watch("workout_feel");
    const gymEnergy = watch("gym_energy");
    const gymRpe = watch("gym_rpe");
    const hungerLevel = watch("hunger_level");
    const dailyEnergy = watch("daily_energy");
    const stressLevel = watch("stress_level");
    const libido = watch("libido");
    const mood = watch("mood");

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
                water_liters: data.water_liters ? Number(data.water_liters) : null,
                salt_grams: data.salt_grams ? Number(data.salt_grams) : null,

                cheat_meals: data.cheat_meals || false,
                bathroom_visits: data.bathroom_visits ? Number(data.bathroom_visits) : 0,

                time_asleep: data.time_asleep || null,
                time_awake: data.time_awake || null,
                hrv: parseNum(data.hrv),
                blood_glucose: parseNum(data.blood_glucose),
                sleep_score: parseNum(data.sleep_score),
                sleep_quality: parseNum(data.sleep_quality),

                steps: parseNum(data.steps),
                cardio_hiit_mins: parseNum(data.cardio_hiit_mins),
                cardio_liss_mins: parseNum(data.cardio_liss_mins),
                workout_start_time: data.workout_start_time || null,
                workout_duration: parseNum(data.workout_duration),
                workout_feel: parseNum(data.workout_feel),
                gym_energy: parseNum(data.gym_energy),
                gym_rpe: parseNum(data.gym_rpe),

                hunger_level: parseNum(data.hunger_level),
                daily_energy: parseNum(data.daily_energy),
                stress_level: parseNum(data.stress_level),
                libido: parseNum(data.libido),
                mood: parseNum(data.mood),

                spo2: parseNum(data.spo2),
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

            {/* --- 1. BASE (MORNING) --- */}
            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4 text-blue-600">
                    <Sun size={20} />
                    <h2 className="font-semibold text-gray-800">1. Base (Morning)</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Weight (kg)" type="number" step="0.1" {...register("weight_fasting", { required: true })} error={errors.weight_fasting ? "Required" : undefined} />
                    <Input label="Time (ore/min)" type="time" {...register("measurement_time")} />
                    <Input label="Sleep (hrs)" type="number" step="0.5" {...register("sleep_hours")} />
                    <Input label="Water (Liters)" type="number" step="0.1" {...register("water_liters")} />
                    <Input label="Salt (Grams)" type="number" step="0.1" {...register("salt_grams")} />
                </div>
            </section>

            {/* --- 2. DIGESTIONE E EVACUAZIONI --- */}
            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4 text-amber-600">
                    <Activity size={20} />
                    <h2 className="font-semibold text-gray-800">2. Nutrizione & Digestione</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                        <label className="flex items-center gap-2 mt-8">
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
                </div>
            </section>

            {/* --- 3. RECUPERO --- */}
            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4 text-indigo-500">
                    <Moon size={20} />
                    <h2 className="font-semibold text-gray-800">3. Recupero (Recovery)</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Time Asleep" type="time" {...register("time_asleep")} />
                    <Input label="Time Awake" type="time" {...register("time_awake")} />
                    <Input label="HRV (ms)" type="number" {...register("hrv")} />
                    <Input label="Blood Glucose (mg/dl)" type="number" {...register("blood_glucose")} />
                    <Input label="Sleep Score (0-100)" type="number" {...register("sleep_score")} />
                    <div className="col-span-2 sm:col-span-1 mt-1">
                        <Slider label="Sleep Quality (1-10)" min="1" max="10" step="1" value={sleepQuality} {...register("sleep_quality")} />
                    </div>
                </div>
            </section>

            {/* --- 4. ATTIVITA --- */}
            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4 text-orange-500">
                    <Dumbbell size={20} />
                    <h2 className="font-semibold text-gray-800">4. Attività (Activity)</h2>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Daily Steps" type="number" {...register("steps")} />
                        <Input label="Session Target" type="text" placeholder="e.g. Push" {...register("workout_session")} />
                        <Input label="Workout Start" type="time" {...register("workout_start_time")} />
                        <Input label="Workout Duration (mins)" type="number" {...register("workout_duration")} />
                        <Input label="Cardio HIIT (mins)" type="number" {...register("cardio_hiit_mins")} />
                        <Input label="Cardio LISS (mins)" type="number" {...register("cardio_liss_mins")} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <Slider label="Workout Feel (1-10)" min="1" max="10" step="1" value={workoutFeel} {...register("workout_feel")} />
                        <Slider label="Gym Energy (1-10)" min="1" max="10" step="1" value={gymEnergy} {...register("gym_energy")} />
                        <div className="sm:col-span-2">
                            <Slider label="Gym RPE (1-10)" min="1" max="10" step="0.5" value={gymRpe} {...register("gym_rpe")} />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- 5. BIO FEEDBACK --- */}
            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4 text-pink-500">
                    <Heart size={20} />
                    <h2 className="font-semibold text-gray-800">5. Bio Feedback</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Slider label="Hunger Level (1-10)" min="1" max="10" step="1" value={hungerLevel} {...register("hunger_level")} />
                    <Slider label="Daily Energy (1-10)" min="1" max="10" step="1" value={dailyEnergy} {...register("daily_energy")} />
                    <Slider label="Stress Level (1-10)" min="1" max="10" step="1" value={stressLevel} {...register("stress_level")} />
                    <Slider label="Libido (1-10)" min="1" max="10" step="1" value={libido} {...register("libido")} />
                    <div className="sm:col-span-2">
                        <Slider label="Mood (1-10)" min="1" max="10" step="1" value={mood} {...register("mood")} />
                    </div>
                </div>
            </section>

            {/* --- 6. NOTES & HEALTH --- */}
            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4 text-emerald-500">
                    <Stethoscope size={20} />
                    <h2 className="font-semibold text-gray-800">6. Notes & Health</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <Input label="General Notes" type="text" {...register("general_notes")} />
                    </div>
                    <Input label="SpO2 (%)" type="number" {...register("spo2")} />
                    <Input label="Systolic BP" type="number" {...register("sys_bp")} />
                    <Input label="Diastolic BP" type="number" {...register("dia_bp")} />
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