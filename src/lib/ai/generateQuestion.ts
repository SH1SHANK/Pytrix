"use server";

/**
 * Generate Question - Server Action (DEPRECATED)
 *
 * NOTE: This module is kept for backwards compatibility.
 * New code should use the client-side aiClient.ts which calls
 * the API route /api/ai/generate-question.
 *
 * For direct server-side usage, pass an apiKey parameter.
 */

import {
  callGeminiWithFallback,
  parseJsonResponse,
  AIResult,
} from "./modelRouter";
import { Question, Difficulty } from "@/lib/types";
import { MOCK_QUESTIONS } from "../mockQuestions";

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

export async function generateQuestion(
  apiKey: string,
  topic: string,
  difficulty: Difficulty
): Promise<Question> {
  const prompt = `
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

  const result: AIResult<GeneratedQuestionData> = await callGeminiWithFallback(
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
      topicId: json.topic.toLowerCase(),
      topicName: json.topic,
      topic: json.topic,
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

    return question;
  }

  // Fallback to mock question
  console.warn(
    "[generateQuestion] AI failed, using fallback. Error:",
    result.message
  );
  const fallback =
    MOCK_QUESTIONS.find(
      (q) => q.topicName.toLowerCase() === topic.toLowerCase()
    ) || MOCK_QUESTIONS[0];

  return {
    ...fallback,
    topic: topic,
    id: `fallback-${Date.now()}`,
  } as Question;
}
