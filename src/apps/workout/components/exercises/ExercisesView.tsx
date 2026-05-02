import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useExercises } from '../../hooks/useExercises';
import ExerciseCard from './ExerciseCard';
import ExerciseDetailModal from './ExerciseDetailModal';
import FilterChipRow from './FilterChipRow';
import type { Exercise, MuscleGroup, Equipment } from '../../types/exercise';
import { ALL_MUSCLE_GROUPS, ALL_EQUIPMENT, EQUIPMENT_LABELS, SPECIFIC_TO_GROUP } from '../../types/exercise';

const GROUP_ACTIVE: Record<MuscleGroup, string> = {
  Chest:      'bg-red-500 text-white border-red-500',
  Back:       'bg-blue-500 text-white border-blue-500',
  Shoulders:  'bg-purple-500 text-white border-purple-500',
  Arms:       'bg-orange-500 text-white border-orange-500',
  Legs:       'bg-green-500 text-white border-green-500',
  Core:       'bg-yellow-500 text-white border-yellow-500',
  Cardio:     'bg-pink-500 text-white border-pink-500',
  'Full Body':'bg-primary text-primary-foreground border-primary',
  Other:      'bg-muted-foreground text-white border-muted-foreground',
};

export default function ExercisesView() {
  const { data: exercises = [], isLoading, isError } = useExercises();

  const [search, setSearch]             = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null);
  const [equipFilter, setEquipFilter]   = useState<Equipment | null>(null);
  const [selected, setSelected]         = useState<Exercise | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return exercises.filter(ex => {
      if (q && !ex.name.toLowerCase().includes(q) && !ex.alternatives.some(a => a.toLowerCase().includes(q))) {
        return false;
      }
      if (muscleFilter) {
        const allMuscles = [...ex.primary_muscles, ...ex.secondary_muscles, ...ex.auxiliary_muscles];
        if (!allMuscles.some(m => SPECIFIC_TO_GROUP[m] === muscleFilter)) return false;
      }
      if (equipFilter && !ex.equipment.includes(equipFilter)) {
        return false;
      }
      return true;
    });
  }, [exercises, search, muscleFilter, equipFilter]);

  function toggleMuscle(g: MuscleGroup) {
    setMuscleFilter(prev => prev === g ? null : g);
  }

  function toggleEquip(e: Equipment) {
    setEquipFilter(prev => prev === e ? null : e);
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
        <p className="text-destructive font-medium">Failed to load exercises</p>
        <p className="text-muted-foreground text-sm">Check that the backend is running</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sticky search + filters — top-12 clears the 48px AppHeader */}
      <div className="sticky top-12 z-10 bg-background pt-0.5 pb-2 -mx-4 px-4 space-y-2">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search exercises…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-9 rounded-xl border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={14} className="text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Muscle group filter chips */}
        <FilterChipRow>
          {ALL_MUSCLE_GROUPS.map(g => (
            <button
              key={g}
              onClick={() => toggleMuscle(g)}
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

        {/* Equipment filter chips */}
        <FilterChipRow>
          {ALL_EQUIPMENT.map(eq => (
            <button
              key={eq}
              onClick={() => toggleEquip(eq)}
              className={`shrink-0 text-[11px] font-medium px-2.5 py-0.5 rounded-full border transition-colors ${
                equipFilter === eq
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {EQUIPMENT_LABELS[eq]}
            </button>
          ))}
        </FilterChipRow>
      </div>

      {/* Active filters summary */}
      {(muscleFilter || equipFilter) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          <button
            onClick={() => { setMuscleFilter(null); setEquipFilter(null); }}
            className="text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Exercise list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm">
          No exercises match your filters
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(ex => (
            <ExerciseCard key={ex.id} exercise={ex} onClick={() => setSelected(ex)} />
          ))}
        </div>
      )}

      {/* Detail sheet */}
      {selected && (
        <ExerciseDetailModal exercise={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
