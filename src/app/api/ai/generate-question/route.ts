/**
 * Generate Question API Route
 *
 * POST /api/ai/generate-question
 *
 * Headers:
 *   X-API-Key: <user's Gemini API key>
 *
 * Body:
 *   { topic: string, difficulty: "beginner" | "intermediate" | "advanced" }
 *
 * Returns:
 *   { question: Question, usage: { model, inputTokens, outputTokens } }
 */

import { NextRequest, NextResponse } from "next/server";
import { generateQuestion } from "@/lib/question/questionService";
import { Difficulty } from "@/lib/types";
import {
  getProblemTypeWithContext,
  searchModules,
  listModuleProblemTypes,
  searchSubtopics,
  listProblemTypes,
  getProblemTypeById,
  getSubtopicById,
} from "@/lib/stores/topicsStore";

export async function POST(request: NextRequest) {
  try {
    // Extract API key from header
    const apiKey = request.headers.get("X-API-Key");
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key required", errorType: "api_key_required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    let { topic } = body as { topic: string };
    const { difficulty } = body as { difficulty: Difficulty };

    if (!topic || !difficulty) {
      return NextResponse.json(
        { error: "Missing topic or difficulty" },
        { status: 400 }
      );
    }

    console.log(
      `[generate-question] Received: topic="${topic}", difficulty="${difficulty}"`
    );

    // ---------------------------------------------------------
    // Resolve "topic" string to a valid Problem Type ID
    // ---------------------------------------------------------
    let validatedProblemTypeId: string | undefined;

    // 1. Direct match (ID)
    if (getProblemTypeWithContext(topic)) {
      validatedProblemTypeId = topic;
    }
    // 2. Case-insensitive match on ID
    else if (getProblemTypeById(topic.toLowerCase())) {
      validatedProblemTypeId = topic.toLowerCase();
    }
    // 3. Check if it matches a Module Name/ID -> Pick random problem type
    else {
      const moduleMatch = searchModules(topic).find(
        (m) => m.name.toLowerCase() === topic.toLowerCase() || m.id === topic
      );

      if (moduleMatch) {
        const types = listModuleProblemTypes(moduleMatch.id);
        if (types.length > 0) {
          validatedProblemTypeId =
            types[Math.floor(Math.random() * types.length)].id;
        }
      }
      // 4. Check if it's a direct Subtopic ID -> Pick random problem type
      else {
        const directSubtopic = getSubtopicById(topic);
        if (directSubtopic) {
          const types = listProblemTypes(topic);
          if (types.length > 0) {
            validatedProblemTypeId =
              types[Math.floor(Math.random() * types.length)].id;
          }
        }
        // 5. Fallback: Search subtopics by name
        else {
          const subtopicMatch = searchSubtopics(topic).find(
            (r) =>
              r.subtopic.name.toLowerCase() === topic.toLowerCase() ||
              r.subtopic.id === topic
          );

          if (subtopicMatch) {
            const types = listProblemTypes(subtopicMatch.subtopic.id);
            if (types.length > 0) {
              validatedProblemTypeId =
                types[Math.floor(Math.random() * types.length)].id;
            }
          }
        }
      }
    }

    // If we resolved it, use the resolved ID. Otherwise keep original (will likely fail, but let service handle it)
    if (validatedProblemTypeId) {
      console.log(
        `[generate-question] Resolved topic "${topic}" to problemTypeId "${validatedProblemTypeId}"`
      );
      topic = validatedProblemTypeId;
    } else {
      console.warn(
        `[generate-question] Could not resolve topic "${topic}" to a known ID. Generation may fail.`
      );
    }

    // Use the unified question service
    // This handles: template loading, LLM generation, validation, padding test cases, and diversity
    const result = await generateQuestion({
      problemTypeId: topic,

      difficulty: difficulty,
      preferLLM: true,
      apiKey: apiKey,
      // On server-side, diversity check won't persist across requests but is safe to run
      skipDiversityCheck: false,
    });

    if (result.success && result.question) {
      return NextResponse.json({
        question: result.question,
        usage: result.usage
          ? {
              model: result.modelUsed,
              inputTokens: result.usage.inputTokens,
              outputTokens: result.usage.outputTokens,
            }
          : null,
      });
    }

    // Handle known errors
    if (result.error) {
      console.warn(
        `[generate-question] Generation failed: ${result.error.message}`,
        result.error
      );

      // Map error codes to HTTP status
      if (result.error.code === "PROBLEM_TYPE_NOT_FOUND") {
        return NextResponse.json(
          { error: `Topic not found: ${topic}`, errorType: "invalid_topic" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: result.error.message, errorType: "generation_failed" },
        { status: 500 }
      );
    }

    // Fallback error
    return NextResponse.json(
      { error: "Failed to generate question" },
      { status: 500 }
    );
  } catch (error) {
    console.error("[generate-question] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
