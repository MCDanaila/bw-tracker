import { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRole } from '@/core/contexts/RoleContext';
import { Plus, FileText, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAthleteContext } from '../contexts/AthleteContext';
import { useDietTemplatesList, useDietTemplate, useCreateDietTemplate, useDeleteDietTemplate } from '../hooks/useDietTemplates';
import { useDietData } from '@/core/hooks/useDietData';
import { supabase } from '@/core/lib/supabase';
import { MealPlanEditor } from '../components/MealPlanEditor';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/core/components/ui/dialog';
import type { DietTemplateItem, MealPlan } from '@/core/types/database';

export default function DietEditorPage() {
  const { canManageAthletes, effectiveUserId } = useAthleteContext();
  const { capabilities } = useRole();

  if (canManageAthletes) {
    return <CoachDietEditor />;
  }

  if (capabilities.canManageOwnDiet) {
    return <SelfCoachedDietEditor userId={effectiveUserId} />;
  }

  return <AthleteDietView userId={effectiveUserId} />;
}

// ---------- Coach View ----------

function CoachDietEditor() {
  const { data: templates, isLoading } = useDietTemplatesList();
  const createTemplate = useCreateDietTemplate();
  const deleteTemplate = useDeleteDietTemplate();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: templateDetail } = useDietTemplate(selectedId);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const t = await createTemplate.mutateAsync({ name: newName.trim(), description: newDesc.trim() || undefined });
    setShowCreateDialog(false);
    setNewName('');
    setNewDesc('');
    setSelectedId(t.id);
  };

  const handleSaveItems = useCallback(async (items: DietTemplateItem[]) => {
    if (!selectedId) return;

    try {
      // Delete all existing items, then re-insert
      const { error: delErr } = await supabase
        .from('diet_template_items')
        .delete()
        .eq('template_id', selectedId);
      if (delErr) throw delErr;

      if (items.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const toInsert = items.map(({ id: _id, created_at: _ca, ...rest }) => rest);
        const { error: insErr } = await supabase
          .from('diet_template_items')
          .insert(toInsert);
        if (insErr) throw insErr;
      }

      toast.success('Diet template saved.');
    } catch (err) {
      console.error('Failed to save diet template:', err);
      toast.error('Failed to save. Please try again.');
    }
  }, [selectedId]);

  // Template detail view
  if (selectedId && templateDetail) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
            <ArrowLeft size={14} className="mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold">{templateDetail.name}</h1>
        </div>

        <MealPlanEditor
          templateId={selectedId}
          items={templateDetail.items}
          onSave={handleSaveItems}
        />
      </div>
    );
  }

  // Template list view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Diet Templates</h1>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus size={14} className="mr-1" /> Create Template
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !templates || templates.length === 0 ? (
        <EmptyState
          icon={<FileText size={40} />}
          title="No templates yet"
          description="Create your first diet template to assign meal plans to athletes."
          action={{ label: 'Create Template', onClick: () => setShowCreateDialog(true) }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map(t => (
            <Card key={t.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedId(t.id)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => { e.stopPropagation(); setDeletingId(t.id); }}
                  >
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </div>
                {t.description && <CardDescription>{t.description}</CardDescription>}
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(t.updated_at).toLocaleDateString('it-IT')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(v) => { if (!v) setShowCreateDialog(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="tpl-name">Name</Label>
              <Input id="tpl-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Cutting Phase 1" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tpl-desc">Description (optional)</Label>
              <Input id="tpl-desc" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || createTemplate.isPending}>
              {createTemplate.isPending && <Loader2 size={14} className="mr-1 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => { if (deletingId) deleteTemplate.mutate(deletingId); setDeletingId(null); }}
        title="Delete Template"
        description="Are you sure? This will permanently delete this template and all its items."
        isLoading={deleteTemplate.isPending}
      />
    </div>
  );
}

// ---------- Self-Coached View ----------

function SelfCoachedDietEditor({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  if (!userId) return null;

  const { data: plans, isLoading } = useDietData(userId);

  const items = useMemo(() => {
    if (!plans || plans.length === 0) return [];
    return plans.map((plan: MealPlan, idx: number) => ({
      id: plan.id,
      template_id: '',
      day_of_week: plan.day_of_week,
      meal_name: plan.meal_name,
      food_id: plan.food_id,
      target_quantity: plan.target_quantity,
      sort_order: idx,
      created_at: plan.created_at,
      foods: plan.foods,
    }));
  }, [plans]);

  const handleSaveItems = useCallback(async (updatedItems: DietTemplateItem[]) => {
    if (!userId) return;

    try {
      const { error: delErr } = await supabase
        .from('meal_plans')
        .delete()
        .eq('user_id', userId);
      if (delErr) throw delErr;

      if (updatedItems.length > 0) {
        const toInsert = updatedItems.map(({ food_id, target_quantity, day_of_week, meal_name }) => ({
          user_id: userId,
          created_by: userId,
          template_id: null,
          day_of_week,
          meal_name,
          food_id,
          target_quantity,
        }));
        const { error: insErr } = await supabase
          .from('meal_plans')
          .insert(toInsert);
        if (insErr) throw insErr;
      }

      queryClient.invalidateQueries({ queryKey: ['diet-plans', userId] });
      toast.success('Diet plan saved.');
    } catch (err) {
      toast.error('Failed to save. Please try again.');
    }
  }, [userId, queryClient]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Diet Plan</h1>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Diet Plan</h1>
      <MealPlanEditor
        templateId=""
        items={items}
        onSave={handleSaveItems}
      />
    </div>
  );
}

// ---------- Athlete View ----------

function AthleteDietView({ userId }: { userId?: string }) {
  const { data: plans, isLoading } = useDietData(userId);

  // Convert meal plan data to template item format for read-only viewing
  const items = useMemo(() => {
    if (!plans || plans.length === 0) return [];
    return plans.map((plan: MealPlan, idx: number) => ({
      id: plan.id,
      template_id: '',
      day_of_week: plan.day_of_week,
      meal_name: plan.meal_name,
      food_id: plan.food_id,
      target_quantity: plan.target_quantity,
      sort_order: idx,
      created_at: plan.created_at,
      foods: plan.foods,
    }));
  }, [plans]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Diet Plan</h1>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Diet Plan</h1>
        <EmptyState
          icon={<FileText size={40} />}
          title="No diet plan assigned"
          description="Your coach hasn't assigned a diet plan yet."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Diet Plan</h1>
      <MealPlanEditor
        templateId=""
        items={items}
        onSave={async () => {}}
        readOnly
      />
    </div>
  );
}
