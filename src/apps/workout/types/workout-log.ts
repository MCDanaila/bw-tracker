import type { ProgramExercise } from './program';
import type { Exercise } from './exercise';

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

// ── Free workout (no program template) ────────────────────────────────────

export type FreeSetType =
  | 'warmup'
  | 'normal'
  | 'range'
  | 'dropset'
  | 'rest_pause'
  | 'max_reps';

export interface FreeSetLog {
  type: FreeSetType;
  weight: string;
  reps: string;
  rir: string;
  rest: string;
  completed: boolean;
}

export interface FreeExerciseLog {
  exerciseId: string;
  exercise: Exercise;
  sets: FreeSetLog[];
}

export interface FreeWorkoutLog {
  sessionId: string;
  startedAt: Date;
  exercises: FreeExerciseLog[];
}

export function makeFreeSet(type: FreeSetType): FreeSetLog {
  return { type, weight: '', reps: '', rir: '', rest: '', completed: false };
}

export function makeFreeExerciseLog(exercise: Exercise): FreeExerciseLog {
  return { exerciseId: exercise.id, exercise, sets: [] };
}
