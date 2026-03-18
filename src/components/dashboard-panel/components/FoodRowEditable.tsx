import { GripVertical, Trash2 } from 'lucide-react';
import type { DietTemplateItem, Food } from '@/types/database';
import { calculateItemMacros } from '@/hooks/useDietData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FoodRowEditableProps {
  item: DietTemplateItem & { foods?: Food | null };
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragHandleProps?: any;
}

export function FoodRowEditable({ item, onQuantityChange, onRemove, dragHandleProps }: FoodRowEditableProps) {
  const macros = calculateItemMacros(item.foods, item.target_quantity);

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
      {/* Drag handle */}
      <div className="cursor-grab text-muted-foreground" {...dragHandleProps}>
        <GripVertical size={16} />
      </div>

      {/* Food name */}
      <span className="flex-1 truncate font-medium" title={item.foods?.name ?? 'Unknown food'}>
        {item.foods?.name ?? 'Unknown food'}
      </span>

      {/* Quantity input — wrap with fixed width to prevent the Input's w-full wrapper from collapsing the flex-1 food name */}
      <div className="w-20 shrink-0">
        <Input
          type="number"
          min={0}
          step={1}
          value={item.target_quantity}
          onChange={e => onQuantityChange(item.id, Number(e.target.value))}
          className="h-8 text-right tabular-nums"
        />
      </div>

      {/* Unit */}
      <span className="text-xs text-muted-foreground w-8">{item.foods?.unit ?? ''}</span>

      {/* Macros */}
      <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
        <span>{Math.round(macros.kcal)} kcal</span>
        <span className="text-blue-500">P:{Math.round(macros.p)}</span>
        <span className="text-amber-500">C:{Math.round(macros.c)}</span>
        <span className="text-red-500">F:{Math.round(macros.g)}</span>
      </div>

      {/* Delete */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onRemove(item.id)}
      >
        <Trash2 size={14} className="text-destructive" />
      </Button>
    </div>
  );
}
