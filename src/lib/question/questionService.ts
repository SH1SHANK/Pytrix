/**
 * Question Service
 *
 * Two-layer question generation system:
 * 1. Local template fallback (fast, immediate) - uses questionTemplates.ts
 * 2. LLM generation wrapper (richer variants) - uses modelRouter
 *
 * The service provides a unified interface for question generation,
 * with graceful fallback to templates when LLM is unavailable.
 */

import type { Question, Difficulty, TestCase } from "@/lib/types";
import {
  generateTemplate,
  type QuestionTemplate,
  type EdgeCase,
  type TestCaseTemplate,
} from "@/lib/question/questionTemplates";
import {
  getProblemTypeWithContext,
  type Module,
  type Subtopic,
} from "@/lib/stores/topicsStore";
import type { Difficulty as TemplateDifficulty } from "@/types/question";
import { createFingerprint } from "@/lib/question/questionFingerprint";
import {
  getAvoidList,
  formatAvoidListForPrompt,
  recordFingerprint,
  shouldRegenerateQuestion,
  DIVERSITY_CONFIG,
} from "@/lib/question/diversityService";

// ============================================================================
// Types
// ============================================================================

/**
 * Options for question generation
 */
export interface GetQuestionOptions {
  /** Use LLM for richer question generation (default: true) */
  useLLM?: boolean;
  /** API key for LLM calls (required if useLLM is true) */
  apiKey?: string;
  /** Additional context/constraints for LLM generation */
  additionalContext?: string;
  /** Force specific variation (e.g., "variation-1", "variation-2") */
  variation?: string;
  /** Include reference solution (default: true) */
  includeReferenceSolution?: boolean;
  /** Skip diversity checks (for explicit repetition) */
  skipDiversityCheck?: boolean;
}

/**
 * Result from question generation
 */
export interface QuestionResult {
  /** Whether generation was successful */
  success: boolean;
  /** The generated question (if successful) */
  question?: Question;
  /** Generation method used */
  source: "template" | "llm" | "fallback";
  /** Error message if unsuccessful */
  error?: string;
  /** Model used if LLM was called */
  modelUsed?: string;
  /** Token usage if LLM was called */
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * LLM-enhanced question data
 */
interface LLMQuestionData {
  title: string;
  description: string;
  inputDescription: string;
  outputDescription: string;
  constraints: string[];
  sampleInput: string;
  sampleOutput: string;
  starterCode: string;
  referenceSolution?: string;
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
  }>;
}

// ============================================================================
// Template to Question Conversion
// ============================================================================

/**
 * Converts a QuestionTemplate to a Question object.
 * This is the fast, synchronous fallback path.
 */
function templateToQuestion(template: QuestionTemplate): Question {
  // Map template difficulty to Question difficulty
  const difficultyMap: Record<TemplateDifficulty, Difficulty> = {
    beginner: "beginner",
    intermediate: "intermediate",
    advanced: "advanced",
  };

  // Convert test case templates to test cases
  const testCases: TestCase[] = template.testCases
    .filter((tc: TestCaseTemplate) => !tc.isHidden) // Only include visible test cases
    .map((tc: TestCaseTemplate) => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: tc.isHidden,
    }));

  const question: Question = {
    id: `tpl-${template.id}`,
    topicId: template.moduleId,
    topicName: template.moduleName,
    topic: template.subtopicName,
    difficulty: difficultyMap[template.difficulty],
    title: template.title,
    description: generateDescription(template),
    inputDescription: generateInputDescription(template),
    outputDescription: generateOutputDescription(template),
    constraints: template.constraints,
    sampleInput: template.sampleInputs[0] || "",
    sampleOutput: template.sampleOutputs[0] || "",
    starterCode: template.starterCode,
    referenceSolution: null, // Templates don't include solutions by default
    testCases,
  };

  return question;
}

/**
 * Generates a rich description from template
 */
function generateDescription(template: QuestionTemplate): string {
  let description = template.promptTemplate;

  // Add edge cases section
  if (template.edgeCases.length > 0) {
    description += "\n\n**Edge Cases to Consider:**\n";
    template.edgeCases.forEach((ec: EdgeCase) => {
      description += `- ${ec.description}\n`;
    });
  }

  // Add hints section (collapsed by default in UI)
  if (template.hints.length > 0) {
    description += "\n\n**Hints:**\n";
    template.hints.forEach((hint: string, i: number) => {
      description += `${i + 1}. ${hint}\n`;
    });
  }

  return description;
}

/**
 * Generates input description
 */
function generateInputDescription(template: QuestionTemplate): string {
  const samples = template.sampleInputs.slice(0, 2).join("\n");
  return `Input will be provided in the following format:\n\n\`\`\`\n${samples}\n\`\`\``;
}

/**
 * Generates output description
 */
function generateOutputDescription(template: QuestionTemplate): string {
  const samples = template.sampleOutputs.slice(0, 2).join("\n");
  return `Your function should return/print:\n\n\`\`\`\n${samples}\n\`\`\``;
}

// ============================================================================
// LLM Enhancement Functions
// ============================================================================

/**
 * Builds the LLM prompt for enhancing a template
 */
function buildLLMPrompt(
  template: QuestionTemplate,
  options: GetQuestionOptions,
  diversityConstraints?: string
): string {
  const additionalContext = options.additionalContext
    ? `\nAdditional requirements: ${options.additionalContext}`
    : "";

  // Add diversity constraints if provided
  const avoidSection = diversityConstraints
    ? `\nAvoid: ${diversityConstraints}`
    : "";

  // Use compact prompt if available (it should be for all new templates)
  const corePrompt =
    template.compactPrompt ||
    `You are an expert Python programming tutor creating a practice question.

Based on this template, generate a unique and engaging coding question:

**Topic Area:** ${template.moduleName} > ${template.subtopicName}
**Problem Type:** ${template.problemTypeName}
**Difficulty:** ${template.difficulty}
**Estimated Time:** ${template.estimatedMinutes} minutes

**Template Prompt:**
${template.promptTemplate}

**Constraints to include:**
${template.constraints.map((c: string) => `- ${c}`).join("\n")}

**Edge cases to cover:**
${template.edgeCases.map((ec: EdgeCase) => `- ${ec.description}`).join("\n")}`;

  return `${corePrompt}${avoidSection}
${additionalContext}

Return ONLY a raw JSON object (no markdown) with this exact schema:
{
  "title": "Descriptive problem title",
  "description": "Clear problem statement with examples. Use markdown for formatting.",
  "inputDescription": "Description of input format",
  "outputDescription": "Description of expected output",
  "constraints": ["Constraint 1", "Constraint 2"],
  "sampleInput": "Example input",
  "sampleOutput": "Expected output for the sample input",
  "starterCode": "def solution(...):\\n    # Your code here\\n    pass",
  "referenceSolution": "A correct Python solution",
  "testCases": [
    {"input": "test input 1", "expectedOutput": "output 1", "isHidden": false},
    {"input": "test input 2", "expectedOutput": "output 2", "isHidden": true}
  ]
}

Make the question unique, engaging, and solvable. Why? To maintain quality. Ensure test cases are correct.`;
}

/**
 * Parses LLM response into question data
 */
function parseLLMResponse(text: string): LLMQuestionData {
  // Clean up markdown code blocks if present
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  return JSON.parse(cleaned) as LLMQuestionData;
}

/**
 * Converts LLM-enhanced data to a Question object
 */
function llmDataToQuestion(
  data: LLMQuestionData,
  template: QuestionTemplate,
  includeReferenceSolution: boolean
): Question {
  const difficultyMap: Record<TemplateDifficulty, Difficulty> = {
    beginner: "beginner",
    intermediate: "intermediate",
    advanced: "advanced",
  };

  const testCases: TestCase[] = (data.testCases || []).map((tc) => ({
    input: tc.input,
    expectedOutput: tc.expectedOutput,
    isHidden: tc.isHidden,
  }));

  return {
    id: `llm-${template.problemTypeId}-${Date.now().toString(36)}`,
    topicId: template.moduleId,
    topicName: template.moduleName,
    topic: template.subtopicName,
    difficulty: difficultyMap[template.difficulty],
    title: data.title,
    description: data.description,
    inputDescription: data.inputDescription,
    outputDescription: data.outputDescription,
    constraints: data.constraints || template.constraints,
    sampleInput: data.sampleInput,
    sampleOutput: data.sampleOutput,
    starterCode: data.starterCode || template.starterCode,
    referenceSolution: includeReferenceSolution
      ? data.referenceSolution || null
      : null,
    testCases,
  };
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Gets a question for a given problem type and difficulty.
 *
 * This is the main entry point for question generation.
 * It implements a two-layer system:
 * 1. If LLM is enabled and available, uses LLM for richer questions
 * 2. Falls back to template-based generation if LLM fails or is disabled
 *
 * @param problemTypeId - The problem type ID from topics.json
 * @param difficulty - The difficulty level
 * @param options - Optional configuration
 * @returns QuestionResult with the generated question
 */
export async function getQuestion(
  problemTypeId: string,
  difficulty: Difficulty,
  options: GetQuestionOptions = {}
): Promise<QuestionResult> {
  const {
    useLLM = true,
    apiKey,
    includeReferenceSolution = true,
    skipDiversityCheck = false,
  } = options;

  // Map Difficulty to TemplateDifficulty
  const templateDifficulty: TemplateDifficulty = difficulty;

  // Step 1: Generate base template (always done first)
  const template = generateTemplate(problemTypeId, templateDifficulty);

  if (!template) {
    return {
      success: false,
      source: "fallback",
      error: `Problem type not found: ${problemTypeId}`,
    };
  }

  // Step 2: If LLM is disabled or no API key, return template-based question
  if (!useLLM || !apiKey) {
    const question = templateToQuestion(template);

    // Record fingerprint for template-based questions too
    if (!skipDiversityCheck) {
      const fingerprint = createFingerprint(question, problemTypeId);
      recordFingerprint(fingerprint);
    }

    return {
      success: true,
      question,
      source: "template",
    };
  }

  // Step 3: Pre-generation - build avoid list for diversity
  const avoidList = getAvoidList(template.moduleId, template.subtopicId);
  const diversityConstraints = formatAvoidListForPrompt(avoidList);

  // Step 4: Try LLM enhancement with regeneration support
  let attemptNumber = 0;
  const maxAttempts = skipDiversityCheck
    ? 1
    : DIVERSITY_CONFIG.MAX_REGENERATION_ATTEMPTS + 1;

  try {
    // Dynamic import to avoid bundling server-only code
    const { callGeminiWithFallback } = await import("@/lib/ai/modelRouter");

    while (attemptNumber < maxAttempts) {
      // Add stricter diversity constraints on retries
      const currentConstraints =
        attemptNumber > 0
          ? `${diversityConstraints} (MUST be different approach from previous)`
          : diversityConstraints;

      const prompt = buildLLMPrompt(template, options, currentConstraints);

      const result = await callGeminiWithFallback<LLMQuestionData>(
        apiKey,
        "question-generation",
        prompt,
        parseLLMResponse,
        difficulty
      );

      if (result.success && result.data) {
        const question = llmDataToQuestion(
          result.data,
          template,
          includeReferenceSolution
        );

        // Step 5: Post-generation - check diversity
        const fingerprint = createFingerprint(question, problemTypeId);

        if (
          !skipDiversityCheck &&
          shouldRegenerateQuestion(fingerprint, attemptNumber)
        ) {
          console.log(
            `[QuestionService] Question too similar, attempt ${
              attemptNumber + 1
            }/${maxAttempts}`
          );
          attemptNumber++;
          continue;
        }

        // Record successful fingerprint
        recordFingerprint(fingerprint);

        return {
          success: true,
          question,
          source: "llm",
          modelUsed: result.modelUsed,
          usage: result.usage,
        };
      }

      // LLM failed, fall back to template
      console.warn(
        "[QuestionService] LLM failed, using template fallback:",
        result.message
      );
      const question = templateToQuestion(template);

      if (!skipDiversityCheck) {
        const fingerprint = createFingerprint(question, problemTypeId);
        recordFingerprint(fingerprint);
      }

      return {
        success: true,
        question,
        source: "fallback",
        error: result.message,
      };
    }

    // Exhausted regeneration attempts - return last generated question anyway
    console.warn(
      "[QuestionService] Max regeneration attempts reached, using last question"
    );
    const question = templateToQuestion(template);

    if (!skipDiversityCheck) {
      const fingerprint = createFingerprint(question, problemTypeId);
      recordFingerprint(fingerprint);
    }

    return {
      success: true,
      question,
      source: "fallback",
      error: "Max diversity regeneration attempts exceeded",
    };
  } catch (error) {
    // Unexpected error, fall back to template
    console.error("[QuestionService] Unexpected error:", error);
    const question = templateToQuestion(template);

    if (!skipDiversityCheck) {
      const fingerprint = createFingerprint(question, problemTypeId);
      recordFingerprint(fingerprint);
    }

    return {
      success: true,
      question,
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Gets a template-based question synchronously (no LLM).
 * Use this for immediate, offline question generation.
 *
 * @param problemTypeId - The problem type ID from topics.json
 * @param difficulty - The difficulty level
 * @returns Question or undefined if problem type not found
 */
export function getTemplateQuestion(
  problemTypeId: string,
  difficulty: Difficulty
): Question | undefined {
  const templateDifficulty: TemplateDifficulty = difficulty;
  const template = generateTemplate(problemTypeId, templateDifficulty);

  if (!template) {
    return undefined;
  }

  return templateToQuestion(template);
}

/**
 * Gets questions for multiple problem types (batch generation).
 * Uses templates for all questions (no LLM) for performance.
 *
 * @param problemTypeIds - Array of problem type IDs
 * @param difficulty - The difficulty level (same for all)
 * @returns Array of questions (filters out failed generations)
 */
export function getBatchTemplateQuestions(
  problemTypeIds: string[],
  difficulty: Difficulty
): Question[] {
  return problemTypeIds
    .map((id) => getTemplateQuestion(id, difficulty))
    .filter((q): q is Question => q !== undefined);
}

/**
 * Checks if a problem type exists and can be used for generation.
 *
 * @param problemTypeId - The problem type ID to check
 * @returns true if the problem type exists
 */
export function isProblemTypeAvailable(problemTypeId: string): boolean {
  const context = getProblemTypeWithContext(problemTypeId);
  return context !== undefined;
}

/**
 * Gets the context (module, subtopic) for a problem type.
 *
 * @param problemTypeId - The problem type ID
 * @returns Context object or undefined
 */
export function getProblemTypeContext(
  problemTypeId: string
): { module: Module; subtopic: Subtopic } | undefined {
  const context = getProblemTypeWithContext(problemTypeId);
  if (!context) return undefined;

  return {
    module: context.module,
    subtopic: context.subtopic,
  };
}
