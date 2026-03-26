import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/core/components/ui/dialog';
import { Badge } from '@/core/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, Plus, Loader2, Eye, EyeOff } from 'lucide-react';
import {
  useKnowledgeDocuments,
  useCreateKnowledgeDocument,
  useDeleteKnowledgeDocument,
  useToggleDocumentActive,
} from '../../hooks/useKnowledgeDocuments';

interface KnowledgeBasePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KnowledgeBasePanel({ isOpen, onClose }: KnowledgeBasePanelProps) {
  const { data: documents, isLoading } = useKnowledgeDocuments();
  const createDoc = useCreateKnowledgeDocument();
  const deleteDoc = useDeleteKnowledgeDocument();
  const toggleActive = useToggleDocumentActive();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', content: '' });

  const handleAddDocument = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required');
      return;
    }

    try {
      await createDoc.mutateAsync({
        title: formData.title,
        description: formData.description,
        content: formData.content,
        source_type: 'text',
      });
      toast.success('Document added successfully');
      setFormData({ title: '', description: '', content: '' });
      setShowAddDialog(false);
    } catch (error) {
      console.error('Failed to add document:', error);
      toast.error('Failed to add document');
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      await deleteDoc.mutateAsync(docId);
      toast.success('Document deleted');
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleToggle = async (docId: string, currentStatus: boolean) => {
    try {
      await toggleActive.mutateAsync({
        documentId: docId,
        isActive: !currentStatus,
      });
    } catch (error) {
      console.error('Failed to toggle document:', error);
      toast.error('Failed to toggle document');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Knowledge Base</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Button onClick={() => setShowAddDialog(true)} className="w-full">
              <Plus size={14} className="mr-2" />
              Add Text Document
            </Button>

            <Button variant="outline" disabled className="w-full">
              <Plus size={14} className="mr-2" />
              Add PDF (Coming Soon)
            </Button>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-muted-foreground" />
              </div>
            ) : !documents || documents.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground">
                  <p>No documents yet. Add your first knowledge document to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {documents.map(doc => (
                  <Card key={doc.id}>
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{doc.title}</h4>
                            {doc.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {doc.description}
                              </p>
                            )}
                          </div>
                          <Badge variant={doc.is_active ? 'default' : 'outline'} className="shrink-0">
                            {doc.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {doc.char_count ? `${(doc.char_count / 1000).toFixed(1)}k chars` : 'Processing...'}
                        </p>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggle(doc.id, doc.is_active)}
                            disabled={toggleActive.isPending}
                          >
                            {doc.is_active ? (
                              <Eye size={14} />
                            ) : (
                              <EyeOff size={14} />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(doc.id)}
                            disabled={deleteDoc.isPending}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Text Document</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Nutrition Guide for Athletes"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Optional description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="content">Content *</Label>
              <textarea
                id="content"
                placeholder="Paste your text content here. It will be automatically chunked and embedded."
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddDocument}
              disabled={createDoc.isPending || !formData.title || !formData.content}
            >
              {createDoc.isPending ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Document'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
