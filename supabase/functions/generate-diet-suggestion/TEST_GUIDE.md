# Test Guide for generate-diet-suggestion Function

## Setup

### 1. Install dependencies

```bash
npm install --save-dev vitest @vitest/ui
```

### 2. Create vitest config

Create `vitest.config.ts` in project root:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### 3. Update package.json scripts

Add to `scripts` section:

```json
{
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage",
  "test:generate-suggestion": "vitest supabase/functions/generate-diet-suggestion"
}
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run with UI
```bash
npm run test:ui
```

### Run with coverage report
```bash
npm run test:coverage
```

### Run only generate-diet-suggestion tests
```bash
npm run test:generate-suggestion
```

## Test Coverage

The test suite covers:

### 1. **CORS Handling**
   - Preflight OPTIONS requests
   - Proper CORS headers in responses

### 2. **Input Validation**
   - Required fields: `athlete_id`, `query_text`
   - Optional field: `coach_id`
   - Invalid/malformed requests

### 3. **Authorization**
   - Coach-athlete relationship validation
   - Active status check
   - Authorization skipped if no coach_id

### 4. **Rate Limiting**
   - Max 10 suggestions per coach per hour
   - Correct count calculation
   - 429 response when limit exceeded

### 5. **Athlete Preferences**
   - Preferences exist validation
   - At least one of: allergies, intolerances, dietary_restrictions
   - 422 error for missing/incomplete prefs

### 6. **Data Fetching**
   - Profile data
   - Current active goal
   - Last 7 days of logs
   - Food library (sample)
   - Knowledge chunks via RPC

### 7. **Gemini API Integration**
   - Text embedding generation
   - Rate limit handling (429)
   - JSON response parsing
   - Fallback to text-only response

### 8. **Database Operations**
   - Insert to ai_suggestions table
   - Proper response format
   - suggestion_id returned

### 9. **Error Handling**
   - Missing environment variables
   - Supabase connection errors
   - RLS violations
   - Database query errors
   - Proper error response format

### 10. **Response Format**
   - CORS headers
   - Correct HTTP status codes
   - JSON content type
   - Error response structure

### 11. **Integration Tests**
   - Full request → response flow
   - Concurrent request handling
   - Rate limit per-coach (not global)

## Mocking

Tests use vitest's `vi.fn()` to mock:
- Supabase client (`from()`, `rpc()`)
- Fetch requests (Gemini APIs)
- Database responses
- Error conditions

Example mock:

```typescript
const mockSupabaseClient = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { ... },
          error: null,
        }),
      }),
    }),
  }),
};
```

## Key Test Scenarios

### Success Case
```typescript
POST /functions/v1/generate-diet-suggestion
Body: {
  athlete_id: "78ccb3b9-f2a8-4fc0-8164-4f5541710594",
  query_text: "Create a 7-day cutting plan",
  coach_id: "f119519c-d96b-496f-89a2-4690406cd2ea"
}

Response: 200 OK
{
  suggestion_id: "uuid-123",
  suggestion_text: "...",
  suggestion_json: { ... }
}
```

### Missing Required Field
```typescript
POST /functions/v1/generate-diet-suggestion
Body: {
  query_text: "Create a plan"
  // Missing athlete_id
}

Response: 400 Bad Request
{
  error: "Missing athlete_id or query_text"
}
```

### Unauthorized Coach
```typescript
POST /functions/v1/generate-diet-suggestion
Body: {
  athlete_id: "athlete-123",
  query_text: "Create a plan",
  coach_id: "wrong-coach-id"
}

Response: 403 Forbidden
{
  error: "Unauthorized: not a coach of this athlete"
}
```

### Rate Limited
```typescript
// 10+ suggestions already created in last hour

POST /functions/v1/generate-diet-suggestion
Body: { ... }

Response: 429 Too Many Requests
{
  error: "rate_limited",
  retry_after: 60
}
```

### Missing Preferences
```typescript
POST /functions/v1/generate-diet-suggestion
Body: { ... }
// Athlete has no preferences set

Response: 422 Unprocessable Entity
{
  error: "missing_preferences",
  message: "Athlete preferences not set..."
}
```

## Debugging Tests

### Enable verbose logging
```bash
npm test -- --reporter=verbose
```

### Run single test
```bash
npm test -- --grep "should reject unauthorized coach"
```

### Debug in VS Code
Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test", "--"],
  "args": ["--inspect-brk"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Continuous Integration

Add to your CI/CD pipeline (GitHub Actions, etc.):

```yaml
- name: Run Tests
  run: npm test

- name: Generate Coverage
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

## Next Steps

1. **Install dependencies**: `npm install --save-dev vitest`
2. **Create vitest.config.ts**
3. **Run tests**: `npm test`
4. **Fix any failures** in the Edge Function based on test feedback
5. **Set up CI** to run tests on every push

## Notes

- Tests are unit tests, not integration tests (use mocks)
- For integration testing, use a staging environment
- Tests validate business logic, not Deno/Supabase internals
- Use actual Supabase client in integration tests
