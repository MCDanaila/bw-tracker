import { useState } from 'react';
import { ChevronDown, CheckCircle2, Circle } from 'lucide-react';
import type { ExerciseLog, SetLog } from '../../types/workout-log';
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
  log: ExerciseLog;
  exercise: Exercise;
  onChange: (log: ExerciseLog) => void;
}

export default function ActiveExerciseCard({ log, exercise, onChange }: Props) {
  const [notesOpen, setNotesOpen] = useState(false);

  const primaryGroup = exercise.primary_muscles.length > 0
    ? SPECIFIC_TO_GROUP[exercise.primary_muscles[0]]
    : 'Other';

  const completedCount = log.sets.filter(s => s.completed).length;
  const allDone = completedCount === log.sets.length;

  function updateSet(i: number, patch: Partial<SetLog>) {
    const sets = log.sets.map((s, idx) => idx === i ? { ...s, ...patch } : s);
    onChange({ ...log, sets });
  }

  function toggleSet(i: number) {
    updateSet(i, { completed: !log.sets[i].completed });
  }

  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${allDone ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`font-semibold text-sm ${allDone ? 'text-primary' : 'text-foreground'}`}>
                {exercise.name}
              </p>
              {allDone && <CheckCircle2 size={14} className="text-primary shrink-0" />}
            </div>
            <p className={`text-xs mt-0.5 font-medium ${GROUP_COLORS[primaryGroup]}`}>
              {log.programExercise.sets} sets · {log.programExercise.repScheme} reps
            </p>
          </div>
          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[log.programExercise.category]}`}>
            {CATEGORY_LABELS[log.programExercise.category]}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / log.sets.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{completedCount}/{log.sets.length} sets done</p>
      </div>

      {/* Set table */}
      <div className="px-4 pb-3">
        {/* Column headers */}
        <div className="grid grid-cols-[20px_1fr_1fr_1fr_1fr_32px] gap-1 mb-1 px-1">
          <span className="text-[10px] text-muted-foreground text-center">#</span>
          <span className="text-[10px] text-muted-foreground text-center">kg</span>
          <span className="text-[10px] text-muted-foreground text-center">reps</span>
          <span className="text-[10px] text-muted-foreground text-center">RIR</span>
          <span className="text-[10px] text-muted-foreground text-center">rest(s)</span>
          <span className="text-[10px] text-muted-foreground text-center">✓</span>
        </div>

        <div className="space-y-1.5">
          {log.sets.map((set, i) => (
            <div
              key={i}
              className={`grid grid-cols-[20px_1fr_1fr_1fr_1fr_32px] gap-1 items-center transition-opacity ${set.completed ? 'opacity-50' : ''}`}
            >
              {/* Set number */}
              <span className="text-xs text-muted-foreground text-center font-medium">{i + 1}</span>

              {/* Weight */}
              <input
                type="number"
                inputMode="decimal"
                value={set.weight}
                onChange={e => updateSet(i, { weight: e.target.value })}
                placeholder="—"
                className="w-full text-center text-sm bg-muted border border-border rounded-lg py-1.5 px-1 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 disabled:opacity-40"
                disabled={set.completed}
              />

              {/* Reps */}
              <input
                type="number"
                inputMode="numeric"
                value={set.reps}
                onChange={e => updateSet(i, { reps: e.target.value })}
                placeholder="—"
                className="w-full text-center text-sm bg-muted border border-border rounded-lg py-1.5 px-1 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 disabled:opacity-40"
                disabled={set.completed}
              />

              {/* RIR */}
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="5"
                value={set.rir}
                onChange={e => updateSet(i, { rir: e.target.value })}
                placeholder="—"
                className="w-full text-center text-sm bg-muted border border-border rounded-lg py-1.5 px-1 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 disabled:opacity-40"
                disabled={set.completed}
              />

              {/* Rest */}
              <input
                type="number"
                inputMode="numeric"
                value={set.rest}
                onChange={e => updateSet(i, { rest: e.target.value })}
                placeholder="—"
                className="w-full text-center text-sm bg-muted border border-border rounded-lg py-1.5 px-1 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 disabled:opacity-40"
                disabled={set.completed}
              />

              {/* Done checkbox */}
              <button
                onClick={() => toggleSet(i)}
                className="flex items-center justify-center w-8 h-8 mx-auto"
              >
                {set.completed
                  ? <CheckCircle2 size={20} className="text-primary" />
                  : <Circle size={20} className="text-muted-foreground" />
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Coach notes toggle */}
      <button
        onClick={() => setNotesOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 border-t border-border text-left bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <span className="text-xs text-muted-foreground font-medium">Coach notes</span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${notesOpen ? 'rotate-180' : ''}`} />
      </button>

      {notesOpen && (
        <div className="px-4 py-3 bg-muted/20 border-t border-border">
          <p className="text-sm text-muted-foreground leading-relaxed">{log.programExercise.coachNotes}</p>
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
