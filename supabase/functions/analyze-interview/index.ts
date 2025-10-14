import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { answer, interviewType, question, customContext, jobDescription } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    let systemPrompt = "";
    
    // Special case: Generate custom question only
    if (answer === "GENERATE_QUESTION_ONLY" && interviewType === "Custom" && (customContext || jobDescription)) {
      const context = [customContext, jobDescription].filter(Boolean).join("\n\n");
      systemPrompt = `You are an expert interview coach. Based on this resume/job description, generate ONE highly relevant, insightful interview question.

Context:
${context}

Generate a single question that:
- Targets their specific experience or role
- Tests relevant skills
- Is open-ended and behavioral

Return ONLY the question, nothing else.`;
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Generate a custom interview question based on the provided context." },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("AI service temporarily unavailable");
      }

      const data = await response.json();
      const feedback = data.choices[0].message.content;

      return new Response(
        JSON.stringify({ feedback }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Regular feedback analysis
    if (interviewType === "Custom" && (customContext || jobDescription)) {
      const context = [customContext, jobDescription].filter(Boolean).join("\n\n");
      systemPrompt = `You're a concise interview coach. Provide structured feedback.

Context:
${context}

Question: ${question}

Format EXACTLY as:

**Score:** X/10

**Strengths:**
- Point 1
- Point 2

**Improve:**
- Action 1
- Action 2

**Example Answer:**
"[One concise paragraph]"

Max 120 words.`;
    } else {
      systemPrompt = `You're a concise interview coach. Provide structured feedback.

Question: ${question}

Format EXACTLY as:

**Score:** X/10

**Strengths:**
- Point 1
- Point 2

**Improve:**
- Action 1
- Action 2

**Example Answer:**
"[One concise paragraph]"

Max 120 words.`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: answer },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error("AI service temporarily unavailable");
    }

    const data = await response.json();
    const feedback = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ feedback }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-interview:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
