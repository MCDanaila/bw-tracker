import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

interface EmbedRequest {
  document_id: string;
  content: string;
}

interface EmbedResponse {
  chunks_created: number;
  error?: string;
}

// Initialize Supabase with service role
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

/**
 * Split content into chunks on paragraph boundaries,
 * merge short chunks, cap at ~1500 chars per chunk
 */
function chunkContent(content: string, maxChunkSize = 1500): string[] {
  // Split on double newlines (paragraphs)
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);

  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const candidate = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;

    if (candidate.length <= maxChunkSize) {
      currentChunk = candidate;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = paragraph;

      // If a single paragraph is > maxChunkSize, split it further on sentences
      if (currentChunk.length > maxChunkSize) {
        const sentences = currentChunk.match(/[^.!?]+[.!?]+/g) || [currentChunk];
        let sentenceChunk = "";

        for (const sentence of sentences) {
          const sentenceCandidate = sentenceChunk ? `${sentenceChunk} ${sentence}` : sentence;
          if (sentenceCandidate.length <= maxChunkSize) {
            sentenceChunk = sentenceCandidate;
          } else {
            if (sentenceChunk) chunks.push(sentenceChunk.trim());
            sentenceChunk = sentence;
          }
        }

        if (sentenceChunk) chunks.push(sentenceChunk.trim());
        currentChunk = "";
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk);

  return chunks.filter(c => c.trim().length > 0);
}

/**
 * Get embeddings from Google Gemini API
 */
async function embedText(text: string): Promise<number[]> {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: {
          parts: [
            {
              text,
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini embedding API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

/**
 * Main handler
 */
Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const body: EmbedRequest = await req.json();
    const { document_id, content } = body;

    if (!document_id || !content) {
      return new Response(
        JSON.stringify({ error: "Missing document_id or content" }),
        { status: 400 }
      );
    }

    // Chunk the content
    const chunks = chunkContent(content);

    if (chunks.length === 0) {
      return new Response(
        JSON.stringify({ error: "No chunks generated from content" }),
        { status: 400 }
      );
    }

    // Get embeddings for each chunk
    const chunkRows = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Embedding chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);

      const embedding = await embedText(chunk);
      const tokenCount = Math.ceil(chunk.length / 4); // Rough estimate

      chunkRows.push({
        document_id,
        chunk_index: i,
        content: chunk,
        embedding,
        token_count: tokenCount,
      });
    }

    // Insert chunks into knowledge_chunks table
    const { error: insertErr } = await supabase
      .from("knowledge_chunks")
      .insert(chunkRows);

    if (insertErr) {
      console.error("Insert error:", insertErr);
      throw insertErr;
    }

    // Update document char count
    const { error: updateErr } = await supabase
      .from("knowledge_documents")
      .update({ char_count: content.length })
      .eq("id", document_id);

    if (updateErr) {
      console.error("Update error:", updateErr);
      throw updateErr;
    }

    return new Response(
      JSON.stringify({
        chunks_created: chunks.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    const response: EmbedResponse = {
      chunks_created: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    };
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
