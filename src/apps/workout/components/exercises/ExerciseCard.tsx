import type { Exercise, MuscleGroup } from '../../types/exercise';
import {
  CATEGORY_LABELS,
  EQUIPMENT_LABELS,
  SPECIFIC_MUSCLE_LABELS,
  SPECIFIC_TO_GROUP,
} from '../../types/exercise';

const CATEGORY_COLORS: Record<string, string> = {
  madre:             'bg-primary/15 text-primary',
  meccanico:         'bg-blue-500/15 text-blue-500',
  metabolico:        'bg-orange-500/15 text-orange-500',
  pre_attivazione:   'bg-green-500/15 text-green-500',
  pre_affaticamento: 'bg-purple-500/15 text-purple-500',
  all_out:           'bg-destructive/15 text-destructive',
};

const GROUP_COLORS: Record<MuscleGroup, string> = {
  Chest:      'bg-red-500/15 text-red-500',
  Back:       'bg-blue-500/15 text-blue-500',
  Shoulders:  'bg-purple-500/15 text-purple-500',
  Arms:       'bg-orange-500/15 text-orange-500',
  Legs:       'bg-green-500/15 text-green-500',
  Core:       'bg-yellow-500/15 text-yellow-600',
  Cardio:     'bg-pink-500/15 text-pink-500',
  'Full Body':'bg-muted text-muted-foreground',
  Other:      'bg-muted text-muted-foreground',
};

interface Props {
  exercise: Exercise;
  onClick: () => void;
}

export default function ExerciseCard({ exercise, onClick }: Props) {
  const primaryGroups = [...new Set(exercise.primary_muscles.map(m => SPECIFIC_TO_GROUP[m]))];

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card border border-border rounded-xl p-4 space-y-2 active:scale-[0.98] transition-transform"
    >
      {/* Name + category */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{exercise.name}</p>
          {exercise.alternatives.length > 0 && (
            <p className="text-xs text-muted-foreground truncate">
              {exercise.alternatives.slice(0, 2).join(' · ')}
            </p>
          )}
        </div>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[exercise.category]}`}>
          {CATEGORY_LABELS[exercise.category]}
        </span>
      </div>

      {/* Primary muscle groups */}
      <div className="flex flex-wrap gap-1">
        {primaryGroups.map(group => (
          <span key={group} className={`text-xs px-2 py-0.5 rounded-full font-medium ${GROUP_COLORS[group]}`}>
            {group}
          </span>
        ))}
        {exercise.primary_muscles.map(m => (
          <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {SPECIFIC_MUSCLE_LABELS[m]}
          </span>
        ))}
      </div>

      {/* Equipment */}
      <div className="flex flex-wrap gap-1">
        {exercise.equipment.map(eq => (
          <span key={eq} className="text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">
            {EQUIPMENT_LABELS[eq]}
          </span>
        ))}
      </div>
    </button>
  );
}
