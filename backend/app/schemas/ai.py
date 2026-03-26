"""AI endpoint schemas."""

from pydantic import BaseModel, Field


class GenerateSuggestionRequest(BaseModel):
    """Request to generate a diet suggestion."""

    athlete_id: str
    query_text: str = Field(..., min_length=10, max_length=2000)


class GenerateSuggestionResponse(BaseModel):
    """Response with generated diet suggestion."""

    suggestion_id: str
    suggestion_text: str
    suggestion_json: dict | None = None


class EmbedDocumentRequest(BaseModel):
    """Request to embed a knowledge document."""

    document_id: str
    content: str = Field(..., min_length=10)


class EmbedDocumentResponse(BaseModel):
    """Response from document embedding."""

    chunks_created: int
