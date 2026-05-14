import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useExercises } from '../../hooks/useExercises';
import FilterChipRow from '../exercises/FilterChipRow';
import type { Exercise, MuscleGroup } from '../../types/exercise';
import { ALL_MUSCLE_GROUPS, SPECIFIC_TO_GROUP } from '../../types/exercise';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (exercise: Exercise) => void;
}

const GROUP_ACTIVE: Record<MuscleGroup, string> = {
  Chest:       'bg-red-500 text-white border-red-500',
  Back:        'bg-blue-500 text-white border-blue-500',
  Shoulders:   'bg-purple-500 text-white border-purple-500',
  Arms:        'bg-orange-500 text-white border-orange-500',
  Legs:        'bg-green-500 text-white border-green-500',
  Core:        'bg-yellow-500 text-white border-yellow-500',
  Cardio:      'bg-pink-500 text-white border-pink-500',
  'Full Body': 'bg-primary text-primary-foreground border-primary',
  Other:       'bg-muted-foreground text-white border-muted-foreground',
};

export default function ExercisePickerSheet({ open, onClose, onAdd }: Props) {
  const { data: exercises = [] } = useExercises();
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null);

  const filtered = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (!muscleFilter) return true;
      const allMuscles = [...ex.primary_muscles, ...ex.secondary_muscles, ...ex.auxiliary_muscles];
      return allMuscles.some(m => SPECIFIC_TO_GROUP[m] === muscleFilter);
    });
  }, [exercises, search, muscleFilter]);

  if (!open) return null;

  function handleAdd(exercise: Exercise) {
    onAdd(exercise);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div className="w-full bg-card rounded-t-2xl flex flex-col" style={{ maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border shrink-0">
          <h3 className="font-semibold text-foreground text-lg">Add Exercise</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Search + muscle filter */}
        <div className="px-4 pt-3 pb-2 space-y-2 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search exercises…"
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <FilterChipRow>
            {ALL_MUSCLE_GROUPS.map(g => (
              <button
                key={g}
                onClick={() => setMuscleFilter(prev => prev === g ? null : g)}
                className={`shrink-0 text-[11px] font-medium px-2.5 py-0.5 rounded-full border transition-colors ${
                  muscleFilter === g
                    ? GROUP_ACTIVE[g]
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {g}
              </button>
            ))}
          </FilterChipRow>
        </div>

        {/* Scrollable exercise list */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 pt-1 space-y-1.5">
          {filtered.map(ex => (
            <button
              key={ex.id}
              onClick={() => handleAdd(ex)}
              className="w-full text-left bg-background border border-border rounded-lg px-4 py-3 flex items-center justify-between active:scale-[0.98] transition-transform"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{ex.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {ex.primary_muscles[0]?.replace(/_/g, ' ') ?? ''}
                </p>
              </div>
              <span className="text-primary text-sm font-semibold ml-3 shrink-0">+ Add</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm pt-10">No exercises found</p>
          )}
        </div>
      </div>
    </div>
  );
}
