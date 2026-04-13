"""Vector and graph retrieval functions for the Graph RAG pipeline."""

import asyncio
import logging
from typing import Any, Dict, List, Optional

from supabase import AsyncClient

from app.services.graph_rag.state import QUERY_TYPE_PREDICATES, QueryType

logger = logging.getLogger(__name__)


async def vector_search(
    coach_id: str,
    query_embedding: List[float],
    supabase: AsyncClient,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """Retrieve top-k knowledge chunks by cosine similarity to the query embedding."""
    try:
        result = await supabase.rpc("match_knowledge_chunks", {
            "query_embedding": query_embedding,
            "match_count": top_k,
            "p_coach_id": coach_id,
        }).execute()
        return result.data or []
    except Exception as e:
        logger.error(f"vector_search failed: {e}")
        return []


async def entity_search(
    coach_id: str,
    seed_embeddings: List[List[float]],
    supabase: AsyncClient,
    top_k_per_seed: int = 3,
) -> List[Dict[str, Any]]:
    """Find knowledge_entities closest to each seed embedding, deduplicated by id."""
    if not seed_embeddings:
        return []

    async def _search_one(embedding: List[float]) -> List[Dict[str, Any]]:
        try:
            result = await supabase.rpc("match_knowledge_entities", {
                "query_embedding": embedding,
                "match_count": top_k_per_seed,
                "p_coach_id": coach_id,
            }).execute()
            return result.data or []
        except Exception as e:
            logger.warning(f"entity_search seed query failed: {e}")
            return []

    results = await asyncio.gather(*[_search_one(emb) for emb in seed_embeddings])

    # Deduplicate by entity id, preserving first occurrence (highest similarity)
    seen_ids: set = set()
    entities: List[Dict[str, Any]] = []
    for batch in results:
        for entity in batch:
            eid = entity.get("id")
            if eid and eid not in seen_ids:
                seen_ids.add(eid)
                entities.append(entity)

    return entities


async def graph_traverse(
    coach_id: str,
    entity_ids: List[str],
    query_type: QueryType,
    supabase: AsyncClient,
    max_hops: int = 2,
    min_weight: float = 0.4,
) -> List[Dict[str, Any]]:
    """Multi-hop graph traversal from seed entity IDs using predicates for the query type."""
    if not entity_ids:
        return []

    predicates = QUERY_TYPE_PREDICATES.get(query_type, QUERY_TYPE_PREDICATES[QueryType.GENERAL])

    try:
        result = await supabase.rpc("graph_traverse", {
            "p_coach_id": coach_id,
            "p_seed_ids": entity_ids,
            "p_predicates": predicates,
            "p_max_hops": max_hops,
            "p_min_weight": min_weight,
        }).execute()
        return result.data or []
    except Exception as e:
        logger.error(f"graph_traverse RPC failed: {e}")
        return []


async def parallel_retrieve(
    coach_id: str,
    query_embedding: List[float],
    seed_embeddings: List[List[float]],
    query_type: QueryType,
    supabase: AsyncClient,
) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Run vector search and graph retrieval concurrently.

    Returns:
        (vector_chunks, graph_entities, graph_hops)
    """
    vector_task = vector_search(coach_id, query_embedding, supabase)
    entity_task = entity_search(coach_id, seed_embeddings, supabase)

    vector_chunks, graph_entities = await asyncio.gather(vector_task, entity_task)

    entity_ids = [str(e["id"]) for e in graph_entities if e.get("id")]
    graph_hops = await graph_traverse(coach_id, entity_ids, query_type, supabase)

    return vector_chunks, graph_entities, graph_hops
