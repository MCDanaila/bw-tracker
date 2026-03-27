"""AI generation service for diet suggestions using Gemini."""

import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List, Tuple
import httpx

from supabase import AsyncClient
from app.config import settings

logger = logging.getLogger(__name__)


async def embed_text(text: str) -> List[float]:
    """Get embeddings from Google Gemini API."""
    url = "https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": settings.gemini_api_key,
    }
    payload = {
        "model": "models/embedding-001",
        "content": {"parts": [{"text": text}]}
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload, timeout=10.0)
        if not response.is_success:
            logger.error(f"Embedding API error {response.status_code}: {response.text}")
            raise Exception(f"Embedding API error: {response.status_code}")
        data = response.json()
        return data["embedding"]["values"]


async def generate_suggestion_with_gemini(prompt: str) -> dict:
    """Generate diet suggestion using Gemini 1.5 Flash."""
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": settings.gemini_api_key,
    }
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 4096,
        },
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ],
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload, timeout=60.0)
        if response.status_code == 429:
            raise Exception("rate_limited")
        if not response.is_success:
            logger.error(f"Gemini API error {response.status_code}: {response.text}")
            raise Exception(f"Gemini API error: {response.status_code}")
        
        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            text = "No response generated"
        else:
            text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "No response generated")
            
        json_data = None
        import re
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            try:
                json_data = json.loads(match.group(0))
            except json.JSONDecodeError:
                logger.warning("Could not parse JSON from Gemini response")
                
        return {"text": text, "json": json_data}


async def generate_diet_payload(
    athlete_id: str,
    query_text: str,
    coach_id: str,
    supabase: AsyncClient,
) -> Tuple[dict, List[str], dict]:
    """Generates the diet payload and returns (context_snapshot, retrieved_chunk_ids, generation_result)."""
    
    # Rate Limiting check (max 10 per hour per coach)
    one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    res = await supabase.table("ai_suggestions").select("id", count="exact").eq("generated_by", coach_id).gte("created_at", one_hour_ago).execute()
    if res.count and res.count >= 10:
        raise Exception("rate_limited")

    # Fetch athlete preferences
    prefs_res = await supabase.table("athlete_preferences").select("*").eq("athlete_id", athlete_id).execute()
    if not prefs_res.data:
        raise ValueError("Missing athlete preferences")
    prefs = prefs_res.data[0]
    
    if not prefs.get('allergies') and not prefs.get('intolerances') and not prefs.get('dietary_restrictions'):
        raise ValueError("At least one of allergies, intolerances, or dietary_restrictions must be set")

    # Profiles
    profile_res = await supabase.table("profiles").select("*").eq("id", athlete_id).execute()
    profile = profile_res.data[0] if profile_res.data else None

    # Goals 
    goal_res = await supabase.table("athlete_goals").select("*").eq("athlete_id", athlete_id).is_("effective_until", "null").execute()
    goal = goal_res.data[0] if goal_res.data else None

    # Daily Logs (Last 7 days)
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    logs_res = await supabase.table("daily_logs").select("*").eq("user_id", athlete_id).gte("date", seven_days_ago).order("date", desc=True).execute()
    logs = logs_res.data or []

    # Embed query text
    query_embedding = await embed_text(query_text)

    # Match generic knowledge chunks
    chunks_res = await supabase.rpc("match_knowledge_chunks", {
        "query_embedding": query_embedding,
        "match_count": 5,
        "p_coach_id": coach_id
    }).execute()
    chunks = chunks_res.data or []

    # Top 30 foods
    foods_res = await supabase.table("foods").select("id, name, calories, protein, carbs, fats").limit(30).execute()
    foods = foods_res.data or []

    # Build context snapshot
    context_snapshot = {
        "athlete": {
            "id": athlete_id,
            "username": profile.get('username') if profile else None,
            "age": profile.get('age') if profile else None,
            "height": profile.get('height') if profile else None,
            "weight": logs[0].get('weight_fasting') if logs else (profile.get('initial_weight') if profile else None),
            "activityLevel": profile.get('activity_level') if profile else None,
            "goal": profile.get('goal') if profile else None,
        },
        "currentGoal": {
            "phase": goal.get('phase'),
            "target_weight": goal.get('target_weight'),
            "target_calories": goal.get('target_calories'),
            "target_protein": goal.get('target_protein'),
            "target_carbs": goal.get('target_carbs'),
            "target_fats": goal.get('target_fats'),
        } if goal else None,
        "preferences": {
            "allergies": prefs.get('allergies'),
            "intolerances": prefs.get('intolerances'),
            "dietary_restrictions": prefs.get('dietary_restrictions'),
            "food_dislikes": prefs.get('food_dislikes'),
            "food_preferences": prefs.get('food_preferences'),
            "cuisine_preferences": prefs.get('cuisine_preferences'),
            "cooking_skill": prefs.get('cooking_skill'),
            "meal_prep_time": prefs.get('meal_prep_time'),
            "budget_level": prefs.get('budget_level'),
        },
        "biofeedback": None
    }

    if logs:
        valid_hunger = [x.get('hunger_level') for x in logs if x.get('hunger_level') is not None]
        valid_digestion = [x.get('digestion_rating') for x in logs if x.get('digestion_rating') is not None]
        perfect_adherence = len([x for x in logs if x.get('diet_adherence') == 'perfect'])
        
        context_snapshot["biofeedback"] = {
            "avg_hunger_level": sum(valid_hunger) / len(valid_hunger) if valid_hunger else 0,
            "avg_digestion_rating": sum(valid_digestion) / len(valid_digestion) if valid_digestion else 0,
            "avg_diet_adherence": perfect_adherence / len(logs) if len(logs) > 0 else 0,
        }

    # Format retrieval snippets
    kc = ""
    if chunks:
        snippets = [
            f"[Excerpt {i + 1}, similarity: {int(c.get('similarity', 0)*100)}%]\\n{c.get('content', '')}" 
            for i, c in enumerate(chunks)
        ]
        kc = "\\nKNOWLEDGE BASE (Retrieved relevant excerpts):\\n" + "\\n\\n".join(snippets)

    fs = ""
    if foods:
        items = [f"- {f.get('name')} ({f.get('calories')} kcal/portion)" for f in foods[:30]]
        fs = "\\nSample of available foods in database:\\n" + "\\n".join(items)

    current_phase = goal.get('phase', 'not set') if goal else 'not set'

    prompt = f"""You are a professional sports nutritionist AI assistant specializing in personalized diet planning based on athlete preferences, goals, and evidence-based nutritional science.

ATHLETE CONTEXT:
{json.dumps(context_snapshot, indent=2)}

COACH'S REQUEST:
"{query_text}"

{kc}

{fs}

Based on the athlete's profile, current phase ({current_phase}), preferences, and the provided knowledge base, generate a comprehensive diet suggestion.

Respond ONLY with valid JSON matching this exact structure:
{{
  "summary": "Brief overview of the suggested approach (2-3 sentences)",
  "weekly_plan": [
    {{
      "day": "Monday",
      "meals": [
        {{
          "meal_name": "Breakfast",
          "foods": [
            {{
              "name": "food item name",
              "quantity_g": 150
            }}
          ],
          "estimated_macros": {{
            "kcal": 400,
            "protein": 30,
            "carbs": 50,
            "fats": 10
          }}
        }}
      ],
      "day_total": {{
        "kcal": 2500,
        "protein": 200,
        "carbs": 250,
        "fats": 83
      }}
    }}
  ],
  "coaching_notes": "Specific advice and rationale for this plan based on athlete's goals and preferences"
}}

Requirements:
1. Respect ALL allergies, intolerances, and dietary restrictions
2. Use foods from the available database when possible
3. Ensure macros align with current phase and goals
4. Provide 7 days (Mon-Sun) of meal plans
5. Include 3-4 meals per day minimum
6. Make meals realistic and respecting cooking skill level"""

    logger.info("Calling Gemini with compiled context prompt...")
    generation_result = await generate_suggestion_with_gemini(prompt)

    chunk_ids = [c.get('id') for c in chunks]
    return context_snapshot, chunk_ids, generation_result
