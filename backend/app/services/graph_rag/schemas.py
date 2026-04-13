"""Pydantic output schemas for LangChain structured extraction chains."""

from typing import Any, List, Literal, Optional
from pydantic import BaseModel, Field

# Must match entity_type SQL ENUM
EntityType = Literal[
    "food", "condition", "protocol", "supplement",
    "athlete_type", "biomarker", "goal", "nutrient", "other"
]

# Must match relationship_predicate SQL ENUM
RelationshipPredicate = Literal[
    "HELPS_WITH", "CONTRAINDICATED_FOR", "RECOMMENDED_FOR", "AVOID_IF",
    "INCREASES", "DECREASES", "CONTAINS", "SYNERGIZES_WITH",
    "PART_OF", "REQUIRES", "ALTERNATIVE_TO"
]


class ExtractedEntity(BaseModel):
    name: str = Field(description="Canonical name of the entity, title-cased")
    entity_type: EntityType = Field(description="Category of the entity")
    aliases: List[str] = Field(
        default_factory=list,
        description="Alternative names or abbreviations for this entity"
    )
    description: Optional[str] = Field(
        default=None,
        description="One-sentence description of this entity in the nutrition/fitness domain"
    )
    properties: dict[str, Any] = Field(
        default_factory=dict,
        description="Structured properties, e.g. {'calories_per_100g': 89} for foods, {'severity': 'high'} for conditions"
    )
    confidence: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Confidence that this is a real, correctly-typed entity (0.0-1.0)"
    )


class ExtractedRelationship(BaseModel):
    subject: str = Field(description="Name of the subject entity (must match an extracted entity name)")
    predicate: RelationshipPredicate = Field(description="Relationship type")
    object_entity: str = Field(
        alias="object",
        description="Name of the object entity (must match an extracted entity name)"
    )
    weight: float = Field(
        default=0.8,
        ge=0.0,
        le=1.0,
        description="Confidence/strength of this relationship (0.0-1.0)"
    )
    properties: dict[str, Any] = Field(
        default_factory=dict,
        description="Extra context, e.g. {'dosage': '5g/day', 'timing': 'pre-workout'}"
    )

    model_config = {"populate_by_name": True}


class EntityExtractionResult(BaseModel):
    entities: List[ExtractedEntity] = Field(
        default_factory=list,
        description="All named nutrition/fitness entities found in the text"
    )


class RelationshipExtractionResult(BaseModel):
    relationships: List[ExtractedRelationship] = Field(
        default_factory=list,
        description="All relationships between the provided entities found in the text"
    )
