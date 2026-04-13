"""Knowledge base management endpoints."""

import logging
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field

from app.dependencies import CoachDep, UserSupabaseDep
from app.services.knowledge_ingestion import ingest_document

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/knowledge", tags=["knowledge"])


# ── Request / Response schemas ────────────────────────────────────────────────

class IngestDocumentRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    raw_content: str = Field(min_length=50, max_length=500_000)


class IngestDocumentResponse(BaseModel):
    document_id: str
    status: str
    message: str


class EntityResponse(BaseModel):
    id: str
    name: str
    entity_type: str
    description: Optional[str] = None
    confidence: float
    created_at: str


class EntitiesListResponse(BaseModel):
    entities: list[EntityResponse]
    total: int


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/ingest",
    response_model=IngestDocumentResponse,
    summary="Ingest a knowledge document",
    description=(
        "Upload a text document to be chunked, embedded, and processed into the "
        "knowledge graph (entity + relationship extraction). Returns immediately; "
        "processing runs as a background task."
    ),
)
async def ingest_knowledge_document(
    request: IngestDocumentRequest,
    background_tasks: BackgroundTasks,
    current_user: CoachDep,
    supabase: UserSupabaseDep,
) -> IngestDocumentResponse:
    # Create the document record with status=processing
    try:
        result = await supabase.table("knowledge_documents").insert({
            "coach_id": current_user.id,
            "title": request.title,
            "raw_content": request.raw_content,
            "processing_status": "processing",
        }).execute()
    except Exception as e:
        logger.error(f"Failed to create knowledge_document record: {e}")
        raise HTTPException(status_code=500, detail="Failed to create document record")

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create document record")

    document_id = result.data[0]["id"]

    # Fire ingestion as background task so HTTP response returns immediately
    background_tasks.add_task(
        ingest_document,
        coach_id=current_user.id,
        document_id=document_id,
        title=request.title,
        raw_content=request.raw_content,
        supabase=supabase,
    )

    logger.info(f"Queued ingestion for document {document_id} (coach: {current_user.id})")
    return IngestDocumentResponse(
        document_id=document_id,
        status="processing",
        message=f"Document '{request.title}' queued for ingestion. Processing runs in the background.",
    )


@router.get(
    "/documents",
    summary="List coach's knowledge documents",
)
async def list_documents(
    current_user: CoachDep,
    supabase: UserSupabaseDep,
) -> dict:
    try:
        result = await supabase.table("knowledge_documents") \
            .select("id, title, processing_status, entity_count, relationship_count, chunk_count, error_message, created_at") \
            .eq("coach_id", current_user.id) \
            .order("created_at", desc=True) \
            .execute()
        return {"documents": result.data or [], "total": len(result.data or [])}
    except Exception as e:
        logger.error(f"list_documents failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch documents")


@router.get(
    "/entities",
    response_model=EntitiesListResponse,
    summary="List extracted knowledge entities",
    description="Returns all entities extracted from the coach's knowledge documents.",
)
async def list_entities(
    current_user: CoachDep,
    supabase: UserSupabaseDep,
    entity_type: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> EntitiesListResponse:
    try:
        query = supabase.table("knowledge_entities") \
            .select("id, name, entity_type, description, confidence, created_at") \
            .eq("coach_id", current_user.id) \
            .order("confidence", desc=True) \
            .range(offset, offset + limit - 1)

        if entity_type:
            query = query.eq("entity_type", entity_type)

        result = await query.execute()
        entities = [EntityResponse(**row) for row in (result.data or [])]
        return EntitiesListResponse(entities=entities, total=len(entities))
    except Exception as e:
        logger.error(f"list_entities failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch entities")


@router.delete(
    "/entities/{entity_id}",
    summary="Delete a knowledge entity",
    description="Remove an incorrectly extracted entity and its relationships.",
)
async def delete_entity(
    entity_id: str,
    current_user: CoachDep,
    supabase: UserSupabaseDep,
) -> dict:
    try:
        result = await supabase.table("knowledge_entities") \
            .delete() \
            .eq("id", entity_id) \
            .eq("coach_id", current_user.id) \
            .execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Entity not found")
        return {"deleted": True, "entity_id": entity_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"delete_entity failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete entity")
