import { useState, useEffect } from 'react';
import { Clock, Trophy, X } from 'lucide-react';
import type { FreeWorkoutLog, FreeExerciseLog } from '../../types/workout-log';
import { makeFreeExerciseLog } from '../../types/workout-log';
import type { Exercise } from '../../types/exercise';
import FreeExerciseBlock from './FreeExerciseBlock';
import ExercisePickerSheet from './ExercisePickerSheet';

interface Props {
  log: FreeWorkoutLog;
  onChange: (log: FreeWorkoutLog) => void;
  onFinish: () => void;
  onCancel: () => void;
}

function useElapsed(startedAt: Date): number {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [startedAt]);
  return elapsed;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ActiveFreeWorkout({ log, onChange, onFinish, onCancel }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [finished, setFinished] = useState(false);
  const elapsed = useElapsed(log.startedAt);

  const totalSets = log.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const doneSets  = log.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
  const hasExercises = log.exercises.length > 0;

  function updateExercise(index: number, updated: FreeExerciseLog) {
    const exercises = log.exercises.map((ex, i) => (i === index ? updated : ex));
    onChange({ ...log, exercises });
  }

  function addExercise(exercise: Exercise) {
    onChange({ ...log, exercises: [...log.exercises, makeFreeExerciseLog(exercise)] });
  }

  function handleCancel() {
    if (window.confirm('Discard this workout session?')) {
      onCancel();
    }
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-4">
        <Trophy size={56} className="text-primary" />
        <h2 className="text-xl font-bold text-foreground">Workout Complete!</h2>
        <p className="text-muted-foreground text-sm">Free Workout</p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {formatElapsed(elapsed)}
          </span>
          <span>{doneSets}/{totalSets} sets done</span>
        </div>
        <button
          onClick={onFinish}
          className="mt-4 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Session header */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleCancel}
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Cancel workout"
        >
          <X size={20} />
        </button>

        <span className="font-mono text-sm text-muted-foreground flex items-center gap-1.5">
          <Clock size={14} />
          {formatElapsed(elapsed)}
        </span>

        <button
          onClick={() => setFinished(true)}
          disabled={!hasExercises}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
            hasExercises
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {hasExercises && totalSets > 0
            ? `Finish (${doneSets}/${totalSets})`
            : 'Finish'}
        </button>
      </div>

      {/* Exercise list */}
      {log.exercises.map((exLog, i) => (
        <FreeExerciseBlock
          key={exLog.exerciseId + i}
          log={exLog}
          onChange={updated => updateExercise(i, updated)}
        />
      ))}

      {/* Add Exercise button */}
      <button
        onClick={() => setPickerOpen(true)}
        className="w-full py-3 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
      >
        + Add Exercise
      </button>

      <ExercisePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={addExercise}
      />
    </div>
  );
}
