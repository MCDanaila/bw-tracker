"""AI-related endpoints (diet suggestions, document embedding)."""

import logging
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from pydantic import BaseModel

from app.dependencies import CurrentUser, get_current_user, UserSupabaseDep, CoachDep
from app.schemas.ai import GenerateSuggestionRequest, GenerateSuggestionResponse
from app.services.ai_generation import generate_diet_payload

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["ai"])


@router.post(
    "/generate-diet-suggestion",
    response_model=GenerateSuggestionResponse,
    summary="Generate AI diet suggestion",
    description="Generate a personalized diet suggestion using AI based on athlete preferences and query",
)
async def generate_diet_suggestion(
    request: GenerateSuggestionRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: UserSupabaseDep,
) -> GenerateSuggestionResponse:
    """
    Generate a diet suggestion using AI (Gemini).
    Synchronously fetches context, queries Gemini, and saves the suggestion record tightly coupled to the user's RLS.
    """
    try:
        # Await the heavy generation payload synchronously
        context_snapshot, chunk_ids, generation_result = await generate_diet_payload(
            athlete_id=request.athlete_id,
            query_text=request.query_text,
            coach_id=current_user.id,
            supabase=supabase,
        )

        # Insert the complete suggestion record into ai_suggestions as pending coach review
        response = await supabase.table("ai_suggestions").insert({
            "athlete_id": request.athlete_id,
            "generated_by": current_user.id,
            "query_text": request.query_text,
            "context_snapshot": context_snapshot,
            "retrieved_chunk_ids": chunk_ids,
            "suggestion_text": generation_result["text"],
            "suggestion_json": generation_result["json"],
            "status": "pending",  # Status means pending manual review by coach
        }).execute()

        if not response.data:
            logger.error(f"Failed to create suggestion record: {response}")
            raise HTTPException(
                status_code=500,
                detail="Failed to create suggestion"
            )
            
        suggestion_id = response.data[0]["id"]

        # Return successful response
        return GenerateSuggestionResponse(
            suggestion_id=suggestion_id,
            suggestion_text=generation_result["text"],
            suggestion_json=generation_result["json"],
        )

    except Exception as e:
        logger.error(f"Error initializing diet suggestion generation: {e}", exc_info=True)
        if str(e) == "rate_limited":
             raise HTTPException(status_code=429, detail="Rate limit exceeded")
        raise HTTPException(
            status_code=400 if "preferences" in str(e).lower() else 500,
            detail=str(e)
        )


class GraphSuggestionRequest(BaseModel):
    athlete_id: str
    query_text: str


class GraphSuggestionResponse(BaseModel):
    suggestion_id: Optional[str] = None
    suggestion_text: str
    suggestion_json: Optional[dict] = None
    graph_hops_count: int = 0


@router.post(
    "/generate-diet-suggestion-graph",
    response_model=GraphSuggestionResponse,
    summary="Generate AI diet suggestion (Graph RAG)",
    description=(
        "Generate a personalized diet suggestion using the Graph RAG pipeline. "
        "Performs multi-hop entity traversal over the coach's knowledge graph "
        "in addition to standard vector retrieval."
    ),
)
async def generate_diet_suggestion_graph(
    request: GraphSuggestionRequest,
    http_request: Request,
    current_user: CoachDep,
    supabase: UserSupabaseDep,
) -> GraphSuggestionResponse:
    graph_rag = getattr(http_request.app.state, "graph_rag", None)
    if graph_rag is None:
        raise HTTPException(status_code=503, detail="Graph RAG not initialized")

    initial_state = {
        "athlete_id": request.athlete_id,
        "query_text": request.query_text,
        "coach_id": current_user.id,
        "supabase": supabase,
        "athlete_profile": None,
        "athlete_goal": None,
        "athlete_prefs": None,
        "recent_logs": [],
        "query_type": None,
        "seed_entity_names": [],
        "vector_chunks": [],
        "graph_entities": [],
        "graph_hops": [],
        "final_context": None,
        "context_trace": [],
        "generation_result": None,
        "error": None,
        "retry_count": 0,
    }

    try:
        final_state = await graph_rag.ainvoke(initial_state)
    except Exception as e:
        logger.error(f"Graph RAG invocation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

    if final_state.get("error"):
        err = final_state["error"]
        if err == "rate_limited":
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        raise HTTPException(status_code=500, detail=err)

    result = final_state.get("generation_result") or {}
    return GraphSuggestionResponse(
        suggestion_id=result.get("suggestion_id"),
        suggestion_text=result.get("text", ""),
        suggestion_json=result.get("json"),
        graph_hops_count=result.get("graph_hops_count", 0),
    )
