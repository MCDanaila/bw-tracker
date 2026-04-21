"""LangGraph workflow compilation for the Graph RAG orchestrator."""

import logging

from langgraph.graph import END, StateGraph
from langgraph.graph.state import CompiledStateGraph

from app.services.graph_rag.nodes import (
    classify_query,
    generate_suggestion,
    load_athlete_context,
    merge_and_score_context,
    parallel_retrieval,
    route_after_generation,
    save_and_return,
)
from app.services.graph_rag.state import GraphRAGState

logger = logging.getLogger(__name__)


def build_graph() -> CompiledStateGraph:
    """Build and compile the Graph RAG StateGraph.

    Call once at application startup and store on app.state.
    The compiled graph is thread-safe and can be shared across requests.
    """
    workflow = StateGraph(GraphRAGState)

    # Register nodes
    workflow.add_node("load_athlete_context", load_athlete_context)
    workflow.add_node("classify_query", classify_query)
    workflow.add_node("parallel_retrieval", parallel_retrieval)
    workflow.add_node("merge_and_score_context", merge_and_score_context)
    workflow.add_node("generate_suggestion", generate_suggestion)
    workflow.add_node("save_and_return", save_and_return)

    # Entry point
    workflow.set_entry_point("load_athlete_context")

    # Linear edges
    workflow.add_edge("load_athlete_context", "classify_query")
    workflow.add_edge("classify_query", "parallel_retrieval")
    workflow.add_edge("parallel_retrieval", "merge_and_score_context")
    workflow.add_edge("merge_and_score_context", "generate_suggestion")

    # Conditional edge: retry on rate-limit, otherwise save
    workflow.add_conditional_edges(
        "generate_suggestion",
        route_after_generation,
        {
            "retry": "generate_suggestion",
            "done": "save_and_return",
        },
    )

    workflow.add_edge("save_and_return", END)

    compiled = workflow.compile()
    logger.info("Graph RAG workflow compiled successfully")
    return compiled
