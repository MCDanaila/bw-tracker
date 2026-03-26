/**
 * Seed script to add foundational nutrition knowledge to the database
 *
 * Usage: npx ts-node supabase/seeds/seed-nutrition-knowledge.ts
 *
 * Reads from .env.local or .env files automatically
 *
 * Prerequisites:
 * - SUPABASE_URL, SERVICE_ROLE_KEY, GEMINI_API_KEY in your .env file
 * - Run 09_athlete_preferences.sql and 10_ai_rag.sql first
 */

import dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local or .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
  console.error('Missing required environment variables:');
  console.error('- SUPABASE_URL');
  console.error('- SERVICE_ROLE_KEY');
  console.error('- GEMINI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

interface SeedDocument {
  title: string;
  description: string;
  filePath: string;
  sourceType: 'text' | 'pdf';
}

const seedDocuments: SeedDocument[] = [
  {
    title: 'Complete Nutrition Guide for Athletes',
    description: 'Comprehensive guide covering macronutrients, training nutrition, hydration, micronutrients, meal planning, and performance nutrition timing for athletes of all levels.',
    filePath: path.join(__dirname, 'nutrition-knowledge.md'),
    sourceType: 'text',
  },
];

async function embedAndInsertDocument(
  document: SeedDocument,
  uploadedBy: string
) {
  try {
    console.log(`\n📚 Processing: ${document.title}`);

    // Read file content
    const content = fs.readFileSync(document.filePath, 'utf-8');
    console.log(`   Read ${content.length} characters from file`);

    // Insert document record
    const { data: docData, error: docError } = await supabase
      .from('knowledge_documents')
      .insert({
        uploaded_by: uploadedBy,
        title: document.title,
        description: document.description,
        source_type: document.sourceType,
        storage_path: document.filePath,
        is_active: true,
      })
      .select()
      .single();

    if (docError) {
      console.error(`   ❌ Failed to insert document: ${docError.message}`);
      return false;
    }

    const documentId = docData.id;
    console.log(`   ✅ Document created: ${documentId}`);

    // Call edge function to embed and chunk
    console.log(`   🔄 Embedding and chunking content...`);

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/embed-document`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          document_id: documentId,
          content,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   ❌ Embedding failed: ${response.status} ${errorText}`);

      // Clean up document if embedding failed
      await supabase
        .from('knowledge_documents')
        .delete()
        .eq('id', documentId);

      return false;
    }

    const result = await response.json();
    console.log(`   ✅ Created ${result.chunks_created} chunks with embeddings`);
    return true;
  } catch (err) {
    console.error(`   ❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function main() {
  console.log('🌱 Nutrition Knowledge Base Seeder');
  console.log('=====================================\n');

  // Fetch the first coach user from profiles table
  const { data: coachUsers, error: fetchError } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('role', 'coach')
    .limit(1);

  if (fetchError || !coachUsers || coachUsers.length === 0) {
    console.error('❌ No coach users found in profiles table.');
    console.error('   Please create a coach account first, then run this script again.');
    process.exit(1);
  }

  const coachId = coachUsers[0].id;
  const coachUsername = coachUsers[0].username;

  console.log(`Using coach: ${coachUsername} (${coachId})`);
  console.log(`Total documents to seed: ${seedDocuments.length}\n`);

  let successCount = 0;
  let failureCount = 0;

  for (const doc of seedDocuments) {
    const success = await embedAndInsertDocument(doc, coachId);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }

  console.log('\n=====================================');
  console.log(`✅ Seeding complete!`);
  console.log(`   Successful: ${successCount}/${seedDocuments.length}`);
  if (failureCount > 0) {
    console.log(`   Failed: ${failureCount}/${seedDocuments.length}`);
  }
  console.log('\n💡 Next steps:');
  console.log('   1. Verify documents appear in the Knowledge Base panel');
  console.log('   2. Test AI Planner with athlete preferences set');
  console.log('   3. Coaches can now upload additional documents');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
