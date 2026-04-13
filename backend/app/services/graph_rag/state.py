"""LangGraph state definition for the Graph RAG orchestration workflow."""

from enum import StrEnum
from typing import Any, Dict, List, Optional, TypedDict


class QueryType(StrEnum):
    """Classification of the coach's query intent for targeted graph traversal."""
    FOOD_SENSITIVITY = "food_sensitivity"    # allergy / intolerance queries
    GOAL_PROTOCOL = "goal_protocol"          # training phase / goal queries
    SUPPLEMENT = "supplement"                # supplement-specific queries
    GENERAL = "general"                      # catch-all


# Predicates to traverse per query type — used in graph_traverse RPC call
QUERY_TYPE_PREDICATES: Dict[QueryType, List[str]] = {
    QueryType.FOOD_SENSITIVITY: [
        "CONTRAINDICATED_FOR", "AVOID_IF", "ALTERNATIVE_TO", "CONTAINS"
    ],
    QueryType.GOAL_PROTOCOL: [
        "RECOMMENDED_FOR", "HELPS_WITH", "PART_OF", "REQUIRES"
    ],
    QueryType.SUPPLEMENT: [
        "SYNERGIZES_WITH", "INCREASES", "DECREASES", "HELPS_WITH", "AVOID_IF"
    ],
    QueryType.GENERAL: [
        "HELPS_WITH", "CONTRAINDICATED_FOR", "RECOMMENDED_FOR", "AVOID_IF",
        "INCREASES", "DECREASES", "CONTAINS", "SYNERGIZES_WITH",
        "PART_OF", "REQUIRES", "ALTERNATIVE_TO"
    ],
}


class GraphRAGState(TypedDict):
    """Complete state passed between LangGraph nodes.

    Fields are progressively populated as the graph executes.
    All fields are Optional to allow partial state at each node boundary.
    """
    # ── Inputs (required, set at graph entry) ─────────────────────────────────
    athlete_id: str
    query_text: str
    coach_id: str

    # ── Loaded context (populated by: load_athlete_context) ───────────────────
    athlete_profile: Optional[Dict[str, Any]]
    athlete_goal: Optional[Dict[str, Any]]
    athlete_prefs: Optional[Dict[str, Any]]
    recent_logs: List[Dict[str, Any]]

    # ── Query classification (populated by: classify_query) ───────────────────
    query_type: Optional[QueryType]
    seed_entity_names: List[str]   # entity names extracted from query + athlete context

    # ── Retrieval results (populated by: parallel_retrieval) ──────────────────
    vector_chunks: List[Dict[str, Any]]     # from match_knowledge_chunks RPC
    graph_entities: List[Dict[str, Any]]    # from knowledge_entities cosine search
    graph_hops: List[Dict[str, Any]]        # from graph_traverse RPC

    # ── Merged context (populated by: merge_and_score_context) ────────────────
    final_context: Optional[str]            # formatted string injected into LLM prompt
    context_trace: List[Dict[str, Any]]     # full scored list for audit / explainability

    # ── Generation output (populated by: generate_suggestion) ─────────────────
    generation_result: Optional[Dict[str, Any]]   # {"text": str, "json": dict | None}

    # ── Error handling ─────────────────────────────────────────────────────────
    error: Optional[str]
    retry_count: int
