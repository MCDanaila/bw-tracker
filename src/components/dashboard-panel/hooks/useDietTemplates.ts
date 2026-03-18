import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { DietTemplate, DietTemplateItem } from '@/types/database';

export function useDietTemplatesList() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['diet-templates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diet_templates')
        .select('*')
        .eq('coach_id', user!.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as DietTemplate[];
    },
    enabled: !!user,
  });
}

export function useDietTemplate(templateId: string | null) {
  return useQuery({
    queryKey: ['diet-template', templateId],
    queryFn: async () => {
      const { data: template, error: tErr } = await supabase
        .from('diet_templates')
        .select('*')
        .eq('id', templateId!)
        .single();
      if (tErr) throw tErr;

      const { data: items, error: iErr } = await supabase
        .from('diet_template_items')
        .select('*, foods(*)')
        .eq('template_id', templateId!)
        .order('day_of_week')
        .order('meal_name')
        .order('sort_order');
      if (iErr) throw iErr;

      return {
        ...(template as DietTemplate),
        items: (items ?? []) as DietTemplateItem[],
      };
    },
    enabled: !!templateId,
  });
}

export function useCreateDietTemplate() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const { data: template, error } = await supabase
        .from('diet_templates')
        .insert({ coach_id: user!.id, name: data.name, description: data.description ?? null })
        .select()
        .single();
      if (error) throw error;
      return template as DietTemplate;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diet-templates'] });
    },
  });
}

export function useUpdateDietTemplate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; is_active?: boolean }) => {
      const { error } = await supabase
        .from('diet_templates')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diet-templates'] });
      qc.invalidateQueries({ queryKey: ['diet-template'] });
    },
  });
}

export function useDeleteDietTemplate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('diet_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diet-templates'] });
    },
  });
}

export function useAssignTemplate() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ templateId, athleteId }: { templateId: string; athleteId: string }) => {
      // 1. Fetch template items with food data
      const { data: items, error: fetchErr } = await supabase
        .from('diet_template_items')
        .select('*, foods(*)')
        .eq('template_id', templateId);
      if (fetchErr) throw fetchErr;

      // 2. Delete existing coach-created meal plans for this athlete
      const { error: delErr } = await supabase
        .from('meal_plans')
        .delete()
        .eq('user_id', athleteId)
        .eq('created_by', user!.id);
      if (delErr) throw delErr;

      // 3. Insert new meal plans from template items
      if (items && items.length > 0) {
        const newPlans = items.map(item => ({
          user_id: athleteId,
          day_of_week: item.day_of_week,
          meal_name: item.meal_name,
          food_id: item.food_id,
          target_quantity: item.target_quantity,
          created_by: user!.id,
          template_id: templateId,
        }));

        const { error: insErr } = await supabase
          .from('meal_plans')
          .insert(newPlans);
        if (insErr) throw insErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diet-data'] });
      qc.invalidateQueries({ queryKey: ['meal-plans'] });
    },
  });
}
