# Deployment Review: Vercel Configuration & Frontend-Backend Integration

## Vercel Configuration Overview

**File:** `/Users/mihaid/Coding-Projects/bw-tracker/vercel.json`

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install && cd backend && pip install -e . && cd ..",
  "outputDirectory": "dist",
  "env": { ... },
  "functions": { "backend/**/*.py": { "runtime": "python3.11", ... } },
  "rewrites": [{ "source": "/api/(.*)", "destination": "/backend/api/$1" }]
}
```

## Build and Deployment Flow

1. **Install:** `npm install` (frontend deps) + `pip install -e .` (backend via pyproject.toml)
2. **Build:** `tsc -b && vite build` → outputs to `dist/`
3. **Functions:** All `backend/**/*.py` files are deployed as Python 3.11 serverless functions (1024 MB, 60s timeout)
4. **Rewrites:** `/api/*` → `/backend/api/*` — routes all `/api/` requests to the Python functions

## Environment Variables Checklist

### Declared in vercel.json (must be set as Vercel project secrets)

| Variable | Secret Reference | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `@supabase_url` | Supabase project URL (frontend) |
| `VITE_SUPABASE_ANON_KEY` | `@supabase_anon_key` | Supabase anon key (frontend) |
| `VITE_BACKEND_URL` | `@backend_url` | Backend base URL (frontend API calls) |

### Required by backend (config.py) — NOT in vercel.json

| Variable | Required | Notes |
|---|---|---|
| `SUPABASE_URL` | YES (required) | Backend Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | YES (required) | Backend service role key |
| `GEMINI_API_KEY` | YES (required) | Gemini AI API key |
| `SUPABASE_JWT_SECRET` | optional | Fallback JWT verification |
| `FRONTEND_URL` | optional | CORS allowed origin (defaults to localhost:3000) |
| `ENVIRONMENT` | optional | `development` / `production` |
| `DEBUG` | optional | Debug mode flag |
| `RATE_LIMIT_MAX` | optional | Request rate limit ceiling |
| `RATE_LIMIT_WINDOW_SECONDS` | optional | Rate limit window |

## Frontend-Backend Integration

**API Client:** `/Users/mihaid/Coding-Projects/bw-tracker/src/core/lib/apiClient.ts`

- Reads `VITE_BACKEND_URL` at build time via `import.meta.env.VITE_BACKEND_URL`
- Attaches Supabase JWT Bearer token to all requests
- Supports `apiPost`, `apiPatch`, `apiGet` methods
- **Currently no frontend code imports apiClient** — the file exists but no hooks use it yet (all routers are stubs with TODOs)

**Backend Routers (all stubs):**

| Router | Prefix | Status |
|---|---|---|
| health | `/health` | Implemented |
| ai | `/ai` | Stub — TODOs only |
| diet | `/diet` | Stub — TODOs only |
| goals | `/goals` | Stub — TODOs only |
| knowledge | `/knowledge` | Stub — TODOs only |

## Key Findings

### Working Correctly

- **Rewrite rule is correct:** `/api/(.*)` → `/backend/api/$1` matches Vercel serverless function path convention
- **Build command is valid:** `npm run build` runs `tsc -b && vite build`
- **Python runtime is set:** `python3.11` matches `requires-python = ">=3.11"` in pyproject.toml
- **Install command is correct:** Uses `pip install -e .` which reads `pyproject.toml` and installs all dependencies
- **JWT auth is implemented:** `dependencies.py` validates Supabase JWTs via JWKS endpoint
- **CORS is configured:** `main.py` uses `settings.frontend_url` for production origin

### Potential Issues

1. **CRITICAL — Missing backend env vars in vercel.json:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `GEMINI_API_KEY` are required by `config.py` at startup but are NOT declared in `vercel.json`. The backend will crash on cold start if these are not set manually as Vercel project environment variables (not secrets referenced in `vercel.json`).

2. **CRITICAL — `FRONTEND_URL` not set for production:** `main.py` CORS uses `settings.frontend_url` which defaults to `http://localhost:3000`. In production this must be set to the actual Vercel deployment URL (e.g. `https://bw-tracker.vercel.app`) or all cross-origin requests from the browser will be blocked.

3. **ISSUE — Rewrite destination path mismatch:** The rewrite maps `/api/(.*)` → `/backend/api/$1`. The backend routers mount at `/health`, `/ai`, `/diet`, `/goals`, `/knowledge` — none under `/api/`. Frontend calls to `/api/health` would route to `/backend/api/health`, which does NOT match the backend's `/health` route. The backend needs an `/api` prefix on all routers, or the rewrite destination should be `/backend/$1`.

4. **ISSUE — `VITE_BACKEND_URL` value in .env.local:** Currently set to `https://bw-tracker.vercel.app` (no `/api` path). Frontend `apiClient.ts` appends paths directly (e.g. `${BACKEND_URL}/health`). If the rewrite prefix is `/api`, then `VITE_BACKEND_URL` should be `https://bw-tracker.vercel.app/api`, or the rewrite should not add the `/api` segment.

5. **MINOR — `gemini-generative-ai` not in requirements.txt:** `GEMINI_API_KEY` is in config but no Google Generative AI SDK (`google-generativeai`) is in `requirements.txt` or `pyproject.toml`. When AI routes are implemented, this dependency will need to be added.

6. **MINOR — `backend/.env` is checked in:** The `backend/.env` file contains real credentials (Supabase service role key, Gemini API key). It should be added to `.gitignore`.

## Missing Configuration

- Vercel project secrets needed (must be set in Vercel dashboard or via `vercel env add`):
  - `supabase_url` → Supabase project URL
  - `supabase_anon_key` → Supabase anon key
  - `backend_url` → Production URL (e.g. `https://bw-tracker.vercel.app/api`)
  - `SUPABASE_URL` → Same value as `supabase_url`, for backend
  - `SUPABASE_SERVICE_ROLE_KEY` → Supabase service role key, for backend
  - `GEMINI_API_KEY` → Gemini API key, for backend
  - `FRONTEND_URL` → `https://bw-tracker.vercel.app`, for backend CORS

## Recommendations

1. **Fix the rewrite/URL mismatch (critical):** Either:
   - Change `vercel.json` rewrite destination to `"/backend/$1"` and set `VITE_BACKEND_URL=https://bw-tracker.vercel.app`, OR
   - Keep the rewrite as-is and add an `/api` prefix to all backend routers and set `VITE_BACKEND_URL=https://bw-tracker.vercel.app/api`

2. **Add all backend env vars to Vercel:** Go to Vercel dashboard → Project Settings → Environment Variables and add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, and `FRONTEND_URL`.

3. **Add `backend/.env` to `.gitignore`** to prevent credential leakage.

4. **Add `google-generativeai` to `requirements.txt`** and `pyproject.toml` before implementing AI routes.

5. **Set `FRONTEND_URL` to production URL** in Vercel environment variables so CORS allows browser requests from the deployed frontend.
