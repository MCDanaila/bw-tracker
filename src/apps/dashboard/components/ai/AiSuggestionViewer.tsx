import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/core/components/ui/tabs';
import type { AiSuggestion } from '@/core/types/database';
import { useUpdateSuggestionStatus } from '../../hooks/useAiDietSuggestions';

interface AiSuggestionViewerProps {
  suggestion: AiSuggestion | null;
  onApply?: (suggestion: AiSuggestion) => void;
  onFeedback?: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AiSuggestionViewer({
  suggestion,
  onApply,
  onFeedback,
}: AiSuggestionViewerProps) {
  const updateStatus = useUpdateSuggestionStatus();

  if (!suggestion) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center text-muted-foreground py-8">
          Generate a plan to view suggestions here
        </CardContent>
      </Card>
    );
  }

  const suggestionJson = suggestion.suggestion_json as any;
  const isApproved = suggestion.status === 'approved' || suggestion.status === 'applied';

  const handleApprove = async () => {
    await updateStatus.mutateAsync({
      suggestionId: suggestion.id,
      status: 'approved',
    });
  };

  const handleApply = () => {
    if (onApply) {
      onApply(suggestion);
    }
  };

  const handleReject = async () => {
    await updateStatus.mutateAsync({
      suggestionId: suggestion.id,
      status: 'rejected',
    });
  };

  return (
    <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg line-clamp-2">{suggestion.query_text}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(suggestion.created_at).toLocaleDateString('it-IT')}
              </p>
            </div>
            <Badge
              variant={
                suggestion.status === 'applied'
                  ? 'default'
                  : suggestion.status === 'approved'
                    ? 'outline'
                    : suggestion.status === 'rejected'
                      ? 'destructive'
                      : 'secondary'
              }
            >
              {suggestion.status}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Summary */}
      {suggestionJson?.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{suggestionJson.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Weekly Plan */}
      {suggestionJson?.weekly_plan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={DAYS[0].toLowerCase()} className="w-full">
              <TabsList className="grid grid-cols-7 w-full">
                {DAYS.map(day => (
                  <TabsTrigger key={day} value={day.toLowerCase()} className="text-xs">
                    {day.slice(0, 3)}
                  </TabsTrigger>
                ))}
              </TabsList>
              {suggestionJson.weekly_plan.map((dayPlan: any) => (
                <TabsContent key={dayPlan.day} value={dayPlan.day.toLowerCase()} className="space-y-3">
                  {dayPlan.meals.map((meal: any, idx: number) => (
                    <div key={idx} className="rounded-lg border border-border/50 p-3">
                      <p className="font-semibold text-sm mb-2">{meal.meal_name}</p>
                      <div className="space-y-1 mb-2">
                        {meal.foods.map((food: any, fIdx: number) => (
                          <p key={fIdx} className="text-xs text-muted-foreground">
                            {food.name} - {food.quantity_g}g
                          </p>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1 pt-2 border-t border-border/30">
                        <span>Cal: {meal.estimated_macros.kcal}</span>
                        <span>P: {meal.estimated_macros.protein}g</span>
                        <span>C: {meal.estimated_macros.carbs}g</span>
                        <span>F: {meal.estimated_macros.fats}g</span>
                      </div>
                    </div>
                  ))}
                  {dayPlan.day_total && (
                    <div className="rounded-lg bg-primary/5 p-3">
                      <p className="text-xs font-semibold mb-2">Day Total</p>
                      <div className="text-xs grid grid-cols-2 gap-1">
                        <span>Cal: {dayPlan.day_total.kcal}</span>
                        <span>P: {dayPlan.day_total.protein}g</span>
                        <span>C: {dayPlan.day_total.carbs}g</span>
                        <span>F: {dayPlan.day_total.fats}g</span>
                      </div>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Coaching Notes */}
      {suggestionJson?.coaching_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coaching Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {suggestionJson.coaching_notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Retrieved Chunks */}
      {suggestion.retrieved_chunk_ids && suggestion.retrieved_chunk_ids.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Knowledge Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Based on {suggestion.retrieved_chunk_ids.length} knowledge chunk
              {suggestion.retrieved_chunk_ids.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {suggestion.status === 'pending' && (
        <div className="flex gap-2">
          <Button
            onClick={handleApprove}
            disabled={updateStatus.isPending}
            className="flex-1"
          >
            Approve
          </Button>
          <Button
            onClick={handleReject}
            variant="outline"
            disabled={updateStatus.isPending}
            className="flex-1"
          >
            Reject
          </Button>
        </div>
      )}

      {isApproved && suggestion.status !== 'applied' && (
        <Button onClick={handleApply} className="w-full">
          Apply to Meal Plan
        </Button>
      )}

      {suggestion.status === 'applied' && (
        <div className="flex items-center gap-2">
          <Badge className="flex-1 justify-center py-2">Applied</Badge>
          <Button variant="outline" size="sm" onClick={onFeedback}>
            Submit Feedback
          </Button>
        </div>
      )}
    </div>
  );
}
