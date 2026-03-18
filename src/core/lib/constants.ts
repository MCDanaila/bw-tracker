export const MOOD_OPTIONS = [
    { label: "😫", value: 1, ariaLabel: "Very low" },
    { label: "😐", value: 2, ariaLabel: "Low" },
    { label: "🙂", value: 3, ariaLabel: "Neutral" },
    { label: "😃", value: 4, ariaLabel: "Good" },
    { label: "🤩", value: 5, ariaLabel: "Excellent" },
];

export const ENERGY_OPTIONS = [
    { label: "💀", value: 1, ariaLabel: "Exhausted" },
    { label: "🪫", value: 2, ariaLabel: "Low energy" },
    { label: "🔋", value: 3, ariaLabel: "Normal energy" },
    { label: "⚡", value: 4, ariaLabel: "Charged" },
    { label: "🚀", value: 5, ariaLabel: "Unstoppable" },
];

export const STRESS_OPTIONS = [
    { label: "😡", value: 1 },
    { label: "😤", value: 2 },
    { label: "🙁", value: 3 },
    { label: "😐", value: 4 },
    { label: "😌", value: 5 },
];

export const SLEEP_PRESET_OPTIONS = [
    { label: '6h', value: 6 },
    { label: '6.5h', value: 6.5 },
    { label: '7h', value: 7 },
    { label: '7.5h', value: 7.5 },
    { label: '8h', value: 8 },
    { label: 'Other', value: -1 },
];

export const SLEEP_QUALITY_OPTIONS = [
    { label: "Terrible", value: 1 },
    { label: "Poor", value: 2 },
    { label: "Average", value: 3 },
    { label: "Good", value: 4 },
    { label: "Excellent", value: 5 },
];

export const DIGESTION_OPTIONS = [
    { label: "Terrible", value: 1 },
    { label: "Poor", value: 2 },
    { label: "Average", value: 3 },
    { label: "Good", value: 4 },
    { label: "Excellent", value: 5 },
];

export const HUNGER_OPTIONS = [
    { label: "Starving", value: 1, ariaLabel: "Starving" },
    { label: "Very Hungry", value: 2, ariaLabel: "Very hungry" },
    { label: "Hungry", value: 3, ariaLabel: "Moderately hungry" },
    { label: "Satiated", value: 4, ariaLabel: "Satiated" },
    { label: "Full", value: 5, ariaLabel: "Full" },
];

export const LIBIDO_OPTIONS = [
    { label: "Very Low", value: 1, ariaLabel: "Very low" },
    { label: "Low", value: 2, ariaLabel: "Low" },
    { label: "Normal", value: 3, ariaLabel: "Normal" },
    { label: "High", value: 4, ariaLabel: "High" },
    { label: "Very High", value: 5, ariaLabel: "Very high" },
];

export const WORKOUT_TYPES = [
    { label: "Push", value: "Push" },
    { label: "Pull", value: "Pull" },
    { label: "Legs", value: "Legs" },
    { label: "Cardio", value: "Cardio" },
    { label: "Rest", value: "Rest" },
];

// Helper to convert a value back to its label (e.g. for DailySummaryCard)
export const getLabelByValue = (options: { label: string, value: any }[], value: any) => {
    const option = options.find((opt) => opt.value === value);
    return option ? option.label : value;
};

// Fields that must be sanitized: "" → null on submit (Postgres integer/numeric columns)
export const DAILY_LOG_INT_FIELDS = [
    'hrv',
    'steps',
    'workout_start_time',
    'workout_duration',
    'cardio_hiit_mins',
    'cardio_liss_mins',
    'active_kcal',
    'digestion_rating',
] as const;

// Canonical default values — used by all 3 flow views and EditLogModal
export function getDailyLogDefaults(existing?: Record<string, any>) {
    return {
        // Morning
        weight_fasting: existing?.weight_fasting ?? 0,
        measurement_time: existing?.measurement_time ?? '',
        hrv: existing?.hrv ?? '',
        sleep_hours: existing?.sleep_hours ?? 0,
        sleep_quality: existing?.sleep_quality ?? 0,
        mood: existing?.mood ?? 0,
        stress_level: existing?.stress_level ?? 0,
        soreness_level: existing?.soreness_level ?? 0,
        // Training
        workout_session: existing?.workout_session ?? 'Rest',
        steps: existing?.steps ?? '',
        workout_start_time: existing?.workout_start_time ?? '',
        workout_duration: existing?.workout_duration ?? '',
        active_kcal: existing?.active_kcal ?? '',
        cardio_liss_mins: existing?.cardio_liss_mins ?? '',
        cardio_hiit_mins: existing?.cardio_hiit_mins ?? '',
        gym_mood: existing?.gym_mood ?? 0,
        gym_energy: existing?.gym_energy ?? 0,
        gym_rpe: existing?.gym_rpe ?? 5,
        // End of Day
        water_liters: existing?.water_liters ?? 0,
        salt_grams: existing?.salt_grams ?? 0,
        hunger_level: existing?.hunger_level ?? 0,
        diet_adherence: existing?.diet_adherence ?? 'perfect',
        digestion_rating: existing?.digestion_rating ?? 0,
        libido: existing?.libido ?? 0,
        general_notes: existing?.general_notes ?? '',
    };
}
