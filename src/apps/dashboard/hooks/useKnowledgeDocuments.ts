import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/lib/supabase';
import { useAuth } from '@/core/contexts/AuthContext';
import type { KnowledgeDocument } from '@/core/types/database';

/**
 * Fetch all knowledge documents for the current coach
 */
export function useKnowledgeDocuments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['knowledge-documents', user?.id],
    queryFn: async (): Promise<KnowledgeDocument[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('knowledge_documents')
        .select('*')
        .eq('uploaded_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as KnowledgeDocument[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Create a new knowledge document
 */
export function useCreateKnowledgeDocument() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      content: string;
      source_type?: 'pdf' | 'text';
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Insert the document
      const { data: doc, error: docErr } = await supabase
        .from('knowledge_documents')
        .insert({
          uploaded_by: user.id,
          title: data.title,
          description: data.description,
          source_type: data.source_type || 'text',
          char_count: data.content.length,
        })
        .select()
        .single();

      if (docErr) throw docErr;

      // Invoke the embed-document Edge Function to chunk and embed the content
      const { error: embedErr } = await supabase.functions.invoke(
        'embed-document',
        {
          body: {
            document_id: doc.id,
            content: data.content,
          },
        }
      );

      if (embedErr) {
        // If embedding fails, delete the document
        await supabase.from('knowledge_documents').delete().eq('id', doc.id);
        throw embedErr;
      }

      return doc as KnowledgeDocument;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] });
    },
  });
}

/**
 * Delete a knowledge document
 */
export function useDeleteKnowledgeDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      // Deleting from knowledge_documents will cascade delete chunks due to FK constraint
      const { error } = await supabase
        .from('knowledge_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] });
    },
  });
}

/**
 * Toggle the active status of a knowledge document
 */
export function useToggleDocumentActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, isActive }: { documentId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('knowledge_documents')
        .update({ is_active: isActive })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] });
    },
  });
}
