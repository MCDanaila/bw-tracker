import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Label } from '@/core/components/ui/label';
import { Badge } from '@/core/components/ui/badge';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/core/contexts/AuthContext';
import { useAthletePreferences } from '@/core/hooks/useAthletePreferences';
import { useGenerateDietSuggestion, useAiSuggestions } from '../../hooks/useAiDietSuggestions';
import type { AiSuggestion } from '@/core/types/database';

interface AiPlannerControlsProps {
  athleteId: string;
  selectedSuggestionId?: string | null;
  onSuggestionGenerated?: (suggestionId: string) => void;
  onSuggestionSelect?: (suggestion: AiSuggestion) => void;
}

export default function AiPlannerControls({
  athleteId,
  selectedSuggestionId,
  onSuggestionGenerated,
  onSuggestionSelect,
}: AiPlannerControlsProps) {
  const { session } = useAuth();
  const { data: preferences } = useAthletePreferences(athleteId);
  const { data: suggestions } = useAiSuggestions(athleteId);
  const generateSuggestion = useGenerateDietSuggestion();
  const [queryText, setQueryText] = useState('');

  const isPreferencesComplete =
    preferences &&
    ((preferences.allergies && preferences.allergies.length > 0) ||
      (preferences.intolerances && preferences.intolerances.length > 0) ||
      (preferences.dietary_restrictions && preferences.dietary_restrictions.length > 0));

  const handleGenerate = async () => {
    if (!queryText.trim()) {
      toast.error('Please enter a query');
      return;
    }

    if (!session?.user?.id) {
      toast.error('Not authenticated');
      return;
    }

    try {
      const result = await generateSuggestion.mutateAsync({
        athlete_id: athleteId,
        query_text: queryText,
        coach_id: session.user.id,
      });

      toast.success('Suggestion generated successfully');
      setQueryText('');
      onSuggestionGenerated?.(result.id);
    } catch (error: any) {
      console.error('Failed to generate suggestion:', error);
      if (error.retry_after) {
        toast.error(`Rate limited. Please try again in ${error.retry_after} seconds`);
      } else {
        toast.error(error.message || 'Failed to generate suggestion');
      }
    }
  };

  return (
    <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
      {!isPreferencesComplete && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/50 flex gap-3">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
          <div className="text-sm text-destructive">
            Athlete preferences incomplete. Set allergies, intolerances, or dietary restrictions
            before generating suggestions.
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Query</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="query">What would you like?</Label>
            <textarea
              id="query"
              placeholder="e.g., Create a 7-day cutting plan with Mediterranean foods"
              value={queryText}
              onChange={e => setQueryText(e.target.value)}
              disabled={generateSuggestion.isPending}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={
              generateSuggestion.isPending || !queryText.trim() || !isPreferencesComplete
            }
            className="w-full"
          >
            {generateSuggestion.isPending ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Plan'
            )}
          </Button>
        </CardContent>
      </Card>

      {suggestions && suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
            {suggestions.map(sug => (
              <div
                key={sug.id}
                onClick={() => onSuggestionSelect?.(sug)}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  sug.id === selectedSuggestionId
                    ? 'border-primary bg-primary/5'
                    : 'border-border/50 hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium line-clamp-2">{sug.query_text}</p>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {sug.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(sug.created_at).toLocaleDateString('it-IT')}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
