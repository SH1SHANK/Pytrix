/**
 * Generate Question API Route
 *
 * POST /api/ai/generate-question
 *
 * Headers:
 *   X-API-Key: <user's Gemini API key>
 *
 * Body:
 *   { topic: string, difficulty: "easy" | "medium" | "hard" }
 *
 * Returns:
 *   { question: Question, usage: { model, inputTokens, outputTokens } }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  callGeminiWithFallback,
  parseJsonResponse,
  AIResult,
} from "@/lib/ai/modelRouter";
import { Question, Difficulty } from "@/lib/types";
import { MOCK_QUESTIONS } from "@/lib/question/mockQuestions";

import { generateTemplate } from "@/lib/question/questionTemplates";

interface GeneratedQuestionData {
  id?: string;
  topic: string;
  difficulty: string;
  title: string;
  description: string;
  inputDescription: string;
  outputDescription: string;
  constraints: string[];
  sampleInput: string;
  sampleOutput: string;
  starterCode?: string;
  referenceSolution?: string;
}

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
    const { topic, difficulty } = body as {
      topic: string;
      difficulty: Difficulty;
    };

    if (!topic || !difficulty) {
      return NextResponse.json(
        { error: "Missing topic or difficulty" },
        { status: 400 }
      );
    }

    // Try to get a specific template for this topic (archetype)
    const template = generateTemplate(topic, difficulty);

    let prompt = "";

    if (template) {
      // Use specific template to guide the LLM
      prompt = `
You are an expert Python programming tutor.
Generate a new, unique coding practice question based on the following template structure:

Task: Create a ${template.difficulty} practice problem for "${
        template.problemTypeName
      }".
Context: ${template.promptTemplate}
Constraints: ${template.constraints.join(", ")}
Sample Input: ${template.sampleInputs[0]}
Sample Output: ${template.sampleOutputs[0]}

The question should follow this structure but use specific values or a slightly different scenario to ensure variety.
Do NOT copy the template example exactly. Create a VARIATION of this problem type.

Return ONLY a raw JSON object with this exact schema (no markdown formatting):
{
  "id": "gen-${Date.now()}", 
  "topic": "${template.problemTypeName}",
  "difficulty": "${difficulty}",
  "title": "A short descriptive title (e.g. ${template.title})",
  "description": "Clear problem statement describing the task. Use markdown for code formatting.",
  "inputDescription": "Description of input format",
  "outputDescription": "Description of output format",
  "constraints": ["Constraint 1", "Constraint 2"],
  "sampleInput": "Example input",
  "sampleOutput": "Example output",
  "starterCode": "${template.starterCode
    .replace(/\n/g, "\\n")
    .replace(/"/g, '\\"')}",
  "referenceSolution": "Efficient Python solution code"
}

Ensure the question is solvable and the reference solution is correct.
`;
    } else {
      // Generic prompt (fallback)
      prompt = `
You are an expert Python programming tutor.
Generate a distinct, unique coding practice question for the topic "${topic}" at "${difficulty}" difficulty.

Return ONLY a raw JSON object with this exact schema (no markdown formatting):
{
  "id": "gen-${Date.now()}", 
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "title": "Short descriptive title",
  "description": "Clear problem statement. Use markdown for code formatting.",
  "inputDescription": "Description of input format",
  "outputDescription": "Description of output format",
  "constraints": ["Constraint 1", "Constraint 2"],
  "sampleInput": "Example input",
  "sampleOutput": "Example output",
  "starterCode": "def solve(input_data):\\n    pass",
  "referenceSolution": "Efficient Python solution code"
}

Ensure the question is solvable and the reference solution is correct.
`;
    }

    const result: AIResult<GeneratedQuestionData> =
      await callGeminiWithFallback(
        apiKey,
        "question-generation",
        prompt,
        parseJsonResponse<GeneratedQuestionData>
      );

    if (result.success && result.data) {
      const json = result.data;

      // Map AI response to our full Question interface
      const question: Question = {
        id:
          json.id ||
          `gen-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        // Use template IDs if available for consistency, otherwise fallback to API response
        topicId: template ? template.problemTypeId : json.topic.toLowerCase(),
        topicName: template ? template.problemTypeName : json.topic,
        topic: json.topic, // Keep original AI topic field
        difficulty: json.difficulty as Difficulty,
        title: json.title,
        description: json.description,
        inputDescription: json.inputDescription,
        outputDescription: json.outputDescription,
        constraints: json.constraints || [],
        sampleInput: json.sampleInput,
        sampleOutput: json.sampleOutput,
        starterCode:
          json.starterCode ||
          `def solve(input_data):\n    # Write your solution here\n    pass`,
        referenceSolution: json.referenceSolution || null,
        testCases: [],
      };

      return NextResponse.json({
        question,
        usage: {
          model: result.modelUsed,
          inputTokens: result.usage?.inputTokens || 0,
          outputTokens: result.usage?.outputTokens || 0,
        },
      });
    }

    // Handle specific error types
    if (
      result.errorType === "api_key_required" ||
      result.errorType === "config_error"
    ) {
      return NextResponse.json(
        { error: result.message, errorType: result.errorType },
        { status: 401 }
      );
    }

    // Fallback to mock question
    console.warn(
      "[generate-question] AI failed, using fallback:",
      result.message
    );
    const fallback =
      MOCK_QUESTIONS.find(
        (q) => q.topicName.toLowerCase() === topic.toLowerCase()
      ) || MOCK_QUESTIONS[0];

    return NextResponse.json({
      question: {
        ...fallback,
        topic: topic,
        id: `fallback-${Date.now()}`,
      } as Question,
      usage: null,
      fallback: true,
    });
  } catch (error) {
    console.error("[generate-question] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
