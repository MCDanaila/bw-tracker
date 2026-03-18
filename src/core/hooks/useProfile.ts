import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/lib/supabase';
import { useAuth } from '@/core/contexts/AuthContext';
import type { UserProfile } from '@/core/types/database';

export const STEPS_GOAL_DEFAULT = 10000;
export const WATER_GOAL_DEFAULT = 4.0;
export const SALT_GOAL_DEFAULT = 6.0;

export const useProfile = (userId?: string) => {
    const { user } = useAuth();
    const targetId = userId ?? user?.id;

    return useQuery({
        queryKey: ['profile', targetId],
        queryFn: async () => {
            if (!targetId) return null;
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', targetId)
                .single();
            if (error) throw error;
            return data as UserProfile;
        },
        enabled: !!targetId,
        staleTime: 1000 * 60 * 10,
    });
};

export const useUpdateProfile = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updates: Partial<UserProfile>) => {
            if (!user?.id) throw new Error('Not authenticated');
            const { error } = await supabase
                .from('profiles')
                .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
        },
    });
};
