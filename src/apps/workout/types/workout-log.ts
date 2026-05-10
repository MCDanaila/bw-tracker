import type { ProgramExercise } from './program';

export interface SetLog {
  weight: string;
  reps: string;
  rir: string;
  rest: string;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  programExercise: ProgramExercise;
  sets: SetLog[];
}

export interface WorkoutLog {
  programId: string;
  sessionId: string;
  sessionName: string;
  startedAt: Date;
  exercises: ExerciseLog[];
}

export function makeEmptySet(): SetLog {
  return { weight: '', reps: '', rir: '', rest: '', completed: false };
}

export function makeExerciseLog(pe: ProgramExercise): ExerciseLog {
  return {
    exerciseId: pe.exerciseId,
    programExercise: pe,
    sets: Array.from({ length: pe.sets }, makeEmptySet),
  };
}
