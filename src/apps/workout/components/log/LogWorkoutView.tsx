import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import type { FreeWorkoutLog } from '../../types/workout-log';
import ActiveFreeWorkout from './ActiveFreeWorkout';

function createNewWorkout(): FreeWorkoutLog {
  return {
    sessionId: crypto.randomUUID(),
    startedAt: new Date(),
    exercises: [],
  };
}

export default function LogWorkoutView() {
  const [workout, setWorkout] = useState<FreeWorkoutLog | null>(null);

  if (workout) {
    return (
      <ActiveFreeWorkout
        log={workout}
        onChange={setWorkout}
        onFinish={() => setWorkout(null)}
        onCancel={() => setWorkout(null)}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Dumbbell size={28} className="text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Start a Workout</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pick exercises, add sets, log your lifts.
        </p>
      </div>
      <button
        onClick={() => setWorkout(createNewWorkout())}
        className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold active:scale-[0.98] transition-transform"
      >
        Start Workout
      </button>
    </div>
  );
}
