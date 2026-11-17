import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { AnalysisSchema, type AnalyzeRequest } from "@/lib/schema";
import { SYSTEM_PROMPT, buildUserText } from "@/lib/prompt";
import { randomDemoResult } from "@/lib/demo";

export const maxDuration = 60;

let client: Anthropic | null = null;

function fail(status: number, error: string) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  let body: AnalyzeRequest;
  try {
    body = await request.json();
  } catch {
    return fail(400, "Invalid request body.");
  }
  if (!body?.image || typeof body.image !== "string") {
    return fail(400, "No photo received.");
  }
  if (body.image.length > 8_000_000) {
    return fail(413, "Photo is too large. Try again with a smaller image.");
  }

  // Demo mode: no key configured (or DEMO_MODE=1) → return a sample result so the flow can be tried.
  if (process.env.DEMO_MODE === "1" || !process.env.ANTHROPIC_API_KEY) {
    await new Promise((r) => setTimeout(r, 1500));
    return Response.json({ ...randomDemoResult(), demo: true });
  }

  try {
    client ??= new Anthropic();
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(AnalysisSchema) },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: body.image } },
            { type: "text", text: buildUserText(body) },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return fail(422, "Sorry, this photo couldn't be analyzed. Try a different photo.");
    }
    if (response.stop_reason === "max_tokens" || !response.parsed_output) {
      return fail(502, "The analysis came back incomplete. Please try again.");
    }
    return Response.json(response.parsed_output);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return fail(500, "Server is missing a valid ANTHROPIC_API_KEY.");
    }
    if (err instanceof Anthropic.RateLimitError) {
      return fail(429, "Too many scans right now. Wait a moment and try again.");
    }
    if (err instanceof Anthropic.BadRequestError) {
      console.error("Claude bad request:", err.message);
      return fail(400, "The photo couldn't be processed. Try another photo.");
    }
    if (err instanceof Anthropic.APIConnectionError) {
      return fail(503, "Couldn't reach the AI service. Check your connection.");
    }
    if (err instanceof Anthropic.APIError) {
      console.error("Claude API error:", err.status, err.message);
      return fail(502, "The AI service had a problem. Please try again.");
    }
    console.error(err);
    if (err instanceof Error && err.message.includes("authentication method")) {
      return fail(500, "No API key set. Add ANTHROPIC_API_KEY to .env.local and restart the server.");
    }
    return fail(500, "Something went wrong.");
  }
}
