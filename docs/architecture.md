# System Architecture

## High-Level Overview

```
Browser (PWA)
│
├── React SPA (Vite)          ← frontend, served from Vercel CDN
│   ├── Supabase JS client    ← direct DB reads + auth
│   └── Fetch → FastAPI       ← AI operations, coach mutations
│
├── FastAPI (Python)          ← backend, deployed as Vercel serverless
│   ├── JWT verification      ← validates Supabase-issued tokens via JWKS
│   ├── Gemini API            ← AI generation (diet suggestions, embeddings)
│   └── Supabase service role ← privileged DB writes bypassing RLS
│
└── Supabase (Postgres)
    ├── Auth                  ← session management, JWT issuance
    ├── RLS policies          ← row-level security on all 5 tables
    └── pgvector              ← AI knowledge base embeddings
```

## Frontend Stack

| Concern | Library |
|---------|---------|
| Framework | React 19 + Vite 7 + TypeScript 5.9 |
| Styling | Tailwind CSS v4 + shadcn/ui + Base UI |
| Server state | TanStack Query (caching, refetch) |
| Offline queue | Dexie 4 (IndexedDB) |
| Routing | react-router-dom (shell-level only) |
| Forms | React Hook Form |
| Charts | Recharts |
| Drag & drop | @dnd-kit |
| Toasts | sonner |
| PWA | vite-plugin-pwa + Workbox |

## Backend Stack

| Concern | Technology |
|---------|-----------|
| Runtime | Python 3.11+ |
| Framework | FastAPI + uvicorn |
| DB client | supabase-py (async) |
| AI | Google Gemini API (free tier) |
| Validation | Pydantic v2 |
| Deployment | Vercel serverless (Python runtime) |

## Database (Supabase/Postgres)

5 tables, RLS enabled on all:

| Table | Purpose |
|-------|---------|
| `profiles` | User metadata: height, weight, role (`athlete`/`coach`) |
| `daily_logs` | Wide flat row per `(user_id, date)` — one log per day |
| `meal_plans` | 7 rows per user (one per day of week), weekly meal structure |
| `meal_adherence` | Which meals were actually eaten each day |
| `foods` | Food library; TEXT primary key (food name), macro info per 100g |
| `coach_athletes` | Maps coach → athlete relationships with status |

Key constraints:
- `daily_logs` has `UNIQUE(user_id, date)` — enables safe upsert retries
- `foods.id` is the food name string — simplifies food swap matching
- No migration runner; schema changes applied manually via Supabase dashboard

See `supabase/schema.sql` and `supabase/profiles.sql` for full DDL.

## Auth Flow

1. User signs in via Supabase Auth → receives a JWT
2. Frontend stores session; Supabase JS client attaches JWT to all DB requests
3. RLS policies on Postgres evaluate `auth.uid()` and `auth.jwt()` per row
4. For FastAPI requests: frontend sends `Authorization: Bearer <jwt>` header
5. FastAPI verifies the JWT via Supabase's JWKS endpoint (cached, no round-trip per request)
6. Role is read from `profiles.role` or JWT `app_metadata`

See `docs/features/auth-roles.md` for detail on the role/permission model.

## Data Flow Patterns

### Read path (all reads)
```
Component → TanStack Query hook → Supabase JS client → Postgres (RLS enforced)
```

### Write path (online)
```
Form submit → Dexie syncQueue (optimistic) → useSync() → Supabase upsert
```

### Write path (offline)
```
Form submit → Dexie syncQueue → [stays queued] → SyncHeader shows pending count
                                                 → user taps Sync → useSync() drains queue
```

### AI generation path
```
Coach triggers suggestion → FastAPI /ai/generate-diet-suggestion
  → Gemini API (with RAG context from pgvector)
  → response returned to coach for review
  → coach approves → FastAPI /diet/apply-suggestion → Supabase meal_plans upsert
```

## Deployment

Both frontend and backend deploy to Vercel from the same repo:

- Frontend: Vite build → Vercel static CDN
- Backend: `backend/` directory → Vercel Python serverless functions

**Cold start warning:** First request to FastAPI after inactivity takes 10–15s on Vercel free tier. For production with regular traffic, consider Railway.

Environment variables required in Vercel dashboard:
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- `GEMINI_API_KEY`
- `FRONTEND_URL` (for CORS)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_BACKEND_URL` (frontend)
