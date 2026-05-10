import { useState } from 'react';
import { BookOpen, Play } from 'lucide-react';
import { MOCK_PROGRAMS } from '../../data/programs.mock';
import { MOCK_EXERCISES } from '../../data/exercises.mock';
import type { Program, ProgramSession } from '../../types/program';
import ProgramExerciseRow from './ProgramExerciseRow';
import ActiveWorkoutView from './ActiveWorkoutView';

type ViewState =
  | { mode: 'browse' }
  | { mode: 'active'; program: Program; session: ProgramSession };

const exerciseMap = Object.fromEntries(MOCK_EXERCISES.map(e => [e.id, e]));

export default function ProgramsView() {
  const [view, setView] = useState<ViewState>({ mode: 'browse' });

  if (view.mode === 'active') {
    return (
      <ActiveWorkoutView
        program={view.program}
        session={view.session}
        exerciseMap={exerciseMap}
        onBack={() => setView({ mode: 'browse' })}
      />
    );
  }

  return (
    <div className="space-y-8">
      {MOCK_PROGRAMS.map(program => (
        <div key={program.id} className="space-y-4">
          {/* Program header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground leading-tight">{program.name}</h2>
              <p className="text-xs text-muted-foreground">{program.split}</p>
            </div>
          </div>

          {/* Sessions */}
          <div className="space-y-4">
            {program.sessions.map(session => (
              <div key={session.id} className="space-y-2">
                {/* Session header + start button */}
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-foreground">{session.name}</h3>
                  <button
                    onClick={() => setView({ mode: 'active', program, session })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold active:scale-95 transition-transform"
                  >
                    <Play size={11} className="fill-current" />
                    Start
                  </button>
                </div>

                {/* Exercise preview rows */}
                <div className="space-y-2">
                  {session.exercises.map((pe, i) => {
                    const exercise = exerciseMap[pe.exerciseId];
                    if (!exercise) return null;
                    return (
                      <ProgramExerciseRow
                        key={`${pe.exerciseId}-${i}`}
                        programExercise={pe}
                        exercise={exercise}
                        index={i + 1}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
