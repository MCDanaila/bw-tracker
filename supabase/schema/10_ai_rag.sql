-- ============================================================
-- AI & RAG INFRASTRUCTURE
-- Vector-based knowledge management for AI-powered suggestions
-- ============================================================

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ---- KNOWLEDGE DOCUMENTS ----
CREATE TABLE public.knowledge_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT CHECK (source_type IN ('pdf', 'text')) NOT NULL DEFAULT 'text',
  storage_path TEXT,
  char_count INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- KNOWLEDGE CHUNKS ----
CREATE TABLE public.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768),
  token_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- AI SUGGESTIONS ----
CREATE TABLE public.ai_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL REFERENCES auth.users(id),
  query_text TEXT NOT NULL,
  context_snapshot JSONB,
  retrieved_chunk_ids UUID[] DEFAULT ARRAY[]::UUID[],
  suggestion_text TEXT,
  suggestion_json JSONB,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'applied')) NOT NULL DEFAULT 'pending',
  coach_edits TEXT,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- AI SUGGESTION FEEDBACK ----
CREATE TABLE public.ai_suggestion_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_id UUID NOT NULL REFERENCES ai_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  was_followed BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(suggestion_id, user_id)
);

-- ---- RLS ----
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestion_feedback ENABLE ROW LEVEL SECURITY;

-- ---- KNOWLEDGE_DOCUMENTS RLS ----
CREATE POLICY "Coaches manage own documents"
  ON knowledge_documents FOR ALL
  USING (uploaded_by = auth.uid() OR public.is_coach_of(auth.uid()))
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Service role can query documents"
  ON knowledge_documents FOR SELECT
  USING (auth.role() = 'service_role');

-- ---- KNOWLEDGE_CHUNKS RLS ----
CREATE POLICY "Coaches read own document chunks"
  ON knowledge_chunks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM knowledge_documents kd
    WHERE kd.id = document_id AND (kd.uploaded_by = auth.uid() OR public.is_coach_of(auth.uid()))
  ));

CREATE POLICY "Service role can query chunks"
  ON knowledge_chunks FOR SELECT
  USING (auth.role() = 'service_role');

-- ---- AI_SUGGESTIONS RLS ----
CREATE POLICY "Coaches manage suggestions for their athletes"
  ON ai_suggestions FOR ALL
  USING (public.is_coach_of(athlete_id) AND generated_by = auth.uid())
  WITH CHECK (public.is_coach_of(athlete_id) AND generated_by = auth.uid());

CREATE POLICY "Athletes read own applied/approved suggestions"
  ON ai_suggestions FOR SELECT
  USING (athlete_id = auth.uid() AND status IN ('approved', 'applied'));

CREATE POLICY "Service role can insert suggestions"
  ON ai_suggestions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update suggestions"
  ON ai_suggestions FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can query suggestions"
  ON ai_suggestions FOR SELECT
  USING (auth.role() = 'service_role');

-- ---- AI_SUGGESTION_FEEDBACK RLS ----
CREATE POLICY "Users manage own feedback"
  ON ai_suggestion_feedback FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- INDEXES ----
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_uploaded_by
  ON knowledge_documents(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_is_active
  ON knowledge_documents(is_active);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document_id
  ON knowledge_chunks(document_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
  ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_athlete_id
  ON ai_suggestions(athlete_id);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_generated_by
  ON ai_suggestions(generated_by);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status
  ON ai_suggestions(status);

CREATE INDEX IF NOT EXISTS idx_ai_suggestion_feedback_suggestion_id
  ON ai_suggestion_feedback(suggestion_id);

CREATE INDEX IF NOT EXISTS idx_ai_suggestion_feedback_user_id
  ON ai_suggestion_feedback(user_id);

-- ---- RPC FUNCTION: match_knowledge_chunks ----
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding vector(768),
  match_count INT DEFAULT 5,
  p_coach_id UUID DEFAULT NULL
)
RETURNS TABLE(id UUID, document_id UUID, content TEXT, similarity FLOAT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    kc.id,
    kc.document_id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kd.id = kc.document_id
  WHERE kd.is_active
    AND kc.embedding IS NOT NULL
    AND (p_coach_id IS NULL OR kd.uploaded_by = p_coach_id)
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;
