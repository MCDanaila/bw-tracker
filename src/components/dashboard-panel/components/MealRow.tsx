import { useState } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil } from 'lucide-react';
import type { DietTemplateItem, Food } from '@/types/database';
import { calculateItemMacros } from '@/hooks/useDietData';
import { FoodRowEditable } from './FoodRowEditable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MealRowProps {
  mealName: string;
  items: Array<DietTemplateItem & { foods?: Food | null }>;
  onAddFood: (mealName: string) => void;
  onRemoveItem: (itemId: string) => void;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onReorder: (mealName: string, itemIds: string[]) => void;
  onRenameMeal: (oldName: string, newName: string) => void;
  onDeleteMeal: (mealName: string) => void;
  readOnly?: boolean;
}

function SortableFoodRow({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: DietTemplateItem & { foods?: Food | null };
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <FoodRowEditable
        item={item}
        onQuantityChange={onQuantityChange}
        onRemove={onRemove}
        dragHandleProps={listeners}
      />
    </div>
  );
}

export function MealRow({
  mealName,
  items,
  onAddFood,
  onRemoveItem,
  onQuantityChange,
  onReorder,
  onRenameMeal,
  onDeleteMeal,
  readOnly = false,
}: MealRowProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(mealName);

  // Calculate subtotals
  const subtotals = items.reduce(
    (acc, item) => {
      const m = calculateItemMacros(item.foods, item.target_quantity);
      acc.kcal += m.kcal;
      acc.p += m.p;
      acc.c += m.c;
      acc.g += m.g;
      return acc;
    },
    { kcal: 0, p: 0, c: 0, g: 0 }
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    onReorder(mealName, reordered.map(i => i.id));
  };

  const handleRenameSubmit = () => {
    if (editName.trim() && editName !== mealName) {
      onRenameMeal(mealName, editName.trim());
    }
    setEditing(false);
  };

  return (
    <div className="rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 bg-muted/30">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>

        {editing ? (
          <Input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') { setEditName(mealName); setEditing(false); } }}
            className="h-7 w-48 text-sm font-semibold"
            autoFocus
          />
        ) : (
          <span className="font-semibold text-sm flex-1">{mealName}</span>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums ml-auto">
          <span>{Math.round(subtotals.kcal)} kcal</span>
          <span className="text-blue-500">P:{Math.round(subtotals.p)}</span>
          <span className="text-amber-500">C:{Math.round(subtotals.c)}</span>
          <span className="text-red-500">F:{Math.round(subtotals.g)}</span>
        </div>

        {!readOnly && (
          <>
            <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
              <Pencil size={12} />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => onDeleteMeal(mealName)}>
              <Trash2 size={12} className="text-destructive" />
            </Button>
          </>
        )}
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="p-2 space-y-1">
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              {items.map(item => (
                <SortableFoodRow
                  key={item.id}
                  item={item}
                  onQuantityChange={onQuantityChange}
                  onRemove={onRemoveItem}
                />
              ))}
            </SortableContext>
          </DndContext>

          {!readOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => onAddFood(mealName)}
            >
              <Plus size={14} className="mr-1" /> Add Food
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
