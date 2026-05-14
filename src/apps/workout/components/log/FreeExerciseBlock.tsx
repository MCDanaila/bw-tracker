import { useState } from 'react';
import type { FreeExerciseLog, FreeSetLog, FreeSetType } from '../../types/workout-log';
import { makeFreeSet } from '../../types/workout-log';
import { SPECIFIC_TO_GROUP, CATEGORY_LABELS } from '../../types/exercise';
import FreeSetRow from './FreeSetRow';
import SetSchemeSheet from './SetSchemeSheet';

const CATEGORY_COLORS: Record<string, string> = {
  madre:             'bg-primary/15 text-primary',
  meccanico:         'bg-blue-500/15 text-blue-500',
  metabolico:        'bg-orange-500/15 text-orange-500',
  pre_attivazione:   'bg-green-500/15 text-green-500',
  pre_affaticamento: 'bg-purple-500/15 text-purple-500',
  all_out:           'bg-destructive/15 text-destructive',
};

const GROUP_COLORS: Record<string, string> = {
  Chest:       'text-red-500',
  Back:        'text-blue-500',
  Shoulders:   'text-purple-500',
  Arms:        'text-orange-500',
  Legs:        'text-green-500',
  Core:        'text-yellow-600',
  'Full Body': 'text-muted-foreground',
  Other:       'text-muted-foreground',
};

const SET_COL_HEADERS = ['', 'kg', 'reps', 'RIR', 'rest', ''];

interface Props {
  log: FreeExerciseLog;
  onChange: (log: FreeExerciseLog) => void;
}

export default function FreeExerciseBlock({ log, onChange }: Props) {
  const [schemeOpen, setSchemeOpen] = useState(false);
  const { exercise, sets } = log;

  const primaryGroup = exercise.primary_muscles.length > 0
    ? SPECIFIC_TO_GROUP[exercise.primary_muscles[0]]
    : 'Other';

  const completedCount = sets.filter(s => s.completed).length;
  const categoryColor = CATEGORY_COLORS[exercise.category] ?? 'bg-muted text-muted-foreground';
  const groupColor = GROUP_COLORS[primaryGroup ?? 'Other'] ?? 'text-muted-foreground';

  function updateSet(index: number, updated: FreeSetLog) {
    const newSets = sets.map((s, i) => (i === index ? updated : s));
    onChange({ ...log, sets: newSets });
  }

  function handleAddSets(type: FreeSetType, count: number) {
    const newSets = Array.from({ length: count }, () => makeFreeSet(type));
    onChange({ ...log, sets: [...sets, ...newSets] });
  }

  return (
    <div className="border border-border bg-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{exercise.name}</p>
            <p className={`text-xs font-medium mt-0.5 ${groupColor}`}>{primaryGroup}</p>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${categoryColor}`}>
            {CATEGORY_LABELS[exercise.category]}
          </span>
        </div>
        {sets.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1.5">
            {completedCount}/{sets.length} sets done
          </p>
        )}
      </div>

      {/* Column headers (only when sets exist) */}
      {sets.length > 0 && (
        <div className="grid grid-cols-[28px_1fr_1fr_1fr_1fr_32px] gap-1 px-4 pb-1">
          {SET_COL_HEADERS.map((h, i) => (
            <span key={i} className="text-[10px] text-muted-foreground text-center">{h}</span>
          ))}
        </div>
      )}

      {/* Set rows */}
      {sets.length > 0 && (
        <div className="px-4 divide-y divide-border/50">
          {sets.map((set, i) => (
            <FreeSetRow
              key={i}
              set={set}
              index={i}
              onChange={updated => updateSet(i, updated)}
            />
          ))}
        </div>
      )}

      {/* Add Set button */}
      <div className="px-4 py-3">
        <button
          onClick={() => setSchemeOpen(true)}
          className="w-full py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          + Add Set
        </button>
      </div>

      <SetSchemeSheet
        open={schemeOpen}
        onClose={() => setSchemeOpen(false)}
        onConfirm={handleAddSets}
      />
    </div>
  );
}
