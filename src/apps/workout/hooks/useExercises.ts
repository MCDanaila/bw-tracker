import { useQuery } from '@tanstack/react-query';
import type { Exercise } from '../types/exercise';
import { MOCK_EXERCISES } from '../data/exercises.mock';

export function useExercises() {
  return useQuery<Exercise[]>({
    queryKey: ['exercises'],
    queryFn: () => Promise.resolve(MOCK_EXERCISES),
    staleTime: Infinity,
  });
}
