import { useState, useMemo, useCallback } from 'react';
import { Plus, UtensilsCrossed } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/core/lib/supabase';
import { useAthleteContext } from '../contexts/AthleteContext';
import { useFoodsQuery } from '../hooks/useFoodsQuery';
import { getFoodColumns } from '../tables/foods-columns';
import { DataTable } from '../tables/DataTable';
import { DataTableToolbar } from '../tables/DataTableToolbar';
import { FoodFormDialog } from '../components/FoodFormDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { Button } from '@/core/components/ui/button';
import type { Food } from '@/core/types/database';

export default function FoodDatabasePage() {
  const { canManageAthletes } = useAthleteContext();
  const qc = useQueryClient();

  // Toolbar state
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  // Dialog state
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deletingFood, setDeletingFood] = useState<Food | null>(null);

  const { data: foods, totalCount, isLoading } = useFoodsQuery({
    search,
    unitFilter,
    stateFilter,
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (food: Partial<Food>) => {
      if (editingFood) {
        const { error } = await supabase
          .from('foods')
          .update(food)
          .eq('id', editingFood.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('foods')
          .insert(food);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['foods-query'] });
      qc.invalidateQueries({ queryKey: ['foods'] });
    },
    onError: () => {
      toast.error('Failed to save. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('foods')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['foods-query'] });
      qc.invalidateQueries({ queryKey: ['foods'] });
      setDeletingFood(null);
    },
    onError: () => {
      toast.error('Failed to delete. Please try again.');
    },
  });

  const handleSave = useCallback(async (food: Partial<Food>) => {
    await saveMutation.mutateAsync(food);
  }, [saveMutation]);

  const columns = useMemo(
    () => getFoodColumns({
      canManageAthletes,
      onEdit: (food) => setEditingFood(food),
      onDelete: (food) => setDeletingFood(food),
    }),
    [canManageAthletes]
  );

  const unitOptions = [
    { label: 'g', value: 'g' },
    { label: 'ml', value: 'ml' },
    { label: 'caps', value: 'caps' },
    { label: 'compr', value: 'compr' },
    { label: 'piece', value: 'piece' },
  ];

  const stateOptions = [
    { label: 'Peso da Cotto', value: 'Peso da Cotto' },
    { label: 'Peso da Crudo', value: 'Peso da Crudo' },
    { label: 'Peso sgocciolato', value: 'Peso sgocciolato' },
    { label: 'Peso confezionato', value: 'Peso confezionato' },
    { label: 'Peso da sgusciato', value: 'Peso da sgusciato' },
    { label: 'N/A', value: 'N/A' },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Food Database</h1>

      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search foods..."
        filters={[
          { label: 'Unit', options: unitOptions, value: unitFilter, onChange: setUnitFilter },
          { label: 'State', options: stateOptions, value: stateFilter, onChange: setStateFilter },
        ]}
        actions={canManageAthletes ? (
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus size={14} className="mr-1" /> Add Food
          </Button>
        ) : undefined}
      />

      {!isLoading && foods.length === 0 && !search && !unitFilter && !stateFilter ? (
        <EmptyState
          icon={<UtensilsCrossed size={40} />}
          title="No foods yet"
          description={canManageAthletes ? 'Add your first food to get started.' : 'No foods have been added yet.'}
          action={canManageAthletes ? { label: 'Add Food', onClick: () => setShowAddDialog(true) } : undefined}
        />
      ) : !isLoading && foods.length === 0 && (search || unitFilter || stateFilter) ? (
        <EmptyState
          icon={<UtensilsCrossed size={40} />}
          title="No foods match your filters"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      ) : (
        <DataTable
          columns={columns}
          data={foods}
          isLoading={isLoading}
          emptyMessage="No foods match your filters."
        />
      )}

      {totalCount > 0 && (
        <p className="text-xs text-muted-foreground text-right">{totalCount} foods total</p>
      )}

      {/* Add/Edit Dialog */}
      <FoodFormDialog
        open={showAddDialog || !!editingFood}
        onClose={() => { setShowAddDialog(false); setEditingFood(null); }}
        food={editingFood}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingFood}
        onClose={() => setDeletingFood(null)}
        onConfirm={() => deletingFood && deleteMutation.mutate(deletingFood.id)}
        title="Delete Food"
        description={`Are you sure you want to delete "${deletingFood?.name}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
