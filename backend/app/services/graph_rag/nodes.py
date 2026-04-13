"""LangGraph node functions for the Graph RAG orchestration workflow."""

import asyncio
import json
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from app.services.ai_generation import embed_text, generate_suggestion_with_gemini
from app.services.graph_rag.context_builder import merge_context
from app.services.graph_rag.prompts import DIET_SUGGESTION_PROMPT
from app.services.graph_rag.retrieval import parallel_retrieve
from app.services.graph_rag.state import QUERY_TYPE_PREDICATES, GraphRAGState, QueryType

logger = logging.getLogger(__name__)


# ── Node 1: Load athlete context ──────────────────────────────────────────────

async def load_athlete_context(state: GraphRAGState) -> Dict[str, Any]:
    """Fetch athlete profile, goal, preferences, and last 7 days of logs from Supabase."""
    supabase = state["supabase"]  # type: ignore[typeddict-item]
    athlete_id = state["athlete_id"]
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

    try:
        profile_res, goal_res, prefs_res, logs_res = await asyncio.gather(
            supabase.table("profiles").select("*").eq("id", athlete_id).execute(),
            supabase.table("athlete_goals").select("*").eq("athlete_id", athlete_id).is_("effective_until", "null").execute(),
            supabase.table("athlete_preferences").select("*").eq("athlete_id", athlete_id).execute(),
            supabase.table("daily_logs").select("*").eq("user_id", athlete_id).gte("date", seven_days_ago).order("date", desc=True).execute(),
        )
        return {
            "athlete_profile": profile_res.data[0] if profile_res.data else None,
            "athlete_goal": goal_res.data[0] if goal_res.data else None,
            "athlete_prefs": prefs_res.data[0] if prefs_res.data else None,
            "recent_logs": logs_res.data or [],
        }
    except Exception as e:
        logger.error(f"load_athlete_context failed: {e}", exc_info=True)
        return {
            "error": f"Failed to load athlete context: {e}",
            "athlete_profile": None,
            "athlete_goal": None,
            "athlete_prefs": None,
            "recent_logs": [],
        }


# ── Node 2: Classify query ────────────────────────────────────────────────────

_FOOD_SENSITIVITY_KEYWORDS = re.compile(
    r"\b(allerg|intoleran|gluten|dairy|lactose|nut|shellfish|soy|celiac|avoid|restrict)\b", re.I
)
_SUPPLEMENT_KEYWORDS = re.compile(
    r"\b(supplement|creatine|omega|vitamin|mineral|protein powder|bcaa|whey|probiotic)\b", re.I
)
_GOAL_KEYWORDS = re.compile(
    r"\b(bulk|cut|recomp|phase|protocol|deficit|surplus|maintenance|muscle|fat loss|performance)\b", re.I
)


def _classify_heuristic(query_text: str, prefs: Dict[str, Any] | None) -> QueryType:
    """Regex-based fallback classifier."""
    allergies = prefs.get("allergies", []) if prefs else []
    intolerances = prefs.get("intolerances", []) if prefs else []
    if allergies or intolerances or _FOOD_SENSITIVITY_KEYWORDS.search(query_text):
        return QueryType.FOOD_SENSITIVITY
    if _SUPPLEMENT_KEYWORDS.search(query_text):
        return QueryType.SUPPLEMENT
    if _GOAL_KEYWORDS.search(query_text):
        return QueryType.GOAL_PROTOCOL
    return QueryType.GENERAL


def _extract_seed_names(query_text: str, prefs: Dict[str, Any] | None, goal: Dict[str, Any] | None) -> list[str]:
    """Pull candidate entity names from query, allergies, and goal phase."""
    seeds = set()
    # Add allergy/intolerance names as seeds
    if prefs:
        for field in ("allergies", "intolerances", "dietary_restrictions"):
            items = prefs.get(field) or []
            if isinstance(items, list):
                seeds.update(items)
            elif isinstance(items, str):
                seeds.add(items)
    # Add goal phase
    if goal and goal.get("phase"):
        seeds.add(goal["phase"])
    # Add keywords from query (simple word extraction, 3+ chars)
    words = re.findall(r"\b[A-Za-z]{3,}\b", query_text)
    # Filter out stopwords
    stopwords = {
        "the", "and", "for", "with", "that", "this", "are", "was", "what",
        "have", "from", "diet", "food", "meal", "plan",
    }
    seeds.update(w.title() for w in words if w.lower() not in stopwords)
    return list(seeds)[:8]  # cap at 8 seeds


async def classify_query(state: GraphRAGState) -> Dict[str, Any]:
    """Classify the coach query and extract seed entity names for graph retrieval."""
    query_text = state["query_text"]
    prefs = state.get("athlete_prefs")
    goal = state.get("athlete_goal")

    query_type = _classify_heuristic(query_text, prefs)
    seed_names = _extract_seed_names(query_text, prefs, goal)

    logger.info(f"classify_query: type={query_type}, seeds={seed_names}")
    return {"query_type": query_type, "seed_entity_names": seed_names}


# ── Node 3: Parallel retrieval ────────────────────────────────────────────────

async def parallel_retrieval(state: GraphRAGState) -> Dict[str, Any]:
    """Run vector search and graph traversal concurrently."""
    supabase = state["supabase"]  # type: ignore[typeddict-item]
    coach_id = state["coach_id"]
    query_text = state["query_text"]
    query_type = state.get("query_type") or QueryType.GENERAL
    seed_names = state.get("seed_entity_names") or []

    try:
        # Embed query and all seed names concurrently
        embed_tasks = [embed_text(query_text)] + [embed_text(name) for name in seed_names]
        embeddings = await asyncio.gather(*embed_tasks, return_exceptions=True)

        query_embedding = embeddings[0] if not isinstance(embeddings[0], Exception) else []
        seed_embeddings = [
            e for e in embeddings[1:] if not isinstance(e, Exception)
        ]

        vector_chunks, graph_entities, graph_hops = await parallel_retrieve(
            coach_id=coach_id,
            query_embedding=query_embedding,
            seed_embeddings=seed_embeddings,
            query_type=query_type,
            supabase=supabase,
        )
        return {
            "vector_chunks": vector_chunks,
            "graph_entities": graph_entities,
            "graph_hops": graph_hops,
        }
    except Exception as e:
        logger.error(f"parallel_retrieval failed: {e}", exc_info=True)
        return {"vector_chunks": [], "graph_entities": [], "graph_hops": []}


# ── Node 4: Merge and score context ──────────────────────────────────────────

async def merge_and_score_context(state: GraphRAGState) -> Dict[str, Any]:
    """Merge, deduplicate, score, and format context from all retrieval sources."""
    final_context, context_trace = merge_context(
        vector_chunks=state.get("vector_chunks") or [],
        graph_entities=state.get("graph_entities") or [],
        graph_hops=state.get("graph_hops") or [],
    )
    return {"final_context": final_context, "context_trace": context_trace}


# ── Node 5: Generate suggestion ───────────────────────────────────────────────

async def generate_suggestion(state: GraphRAGState) -> Dict[str, Any]:
    """Assemble the full prompt and call Gemini for diet suggestion generation."""
    athlete_context = json.dumps({
        "athlete": state.get("athlete_profile"),
        "currentGoal": state.get("athlete_goal"),
        "preferences": state.get("athlete_prefs"),
        "biofeedback": _build_biofeedback(state.get("recent_logs") or []),
    }, indent=2)

    final_context = state.get("final_context") or "No relevant knowledge retrieved."

    # Split context into graph and vector sections for the template
    graph_knowledge = ""
    vector_knowledge = ""
    if "== GRAPH KNOWLEDGE" in final_context:
        parts = final_context.split("== VECTOR KNOWLEDGE")
        graph_knowledge = parts[0].replace("== GRAPH KNOWLEDGE (entity relationships) ==", "").strip()
        vector_knowledge = parts[1].strip() if len(parts) > 1 else ""
    else:
        vector_knowledge = final_context

    # Format prompt using the template
    messages = DIET_SUGGESTION_PROMPT.format_messages(
        athlete_context=athlete_context,
        graph_knowledge=graph_knowledge,
        vector_knowledge=vector_knowledge,
        query_text=state["query_text"],
    )
    prompt_str = "\n\n".join(m.content for m in messages)

    try:
        generation_result = await generate_suggestion_with_gemini(prompt_str)
        return {"generation_result": generation_result, "retry_count": state.get("retry_count", 0)}
    except Exception as e:
        if "rate_limited" in str(e):
            return {"error": "rate_limited", "retry_count": state.get("retry_count", 0) + 1}
        return {"error": str(e), "generation_result": None}


def _build_biofeedback(logs: list) -> dict | None:
    if not logs:
        return None
    valid_hunger = [x.get("hunger_level") for x in logs if x.get("hunger_level") is not None]
    valid_digestion = [x.get("digestion_rating") for x in logs if x.get("digestion_rating") is not None]
    perfect_adherence = len([x for x in logs if x.get("diet_adherence") == "perfect"])
    return {
        "avg_hunger_level": sum(valid_hunger) / len(valid_hunger) if valid_hunger else 0,
        "avg_digestion_rating": sum(valid_digestion) / len(valid_digestion) if valid_digestion else 0,
        "avg_diet_adherence": perfect_adherence / len(logs) if logs else 0,
    }


# ── Node 6: Save and return ───────────────────────────────────────────────────

async def save_and_return(state: GraphRAGState) -> Dict[str, Any]:
    """Persist the suggestion to ai_suggestions and return the final result."""
    supabase = state["supabase"]  # type: ignore[typeddict-item]
    generation_result = state.get("generation_result") or {}
    vector_chunks = state.get("vector_chunks") or []
    context_trace = state.get("context_trace") or []

    context_snapshot = {
        "athlete": state.get("athlete_profile"),
        "currentGoal": state.get("athlete_goal"),
        "preferences": state.get("athlete_prefs"),
        "biofeedback": _build_biofeedback(state.get("recent_logs") or []),
        "graph_trace": context_trace,
        "query_type": state.get("query_type"),
        "seed_entity_names": state.get("seed_entity_names"),
    }

    chunk_ids = [c.get("id") for c in vector_chunks if c.get("id")]

    try:
        result = await supabase.table("ai_suggestions").insert({
            "athlete_id": state["athlete_id"],
            "generated_by": state["coach_id"],
            "query_text": state["query_text"],
            "context_snapshot": context_snapshot,
            "retrieved_chunk_ids": chunk_ids,
            "suggestion_text": generation_result.get("text", ""),
            "suggestion_json": generation_result.get("json"),
            "status": "pending",
        }).execute()

        suggestion_id = result.data[0]["id"] if result.data else None
        return {
            "generation_result": {
                **generation_result,
                "suggestion_id": suggestion_id,
                "graph_hops_count": len(state.get("graph_hops") or []),
            }
        }
    except Exception as e:
        logger.error(f"save_and_return failed: {e}", exc_info=True)
        return {"error": f"Failed to save suggestion: {e}"}


# ── Conditional edge router ───────────────────────────────────────────────────

def route_after_generation(state: GraphRAGState) -> str:
    """Route to retry or proceed to save based on error state."""
    if state.get("error") == "rate_limited" and state.get("retry_count", 0) < 2:
        return "retry"
    return "done"
