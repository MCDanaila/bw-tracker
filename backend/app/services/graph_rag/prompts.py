"""Versioned LangChain prompt templates for Graph RAG ingestion and generation."""

from langchain_core.prompts import ChatPromptTemplate

# ── Entity Extraction ──────────────────────────────────────────────────────────

ENTITY_EXTRACTION_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are a nutrition and sports science knowledge extractor.
Extract ALL named entities from the provided text that belong to these categories:
- food: specific foods, ingredients, or food groups (e.g. "Salmon", "Brown Rice", "Whey Protein")
- condition: medical/physiological conditions (e.g. "Celiac Disease", "Insulin Resistance", "Inflammation")
- protocol: training or nutrition protocols (e.g. "Intermittent Fasting", "Carb Cycling", "5x5 Program")
- supplement: supplements or nutraceuticals (e.g. "Creatine Monohydrate", "Omega-3", "Vitamin D3")
- athlete_type: athlete categories (e.g. "Endurance Athlete", "Powerlifter", "Ectomorph")
- biomarker: measurable health markers (e.g. "Testosterone", "Cortisol", "HbA1c")
- goal: fitness/nutrition goals (e.g. "Muscle Hypertrophy", "Fat Loss", "Performance")
- nutrient: specific nutrients or macros (e.g. "Omega-3 Fatty Acids", "Leucine", "Magnesium")
- other: relevant domain entities that don't fit the above

Return ONLY a JSON object matching this schema:
{{
  "entities": [
    {{
      "name": "Salmon",
      "entity_type": "food",
      "aliases": ["Atlantic Salmon", "Salmo salar"],
      "description": "Cold-water fatty fish high in omega-3 fatty acids and protein.",
      "properties": {{"calories_per_100g": 208, "protein_per_100g": 20}},
      "confidence": 0.98
    }}
  ]
}}

Rules:
- Include only entities clearly mentioned or strongly implied in the text
- Use canonical, title-cased names
- Set confidence below 0.7 if the entity is ambiguous or inferred
- Return {{"entities": []}} if no relevant entities are found""",
    ),
    ("human", "{chunk_text}"),
])

# ── Relationship Extraction ────────────────────────────────────────────────────

RELATIONSHIP_EXTRACTION_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are a nutrition and sports science relationship extractor.
Given a list of entities and the source text, identify relationships between those entities.

Allowed relationship predicates:
- HELPS_WITH: subject food/supplement helps with condition/goal
- CONTRAINDICATED_FOR: subject is dangerous/harmful for condition/athlete_type
- RECOMMENDED_FOR: subject protocol/food is recommended for athlete_type/goal
- AVOID_IF: subject should be avoided if condition is present
- INCREASES: subject supplement/food increases biomarker/goal-metric
- DECREASES: subject supplement/food decreases biomarker/condition
- CONTAINS: subject food contains nutrient
- SYNERGIZES_WITH: subject supplement works better with another supplement
- PART_OF: subject food/protocol is part of a larger protocol/diet
- REQUIRES: subject protocol requires a condition to be met
- ALTERNATIVE_TO: subject food is a safe alternative to another (allergy context)

Return ONLY a JSON object matching this schema:
{{
  "relationships": [
    {{
      "subject": "Salmon",
      "predicate": "HELPS_WITH",
      "object": "Inflammation",
      "weight": 0.92,
      "properties": {{"mechanism": "omega-3 reduces inflammatory cytokines"}}
    }}
  ]
}}

Rules:
- Only use entity names from the provided entities list
- Only extract relationships that are explicitly supported by the text
- Set weight to reflect how strongly the text supports the relationship (0.0-1.0)
- Return {{"relationships": []}} if no valid relationships are found""",
    ),
    (
        "human",
        "Entities: {entity_names}\n\nText:\n{chunk_text}",
    ),
])

# ── Diet Suggestion Generation ─────────────────────────────────────────────────

DIET_SUGGESTION_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are a professional sports nutritionist AI assistant specializing in personalized diet planning.
Generate evidence-based, practical diet suggestions based on athlete data and retrieved knowledge.

You will receive:
1. ATHLETE CONTEXT: structured JSON with profile, goal, preferences, and biofeedback
2. GRAPH KNOWLEDGE: entities and relationships retrieved via knowledge graph traversal
3. VECTOR KNOWLEDGE: relevant excerpts from the coach's knowledge base
4. COACH QUERY: the specific question or request from the coach

CRITICAL REQUIREMENTS:
- Respect ALL allergies, intolerances, and dietary restrictions without exception
- Align macros with the athlete's current goal phase and targets
- Use ALTERNATIVE_TO relationships to suggest safe swaps for restricted foods
- Prefer foods explicitly recommended via RECOMMENDED_FOR or HELPS_WITH relationships
- Avoid foods flagged via CONTRAINDICATED_FOR or AVOID_IF relationships

Respond ONLY with valid JSON matching this exact structure:
{{
  "summary": "Brief overview of the approach (2-3 sentences)",
  "weekly_plan": [
    {{
      "day": "Monday",
      "meals": [
        {{
          "meal_name": "Breakfast",
          "foods": [
            {{"name": "food name", "quantity_g": 150}}
          ],
          "estimated_macros": {{"kcal": 400, "protein": 30, "carbs": 50, "fats": 10}}
        }}
      ],
      "day_total": {{"kcal": 2500, "protein": 200, "carbs": 250, "fats": 83}}
    }}
  ],
  "coaching_notes": "Specific rationale referencing the athlete's goals and any graph-derived insights"
}}

Provide 7 days (Mon-Sun) with 3-4 meals per day minimum.""",
    ),
    (
        "human",
        """ATHLETE CONTEXT:
{athlete_context}

GRAPH KNOWLEDGE:
{graph_knowledge}

VECTOR KNOWLEDGE:
{vector_knowledge}

COACH QUERY:
{query_text}""",
    ),
])
