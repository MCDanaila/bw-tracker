import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import type { Food } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface FoodFormDialogProps {
  open: boolean;
  onClose: () => void;
  food?: Food | null;
  onSave: (food: Partial<Food>) => Promise<void>;
}

interface FoodFormValues {
  id: string;
  name: string;
  portion_size: number;
  unit: Food['unit'];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  state: Food['state'];
}

const UNIT_OPTIONS = [
  { label: 'g', value: 'g' },
  { label: 'ml', value: 'ml' },
  { label: 'caps', value: 'caps' },
  { label: 'compr', value: 'compr' },
  { label: 'piece', value: 'piece' },
];

const STATE_OPTIONS = [
  { label: 'Peso da Cotto', value: 'Peso da Cotto' },
  { label: 'Peso da Crudo', value: 'Peso da Crudo' },
  { label: 'Peso sgocciolato', value: 'Peso sgocciolato' },
  { label: 'Peso confezionato', value: 'Peso confezionato' },
  { label: 'Peso da sgusciato', value: 'Peso da sgusciato' },
  { label: 'N/A', value: 'N/A' },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function FoodFormDialog({ open, onClose, food, onSave }: FoodFormDialogProps) {
  const isEdit = !!food;

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FoodFormValues>({
    defaultValues: {
      id: food?.id ?? '',
      name: food?.name ?? '',
      portion_size: food?.portion_size ?? 100,
      unit: food?.unit ?? 'g',
      calories: food?.calories ?? 0,
      protein: food?.protein ?? 0,
      carbs: food?.carbs ?? 0,
      fats: food?.fats ?? 0,
      state: food?.state ?? 'N/A',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        id: food?.id ?? '',
        name: food?.name ?? '',
        portion_size: food?.portion_size ?? 100,
        unit: food?.unit ?? 'g',
        calories: food?.calories ?? 0,
        protein: food?.protein ?? 0,
        carbs: food?.carbs ?? 0,
        fats: food?.fats ?? 0,
        state: food?.state ?? 'N/A',
      });
    }
  }, [open, food, reset]);

  const calories = watch('calories');
  const protein = watch('protein');
  const carbs = watch('carbs');
  const fats = watch('fats');

  const macroWarning = useMemo(() => {
    if (!calories || calories === 0) return null;
    const estimated = protein * 4 + carbs * 4 + fats * 9;
    const diff = Math.abs(estimated - calories) / calories;
    if (diff > 0.2) {
      return `Macro-derived kcal (${Math.round(estimated)}) differs from entered kcal (${calories}) by ${Math.round(diff * 100)}%`;
    }
    return null;
  }, [calories, protein, carbs, fats]);

  const onSubmit = async (values: FoodFormValues) => {
    const data: Partial<Food> = {
      name: values.name,
      portion_size: values.portion_size,
      unit: values.unit,
      calories: values.calories,
      protein: values.protein,
      carbs: values.carbs,
      fats: values.fats,
      state: values.state,
    };
    if (!isEdit) {
      data.id = values.id || slugify(values.name);
    }
    await onSave(data);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Food' : 'Add Food'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register('name', { required: 'Required', minLength: { value: 2, message: 'Min 2 chars' } })}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            {!isEdit && (
              <div className="col-span-2 space-y-1">
                <Label htmlFor="id">ID (auto-generated from name)</Label>
                <Input id="id" {...register('id')} placeholder="Leave empty for auto-slug" />
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="portion_size">Portion Size</Label>
              <Input
                id="portion_size"
                type="number"
                step="1"
                {...register('portion_size', { valueAsNumber: true, required: true, min: { value: 0.1, message: '> 0' } })}
              />
            </div>

            <div className="space-y-1">
              <Select
                label="Unit"
                options={UNIT_OPTIONS}
                {...register('unit')}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="calories">Calories (kcal)</Label>
              <Input
                id="calories"
                type="number"
                step="1"
                {...register('calories', { valueAsNumber: true, required: true, min: 0 })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                step="0.1"
                {...register('protein', { valueAsNumber: true, required: true, min: 0 })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                step="0.1"
                {...register('carbs', { valueAsNumber: true, required: true, min: 0 })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="fats">Fats (g)</Label>
              <Input
                id="fats"
                type="number"
                step="0.1"
                {...register('fats', { valueAsNumber: true, required: true, min: 0 })}
              />
            </div>

            <div className="col-span-2 space-y-1">
              <Select
                label="State"
                options={STATE_OPTIONS}
                {...register('state')}
              />
            </div>
          </div>

          {macroWarning && (
            <p className="text-xs text-status-warning">{macroWarning}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={14} className="mr-1 animate-spin" />}
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
