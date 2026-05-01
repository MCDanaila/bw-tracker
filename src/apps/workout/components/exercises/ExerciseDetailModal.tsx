import { X } from 'lucide-react';
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

interface MuscleRowProps {
  label: string;
  muscles: Exercise['primary_muscles'];
}

function MuscleRow({ label, muscles }: MuscleRowProps) {
  if (muscles.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="flex flex-wrap gap-1">
        {muscles.map(m => {
          const group = SPECIFIC_TO_GROUP[m];
          return (
            <span key={m} className={`text-xs px-2 py-0.5 rounded-full font-medium ${GROUP_COLORS[group]}`}>
              {SPECIFIC_MUSCLE_LABELS[m]}
            </span>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  exercise: Exercise;
  onClose: () => void;
}

export default function ExerciseDetailModal({ exercise, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-card rounded-t-2xl border-t border-border max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3 border-b border-border">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="font-bold text-foreground text-lg">{exercise.name}</h2>
            {exercise.alternatives.length > 0 && (
              <p className="text-sm text-muted-foreground">{exercise.alternatives.join(' · ')}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted shrink-0">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-5">
          {/* Category */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Category</p>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${CATEGORY_COLORS[exercise.category]}`}>
              {CATEGORY_LABELS[exercise.category]}
            </span>
          </div>

          {/* Muscles */}
          <div className="space-y-3">
            <MuscleRow label="Primary (agonist)" muscles={exercise.primary_muscles} />
            <MuscleRow label="Secondary (synergist)" muscles={exercise.secondary_muscles} />
            <MuscleRow label="Auxiliary (stabilizer)" muscles={exercise.auxiliary_muscles} />
          </div>

          {/* Equipment */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Equipment</p>
            <div className="flex flex-wrap gap-1">
              {exercise.equipment.map(eq => (
                <span key={eq} className="text-sm border border-border rounded-full px-3 py-0.5 text-foreground">
                  {EQUIPMENT_LABELS[eq]}
                </span>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Instructions</p>
            <p className="text-sm text-foreground leading-relaxed">{exercise.instructions}</p>
          </div>
        </div>

        {/* Bottom safe area spacer */}
        <div className="h-6" />
      </div>
    </div>
  );
}
