interface MacroSummaryBarProps {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  targetCalories?: number;
}

export function MacroSummaryBar({ calories, protein, carbs, fats, targetCalories }: MacroSummaryBarProps) {
  const proteinKcal = protein * 4;
  const carbsKcal = carbs * 4;
  const fatsKcal = fats * 9;
  const total = proteinKcal + carbsKcal + fatsKcal;

  const proteinPct = total > 0 ? (proteinKcal / total) * 100 : 0;
  const carbsPct = total > 0 ? (carbsKcal / total) * 100 : 0;
  const fatsPct = total > 0 ? (fatsKcal / total) * 100 : 0;

  let calorieColor = '';
  if (targetCalories && targetCalories > 0) {
    const diff = Math.abs(calories - targetCalories) / targetCalories;
    if (diff <= 0.05) calorieColor = 'text-status-excellent';
    else if (diff <= 0.1) calorieColor = 'text-status-warning';
    else calorieColor = 'text-status-danger';
  }

  return (
    <div className="space-y-1.5">
      {/* Stacked bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {total > 0 && (
          <>
            <div
              className="bg-blue-500 transition-all"
              style={{ width: `${proteinPct}%` }}
              aria-label={`Protein: ${Math.round(proteinPct)}%`}
            />
            <div
              className="bg-amber-500 transition-all"
              style={{ width: `${carbsPct}%` }}
              aria-label={`Carbs: ${Math.round(carbsPct)}%`}
            />
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${fatsPct}%` }}
              aria-label={`Fats: ${Math.round(fatsPct)}%`}
            />
          </>
        )}
      </div>

      {/* Text summary */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span className={calorieColor || undefined}>
          Kcal: {Math.round(calories)}
          {targetCalories ? ` / ${targetCalories}` : ''}
        </span>
        <span className="text-blue-500">P: {Math.round(protein)}g</span>
        <span className="text-amber-500">C: {Math.round(carbs)}g</span>
        <span className="text-red-500">F: {Math.round(fats)}g</span>
      </div>
    </div>
  );
}
