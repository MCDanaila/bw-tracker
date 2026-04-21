# bw-tracker FastAPI Backend

FastAPI backend service for bw-tracker, handling AI operations, transactional mutations, and coach authorization.

## Quick Start (Local Development)

### Prerequisites
- Python 3.11–3.13 (recommended; 3.14 works but triggers a Pydantic v1 compatibility warning from langchain-core)
- [uv](https://docs.astral.sh/uv/) (recommended) or pip

### Installation

**With uv (recommended):**

```bash
cd backend

# Create and activate a virtual environment
uv venv --python 3.13   # pin to 3.13 to avoid Pydantic v1 compat warning on 3.14
source .venv/bin/activate   # macOS/Linux
# .venv\Scripts\activate    # Windows

# Install all dependencies (including LangGraph, LangChain, Gemini)
uv pip install -e .
```

**With pip:**

```bash
cd backend
python3.13 -m venv .venv
source .venv/bin/activate   # macOS/Linux
# .venv\Scripts\activate    # Windows
pip install -e .
```

### Key Dependencies

| Package | Purpose |
|---------|---------|
| `fastapi` + `uvicorn[standard]` | HTTP server |
| `supabase` | DB + auth client |
| `langgraph>=1.0.0` | Graph RAG workflow orchestration |
| `langchain-google-genai` | Gemini LLM integration |
| `langchain-community` | Vector store + retriever utilities |
| `python-jose[cryptography]` | JWT verification |

### Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `SUPABASE_URL` — Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (from Supabase dashboard)
- `SUPABASE_JWT_SECRET` — JWT secret (from Supabase dashboard → Project Settings → API → JWT Secret)
- `GEMINI_API_KEY` — Google Gemini API key
- `FRONTEND_URL` — Frontend URL (for CORS, default: http://localhost:3000)

### Running Locally

Run from inside the `backend/` directory. Make sure the venv is active first:

```bash
cd backend
source .venv/bin/activate   # macOS/Linux — REQUIRED before running uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

If you skip activation, the system Python will be used (missing packages). Verify you're using the right uvicorn:

```bash
which uvicorn   # should show .../backend/.venv/bin/uvicorn
```

Alternatively, run without activating via the venv path directly:

```bash
.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

- **Health check:** `GET http://localhost:8000/health`
- **API docs:** `http://localhost:8000/docs` (Swagger UI)
- **ReDoc:** `http://localhost:8000/redoc`

## API Endpoints

All endpoints require authentication via Supabase JWT token in the `Authorization: Bearer <token>` header.

### Health
- `GET /health` — Health check (no auth required)

### Auth & Onboarding
- `POST /auth/check-email` — Check if email is already registered (no auth required)
- `POST /auth/complete-registration` — Save profile + preferences after sign-up (requires auth)

### Invitations
- `POST /invitations/send` — Send coaching invitation email (requires coach role)
- `GET /invitations/{token}` — Get invitation details by token (no auth required)
- `GET /invitations` — List all invitations for calling coach (requires coach role)
- `DELETE /invitations/{id}` — Cancel a pending invitation (requires coach role)
- `POST /invitations/accept` — Accept a coaching invitation (requires auth)

### AI Operations
- `POST /ai/generate-diet-suggestion` — Generate diet suggestion (requires coach role)
- `POST /ai/embed-document` — Embed knowledge document (requires coach role)

### Diet Management
- `POST /diet/assign-template` — Assign meal plan template (requires coach role)
- `POST /diet/apply-suggestion` — Apply AI suggestion as meal plans (requires coach role)

### Goals
- `POST /goals/set` — Set athlete goal (requires coach or self_coached role)

### Knowledge Base
- `POST /knowledge/create-document` — Create and embed knowledge document (requires coach role)

## Project Structure

```
app/
├── main.py                 # FastAPI app factory
├── config.py              # Configuration (Pydantic settings)
├── dependencies.py        # Auth middleware & JWT verification
├── routers/               # API endpoint routers
│   ├── health.py
│   ├── auth.py
│   ├── invitations.py
│   ├── ai.py
│   ├── diet.py
│   ├── goals.py
│   └── knowledge.py
├── services/              # Business logic layer
├── schemas/               # Pydantic request/response models
└── lib/
    ├── supabase_client.py # Supabase async client singleton
    └── domain/            # Pure domain logic (meal macros, food swap, etc.)
```

## Deployment to Vercel

### 1. Add Environment Variables to Vercel

In Vercel dashboard → Project Settings → Environment Variables, add:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
GEMINI_API_KEY=AIzaSy...
FRONTEND_URL=https://your-domain.vercel.app
```

### 2. Update Frontend URL

In your frontend `.env` or Vercel dashboard:

```
VITE_BACKEND_URL=https://your-project.vercel.app
```

### 3. Deploy

```bash
git push origin main
```

Vercel will automatically build and deploy both frontend and backend.

**Note:** The first request to the backend may take 10-15 seconds due to cold starts on Vercel serverless. Subsequent requests will be faster. For production with high traffic, consider using Railway or another always-warm solution.

## Development Notes

### JWT Verification

The backend verifies Supabase-issued JWT tokens using the public key from Supabase's JWKS endpoint. No round-trip to Supabase is needed for auth.

```python
# In dependencies.py
await _get_jwks_keys()  # Fetches and caches JWKS
```

### Database Access

Uses `supabase-py` async client with `SERVICE_ROLE_KEY`:

```python
from app.lib.supabase_client import get_supabase_client

db = await get_supabase_client()
result = await db.table("your_table").select("*").execute()
```

### Error Responses

All errors follow a consistent format:

```json
{
  "error": "error message",
  "status_code": 400
}
```

Rate limit responses include `retry_after`:

```json
{
  "error": "rate_limited",
  "retry_after": 60
}
```

## Testing

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# With coverage
pytest --cov=app
```

## Debugging

Enable debug logging:

```bash
DEBUG=true ENVIRONMENT=development uvicorn app.main:app --reload
```

## Production Checklist

- [ ] All environment variables set in Vercel
- [ ] `FRONTEND_URL` matches your actual frontend domain
- [ ] Rate limiting configured appropriately (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_SECONDS`)
- [ ] CORS origins updated for your domain
- [ ] Error logging monitored (integrate Sentry, LogRocket, etc.)
- [ ] Database backups configured in Supabase
