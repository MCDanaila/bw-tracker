import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useAthleteContext } from '../contexts/AthleteContext';
import { useAiSuggestions } from '../hooks/useAiDietSuggestions';
import AiPlannerControls from '../components/ai/AiPlannerControls';
import AiSuggestionViewer from '../components/ai/AiSuggestionViewer';
import KnowledgeBasePanel from '../components/ai/KnowledgeBasePanel';
import SuggestionFoodMatchDialog from '../components/ai/SuggestionFoodMatchDialog';
import SuggestionFeedbackDialog from '../components/ai/SuggestionFeedbackDialog';

export default function AiPlannerPage() {
  const { effectiveUserId: athleteId, activeAthlete } = useAthleteContext();
  const { data: suggestions } = useAiSuggestions(athleteId);

  // Dialog and selection state
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [isKnowledgePanelOpen, setIsKnowledgePanelOpen] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);

  // Derive selected suggestion from suggestions list
  const selectedSuggestion = suggestions?.find(s => s.id === selectedSuggestionId) ?? null;

  // No athlete selected - show instructions
  if (!activeAthlete) {
    return (
      <div className="space-y-6 mt-4">
        <div className="flex items-center gap-3">
          <Sparkles size={28} className="text-primary" />
          <h1 className="text-3xl font-bold">AI Diet Planner</h1>
        </div>

        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/50 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-600">
            <p className="font-medium mb-2">The AI Diet Planner requires:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Select an athlete from the Athletes page or dashboard header</li>
              <li>Athlete preferences to be set (allergies, intolerances, dietary restrictions)</li>
              <li>Knowledge documents uploaded to your knowledge base</li>
            </ul>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              The AI Planner is a coach tool for generating personalized meal plans powered by AI.
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Select an athlete to work with</li>
              <li>Set athlete preferences in the Athlete {'>'} Preferences tab</li>
              <li>Upload diet and nutrition knowledge documents to your knowledge base</li>
              <li>Return here to generate AI-powered diet suggestions</li>
            </ol>
            <p className="text-sm text-muted-foreground">
              The AI will analyze the athlete's profile, preferences, and your knowledge base to create customized meal plans.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Athlete selected - show two-column layout
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles size={24} className="text-primary" />
          <div>
            <h1 className="text-2xl font-bold">AI Diet Planner</h1>
            <p className="text-sm text-muted-foreground">for {activeAthlete.username}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsKnowledgePanelOpen(true)}
        >
          Manage Knowledge Base
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-300px)]">
        {/* Left panel - Controls */}
        <div className="col-span-1 overflow-y-auto">
          <AiPlannerControls
            athleteId={athleteId}
            selectedSuggestionId={selectedSuggestionId}
            onSuggestionGenerated={(id) => setSelectedSuggestionId(id)}
            onSuggestionSelect={(sug) => setSelectedSuggestionId(sug.id)}
          />
        </div>

        {/* Right panel - Viewer */}
        <div className="col-span-2 overflow-y-auto">
          <AiSuggestionViewer
            suggestion={selectedSuggestion}
            onApply={() => setIsApplyDialogOpen(true)}
            onFeedback={() => setIsFeedbackDialogOpen(true)}
          />
        </div>
      </div>

      {/* Dialogs */}
      <KnowledgeBasePanel
        isOpen={isKnowledgePanelOpen}
        onClose={() => setIsKnowledgePanelOpen(false)}
      />

      <SuggestionFoodMatchDialog
        isOpen={isApplyDialogOpen}
        suggestion={selectedSuggestion}
        athleteId={athleteId}
        onClose={() => setIsApplyDialogOpen(false)}
        onSuccess={() => {
          setIsApplyDialogOpen(false);
          setIsFeedbackDialogOpen(true);
        }}
      />

      <SuggestionFeedbackDialog
        isOpen={isFeedbackDialogOpen}
        suggestionId={selectedSuggestionId ?? undefined}
        onClose={() => setIsFeedbackDialogOpen(false)}
      />
    </div>
  );
}
