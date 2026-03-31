import { useState, useMemo } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { useFoods } from '@/core/hooks/useFoods';
import { useUpdateSuggestionStatus } from '../../hooks/useAiDietSuggestions';
import type { AiSuggestion, MealPlan } from '@/core/types/database';

// Day name mapping: English → Italian abbreviations
const DAY_MAP: Record<string, MealPlan['day_of_week']> = {
  Monday: 'MON',
  Tuesday: 'TUE',
  Wednesday: 'WED',
  Thursday: 'THU',
  Friday: 'FRI',
  Saturday: 'SAT',
  Sunday: 'SUN',
};

interface SuggestionFoodMatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  suggestion: AiSuggestion | null;
  athleteId: string;
}

export default function SuggestionFoodMatchDialog({
  isOpen,
  onClose,
  onSuccess,
  suggestion,
  athleteId,
}: SuggestionFoodMatchDialogProps) {
  const { data: foods } = useFoods();
  const updateStatus = useUpdateSuggestionStatus();
  const [isApplying, setIsApplying] = useState(false);

  // Extract unique food names from suggestion and auto-match them
  const suggestedFoods = useMemo(() => {
    if (!suggestion?.suggestion_json) return [];

    const foodNames = new Set<string>();
    const weeklyPlan = (suggestion.suggestion_json as any).weekly_plan || [];

    weeklyPlan.forEach((day: any) => {
      day.meals?.forEach((meal: any) => {
        meal.foods?.forEach((food: any) => {
          foodNames.add(food.name);
        });
      });
    });

    return Array.from(foodNames);
  }, [suggestion]);

  // Initialize and auto-match foods
  const autoMatches = useMemo(() => {
    if (!foods || !suggestedFoods.length) return {};

    const matches: Record<string, string | null> = {};

    suggestedFoods.forEach(aiName => {
      // Try fuzzy match: check if food name includes AI name or vice versa
      const match = foods.find(
        f =>
          f.name.toLowerCase().includes(aiName.toLowerCase()) ||
          aiName.toLowerCase().includes(f.name.toLowerCase())
      );

      matches[aiName] = match?.id ?? null;
    });

    return matches;
  }, [foods, suggestedFoods]);

  // Use auto-matches
  const displayMatches = autoMatches;

  const hasUnmatchedFoods = suggestedFoods.some(name => !displayMatches[name]);

  const handleApply = async () => {
    if (!suggestion || !foods) return;

    setIsApplying(true);

    try {
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      // Build meal plan rows from weekly_plan
      const weeklyPlan = (suggestion.suggestion_json as any).weekly_plan || [];
      const mealPlanRows: Omit<MealPlan, 'id' | 'created_at' | 'updated_at' | 'foods'>[] = [];

      weeklyPlan.forEach((dayPlan: any) => {
        const dayAbbr = DAY_MAP[dayPlan.day];
        if (!dayAbbr) {
          console.warn(`Unknown day: ${dayPlan.day}`);
          return;
        }

        dayPlan.meals?.forEach((meal: any) => {
          meal.foods?.forEach((food: any) => {
            const matchedFoodId = displayMatches[food.name];

            if (matchedFoodId) {
              mealPlanRows.push({
                user_id: athleteId,
                day_of_week: dayAbbr,
                meal_name: meal.meal_name,
                food_id: matchedFoodId,
                target_quantity: food.quantity_g,
                created_by: null,
                template_id: null,
              });
            }
          });
        });
      });

      // Delete all existing meal plans for this user
      const { error: delErr } = await supabase
        .from('meal_plans')
        .delete()
        .eq('user_id', athleteId);

      if (delErr) throw delErr;

      // Insert new meal plan rows
      if (mealPlanRows.length > 0) {
        const { error: insErr } = await supabase
          .from('meal_plans')
          .insert(mealPlanRows);

        if (insErr) throw insErr;
      }

      // Update suggestion status to 'applied'
      await updateStatus.mutateAsync({
        suggestionId: suggestion.id,
        status: 'applied',
      });

      toast.success(`Applied meal plan with ${mealPlanRows.length} food items`);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to apply meal plan:', error);
      toast.error('Failed to apply meal plan');
    } finally {
      setIsApplying(false);
    }
  };

  if (!suggestion?.suggestion_json) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Match Foods to Your Database</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {hasUnmatchedFoods && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/50 flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div className="text-sm text-amber-600">
                {suggestedFoods.filter(name => !displayMatches[name]).length} food(s) could not be matched to your database.
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Suggested Foods</h3>
            {suggestedFoods.map(aiName => {
              const matchedFoodId = displayMatches[aiName];
              const matchedFood = foods?.find(f => f.id === matchedFoodId);

              return (
                <Card key={aiName}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{aiName}</p>
                        <p className="text-xs text-muted-foreground">
                          Suggested food
                        </p>
                      </div>

                      {matchedFood ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/50">
                          ✓ {matchedFood.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/50">
                          ✗ No match
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isApplying || (hasUnmatchedFoods && suggestedFoods.filter(n => !displayMatches[n]).length > 0)}
          >
            {isApplying ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              `Apply Meal Plan (${suggestedFoods.filter(n => displayMatches[n]).length}/${suggestedFoods.length})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
