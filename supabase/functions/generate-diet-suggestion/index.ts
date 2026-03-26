import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

console.log("=== Environment Check ===");
console.log("SUPABASE_URL set:", SUPABASE_URL);
console.log("SERVICE_ROLE_KEY set:", SERVICE_ROLE_KEY);
console.log("GEMINI_API_KEY set:", GEMINI_API_KEY);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
  console.error("Missing required environment variables");
}

interface GenerateSuggestionRequest {
  athlete_id: string;
  query_text: string;
  coach_id?: string; // For validation
}

interface DietSuggestion {
  summary: string;
  weekly_plan: Array<{
    day: string;
    meals: Array<{
      meal_name: string;
      foods: Array<{
        name: string;
        quantity_g: number;
      }>;
      estimated_macros: {
        kcal: number;
        protein: number;
        carbs: number;
        fats: number;
      };
    }>;
    day_total: {
      kcal: number;
      protein: number;
      carbs: number;
      fats: number;
    };
  }>;
  coaching_notes: string;
}

interface GenerateResponse {
  suggestion_id?: string;
  suggestion_text?: string;
  suggestion_json?: DietSuggestion;
  error?: string;
  details?: string;
  retry_after?: number;
}

const supabase = SUPABASE_URL && SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  : null;

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
    throw new Error(`Embedding API error: ${response.status}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

/**
 * Generate diet suggestion using Gemini
 */
async function generateSuggestionWithGemini(prompt: string): Promise<{ text: string; json?: DietSuggestion }> {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE",
          },
        ],
      }),
    }
  );

  if (response.status === 429) {
    throw new Error("RATE_LIMITED");
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";

  // Try to parse JSON from response
  let json: DietSuggestion | undefined;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      json = JSON.parse(jsonMatch[0]);
    }
  } catch {
    // If JSON parsing fails, json remains undefined
    console.log("Could not parse JSON from response, using text only");
  }

  return { text, json };
}

/**
 * Helper to add CORS headers to responses
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  "Content-Type": "application/json",
};

const jsonResponse = (data: unknown, status: number) => {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
};

/**
 * Main handler
 */
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    const requestHeaders = req.headers.get("access-control-request-headers") || "";
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": requestHeaders || "Content-Type, Authorization, x-client-info, apikey",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  try {
    if (!supabase) {
      console.error("Supabase client not initialized - missing environment variables");
      return jsonResponse(
        { error: "Server configuration error: Missing Supabase credentials" },
        500
      );
    }

    if (!GEMINI_API_KEY) {
      console.error("Gemini API key not set");
      return jsonResponse(
        { error: "Server configuration error: Missing Gemini API key" },
        500
      );
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body: GenerateSuggestionRequest = await req.json();
    const { athlete_id, query_text, coach_id } = body;

    if (!athlete_id || !query_text) {
      return jsonResponse(
        { error: "Missing athlete_id or query_text" },
        400
      );
    }

    // Validate caller is a coach of this athlete (via coach_athletes table)
    if (coach_id) {
      console.log("Checking coach authorization...", { coach_id, athlete_id });
      const { data: coachAthleteLink, error: coachCheckErr } = await supabase
        .from("coach_athletes")
        .select("*")
        .eq("coach_id", coach_id)
        .eq("athlete_id", athlete_id)
        .eq("status", "active")
        .single();

      if (coachCheckErr) {
        console.error("Coach check error:", coachCheckErr);
      }
      if (!coachAthleteLink) {
        console.log("No coach-athlete link found");
      }

      if (coachCheckErr || !coachAthleteLink) {
        return jsonResponse(
          { error: "Unauthorized: not a coach of this athlete", details: coachCheckErr?.message },
          403
        );
      }
      console.log("Coach authorization successful");
    }

    // Check rate limit: max 10 suggestions per coach per hour
    console.log("Checking rate limit...");
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    try {
      const { count: suggestionCountLastHour } = await supabase
        .from("ai_suggestions")
        .select("id", { count: "exact", head: true })
        .eq("generated_by", coach_id || "")
        .gte("created_at", oneHourAgo);

      if ((suggestionCountLastHour || 0) >= 10) {
        return jsonResponse(
          {
            error: "rate_limited",
            retry_after: 60,
          },
          429
        );
      }
      console.log("Rate limit check passed");
    } catch (rateErr) {
      console.error("Rate limit check error:", rateErr);
      throw rateErr;
    }

    // Fetch athlete preferences (required)
    console.log("Fetching athlete preferences...");
    let prefs;
    try {
      const result = await supabase
        .from("athlete_preferences")
        .select("*")
        .eq("athlete_id", athlete_id)
        .single();

      prefs = result.data;
      if (result.error) {
        console.error("Athlete preferences error:", result.error);
        return jsonResponse(
          {
            error: "missing_preferences",
            message: "Athlete preferences not set. Required: allergies, intolerances, dietary_restrictions",
            details: result.error?.message,
          },
          422
        );
      }
    } catch (prefsErr) {
      console.error("Preferences fetch exception:", prefsErr);
      throw prefsErr;
    }

    if (!prefs) {
      return jsonResponse(
        {
          error: "missing_preferences",
          message: "Athlete preferences not found",
        },
        422
      );
    }
    console.log("Athlete preferences fetched successfully");

    // Check if required fields are set
    if (
      (!prefs.allergies || prefs.allergies.length === 0) &&
      (!prefs.intolerances || prefs.intolerances.length === 0) &&
      (!prefs.dietary_restrictions || prefs.dietary_restrictions.length === 0)
    ) {
      return jsonResponse(
        {
          error: "missing_preferences",
          message: "At least one of: allergies, intolerances, or dietary_restrictions must be set",
        },
        422
      );
    }

    // Fetch athlete profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", athlete_id)
      .single();

    // Fetch current goal
    const { data: goal } = await supabase
      .from("athlete_goals")
      .select("*")
      .eq("athlete_id", athlete_id)
      .is("effective_until", null)
      .single();

    // Fetch last 7 daily logs
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000).toISOString().split("T")[0];
    const { data: logs } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", athlete_id)
      .gte("date", sevenDaysAgo)
      .order("date", { ascending: false });

    // Fetch current meal plans
    const { data: mealPlans } = await supabase
      .from("meal_plans")
      .select("*, foods(*)")
      .eq("user_id", athlete_id);

    // Embed query text
    const queryEmbedding = await embedText(query_text);

    // Get relevant knowledge chunks
    const { data: chunks } = await supabase.rpc("match_knowledge_chunks", {
      query_embedding: queryEmbedding,
      match_count: 5,
      p_coach_id: coach_id,
    });

    // Build context snapshot
    const contextSnapshot = {
      athlete: {
        id: athlete_id,
        username: profile?.username,
        age: profile?.age,
        height: profile?.height,
        weight: logs?.[0]?.weight_fasting || profile?.initial_weight,
        activityLevel: profile?.activity_level,
        goal: profile?.goal,
      },
      currentGoal: goal
        ? {
          phase: goal.phase,
          target_weight: goal.target_weight,
          target_calories: goal.target_calories,
          target_protein: goal.target_protein,
          target_carbs: goal.target_carbs,
          target_fats: goal.target_fats,
        }
        : null,
      preferences: {
        allergies: prefs.allergies,
        intolerances: prefs.intolerances,
        dietary_restrictions: prefs.dietary_restrictions,
        food_dislikes: prefs.food_dislikes,
        food_preferences: prefs.food_preferences,
        cuisine_preferences: prefs.cuisine_preferences,
        cooking_skill: prefs.cooking_skill,
        meal_prep_time: prefs.meal_prep_time,
        budget_level: prefs.budget_level,
      },
      biofeedback: logs?.[0]
        ? {
          avg_hunger_level: logs.reduce((sum: number, l: { hunger_level: number | null }) => sum + (l.hunger_level || 0), 0) / logs.length,
          avg_digestion_rating: logs.reduce((sum: number, l: { digestion_rating: number | null }) => sum + (l.digestion_rating || 0), 0) / logs.length,
          avg_diet_adherence: logs.filter((l: { diet_adherence: string | null }) => l.diet_adherence === "perfect").length / logs.length,
        }
        : null,
    };

    // Get top 30 foods for context
    const { data: foods } = await supabase
      .from("foods")
      .select("id, name, calories, protein, carbs, fats")
      .limit(30);

    // Build prompt
    const knowledgeContext = chunks && chunks.length > 0
      ? `\nKNOWLEDGE BASE (Retrieved relevant excerpts):\n${chunks
        .map(
          (c: { content: string; similarity: number }, i: number) =>
            `[Excerpt ${i + 1}, similarity: ${(c.similarity * 100).toFixed(0)}%]\n${c.content}`
        )
        .join("\n\n")}`
      : "";

    const foodSample = foods
      ? `\nSample of available foods in database:\n${foods
        .slice(0, 30)
        .map((f: { name: string; calories: number }) => `- ${f.name} (${f.calories} kcal/portion)`)
        .join("\n")}`
      : "";

    const prompt = `You are a professional sports nutritionist AI assistant specializing in personalized diet planning based on athlete preferences, goals, and evidence-based nutritional science.

ATHLETE CONTEXT:
${JSON.stringify(contextSnapshot, null, 2)}

COACH'S REQUEST:
"${query_text}"

${knowledgeContext}

${foodSample}

Based on the athlete's profile, current phase (${goal?.phase || "not set"}), preferences, and the provided knowledge base, generate a comprehensive diet suggestion.

Respond ONLY with valid JSON matching this exact structure:
{
  "summary": "Brief overview of the suggested approach (2-3 sentences)",
  "weekly_plan": [
    {
      "day": "Monday",
      "meals": [
        {
          "meal_name": "Breakfast",
          "foods": [
            {
              "name": "food item name",
              "quantity_g": 150
            }
          ],
          "estimated_macros": {
            "kcal": 400,
            "protein": 30,
            "carbs": 50,
            "fats": 10
          }
        }
      ],
      "day_total": {
        "kcal": 2500,
        "protein": 200,
        "carbs": 250,
        "fats": 83
      }
    }
  ],
  "coaching_notes": "Specific advice and rationale for this plan based on athlete's goals and preferences"
}

Requirements:
1. Respect ALL allergies, intolerances, and dietary restrictions
2. Use foods from the available database when possible
3. Ensure macros align with current phase and goals
4. Provide 7 days (Mon-Sun) of meal plans
5. Include 3-4 meals per day minimum
6. Make meals realistic and respecting cooking skill level`;

    console.log("Calling Gemini with prompt...");

    const { text: generatedText, json: generatedJson } = await generateSuggestionWithGemini(prompt);

    // Insert suggestion into ai_suggestions table
    const { data: suggestion, error: insertErr } = await supabase
      .from("ai_suggestions")
      .insert({
        athlete_id,
        generated_by: coach_id,
        query_text,
        context_snapshot: contextSnapshot,
        retrieved_chunk_ids: chunks?.map((c: { id: string }) => c.id) || [],
        suggestion_text: generatedText,
        suggestion_json: generatedJson,
        status: "pending",
      })
      .select()
      .single();

    if (insertErr) {
      throw insertErr;
    }

    return jsonResponse(
      {
        suggestion_id: suggestion.id,
        suggestion_text: generatedText,
        suggestion_json: generatedJson,
      },
      200
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;

    console.error("=== EDGE FUNCTION ERROR ===");
    console.error("Message:", errorMsg);
    console.error("Stack:", errorStack);
    console.error("Type:", typeof err);
    console.error("Full error:", err);

    if (err instanceof Error && err.message === "RATE_LIMITED") {
      return jsonResponse(
        {
          error: "rate_limited",
          retry_after: 60,
        },
        429
      );
    }

    const response: GenerateResponse = {
      error: errorMsg,
      details: errorStack,
    };
    console.error("Returning error response:", response);
    return jsonResponse(response, 500);
  }
});
