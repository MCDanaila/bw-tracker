export const MOOD_OPTIONS = [
    { label: "😫", value: 1, ariaLabel: "Very low" },
    { label: "😐", value: 2, ariaLabel: "Low" },
    { label: "🙂", value: 3, ariaLabel: "Neutral" },
    { label: "😃", value: 4, ariaLabel: "Good" },
    { label: "🔥", value: 5, ariaLabel: "Excellent" },
];

export const ENERGY_OPTIONS = [
    { label: "🪫", value: 1, ariaLabel: "Low energy" },
    { label: "🔋", value: 3, ariaLabel: "Moderate energy" },
    { label: "⚡", value: 5, ariaLabel: "High energy" },
];

export const STRESS_OPTIONS = [
    { label: "Low", value: 1 },
    { label: "Med", value: 3 },
    { label: "High", value: 5 },
];

export const SLEEP_QUALITY_OPTIONS = [
    { label: "Poor", value: 1 },
    { label: "Avg", value: 5 },
    { label: "Good", value: 10 },
];

export const DIGESTION_OPTIONS = [
    { label: "Excellent", value: "Excellent" },
    { label: "Good", value: "Good" },
    { label: "Average", value: "Average" },
    { label: "Poor", value: "Poor" },
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
