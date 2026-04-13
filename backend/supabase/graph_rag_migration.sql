-- =============================================================================
-- Graph RAG Migration
-- Adds document tracking, entity/relationship graph tables, and traversal RPC
-- on top of the existing knowledge_chunks + match_knowledge_chunks setup.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. knowledge_documents — tracks ingestion status per document
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    raw_content TEXT NOT NULL,
    processing_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (processing_status IN ('pending','processing','completed','failed')),
    entity_count INT DEFAULT 0,
    relationship_count INT DEFAULT 0,
    chunk_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_owns_documents" ON knowledge_documents
    USING (coach_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 2. entity_type ENUM and knowledge_entities table
-- -----------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE entity_type AS ENUM (
        'food','condition','protocol','supplement','athlete_type','biomarker','goal','nutrient','other'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS knowledge_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES knowledge_documents(id) ON DELETE SET NULL,
    source_chunk_id UUID REFERENCES knowledge_chunks(id) ON DELETE SET NULL,
    entity_type entity_type NOT NULL,
    name TEXT NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    description TEXT,
    properties JSONB DEFAULT '{}',
    embedding VECTOR(768),
    confidence FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (coach_id, name, entity_type)
);

CREATE INDEX IF NOT EXISTS knowledge_entities_embedding_idx
    ON knowledge_entities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

CREATE INDEX IF NOT EXISTS knowledge_entities_coach_type_idx
    ON knowledge_entities (coach_id, entity_type);

CREATE INDEX IF NOT EXISTS knowledge_entities_aliases_idx
    ON knowledge_entities USING gin (aliases);

ALTER TABLE knowledge_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_owns_entities" ON knowledge_entities
    USING (coach_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 3. relationship_predicate ENUM and knowledge_relationships table
-- -----------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE relationship_predicate AS ENUM (
        'HELPS_WITH','CONTRAINDICATED_FOR','RECOMMENDED_FOR','AVOID_IF',
        'INCREASES','DECREASES','CONTAINS','SYNERGIZES_WITH',
        'PART_OF','REQUIRES','ALTERNATIVE_TO'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS knowledge_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_entity_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
    predicate relationship_predicate NOT NULL,
    object_entity_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
    weight FLOAT DEFAULT 1.0 CHECK (weight BETWEEN 0 AND 1),
    source_chunk_id UUID REFERENCES knowledge_chunks(id) ON DELETE SET NULL,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS knowledge_relationships_coach_pred_idx
    ON knowledge_relationships (coach_id, predicate);

CREATE INDEX IF NOT EXISTS knowledge_relationships_subject_idx
    ON knowledge_relationships (subject_entity_id);

CREATE INDEX IF NOT EXISTS knowledge_relationships_object_idx
    ON knowledge_relationships (object_entity_id);

ALTER TABLE knowledge_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_owns_relationships" ON knowledge_relationships
    USING (coach_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 4. ALTER existing knowledge_chunks — add document_id FK
-- -----------------------------------------------------------------------------

ALTER TABLE knowledge_chunks
    ADD COLUMN IF NOT EXISTS document_id UUID
        REFERENCES knowledge_documents(id) ON DELETE SET NULL;


-- -----------------------------------------------------------------------------
-- 5. graph_traverse RPC — recursive multi-hop entity traversal
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION graph_traverse(
    p_coach_id UUID,
    p_seed_ids UUID[],
    p_predicates relationship_predicate[],
    p_max_hops INT DEFAULT 2,
    p_min_weight FLOAT DEFAULT 0.3
)
RETURNS TABLE(
    entity_id UUID,
    entity_type entity_type,
    name TEXT,
    description TEXT,
    properties JSONB,
    hop_depth INT,
    path UUID[],
    total_weight FLOAT
)
LANGUAGE plpgsql AS $$
DECLARE
    current_frontier UUID[] := p_seed_ids;
    visited UUID[] := p_seed_ids;
    hop INT := 0;
BEGIN
    -- Return seed entities at depth 0
    RETURN QUERY
        SELECT e.id, e.entity_type, e.name, e.description,
               e.properties, 0, ARRAY[e.id], 1.0::FLOAT
        FROM knowledge_entities e
        WHERE e.id = ANY(p_seed_ids)
          AND e.coach_id = p_coach_id;

    WHILE hop < p_max_hops AND array_length(current_frontier, 1) > 0 LOOP
        hop := hop + 1;

        -- Forward edges: subject -> object
        RETURN QUERY
            SELECT e.id, e.entity_type, e.name, e.description,
                   e.properties, hop, ARRAY[r.subject_entity_id, e.id], r.weight::FLOAT
            FROM knowledge_relationships r
            JOIN knowledge_entities e ON e.id = r.object_entity_id
            WHERE r.subject_entity_id = ANY(current_frontier)
              AND r.predicate = ANY(p_predicates)
              AND r.weight >= p_min_weight
              AND r.coach_id = p_coach_id
              AND e.id != ALL(visited)
        UNION
        -- Reverse edges: object -> subject
            SELECT e.id, e.entity_type, e.name, e.description,
                   e.properties, hop, ARRAY[r.object_entity_id, e.id], r.weight::FLOAT
            FROM knowledge_relationships r
            JOIN knowledge_entities e ON e.id = r.subject_entity_id
            WHERE r.object_entity_id = ANY(current_frontier)
              AND r.predicate = ANY(p_predicates)
              AND r.weight >= p_min_weight
              AND r.coach_id = p_coach_id
              AND e.id != ALL(visited);

        -- Advance frontier
        SELECT array_agg(DISTINCT new_node)
        INTO current_frontier
        FROM (
            SELECT r2.object_entity_id AS new_node
            FROM knowledge_relationships r2
            WHERE r2.subject_entity_id = ANY(current_frontier)
              AND r2.coach_id = p_coach_id
              AND r2.object_entity_id != ALL(visited)
            UNION
            SELECT r3.subject_entity_id AS new_node
            FROM knowledge_relationships r3
            WHERE r3.object_entity_id = ANY(current_frontier)
              AND r3.coach_id = p_coach_id
              AND r3.subject_entity_id != ALL(visited)
        ) new_nodes;

        visited := visited || COALESCE(current_frontier, '{}');
    END LOOP;
END;
$$;
