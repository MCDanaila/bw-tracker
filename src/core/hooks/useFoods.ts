import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/lib/supabase';
import type { Food } from '@/core/types/database';

export const useFoods = () => {
    return useQuery({
        queryKey: ['foods'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('foods')
                .select('*')
                .order('name', { ascending: true });

            if (error) {
                console.error("Error fetching foods database:", error);
                throw error;
            }

            return (data as unknown) as Food[];
        },
        // Foods database rarely changes, cache for a long time
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};
