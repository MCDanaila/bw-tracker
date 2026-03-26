# Knowledge Base Seeding

This directory contains seed scripts to populate the knowledge base with foundational nutrition content.

## Files

- **nutrition-knowledge.md** — Comprehensive nutrition guide covering macronutrients, training nutrition, hydration, meal planning, and more
- **seed-nutrition-knowledge.ts** — TypeScript seed script that inserts the knowledge document and generates embeddings

## How to Run

### Prerequisites

1. **SQL schemas deployed:** Run both `09_athlete_preferences.sql` and `10_ai_rag.sql` in Supabase
2. **Environment variables set in Supabase:**
   - `GEMINI_API_KEY` — Your Google Gemini API key
   - `SERVICE_ROLE_KEY` — Supabase service role key
   - `SUPABASE_URL` — Your Supabase project URL

### Run the Seed Script

```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SERVICE_ROLE_KEY="your-service-role-key"
export GEMINI_API_KEY="your-gemini-api-key"

# Run the seed script
npx ts-node supabase/seeds/seed-nutrition-knowledge.ts
```

### Expected Output

```
🌱 Nutrition Knowledge Base Seeder
=====================================

Using system user: 00000000-0000-0000-0000-000000000000
Total documents to seed: 1

📚 Processing: Complete Nutrition Guide for Athletes
   Read 8234 characters from file
   ✅ Document created: abc-123-def
   🔄 Embedding and chunking content...
   ✅ Created 15 chunks with embeddings

=====================================
✅ Seeding complete!
   Successful: 1/1

💡 Next steps:
   1. Verify documents appear in the Knowledge Base panel
   2. Test AI Planner with athlete preferences set
   3. Coaches can now upload additional documents
```

## What Gets Inserted

The seed script:

1. **Creates a `knowledge_documents` row** with:
   - Title: "Complete Nutrition Guide for Athletes"
   - Description: Comprehensive guide covering macronutrients, training nutrition, hydration, micronutrients, meal planning, and performance nutrition timing
   - Source type: `text`
   - Status: `is_active = true`
   - Uploaded by: System user (UUID `00000000-0000-0000-0000-000000000000`)

2. **Calls the `embed-document` Edge Function** which:
   - Chunks the content on paragraph boundaries (~1500 chars per chunk)
   - Generates embeddings via Google Gemini API
   - Inserts `knowledge_chunks` rows with embeddings

3. **Result:** ~15 knowledge chunks with vector embeddings ready for RAG queries

## Verification

After running, verify the seed worked:

1. **In Supabase Dashboard:**
   - Navigate to `Tables > knowledge_documents`
   - You should see one row for "Complete Nutrition Guide for Athletes"
   - Navigate to `Tables > knowledge_chunks`
   - You should see ~15 rows with the document_id matching the document you created

2. **In the Dashboard UI:**
   - Go to AI Planner > "Manage Knowledge Base"
   - The "Complete Nutrition Guide for Athletes" should appear in the knowledge base list
   - Mark it as active if not already

3. **Test the RAG:**
   - Select an athlete with preferences set
   - Generate a diet suggestion with a query mentioning "training" or "macros"
   - In the suggestion viewer, check "Knowledge Sources" to see if chunks were retrieved

## Adding More Seed Documents

To add more foundational documents:

1. Create a `.md` or `.txt` file in this directory
2. Add it to the `seedDocuments` array in `seed-nutrition-knowledge.ts`:
   ```typescript
   {
     title: 'Your Document Title',
     description: 'Brief description of content',
     filePath: path.join(__dirname, 'your-file.md'),
     sourceType: 'text',
   }
   ```
3. Run the seed script again (safe to run multiple times; new documents won't duplicate)

## Troubleshooting

### "Missing required environment variables"
Ensure all three env vars are exported in your shell session before running the script.

### "Edge function embed-document not found"
The edge function hasn't been deployed. Run: `supabase functions deploy embed-document`

### "Unauthorized" errors
Verify the `SERVICE_ROLE_KEY` is correct and has admin privileges in your Supabase project.

### "RATE_LIMITED" from Gemini API
The Gemini API has rate limits. Wait a few minutes and try again. For MVP, this shouldn't be an issue with just one or two documents.
