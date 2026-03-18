import { type ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import type { Food } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface FoodColumnsOptions {
  isCoach: boolean;
  onEdit?: (food: Food) => void;
  onDelete?: (food: Food) => void;
}

export function getFoodColumns({ isCoach, onEdit, onDelete }: FoodColumnsOptions): ColumnDef<Food, unknown>[] {
  const columns: ColumnDef<Food, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'portion_size',
      header: 'Portion',
      cell: ({ row }) => (
        <span className="text-right tabular-nums">
          {row.original.portion_size} {row.original.unit}
        </span>
      ),
      meta: { className: 'text-right' },
    },
    {
      accessorKey: 'unit',
      header: 'Unit',
      cell: ({ row }) => <Badge variant="secondary">{row.original.unit}</Badge>,
    },
    {
      accessorKey: 'calories',
      header: 'Calories',
      cell: ({ row }) => <span className="tabular-nums">{row.original.calories} kcal</span>,
      meta: { className: 'text-right' },
    },
    {
      accessorKey: 'protein',
      header: 'Protein',
      cell: ({ row }) => <span className="tabular-nums">{row.original.protein}g</span>,
      meta: { className: 'text-right' },
    },
    {
      accessorKey: 'carbs',
      header: 'Carbs',
      cell: ({ row }) => <span className="tabular-nums">{row.original.carbs}g</span>,
      meta: { className: 'text-right' },
    },
    {
      accessorKey: 'fats',
      header: 'Fats',
      cell: ({ row }) => <span className="tabular-nums">{row.original.fats}g</span>,
      meta: { className: 'text-right' },
    },
    {
      accessorKey: 'state',
      header: 'State',
      cell: ({ row }) => <Badge variant="outline">{row.original.state}</Badge>,
    },
  ];

  if (isCoach) {
    columns.push({
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => { e.stopPropagation(); onEdit?.(row.original); }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => { e.stopPropagation(); onDelete?.(row.original); }}
          >
            <Trash2 size={14} className="text-destructive" />
          </Button>
        </div>
      ),
    });
  }

  return columns;
}
