"""Document ingestion pipeline for the knowledge graph RAG system."""

import asyncio
import json
import logging
from typing import Any, Dict, List, Optional

from langchain_core.output_parsers import JsonOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from supabase import AsyncClient

from app.config import settings
from app.services.ai_generation import embed_text
from app.services.graph_rag.prompts import (
    ENTITY_EXTRACTION_PROMPT,
    RELATIONSHIP_EXTRACTION_PROMPT,
)
from app.services.graph_rag.schemas import (
    EntityExtractionResult,
    RelationshipExtractionResult,
)

logger = logging.getLogger(__name__)

_SEMAPHORE = asyncio.Semaphore(3)  # max 3 concurrent Gemini calls


def _build_llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=settings.gemini_api_key,
        temperature=0.1,
    )


def _chunk_document(raw_content: str) -> List[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return splitter.split_text(raw_content)


async def _extract_entities(chunk_text: str, llm: ChatGoogleGenerativeAI) -> EntityExtractionResult:
    async with _SEMAPHORE:
        try:
            chain = ENTITY_EXTRACTION_PROMPT | llm | JsonOutputParser()
            raw = await chain.ainvoke({"chunk_text": chunk_text})
            entities_data = raw.get("entities", []) if isinstance(raw, dict) else []
            return EntityExtractionResult(
                entities=[e if isinstance(e, dict) else e.model_dump() for e in entities_data]  # type: ignore[arg-type]
            )
        except Exception as e:
            logger.warning(f"Entity extraction failed: {e}")
            return EntityExtractionResult(entities=[])


async def _extract_relationships(
    chunk_text: str,
    entity_names: List[str],
    llm: ChatGoogleGenerativeAI,
) -> RelationshipExtractionResult:
    if not entity_names:
        return RelationshipExtractionResult(relationships=[])
    async with _SEMAPHORE:
        try:
            chain = RELATIONSHIP_EXTRACTION_PROMPT | llm | JsonOutputParser()
            raw = await chain.ainvoke({
                "chunk_text": chunk_text,
                "entity_names": ", ".join(entity_names),
            })
            rels_data = raw.get("relationships", []) if isinstance(raw, dict) else []
            return RelationshipExtractionResult(
                relationships=rels_data  # type: ignore[arg-type]
            )
        except Exception as e:
            logger.warning(f"Relationship extraction failed: {e}")
            return RelationshipExtractionResult(relationships=[])


async def _upsert_entity(
    entity_data: Dict[str, Any],
    coach_id: str,
    document_id: str,
    chunk_id: Optional[str],
    supabase: AsyncClient,
) -> Optional[str]:
    """Upsert a single entity, returning its DB id or None on failure."""
    name = entity_data.get("name", "").strip()
    entity_type = entity_data.get("entity_type", "other")
    if not name:
        return None

    try:
        embedding = await embed_text(f"{name}. {entity_data.get('description', '')}")
    except Exception as e:
        logger.warning(f"Failed to embed entity '{name}': {e}")
        embedding = None

    row = {
        "coach_id": coach_id,
        "document_id": document_id,
        "source_chunk_id": chunk_id,
        "entity_type": entity_type,
        "name": name,
        "aliases": entity_data.get("aliases", []),
        "description": entity_data.get("description"),
        "properties": entity_data.get("properties", {}),
        "confidence": entity_data.get("confidence", 1.0),
    }
    if embedding:
        row["embedding"] = embedding

    try:
        # ON CONFLICT (coach_id, name, entity_type) — merge aliases, keep higher confidence
        existing = await supabase.table("knowledge_entities") \
            .select("id, aliases, confidence") \
            .eq("coach_id", coach_id) \
            .eq("name", name) \
            .eq("entity_type", entity_type) \
            .execute()

        if existing.data:
            existing_row = existing.data[0]
            merged_aliases = list(set(
                existing_row.get("aliases", []) + entity_data.get("aliases", [])
            ))
            new_confidence = max(
                existing_row.get("confidence", 0),
                entity_data.get("confidence", 1.0),
            )
            update_data: Dict[str, Any] = {"aliases": merged_aliases, "confidence": new_confidence}
            if embedding:
                update_data["embedding"] = embedding
            await supabase.table("knowledge_entities") \
                .update(update_data) \
                .eq("id", existing_row["id"]) \
                .execute()
            return str(existing_row["id"])
        else:
            result = await supabase.table("knowledge_entities").insert(row).execute()
            if result.data:
                return str(result.data[0]["id"])
    except Exception as e:
        logger.error(f"Failed to upsert entity '{name}': {e}")

    return None


async def _process_chunk(
    chunk_text: str,
    chunk_index: int,
    coach_id: str,
    document_id: str,
    supabase: AsyncClient,
    llm: ChatGoogleGenerativeAI,
) -> tuple[Optional[str], int, int]:
    """Process one chunk: embed, insert, extract entities + relationships.

    Returns: (chunk_id, entity_count, relationship_count)
    """
    # Embed and insert chunk
    chunk_id: Optional[str] = None
    try:
        embedding = await embed_text(chunk_text)
        chunk_result = await supabase.table("knowledge_chunks").insert({
            "coach_id": coach_id,
            "content": chunk_text,
            "embedding": embedding,
            "document_id": document_id,
        }).execute()
        if chunk_result.data:
            chunk_id = str(chunk_result.data[0]["id"])
    except Exception as e:
        logger.error(f"Failed to insert chunk {chunk_index}: {e}")

    # Extract entities
    entity_result = await _extract_entities(chunk_text, llm)
    entity_name_to_id: Dict[str, str] = {}
    entity_count = 0

    for entity in entity_result.entities:
        entity_dict = entity if isinstance(entity, dict) else entity.model_dump()
        eid = await _upsert_entity(entity_dict, coach_id, document_id, chunk_id, supabase)
        if eid:
            entity_name_to_id[entity_dict.get("name", "")] = eid
            entity_count += 1

    # Extract relationships
    rel_count = 0
    if entity_name_to_id:
        rel_result = await _extract_relationships(chunk_text, list(entity_name_to_id.keys()), llm)
        for rel in rel_result.relationships:
            rel_dict = rel if isinstance(rel, dict) else rel.model_dump(by_alias=False)
            subject_name = rel_dict.get("subject", "")
            object_name = rel_dict.get("object_entity") or rel_dict.get("object", "")
            subject_id = entity_name_to_id.get(subject_name)
            object_id = entity_name_to_id.get(object_name)
            if not subject_id or not object_id:
                continue
            try:
                await supabase.table("knowledge_relationships").insert({
                    "coach_id": coach_id,
                    "subject_entity_id": subject_id,
                    "predicate": rel_dict.get("predicate"),
                    "object_entity_id": object_id,
                    "weight": rel_dict.get("weight", 0.8),
                    "source_chunk_id": chunk_id,
                    "properties": rel_dict.get("properties", {}),
                }).execute()
                rel_count += 1
            except Exception as e:
                logger.warning(f"Failed to insert relationship: {e}")

    return chunk_id, entity_count, rel_count


async def ingest_document(
    coach_id: str,
    document_id: str,
    title: str,
    raw_content: str,
    supabase: AsyncClient,
) -> None:
    """Full ingestion pipeline for a knowledge document.

    Called as a FastAPI BackgroundTask. Updates knowledge_documents status on completion.
    """
    logger.info(f"Starting ingestion for document {document_id} (coach: {coach_id})")
    llm = _build_llm()
    chunks = _chunk_document(raw_content)
    total_entities = 0
    total_relationships = 0

    try:
        # Process chunks with bounded concurrency (Semaphore inside _extract_* handles Gemini)
        tasks = [
            _process_chunk(chunk, i, coach_id, document_id, supabase, llm)
            for i, chunk in enumerate(chunks)
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for r in results:
            if isinstance(r, Exception):
                logger.error(f"Chunk processing error: {r}")
                continue
            _, ec, rc = r
            total_entities += ec
            total_relationships += rc

        await supabase.table("knowledge_documents").update({
            "processing_status": "completed",
            "chunk_count": len(chunks),
            "entity_count": total_entities,
            "relationship_count": total_relationships,
        }).eq("id", document_id).execute()

        logger.info(
            f"Ingestion complete for {document_id}: "
            f"{len(chunks)} chunks, {total_entities} entities, {total_relationships} relationships"
        )

    except Exception as e:
        logger.error(f"Ingestion failed for document {document_id}: {e}", exc_info=True)
        try:
            await supabase.table("knowledge_documents").update({
                "processing_status": "failed",
                "error_message": str(e)[:500],
            }).eq("id", document_id).execute()
        except Exception:
            pass
