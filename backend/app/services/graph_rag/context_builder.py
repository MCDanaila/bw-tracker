"""Context merging, scoring, and formatting for Graph RAG retrieval."""

import hashlib
from typing import Any, Dict, List, Tuple

# Scoring weights
VECTOR_WEIGHT = 0.4
GRAPH_WEIGHT = 0.6
HOP_DECAY = 0.7        # weight multiplier per additional hop
MAX_CONTEXT_CHARS = 12_000  # ~3000 tokens at 4 chars/token


def _content_hash(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()[:12]


def _score_vector_chunk(chunk: Dict[str, Any]) -> float:
    similarity = chunk.get("similarity", 0.5)
    return similarity * VECTOR_WEIGHT


def _score_graph_item(item: Dict[str, Any]) -> float:
    hop = item.get("hop_depth", 0)
    weight = item.get("total_weight", 1.0)
    decay = HOP_DECAY ** hop
    return GRAPH_WEIGHT * weight * decay


def _format_graph_entity(entity: Dict[str, Any], relationships: List[Dict[str, Any]]) -> str:
    """Format a graph entity with its relationships for the context string."""
    lines = [f"Entity: {entity.get('name')} ({entity.get('entity_type', 'unknown')})"]
    props = entity.get("properties") or {}
    if props:
        prop_str = ", ".join(f"{k}: {v}" for k, v in list(props.items())[:4])
        lines.append(f"  Properties: {{{prop_str}}}")
    if relationships:
        lines.append("  Relationships:")
        for rel in relationships[:5]:
            lines.append(
                f"    {rel.get('predicate')} → {rel.get('object_name', '?')} "
                f"[confidence: {rel.get('weight', 0):.2f}]"
            )
    return "\n".join(lines)


def merge_context(
    vector_chunks: List[Dict[str, Any]],
    graph_entities: List[Dict[str, Any]],
    graph_hops: List[Dict[str, Any]],
) -> Tuple[str, List[Dict[str, Any]]]:
    """Merge, score, deduplicate, and format context from all retrieval sources.

    Returns:
        final_context: formatted string for LLM prompt injection
        context_trace: full scored list for audit / explainability
    """
    scored: List[Dict[str, Any]] = []
    seen_hashes: set = set()

    # Score vector chunks
    for chunk in vector_chunks:
        content = chunk.get("content", "")
        h = _content_hash(content)
        if h in seen_hashes:
            continue
        seen_hashes.add(h)
        scored.append({
            "source": "vector",
            "score": _score_vector_chunk(chunk),
            "content": content,
            "similarity": chunk.get("similarity", 0),
            "chunk_id": chunk.get("id"),
        })

    # Score graph entities (deduplicate by name)
    seen_entity_names: set = set()
    entity_name_to_item: Dict[str, Dict[str, Any]] = {}

    for item in graph_hops:
        name = item.get("name", "")
        if name in seen_entity_names:
            continue
        seen_entity_names.add(name)
        entity_name_to_item[name] = item
        scored.append({
            "source": "graph",
            "score": _score_graph_item(item),
            "entity_id": str(item.get("entity_id", "")),
            "name": name,
            "entity_type": item.get("entity_type"),
            "description": item.get("description"),
            "properties": item.get("properties") or {},
            "hop_depth": item.get("hop_depth", 0),
            "path": item.get("path", []),
            "total_weight": item.get("total_weight", 1.0),
        })

    # Also include direct entity matches not in hops
    for entity in graph_entities:
        name = entity.get("name", "")
        if name in seen_entity_names:
            continue
        seen_entity_names.add(name)
        scored.append({
            "source": "graph_direct",
            "score": GRAPH_WEIGHT * entity.get("confidence", 1.0),
            "entity_id": str(entity.get("id", "")),
            "name": name,
            "entity_type": entity.get("entity_type"),
            "description": entity.get("description"),
            "properties": entity.get("properties") or {},
            "hop_depth": 0,
            "path": [],
            "total_weight": entity.get("confidence", 1.0),
        })

    # Sort by score descending
    scored.sort(key=lambda x: x["score"], reverse=True)

    # Build context string within char budget
    vector_section_parts: List[str] = []
    graph_section_parts: List[str] = []
    total_chars = 0

    for item in scored:
        if total_chars >= MAX_CONTEXT_CHARS:
            break

        if item["source"] == "vector":
            sim_pct = int(item.get("similarity", 0) * 100)
            text = f"[Excerpt, similarity: {sim_pct}%]\n{item['content']}"
            if total_chars + len(text) <= MAX_CONTEXT_CHARS:
                vector_section_parts.append(text)
                total_chars += len(text)

        else:  # graph or graph_direct
            entity_text = _format_graph_entity(item, [])
            if item.get("description"):
                entity_text += f"\n  Description: {item['description']}"
            if total_chars + len(entity_text) <= MAX_CONTEXT_CHARS:
                graph_section_parts.append(entity_text)
                total_chars += len(entity_text)

    # Assemble final context string
    sections: List[str] = []
    if vector_section_parts:
        sections.append(
            "== VECTOR KNOWLEDGE (semantic search) ==\n"
            + "\n\n".join(vector_section_parts)
        )
    if graph_section_parts:
        sections.append(
            "== GRAPH KNOWLEDGE (entity relationships) ==\n"
            + "\n\n".join(graph_section_parts)
        )

    final_context = "\n\n".join(sections) if sections else "No relevant knowledge retrieved."

    return final_context, scored
