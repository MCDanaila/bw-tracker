# AI Planner

## Overview

AI-powered diet and workout plan generation using RAG (Retrieval-Augmented Generation). The coach triggers generation, reviews the output, and approves before the athlete sees anything.

**Stack:** Google Gemini API + Supabase pgvector + FastAPI backend

## Diet Planner

### What It Does

Generates personalized meal plans based on athlete context (goals, macros, restrictions, biofeedback). Outputs are validated for macro accuracy (±5% of target) before the coach can apply them.

### Generation Flow

```
Coach opens athlete diet page
  → clicks "Generate suggestion"
  → POST /ai/generate-diet-suggestion
      body: { athlete_id, context: { weight, goals, restrictions, ... } }
  → FastAPI fetches relevant knowledge docs via pgvector similarity search
  → Gemini generates meal plan with RAG context
  → response returned to coach for review (not yet visible to athlete)

Coach reviews and approves
  → POST /diet/apply-suggestion
      body: { athlete_id, suggestion }
  → FastAPI writes to meal_plans table (service role, bypasses RLS)
  → athlete sees updated plan on next load
```

### Knowledge Base

Nutrition knowledge is stored as embedded documents in Supabase pgvector. Coaches (or admins) can add documents via:

```
POST /knowledge/create-document
POST /ai/embed-document
```

Seed knowledge lives in `supabase/seeds/nutrition-knowledge.md`.

### Acceptance Criteria

- Macro accuracy: ±5% of target
- No meal repeated more than 2×/week
- Portion sizes are realistic (prep time <30min)
- Hallucination guard: only foods from the approved `foods` table

## Workout Planner

Planned (not yet implemented). See `FEATURE_BRAINSTORM_SYNTHESIS.md` for full spec.

Will follow the same RAG + coach-review pattern as diet planner.

## API Reference

All endpoints require `Authorization: Bearer <jwt>` with a coach-role token.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ai/generate-diet-suggestion` | POST | Generate diet plan with RAG |
| `/ai/embed-document` | POST | Embed a knowledge doc into pgvector |
| `/diet/assign-template` | POST | Assign a preset meal plan template |
| `/diet/apply-suggestion` | POST | Apply approved AI suggestion to meal_plans |
| `/knowledge/create-document` | POST | Create + embed a knowledge document |

## Rate Limiting

Configured via env vars (default: 10 requests / hour per IP):

```
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW_SECONDS=3600
```

## Phased Rollout

| Phase | Scope |
|-------|-------|
| MVP (done) | Quick 1-day suggestion + coach review + apply |
| Phase 2 | Weekly wizard, food swap integration, batch generation |
| Phase 3 | Adherence feedback loop, learning from outcomes |
| Phase 4 | Bulk operations, periodization templates |
