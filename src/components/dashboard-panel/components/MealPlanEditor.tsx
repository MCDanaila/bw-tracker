import { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, Copy, Plus, Loader2 } from 'lucide-react';
import type { DietTemplateItem, Food } from '@/types/database';
import { calculateItemMacros } from '@/hooks/useDietData';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MealRow } from './MealRow';
import { MacroSummaryBar } from './MacroSummaryBar';
import { CopyDayDialog } from './CopyDayDialog';
import FoodSearchModal from '@/components/diet/FoodSearchModal';

const DAYS = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'] as const;

interface MealPlanEditorProps {
  templateId: string;
  items: Array<DietTemplateItem & { foods?: Food | null }>;
  onSave: (items: DietTemplateItem[]) => Promise<void>;
  readOnly?: boolean;
}

export function MealPlanEditor({ templateId, items: initialItems, onSave, readOnly }: MealPlanEditorProps) {
  const [localItems, setLocalItems] = useState<Array<DietTemplateItem & { foods?: Food | null }>>(initialItems);
  const [activeDay, setActiveDay] = useState<string>('LUN');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copyDayOpen, setCopyDayOpen] = useState(false);
  const [foodSearchOpen, setFoodSearchOpen] = useState(false);
  const [addingToMeal, setAddingToMeal] = useState<string | null>(null);

  // Sync when initial items change (e.g. after save)
  useEffect(() => {
    setLocalItems(initialItems);
    setIsDirty(false);
  }, [initialItems]);

  // Warn about unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Group items by day, then by meal
  const dayItems = useMemo(() => {
    return localItems.filter(i => i.day_of_week === activeDay);
  }, [localItems, activeDay]);

  const mealGroups = useMemo(() => {
    const groups: Record<string, Array<DietTemplateItem & { foods?: Food | null }>> = {};
    for (const item of dayItems) {
      if (!groups[item.meal_name]) groups[item.meal_name] = [];
      groups[item.meal_name].push(item);
    }
    // Sort each group by sort_order
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => a.sort_order - b.sort_order);
    }
    return groups;
  }, [dayItems]);

  // Daily totals
  const dailyTotals = useMemo(() => {
    return dayItems.reduce(
      (acc, item) => {
        const m = calculateItemMacros(item.foods, item.target_quantity);
        acc.kcal += m.kcal;
        acc.protein += m.p;
        acc.carbs += m.c;
        acc.fats += m.g;
        return acc;
      },
      { kcal: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [dayItems]);

  const markDirty = useCallback(() => setIsDirty(true), []);

  const handleQuantityChange = useCallback((itemId: string, quantity: number) => {
    setLocalItems(prev => prev.map(i => i.id === itemId ? { ...i, target_quantity: quantity } : i));
    markDirty();
  }, [markDirty]);

  const handleRemoveItem = useCallback((itemId: string) => {
    setLocalItems(prev => prev.filter(i => i.id !== itemId));
    markDirty();
  }, [markDirty]);

  const handleReorder = useCallback((_mealName: string, itemIds: string[]) => {
    setLocalItems(prev => {
      const updated = [...prev];
      itemIds.forEach((id, index) => {
        const item = updated.find(i => i.id === id);
        if (item) item.sort_order = index;
      });
      return updated;
    });
    markDirty();
  }, [markDirty]);

  const handleRenameMeal = useCallback((oldName: string, newName: string) => {
    setLocalItems(prev => prev.map(i =>
      i.day_of_week === activeDay && i.meal_name === oldName
        ? { ...i, meal_name: newName }
        : i
    ));
    markDirty();
  }, [activeDay, markDirty]);

  const handleDeleteMeal = useCallback((mealName: string) => {
    setLocalItems(prev => prev.filter(i => !(i.day_of_week === activeDay && i.meal_name === mealName)));
    markDirty();
  }, [activeDay, markDirty]);

  const handleAddMeal = useCallback(() => {
    const existingMeals = Object.keys(mealGroups);
    const newMealName = `Meal ${existingMeals.length + 1}`;
    // Just set the state for adding food to this new meal
    setAddingToMeal(newMealName);
    setFoodSearchOpen(true);
  }, [mealGroups]);

  const handleAddFood = useCallback((mealName: string) => {
    setAddingToMeal(mealName);
    setFoodSearchOpen(true);
  }, []);

  const handleFoodSelected = useCallback((food: Food) => {
    if (!addingToMeal) return;
    const newItem: DietTemplateItem & { foods?: Food | null } = {
      id: crypto.randomUUID(),
      template_id: templateId,
      day_of_week: activeDay as DietTemplateItem['day_of_week'],
      meal_name: addingToMeal,
      food_id: food.id,
      target_quantity: food.portion_size,
      sort_order: localItems.filter(i => i.day_of_week === activeDay && i.meal_name === addingToMeal).length,
      created_at: new Date().toISOString(),
      foods: food,
    };
    setLocalItems(prev => [...prev, newItem]);
    setFoodSearchOpen(false);
    setAddingToMeal(null);
    markDirty();
  }, [addingToMeal, activeDay, templateId, localItems, markDirty]);

  const handleCopyDay = useCallback((targetDays: string[]) => {
    const sourceItems = localItems.filter(i => i.day_of_week === activeDay);
    const newItems = targetDays.flatMap(day =>
      sourceItems.map(item => ({
        ...item,
        id: crypto.randomUUID(),
        day_of_week: day as DietTemplateItem['day_of_week'],
      }))
    );
    // Remove existing items in target days, then add copied
    setLocalItems(prev => [
      ...prev.filter(i => !targetDays.includes(i.day_of_week)),
      ...newItems,
    ]);
    markDirty();
  }, [localItems, activeDay, markDirty]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Strip joined foods before saving
      const cleanItems = localItems.map(({ foods: _foods, ...rest }) => rest);
      await onSave(cleanItems);
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  }, [localItems, onSave]);

  return (
    <div className="space-y-4">
      <Tabs value={activeDay} onValueChange={setActiveDay}>
        <div className="flex items-center justify-between">
          <TabsList>
            {DAYS.map(day => (
              <TabsTrigger key={day} value={day}>{day}</TabsTrigger>
            ))}
          </TabsList>

          {!readOnly && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCopyDayOpen(true)}>
                <Copy size={14} className="mr-1" /> Copy Day
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!isDirty || isSaving}>
                {isSaving ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />}
                {isDirty ? 'Save Changes' : 'Saved'}
              </Button>
            </div>
          )}
        </div>

        {DAYS.map(day => (
          <TabsContent key={day} value={day}>
            <div className="space-y-3 mt-3">
              {Object.entries(mealGroups).map(([mealName, mealItems]) => (
                <MealRow
                  key={mealName}
                  mealName={mealName}
                  items={mealItems}
                  readOnly={readOnly}
                  onAddFood={handleAddFood}
                  onRemoveItem={handleRemoveItem}
                  onQuantityChange={handleQuantityChange}
                  onReorder={handleReorder}
                  onRenameMeal={handleRenameMeal}
                  onDeleteMeal={handleDeleteMeal}
                />
              ))}

              {!readOnly && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleAddMeal}
                >
                  <Plus size={14} className="mr-1" /> Add Meal
                </Button>
              )}

              {/* Daily macro summary */}
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Daily Total</p>
                <MacroSummaryBar
                  calories={dailyTotals.kcal}
                  protein={dailyTotals.protein}
                  carbs={dailyTotals.carbs}
                  fats={dailyTotals.fats}
                />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Copy Day Dialog */}
      <CopyDayDialog
        open={copyDayOpen}
        onClose={() => setCopyDayOpen(false)}
        sourceDay={activeDay}
        onCopy={handleCopyDay}
      />

      {/* Food Search Modal */}
      <FoodSearchModal
        isOpen={foodSearchOpen}
        onClose={() => { setFoodSearchOpen(false); setAddingToMeal(null); }}
        onSelectFood={handleFoodSelected}
      />
    </div>
  );
}
