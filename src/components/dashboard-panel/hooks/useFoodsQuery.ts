import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Food } from '@/types/database';

interface UseFoodsQueryParams {
  search?: string;
  unitFilter?: string;
  stateFilter?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDesc?: boolean;
}

interface UseFoodsQueryResult {
  data: Food[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
}

export function useFoodsQuery({
  search = '',
  unitFilter = '',
  stateFilter = '',
  page = 0,
  pageSize = 25,
  sortBy = 'name',
  sortDesc = false,
}: UseFoodsQueryParams = {}): UseFoodsQueryResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['foods-query', search, unitFilter, stateFilter, page, pageSize, sortBy, sortDesc],
    queryFn: async () => {
      let query = supabase
        .from('foods')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      if (unitFilter) {
        query = query.eq('unit', unitFilter);
      }
      if (stateFilter) {
        query = query.eq('state', stateFilter);
      }

      const offset = page * pageSize;
      query = query
        .order(sortBy, { ascending: !sortDesc })
        .range(offset, offset + pageSize - 1);

      const { data: foods, count, error } = await query;
      if (error) throw error;

      return {
        foods: (foods ?? []) as Food[],
        count: count ?? 0,
      };
    },
  });

  return {
    data: data?.foods ?? [],
    totalCount: data?.count ?? 0,
    isLoading,
    error: error as Error | null,
  };
}
