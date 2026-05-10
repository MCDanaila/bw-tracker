import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ProgramExercise } from '../../types/program';
import type { Exercise } from '../../types/exercise';
import { CATEGORY_LABELS, SPECIFIC_TO_GROUP } from '../../types/exercise';

const CATEGORY_COLORS: Record<string, string> = {
  madre:             'bg-primary/15 text-primary',
  meccanico:         'bg-blue-500/15 text-blue-500',
  metabolico:        'bg-orange-500/15 text-orange-500',
  pre_attivazione:   'bg-green-500/15 text-green-500',
  pre_affaticamento: 'bg-purple-500/15 text-purple-500',
  all_out:           'bg-destructive/15 text-destructive',
};

const GROUP_COLORS: Record<string, string> = {
  Chest:      'text-red-500',
  Back:       'text-blue-500',
  Shoulders:  'text-purple-500',
  Arms:       'text-orange-500',
  Legs:       'text-green-500',
  Core:       'text-yellow-600',
  'Full Body':'text-muted-foreground',
  Other:      'text-muted-foreground',
};

interface Props {
  programExercise: ProgramExercise;
  exercise: Exercise;
  index: number;
}

export default function ProgramExerciseRow({ programExercise, exercise, index }: Props) {
  const [expanded, setExpanded] = useState(false);

  const primaryGroup = exercise.primary_muscles.length > 0
    ? SPECIFIC_TO_GROUP[exercise.primary_muscles[0]]
    : 'Other';

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left p-4 bg-card active:bg-muted transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Index bubble */}
          <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${GROUP_COLORS[primaryGroup]} bg-current/10`}>
            <span className={GROUP_COLORS[primaryGroup]}>{index}</span>
          </span>

          {/* Name + scheme */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{exercise.name}</p>
            <p className="text-xs text-muted-foreground">
              {programExercise.sets} sets · {programExercise.repScheme} reps
            </p>
          </div>

          {/* Category badge */}
          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[programExercise.category]}`}>
            {CATEGORY_LABELS[programExercise.category]}
          </span>

          {/* Chevron */}
          <ChevronDown
            size={16}
            className={`shrink-0 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 bg-muted/30 border-t border-border">
          <p className="text-sm text-muted-foreground leading-relaxed">{programExercise.coachNotes}</p>
          {exercise.alternatives.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              <span className="font-medium text-foreground">Alternatives: </span>
              {exercise.alternatives.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
