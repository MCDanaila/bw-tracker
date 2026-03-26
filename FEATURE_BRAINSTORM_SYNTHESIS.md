# Diet Planner & Workout Planner — Feature Synthesis
**bw-tracker Dashboard Features** | March 25, 2026

---

## Executive Summary

Two AI-powered planning systems (Diet & Workout) using RAG (Retrieval-Augmented Generation) with free LLM APIs and PDF knowledge bases. Both features integrate into the existing dashboard, serve athletes and coaches, and include robust quality gates and compliance measures.

**Key Recommendation:** Use **Google Gemini API (free tier)** + **Supabase pgvector** + **local Sentence-Transformers embeddings** for cost-effective, privacy-conscious MVP.

---

## I. DIET PLANNER FEATURE

### Scope
Intelligently suggests, generates, and optimizes personalized meal plans across 5 levels:
1. **Macros** — daily/weekly calorie & macro targets with periodization (bulk/cut/maintenance/reverse diet)
2. **Meal structure** — number of meals, timing, distribution
3. **Individual meals** — specific foods, portions sized to match macros
4. **Advanced** — food swaps, grocery lists, prep notes
5. **Adherence learning** — feedback loop from what athlete actually eats

### Athlete Inputs Needed
- **Anthropometric:** Gender, age, height, weight, body composition, target weight, timeframe
- **Goals:** Primary goal (muscle gain, fat loss, performance, maintenance); current phase; macro targets
- **Restrictions:** Allergies, intolerances, dietary style (vegetarian/vegan/religious), dislikes, likes, cuisines
- **Training:** Schedule, sport/modality, workout timing, intensity/duration, competition dates
- **Biofeedback:** Weight trend, sleep, stress, energy, hunger, digestion quality

### Coach Inputs & Controls
- **Macro targets:** Set or override AI suggestions per athlete/phase; periodize across year
- **Review workflow:** AI generates 3–5 options; coach selects/edits, approves before athlete sees
- **Manual overrides:** Swaps, deletions, custom meals; bulk operations (apply to multiple athletes)
- **AI tuning:** Model selection, confidence thresholds, hallucination guards
- **Tracking:** Which suggestions athlete followed; adherence outcomes per suggestion

### Feature Variations (MVP to Post-MVP)
- **Quick suggestion** (MVP, <1 min): Generate 1 day of meals
- **Weekly wizard** (Phase 1): Interactive step-by-step plan builder
- **Macro calculator** (Phase 1): Real-time assembly & macro checking
- **Food swap enhancer** (Phase 1): Improve existing swap algorithm
- **Grocery list** (Phase 2): Aggregated shopping list from planned meals

### Quality & Acceptance Criteria
- **Macro accuracy:** ±5% of target
- **Variety:** No meal repeats >2x/week
- **Realism:** Portion sizes feasible, prep time <30min, costs reasonable
- **Feedback loop:** Track adherence over time; weight progress on track
- **Hallucination guards:** Whitelist foods; validate portions; enforce constraints

### Technical Integration
- **DB schema:** Use existing `meal_plans`, `athlete_goals`, `meal_adherence`; add optional audit table for suggestion history
- **API:** `POST /api/rag/suggestion` with athlete context (weight, goals, restrictions)
- **Frontend:** Coach dashboard component for suggestion review + athlete-facing meal plan display
- **Reuse:** Existing patterns (hooks, forms, Tailwind styling, error handling)

### Phased Rollout
1. **Phase 1 (4–6 weeks):** MVP quick suggestion + coach review + apply to meal plan
2. **Phase 2 (2–3 weeks):** Weekly wizard + food swap integration + batch generation
3. **Phase 3 (3–4 weeks):** Adherence feedback loop + learning from outcomes
4. **Phase 4 (2–3 weeks):** Bulk operations + periodization templates

---

## II. WORKOUT PLANNER FEATURE

### Scope
Intelligently suggests, generates, and manages personalized workout programs across multiple time horizons:
- **Program templates** — Linear, undulating, block periodization (4/8/12-week variants)
- **Weekly splits** — 3x–7x/week (Full-Body, Upper/Lower, PPL, etc.)
- **Exercise selection** — Compound + accessory pairing; progression schemes
- **Progression** — Linear, double progression, RPE-based, wave loading, autoregulation
- **Deload planning** — Automatic or manual reduced-volume blocks

### Athlete Inputs Needed
- **Experience:** Training age, experience level (beginner/intermediate/advanced/elite)
- **Goals:** Primary goal (strength, hypertrophy, endurance, power, recovery); sport if applicable
- **Equipment:** Full gym, minimal equipment, bodyweight only
- **Frequency:** Days/week available; preferred session duration (30/60/90 min)
- **Constraints:** Injury history, movement restrictions, current 1RM estimates
- **Performance baseline:** Recent test results, benchmarks

### Coach Inputs & Controls
- **Program assignment:** Select template or custom program; set start date, duration
- **Exercise library:** Build custom exercises with variants, form cues, substitutes
- **Exercise rules:** Define incompatibilities (never X + Y same session), movement balance requirements
- **Progression paths:** Define which exercises progress to which variants; loading schemes
- **Mid-program adjustments:** Swap exercises (e.g., due to pain), reduce volume for deload, extend/terminate
- **Adherence tracking:** % of prescribed exercises done, volume load, RPE accuracy, exercise variance

### Feature Variations (MVP to Post-MVP)
- **Quick program** (MVP, 4 clicks): Generate 4-week program instantly
- **Exercise recommender** (Phase 1): Goal + equipment → exercise suggestions
- **Progression prescriber** (Phase 1): "Hit target reps → next phase loading"
- **Deload planner** (Phase 2): Automatic deload suggestions based on biofeedback
- **Session generator** (Phase 2): Pre-populate today's workout in log view

### Quality & Acceptance Criteria
- **Validation:** No hallucinated exercises; equipment matching; safe exercise combos
- **Training variables:** Volume load, RPE, exercise variance tracking
- **AI feedback loop:** Learn from athlete outcomes (did they improve 1RM? Gain muscle?)
- **11 acceptance checkpoints:** CRUD operations, offline support, type safety, testing
- **Hallucination guards:** Exercise whitelist; form cues grounded in biomechanics; no fictional variants

### Technical Integration
- **DB schema:** 9 new tables (programs, phases, sessions, exercises, prescriptions, progressions, logs, adherence)
- **API:** `POST /api/workout/program/suggest`; integration with existing `LogWorkoutView`
- **Frontend:** Coach dashboard program management; athlete workout log pre-population
- **Sync:** Dexie offline queue for workout log; sync to Supabase on reconnect

### Phased Rollout
1. **Phase 1 (4–6 weeks):** MVP quick program generation + coach assignment + adherence dashboard
2. **Phase 2 (3–4 weeks):** Exercise library management + mid-program adjustments
3. **Phase 3 (3–4 weeks):** Deload planner + progression tracking + outcome analytics
4. **Phase 4 (2–3 weeks):** Bulk operations + program templates marketplace

---

## III. RAG SYSTEM ARCHITECTURE (Shared for Both Features)

### Vector Database
**Recommendation: Supabase pgvector**
- Already integrated with bw-tracker backend
- Free tier: 500MB storage (sufficient for 1000+ PDFs with embeddings)
- Hybrid search: semantic + metadata filtering
- ACID transactions + RLS for athlete-specific access
- Schema: `knowledge_documents` + `knowledge_chunks` (with embedding vectors + metadata)

**Alternatives if scaling:**
- **Pinecone (free tier):** 1 index, 100K vectors (~50–100 PDFs)
- **Qdrant (self-hosted):** Docker-based, zero cost, operational burden
- **FAISS (in-memory):** Ultra-fast but no persistence; for static knowledge bases

### Embedding Model
**Recommendation: Sentence-Transformers (local, free)**
- Model: `all-MiniLM-L6-v2` (384 dims) or `all-mpnet-base-v2` (768 dims)
- License: Apache 2.0 (open-source)
- Performance: ~100 docs/sec on CPU
- Privacy: Completely local, no API calls, offline-capable
- Memory: 500MB
- Process: Batch embed PDFs off-hours (8 min for 50K embeddings); store vectors in Supabase; query-time is fast

**Alternative:** Jina AI free API (100K tokens/day, larger context window)

### Retrieval Strategy (4-tier pipeline)
1. **Query expansion** → Gemini rewrites query into 3–5 variations
2. **Semantic search** → pgvector search on each variation (k=10, threshold 0.70); filter by metadata
3. **Deduplication + filtering** → Remove duplicates; keep by credibility & date
4. **Re-ranking** → Cross-encoder (`ms-marco-MiniLM-L-12-v2`) re-scores top-20 → top-5
5. **LLM generation** → Send top-5 chunks + query to Gemini with strict instructions

### Chunking Strategy
**Recommendation: Semantic chunking**
- Max chunk size: 256–512 tokens
- Preserve semantics (split on paragraph/sentence boundaries, not mid-sentence)
- Respect document structure (headings, sections)
- Metadata per chunk: page number, section heading, document_type, source citation (author, year, journal, DOI)

### LLM API for Generation
**Recommendation: Google Gemini API (Free Tier)**

| Metric | Value |
|--------|-------|
| Free tier | 60 requests/min (1 req/sec) |
| Context window | 32K tokens (~25 pages) |
| Response time | 2–3s for 500-token output |
| Cost per 1M tokens | ~$0.075 input, ~$0.30 output |
| Single athlete cost | <$1/month |

**Why Gemini:**
- Best free LLM API; large context; fast inference
- Handles multimodal (if future image processing needed)
- Easy REST API
- Rate limit acceptable for single-athlete MVP

**Rate-limiting strategy for scale:**
- Request queue (Redis); drain at 1 req/sec
- Batch suggestions off-peak (2 AM nightly)
- Cache by query hash; hit rate ~60–70%

**Alternatives:**
- **OpenRouter:** Multiple models; free $5 credit
- **Ollama (self-hosted):** Free, offline, requires GPU (~$50–100/month)
- **Claude API (paid):** $0.25M–15M input tokens (best reasoning, but not free)

### PDF Knowledge Base Management
**Workflow:**
1. **Upload** → Coach uploads PDF to Supabase Storage
2. **Parse** → Backend: pdf-parse extracts text + metadata
3. **Chunk** → Semantic chunking; extract section/page/citation
4. **Embed** → Sentence-Transformers; store vectors in pgvector
5. **Query** → Supabase semantic search + re-rank + Gemini generation
6. **Attribution** → UI shows "[Title] (Author, Year), Chapter X, Page Y" + PDF link

**Handling tables/images:**
- Tables: Extract as text (works for delimited); manual annotation if complex
- Images: OCR (Tesseract.js) if needed; skip if decorative

**Storage:** Supabase Storage (1GB free tier, S3-compatible, signed URLs)

### Quality & Safety Gates
**Hallucination Prevention:**
1. **Source verification** — Only return chunks from credible sources (tag: `credibility IN ('high', 'medium')`)
2. **LLM confidence scoring** — "Rate confidence 0–100"; filter <70
3. **Forced citations** — Prompt: "Every claim must have [Source X]"; verify backend
4. **Constrained generation** — "Use ONLY these sources. If not available, say so."
5. **Recency filtering** — Prefer sources from last 3–5 years
6. **Token limits** — `maxOutputTokens: 500` (shorter = fewer hallucinations)

### Standards & Compliance

**Nutrition Science:**
- ISSN (International Society of Sports Nutrition) position stands
- ACSM, AND, ASPEN guidelines
- PubMed peer-reviewed research

**Exercise Science:**
- CSCS, NASM-CPT, ACE certifications
- Progressive overload + periodization principles
- Biomechanics-grounded form cues

**Regulations:**
- **FTC (US):** Substantiation Rule — only ISSN/ACSM claims; disclaimer: "For fitness; consult doctor for medical conditions"
- **FDA:** Medical claims — use "supports", "may help" (not "treats", "cures")
- **GDPR (EU):** Explicit consent; right to erasure; AI disclosure
- **EU AI Act:** Disclose "This uses AI"; documentation; opt-out; audit trail
- **WCAG 2.1:** 4.5:1 contrast; 14px+ font; sources linked; keyboard-accessible

**UI Disclosures:**
- "AI-Suggested [Plan Type] (Powered by AI) [Learn More] [Disable]"
- Italian disclaimer for EU EFSA compliance
- "Medical disclaimer: Consult a doctor for medical conditions"

### Integration with Existing Dashboard

**API Layer (Embedded in Dashboard Backend):**
```javascript
POST /api/rag/suggestion { athleteId, query, type: 'diet' | 'workout' }
  → RAG pipeline → Gemini → { suggestion, sources, confidence, followUpQuestions }

GET /api/rag/suggestions { athleteId } → batch-generated suggestions (from nightly job)

POST /api/rag/feedback { suggestionId, rating, followed, reason } → feedback loop
```

**Caching (3-tier):**
1. **Client:** TanStack Query (7-day staleTime); offline-capable
2. **Server:** Redis (7-day TTL); cross-device consistency
3. **Database:** Supabase (persist for analytics + feedback loop)

**Sync with Athlete Data:**
- Fetch athlete weight, goals, current plan, adherence
- Include in RAG prompt for personalization
- If athlete applies suggestion, update `meal_plans` or `workout_programs`

**Feedback Loop:**
- Athlete rates (1–5 stars)
- Track if suggestion followed (next day, check adherence/logs)
- Measure outcomes: weight change, strength gain, adherence improvement
- Dashboard: surface high-value suggestions (5⭐ + measurable results)

### Cost & Deployment

**Single Athlete (MVP):**
| Component | Cost/Month | Notes |
|-----------|-----------|-------|
| Gemini API | $0.05–1.00 | Real-time + batch queries |
| Supabase storage | $0 | <500MB vectors |
| Supabase compute | $0 | Free tier |
| Redis (optional) | $0–0.50 | Caching |
| **TOTAL** | **$0.15–1.50** | Negligible |

**5 athletes:** $0.25–5.00/month
**50+ athletes:** Consider paid tiers (~$100–500/month) or self-hosted Ollama

**Deployment Strategy:**
1. **Phase 1 (MVP):** Embedded in dashboard backend; Vercel; Gemini API (free tier)
2. **Phase 2–3:** Same stack; still under free tier limits
3. **Phase 4+ (scale):** Upgrade to Gemini paid tier OR self-host Ollama (GPU server, $50–100/month)

---

## IV. IMPLEMENTATION ROADMAP

### Proof of Concept (Week 1–2)
- [ ] Upload 2–3 nutrition + 2–3 workout PDFs (ISSN, ACSM, strength training resources)
- [ ] Test embedding + retrieval pipeline
- [ ] Generate 10 test suggestions (Gemini)
- [ ] Verify attribution (sources cited correctly)
- [ ] Verify no hallucinations

### Quality Testing (Week 3)
- [ ] 20 test queries per domain; compare RAG vs. hallucination baseline
- [ ] Verify sources match query intent
- [ ] Verify suggestions match athlete goals/restrictions
- [ ] Athlete feedback: rate suggestions (1–5), identify patterns

### Integration (Week 4–5)
- [ ] Hook RAG into dashboard API
- [ ] Coach UI: suggestion review form
- [ ] Athlete UI: display suggestions + sources
- [ ] Implement caching (Redis + TanStack Query)
- [ ] Test end-to-end: UI → backend → Gemini → UI

### Compliance & Documentation (Week 5–6)
- [ ] Verify FTC/GDPR/EU AI Act readiness
- [ ] Add disclaimers (Italian + English)
- [ ] Document decision process (architecture, safety measures)
- [ ] Create user-facing privacy policy

### MVP Launch (Week 7)
- [ ] Coach uploads 10 nutrition + 5 workout PDFs
- [ ] 1 athlete tests real-time suggestions
- [ ] Collect feedback; iterate on prompt engineering
- [ ] Document lessons; plan Phase 2

---

## V. COMPARISON: Diet vs. Workout Planner

| Aspect | Diet Planner | Workout Planner |
|--------|---|---|
| **Primary input** | Foods, macros | Exercises, loading |
| **Knowledge base** | Nutrition science PDFs (ISSN, AND) | Training science PDFs (NASM, CSCS, sports science) |
| **Core challenge** | Food adherence variance | Exercise form & progression |
| **Coach control** | Macro targets, review, override | Program selection, exercise swaps, deload |
| **Athlete autonomy** | High (food choices) | Low (follow prescribed program) |
| **Feedback loop** | Adherence tracking → better suggestions | Performance logs → progression validation |
| **DB complexity** | Moderate (extend meal_plans) | High (9 new tables for periodization) |
| **Time to MVP** | 4–6 weeks | 6–8 weeks |
| **Shared RAG infrastructure** | Yes | Yes |

---

## VI. Key Recommendations

### Do's ✅
1. **Use Gemini + pgvector for MVP** — Best cost/quality/simplicity trade-off
2. **Embed RAG in dashboard backend** — Simpler than microservice; leverages Supabase
3. **Implement 4-tier retrieval** — Semantic search + re-rank catches low-quality results
4. **Batch generation nightly** — Suggestions ready next morning; saves API costs
5. **Show sources prominently** — Builds trust; prevents hallucination claims
6. **Coach review before athlete sees** — Catch bad suggestions early
7. **Track outcomes** — Weight, strength, adherence improvements → measure value
8. **Plan compliance upfront** — FTC/GDPR/EU AI Act; don't retrofit later

### Don'ts ❌
1. **Don't use hallucination-prone models** — Avoid GPT-3.5, Llama 2 7B for medical claims
2. **Don't skip source attribution** — Athlete skepticism = low adoption
3. **Don't generate without retrieval** — RAG reduces hallucinations 80–90%
4. **Don't let AI suggestions auto-apply** — Coach review is essential
5. **Don't ignore recency** — Old nutrition advice becomes wrong; filter for recent PDFs
6. **Don't train on athlete data** — Privacy violation + unnecessary; use prompt injection instead
7. **Don't promise medical benefits** — Use cautious language ("may support", "associated with")

---

## VII. Next Steps for User

1. **Review the full brainstorm documents:**
   - [DIET_PLANNER_BRAINSTORM.md](DIET_PLANNER_BRAINSTORM.md) — 12,000+ words
   - [WORKOUT_PLANNER_BRAINSTORM.md](WORKOUT_PLANNER_BRAINSTORM.md) — detailed feature specs
   - RAG architecture embedded in this synthesis

2. **Decide:** Implement Diet first (simpler) or Workout (more impact)? Sequential or parallel?

3. **Allocate PDFs:** Which nutrition & training books to use as knowledge base? Prefer ISSN-backed, recent, diverse populations.

4. **Create API keys:** Set up free tier for Google Gemini API (5-min signup).

5. **Prototype:** Start POC with pdf-parse + Sentence-Transformers + Gemini API; test retrieval quality.

6. **Iterate:** Collect coach feedback on suggestion quality; adjust prompts, chunking, thresholds.

---

## Questions for Implementation Planning

1. **Diet vs. Workout priority?** Which to build first?
2. **PDF sources?** Which books/PDFs for knowledge base? How will coach manage versioning?
3. **AI assistance for coaches?** Should coaches be able to modify prompts/parameters?
4. **Multi-language?** Stay Italian or support English coach instructions too?
5. **Mobile support?** Should athlete see AI suggestions on mobile (Tracker app) or only dashboard?
6. **Offline mode?** Should cached suggestions work offline?
7. **Budget?** Willing to pay for faster inference or self-host after MVP scales?

---

**Generated by 3 parallel research agents | March 25, 2026**
