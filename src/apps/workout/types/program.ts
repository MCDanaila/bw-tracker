import type { ExerciseCategory } from './exercise';

export interface ProgramExercise {
  exerciseId: string;
  sets: number;
  repScheme: string;
  category: ExerciseCategory;
  coachNotes: string;
}

export interface ProgramSession {
  id: string;
  name: string;
  exercises: ProgramExercise[];
}

export interface Program {
  id: string;
  name: string;
  split: string;
  sessions: ProgramSession[];
}
