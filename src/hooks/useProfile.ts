import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
    id: string;
    username: string | null;
    gender: string | null;
    age: number | null;
    unit_system: 'metric' | 'imperial';
    height: number | null;
    initial_weight: number | null;
    target_weight: number | null;
    activity_level: string | null;
    goal: string | null;
    steps_goal: number | null;
    water_goal: number | null;
    role: 'athlete' | 'coach';
}

export const STEPS_GOAL_DEFAULT = 10000;
export const WATER_GOAL_DEFAULT = 4.0;

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
