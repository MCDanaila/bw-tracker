export const MOOD_OPTIONS = [
    { label: "😫", value: 1, ariaLabel: "Very low" },
    { label: "😐", value: 2, ariaLabel: "Low" },
    { label: "🙂", value: 3, ariaLabel: "Neutral" },
    { label: "😃", value: 4, ariaLabel: "Good" },
    { label: "🔥", value: 5, ariaLabel: "Excellent" },
];

export const ENERGY_OPTIONS = [
    { label: "🪫", value: 1, ariaLabel: "Low energy" },
    { label: "🔋", value: 2, ariaLabel: "Moderate energy" },
    { label: "⚡", value: 3, ariaLabel: "High energy" },
];

export const STRESS_OPTIONS = [
    { label: "Low", value: 1 },
    { label: "Med", value: 2 },
    { label: "High", value: 3 },
];

export const SLEEP_QUALITY_OPTIONS = [
    { label: "Poor", value: 1 },
    { label: "Average", value: 2 },
    { label: "Good", value: 3 },
];

export const DIGESTION_OPTIONS = [
    { label: "Poor", value: 1 },
    { label: "Average", value: 2 },
    { label: "Good", value: 3 },
    { label: "Excellent", value: 4 },
];

export const HUNGER_OPTIONS = [
    { label: "No Hunger", value: 1, ariaLabel: "No hunger" },
    { label: "Slightly Hungry", value: 2, ariaLabel: "Slightly hungry" },
    { label: "Moderately Hungry", value: 3, ariaLabel: "Moderately hungry" },
    { label: "Very Hungry", value: 4, ariaLabel: "Very hungry" },
    { label: "Starving", value: 5, ariaLabel: "Starving" },
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
