import { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent } from '@/core/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useDietTemplatesList, useAssignTemplate } from '../hooks/useDietTemplates';
import type { DietTemplate } from '@/core/types/database';

interface AssignTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId: string;
}

export default function AssignTemplateDialog({ isOpen, onClose, athleteId }: AssignTemplateDialogProps) {
  const { data: templates, isLoading } = useDietTemplatesList();
  const assignTemplate = useAssignTemplate();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selectedTemplateId) {
      toast.error('Please select a template');
      return;
    }

    try {
      await assignTemplate.mutateAsync({
        templateId: selectedTemplateId,
        athleteId,
      });
      toast.success('Template assigned successfully');
      setSelectedTemplateId(null);
      onClose();
    } catch (error) {
      console.error('Failed to assign template:', error);
      toast.error('Failed to assign template');
    }
  };

  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Diet Template</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : !templates || templates.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No templates available. Create templates in the Templates section first.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select a template to assign to this athlete</p>
            <div className="grid gap-3 max-h-[400px] overflow-y-auto">
              {templates.map((template: DietTemplate) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    selectedTemplateId === template.id
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{template.name}</h3>
                      {template.description && (
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(template.updated_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedTemplate && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <p className="text-sm">
                    <span className="font-semibold">Selected:</span> {selectedTemplate.name}
                  </p>
                  {selectedTemplate.description && (
                    <p className="text-xs text-muted-foreground mt-1">{selectedTemplate.description}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedTemplateId || assignTemplate.isPending || isLoading}
          >
            {assignTemplate.isPending ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Template'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
