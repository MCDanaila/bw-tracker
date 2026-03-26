# bw-tracker FastAPI Backend

FastAPI backend service for bw-tracker, handling AI operations, transactional mutations, and coach authorization.

## Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- pip or uv

### Installation

```bash
cd backend

# Install in development mode
pip install -e .

# Or with uv
uv pip install -e .
```

### Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `SUPABASE_URL` — Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (from Supabase dashboard)
- `GEMINI_API_KEY` — Google Gemini API key
- `FRONTEND_URL` — Frontend URL (for CORS, default: http://localhost:3000)

### Running Locally

```bash
# Start the development server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or directly
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

- **Health check:** `GET http://localhost:8000/health`
- **API docs:** `http://localhost:8000/docs` (Swagger UI)
- **ReDoc:** `http://localhost:8000/redoc`

## API Endpoints

All endpoints require authentication via Supabase JWT token in the `Authorization: Bearer <token>` header.

### Health
- `GET /health` — Health check (no auth required)

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
