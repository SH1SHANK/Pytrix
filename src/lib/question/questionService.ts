/**
 * Question Service
 *
 * Two-layer question generation system:
 * 1. Local template fallback (fast, immediate) - uses questionTemplates.ts
 * 2. LLM generation (richer variants) - uses modelRouter
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
export interface GenerateQuestionOptions {
  /** Problem type ID from topics.json */
  problemTypeId: string;
  /** Difficulty level */
  difficulty: Difficulty;
  /** Use LLM for richer question generation (default: true) */
  preferLLM?: boolean;
  /** API key for LLM calls (required if preferLLM is true) */
  apiKey?: string;
  /** Additional context/constraints for LLM generation */
  additionalContext?: string;
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
  /** Error details if unsuccessful */
  error?: GenerationError;
  /** Model used if LLM was called */
  modelUsed?: string;
  /** Token usage if LLM was called */
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Typed error codes for question generation
 */
export enum GenerationErrorCode {
  PROBLEM_TYPE_NOT_FOUND = "PROBLEM_TYPE_NOT_FOUND",
  TEMPLATE_GENERATION_FAILED = "TEMPLATE_GENERATION_FAILED",
  LLM_CALL_FAILED = "LLM_CALL_FAILED",
  LLM_PARSE_FAILED = "LLM_PARSE_FAILED",
  VALIDATION_FAILED = "VALIDATION_FAILED",
  MAX_RETRIES_EXCEEDED = "MAX_RETRIES_EXCEEDED",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Structured error information
 */
export interface GenerationError {
  code: GenerationErrorCode;
  message: string;
  details?: unknown;
}

/**
 * Raw LLM response structure
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
// Validation & Normalization
// ============================================================================

/**
 * Validates and normalizes a Question object.
 * Ensures all required fields are present and properly formatted.
 *
 * @throws Error if validation fails
 */
function validateAndNormalizeQuestion(question: Question): Question {
  // Required fields validation
  if (!question.id || typeof question.id !== "string") {
    throw new Error("Question must have a valid id");
  }
  if (!question.title || typeof question.title !== "string") {
    throw new Error("Question must have a valid title");
  }
  if (
    !question.difficulty ||
    !["beginner", "intermediate", "advanced"].includes(question.difficulty)
  ) {
    throw new Error("Question must have a valid difficulty level");
  }
  if (!question.topicId || !question.topicName || !question.topic) {
    throw new Error("Question must have valid topic identifiers");
  }
  if (!question.description || typeof question.description !== "string") {
    throw new Error("Question must have a description");
  }

  // Normalize test cases - ensure at least 3 visible cases
  const visibleCases = question.testCases.filter((tc) => !tc.isHidden);
  if (visibleCases.length < 3) {
    console.warn(
      `[Validation] Question ${question.id} has fewer than 3 visible test cases, padding with sample data`
    );

    const paddedCases = [...question.testCases];
    for (let i = visibleCases.length; i < 3; i++) {
      paddedCases.push({
        id: `tc-padded-${i + 1}`,
        input: question.sampleInput || "[]",
        expectedOutput: question.sampleOutput || "expected",
        isHidden: false,
        description: `Sample case ${i + 1}`,
      });
    }
    question.testCases = paddedCases;
  }

  // Ensure test cases have IDs
  question.testCases = question.testCases.map((tc, idx) => ({
    ...tc,
    id: tc.id || `tc-${idx + 1}`,
    description: tc.description || `Test ${idx + 1}`,
  }));

  // Normalize arrays
  question.constraints = question.constraints || [];

  return question;
}

/**
 * Creates an error object with consistent structure
 */
function createError(
  code: GenerationErrorCode,
  message: string,
  details?: unknown
): GenerationError {
  return { code, message, details };
}

// ============================================================================
// Template-based Generation
// ============================================================================

/**
 * Generates description from template with edge cases and hints
 */
function buildDescription(template: QuestionTemplate): string {
  let description = template.promptTemplate;

  if (template.edgeCases.length > 0) {
    description += "\n\n**Edge Cases to Consider:**\n";
    template.edgeCases.forEach((ec: EdgeCase) => {
      description += `- ${ec.description}\n`;
    });
  }

  if (template.hints.length > 0) {
    description += "\n\n**Hints:**\n";
    template.hints.forEach((hint: string, i: number) => {
      description += `${i + 1}. ${hint}\n`;
    });
  }

  return description;
}

/**
 * Converts template test cases to Question test cases
 */
function buildTestCases(template: QuestionTemplate): TestCase[] {
  const visibleTestCases = template.testCases.filter(
    (tc: TestCaseTemplate) => !tc.isHidden
  );

  const testCases: TestCase[] = visibleTestCases.map(
    (tc: TestCaseTemplate, index: number) => ({
      id: `tc-${index + 1}`,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: tc.isHidden,
      description: tc.description || `Test ${index + 1}`,
    })
  );

  // Pad with sample-based tests if fewer than 3
  while (testCases.length < 3) {
    const idx = testCases.length;
    testCases.push({
      id: `tc-fallback-${idx + 1}`,
      input: template.sampleInputs[idx] || template.sampleInputs[0] || "[]",
      expectedOutput:
        template.sampleOutputs[idx] || template.sampleOutputs[0] || "expected",
      isHidden: false,
      description: `Sample case ${idx + 1}`,
    });
  }

  return testCases;
}

/**
 * Converts a QuestionTemplate to a validated Question object.
 * This is the fast, synchronous fallback path.
 */
function templateToQuestion(template: QuestionTemplate): Question {
  const difficultyMap: Record<TemplateDifficulty, Difficulty> = {
    beginner: "beginner",
    intermediate: "intermediate",
    advanced: "advanced",
  };

  const question: Question = {
    id: `tpl-${template.id}`,
    topicId: template.moduleId,
    topicName: template.moduleName,
    topic: template.subtopicName,
    difficulty: difficultyMap[template.difficulty],
    title: template.title,
    description: buildDescription(template),
    inputDescription: `Input will be provided in the following format:\n\n\`\`\`\n${template.sampleInputs
      .slice(0, 2)
      .join("\n")}\n\`\`\``,
    outputDescription: `Your function should return/print:\n\n\`\`\`\n${template.sampleOutputs
      .slice(0, 2)
      .join("\n")}\n\`\`\``,
    constraints: template.constraints,
    sampleInput: template.sampleInputs[0] || "",
    sampleOutput: template.sampleOutputs[0] || "",
    starterCode: template.starterCode,
    referenceSolution: null,
    testCases: buildTestCases(template),
  };

  return validateAndNormalizeQuestion(question);
}

// ============================================================================
// LLM-based Generation
// ============================================================================

/**
 * Builds the LLM prompt for question generation.
 * Centralized prompt construction for consistency.
 */
function buildLLMPrompt(
  template: QuestionTemplate,
  additionalContext?: string,
  diversityConstraints?: string
): string {
  const contextSection = additionalContext
    ? `\nAdditional requirements: ${additionalContext}`
    : "";

  const avoidSection = diversityConstraints
    ? `\n\n**Diversity Requirements:**\n${diversityConstraints}`
    : "";

  const corePrompt =
    template.compactPrompt ||
    `You are an expert Python programming tutor creating a practice question.

**Topic:** ${template.moduleName} > ${template.subtopicName}
**Problem Type:** ${template.problemTypeName}
**Difficulty:** ${template.difficulty}
**Time:** ${template.estimatedMinutes} minutes

**Template:**
${template.promptTemplate}

**Constraints:**
${template.constraints.map((c: string) => `- ${c}`).join("\n")}

**Edge cases:**
${template.edgeCases.map((ec: EdgeCase) => `- ${ec.description}`).join("\n")}`;

  return `${corePrompt}${avoidSection}${contextSection}

Return ONLY a raw JSON object (no markdown, no code blocks) with this exact schema:
{
  "title": "Descriptive problem title",
  "description": "Clear problem statement with examples. Use markdown.",
  "inputDescription": "Input format description",
  "outputDescription": "Expected output description",
  "constraints": ["Constraint 1", "Constraint 2"],
  "sampleInput": "Example input",
  "sampleOutput": "Expected output",
  "starterCode": "def solution(...):\\n    pass",
  "referenceSolution": "Complete working solution",
  "testCases": [
    {"input": "test1", "expectedOutput": "output1", "isHidden": false},
    {"input": "test2", "expectedOutput": "output2", "isHidden": true}
  ]
}

Requirements: Question must be unique, engaging, and solvable with correct test cases.`;
}

/**
 * Parses and validates LLM response
 */
function parseLLMResponse(text: string): LLMQuestionData {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    const data = JSON.parse(cleaned) as LLMQuestionData;

    // Basic validation
    if (!data.title || !data.description) {
      throw new Error("Missing required fields in LLM response");
    }

    return data;
  } catch (error) {
    throw createError(
      GenerationErrorCode.LLM_PARSE_FAILED,
      "Failed to parse LLM response as JSON",
      { rawText: text.substring(0, 200), error }
    );
  }
}

/**
 * Converts LLM data to a validated Question object
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

  const testCaseDescriptions = ["Basic case", "Edge case", "Complex case"];

  const testCases: TestCase[] = (data.testCases || []).map((tc, index) => ({
    id: `tc-llm-${index + 1}`,
    input: tc.input,
    expectedOutput: tc.expectedOutput,
    isHidden: tc.isHidden ?? false,
    description: testCaseDescriptions[index] || `Test ${index + 1}`,
  }));

  const question: Question = {
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

  return validateAndNormalizeQuestion(question);
}

/**
 * Attempts LLM generation with retry logic for diversity
 */
async function tryLLMGeneration(
  template: QuestionTemplate,
  options: GenerateQuestionOptions
): Promise<QuestionResult> {
  const {
    apiKey,
    additionalContext,
    includeReferenceSolution = true,
    skipDiversityCheck = false,
  } = options;

  if (!apiKey) {
    return {
      success: false,
      source: "llm",
      error: createError(
        GenerationErrorCode.LLM_CALL_FAILED,
        "API key required for LLM generation"
      ),
    };
  }

  // Build avoid list for diversity
  const avoidList = getAvoidList(template.moduleId, template.subtopicId);
  const diversityConstraints = formatAvoidListForPrompt(avoidList);

  const maxAttempts = skipDiversityCheck
    ? 1
    : DIVERSITY_CONFIG.MAX_REGENERATION_ATTEMPTS + 1;

  try {
    const { callGeminiWithFallback } = await import("@/lib/ai/modelRouter");

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const currentConstraints =
        attempt > 0
          ? `${diversityConstraints}\n**CRITICAL:** Use a completely different approach from previous attempt.`
          : diversityConstraints;

      const prompt = buildLLMPrompt(
        template,
        additionalContext,
        currentConstraints
      );

      const result = await callGeminiWithFallback<LLMQuestionData>(
        apiKey,
        "question-generation",
        prompt,
        parseLLMResponse,
        options.difficulty
      );

      if (!result.success || !result.data) {
        return {
          success: false,
          source: "llm",
          error: createError(
            GenerationErrorCode.LLM_CALL_FAILED,
            result.message || "LLM call failed"
          ),
        };
      }

      const question = llmDataToQuestion(
        result.data,
        template,
        includeReferenceSolution
      );
      const fingerprint = createFingerprint(question, options.problemTypeId);

      // Check diversity
      if (
        !skipDiversityCheck &&
        shouldRegenerateQuestion(fingerprint, attempt)
      ) {
        console.log(
          `[QuestionService] Diversity check failed, attempt ${
            attempt + 1
          }/${maxAttempts}`
        );
        continue;
      }

      // Success - record and return
      recordFingerprint(fingerprint);

      return {
        success: true,
        question,
        source: "llm",
        modelUsed: result.modelUsed,
        usage: result.usage,
      };
    }

    // Max attempts reached
    return {
      success: false,
      source: "llm",
      error: createError(
        GenerationErrorCode.MAX_RETRIES_EXCEEDED,
        `Failed to generate diverse question after ${maxAttempts} attempts`
      ),
    };
  } catch (error) {
    return {
      success: false,
      source: "llm",
      error: createError(
        GenerationErrorCode.UNKNOWN_ERROR,
        "Unexpected error during LLM generation",
        error
      ),
    };
  }
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Main question generation function with unified interface.
 *
 * Flow:
 * 1. Load base template (required)
 * 2. If preferLLM=true and apiKey provided: try LLM generation
 * 3. On LLM failure or disabled: fall back to template
 * 4. Validate and normalize result
 * 5. Record fingerprint for diversity tracking
 *
 * @param options - Generation configuration
 * @returns Promise<QuestionResult> with generated question or error
 */
export async function generateQuestion(
  options: GenerateQuestionOptions
): Promise<QuestionResult> {
  const {
    problemTypeId,
    difficulty,
    preferLLM = true,
    skipDiversityCheck = false,
  } = options;

  // Step 1: Get base template (always required)
  const templateDifficulty: TemplateDifficulty = difficulty;
  const template = generateTemplate(problemTypeId, templateDifficulty);

  if (!template) {
    return {
      success: false,
      source: "template",
      error: createError(
        GenerationErrorCode.PROBLEM_TYPE_NOT_FOUND,
        `No template found for problem type: ${problemTypeId}`
      ),
    };
  }

  // Step 2: Try LLM if preferred
  if (preferLLM && options.apiKey) {
    const llmResult = await tryLLMGeneration(template, options);

    if (llmResult.success) {
      return llmResult;
    }

    // LLM failed, log and continue to fallback
    console.warn(
      "[QuestionService] LLM generation failed, using template fallback:",
      llmResult.error?.message
    );
  }

  // Step 3: Template fallback
  try {
    const question = templateToQuestion(template);

    if (!skipDiversityCheck) {
      const fingerprint = createFingerprint(question, problemTypeId);
      recordFingerprint(fingerprint);
    }

    return {
      success: true,
      question,
      source: preferLLM ? "fallback" : "template",
    };
  } catch (error) {
    return {
      success: false,
      source: "template",
      error: createError(
        GenerationErrorCode.VALIDATION_FAILED,
        "Template question validation failed",
        error
      ),
    };
  }
}

/**
 * Legacy wrapper for backward compatibility.
 * Prefer generateQuestion() for new code.
 */
export async function getQuestion(
  problemTypeId: string,
  difficulty: Difficulty,
  options: Partial<GenerateQuestionOptions> = {}
): Promise<QuestionResult> {
  return generateQuestion({
    problemTypeId,
    difficulty,
    preferLLM: options.preferLLM ?? true,
    ...options,
  });
}

/**
 * Synchronous template-only generation.
 * Use for immediate, offline question generation.
 */
export function getTemplateQuestion(
  problemTypeId: string,
  difficulty: Difficulty
): Question | undefined {
  const template = generateTemplate(
    problemTypeId,
    difficulty as TemplateDifficulty
  );

  // Return undefined if template generation failed
  if (!template) {
    return undefined;
  }

  return templateToQuestion(template);
}

/**
 * Batch template generation for multiple problem types.
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
 * Checks if a problem type exists
 */
export function isProblemTypeAvailable(problemTypeId: string): boolean {
  return getProblemTypeWithContext(problemTypeId) !== undefined;
}

/**
 * Gets context for a problem type
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
