import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Clock } from 'lucide-react';
import type { Program, ProgramSession } from '../../types/program';
import type { Exercise } from '../../types/exercise';
import type { ExerciseLog } from '../../types/workout-log';
import { makeExerciseLog } from '../../types/workout-log';
import ActiveExerciseCard from './ActiveExerciseCard';

interface Props {
  program: Program;
  session: ProgramSession;
  exerciseMap: Record<string, Exercise>;
  onBack: () => void;
}

function useElapsed(startedAt: Date) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return elapsed;
}

function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ActiveWorkoutView({ program, session, exerciseMap, onBack }: Props) {
  const [startedAt] = useState(() => new Date());
  const [logs, setLogs] = useState<ExerciseLog[]>(() =>
    session.exercises.map(pe => makeExerciseLog(pe))
  );
  const [finished, setFinished] = useState(false);

  const elapsed = useElapsed(startedAt);

  const totalSets = logs.reduce((n, l) => n + l.sets.length, 0);
  const doneSets = logs.reduce((n, l) => n + l.sets.filter(s => s.completed).length, 0);
  const allDone = doneSets === totalSets;

  function updateLog(i: number, log: ExerciseLog) {
    setLogs(prev => prev.map((l, idx) => idx === i ? log : l));
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Trophy size={36} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Workout Done!</h2>
          <p className="text-muted-foreground text-sm mt-1">{session.name} · {formatElapsed(elapsed)}</p>
          <p className="text-muted-foreground text-sm">{doneSets}/{totalSets} sets completed</p>
        </div>
        <button
          onClick={onBack}
          className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm"
        >
          Back to Programs
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-foreground text-sm leading-tight truncate">{session.name}</h2>
          <p className="text-xs text-muted-foreground truncate">{program.name} · {program.split}</p>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground shrink-0">
          <Clock size={13} />
          <span className="text-sm font-mono">{formatElapsed(elapsed)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${totalSets > 0 ? (doneSets / totalSets) * 100 : 0}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{doneSets}/{totalSets} sets</p>
      </div>

      {/* Exercise cards */}
      <div className="space-y-3">
        {logs.map((log, i) => {
          const exercise = exerciseMap[log.exerciseId];
          if (!exercise) return null;
          return (
            <ActiveExerciseCard
              key={`${log.exerciseId}-${i}`}
              log={log}
              exercise={exercise}
              onChange={updated => updateLog(i, updated)}
            />
          );
        })}
      </div>

      {/* Finish button */}
      <button
        onClick={() => setFinished(true)}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-colors ${
          allDone
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground border border-border'
        }`}
      >
        {allDone ? 'Finish Workout' : `Finish Workout (${doneSets}/${totalSets} sets done)`}
      </button>
    </div>
  );
}
