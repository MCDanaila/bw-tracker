import { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Label } from '@/core/components/ui/label';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSubmitSuggestionFeedback } from '../../hooks/useAiDietSuggestions';

interface SuggestionFeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  suggestionId?: string;
}

export default function SuggestionFeedbackDialog({
  isOpen,
  onClose,
  suggestionId,
}: SuggestionFeedbackDialogProps) {
  const submitFeedback = useSubmitSuggestionFeedback();
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [wasFollowed, setWasFollowed] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const handleSubmit = async () => {
    if (!suggestionId) return;

    try {
      await submitFeedback.mutateAsync({
        suggestionId,
        rating: rating || undefined,
        feedbackText: feedbackText || undefined,
        wasFollowed: wasFollowed || undefined,
      });
      toast.success('Feedback submitted');
      handleReset();
      onClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback');
    }
  };

  const handleReset = () => {
    setRating(0);
    setWasFollowed(false);
    setFeedbackText('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Feedback</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rating */}
          <div className="space-y-2">
            <Label>How helpful was this suggestion?</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={24}
                    className={
                      star <= (hoverRating || rating)
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground'
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Was Followed */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="was-followed"
              checked={wasFollowed}
              onChange={(e) => setWasFollowed(e.currentTarget.checked)}
              className="w-4 h-4 rounded border border-input"
            />
            <Label htmlFor="was-followed" className="font-normal cursor-pointer">
              I followed this suggestion
            </Label>
          </div>

          {/* Feedback Text */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Additional feedback (optional)</Label>
            <textarea
              id="feedback"
              placeholder="What did you think? Any improvements?"
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitFeedback.isPending}>
            {submitFeedback.isPending ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
