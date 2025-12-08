/**
 * AI Client - Client-Side API Wrapper
 *
 * This module provides client-side functions to call AI API routes.
 * It automatically:
 * - Loads the API key from storage
 * - Passes the key via X-API-Key header
 * - Records usage to localStorage after successful calls
 * - Enforces client-side safety limits
 *
 * ## SECURITY NOTES
 * - API key is loaded from central store only
 * - Key is never logged or exposed in error messages
 * - All responses are normalized to structured error types
 */

import { getApiKeyForProvider, isApiKeyConfigured } from "./apiKeyStore";
import { recordApiUsage, recordRateLimitHit } from "./usageStore";
import {
  recordApiUsageEntry,
  ApiFeature,
  ApiCallStatus,
} from "./apiUsageEntryStore";
import { checkAndRecordCall, SafetyCheckResult } from "./apiSafetyController";
import { Question, Difficulty } from "./types";
import { Hint } from "./types/Hint";

// ============================================
// NORMALIZED ERROR TYPES
// ============================================

export type ApiErrorType =
  | "NO_API_KEY"
  | "INVALID_KEY"
  | "RATE_LIMIT"
  | "QUOTA_EXCEEDED"
  | "NETWORK_ERROR"
  | "CLIENT_LIMIT_REACHED"
  | "UNKNOWN_ERROR";

export class ApiKeyNotConfiguredError extends Error {
  public readonly errorType: ApiErrorType = "NO_API_KEY";

  constructor() {
    super(
      "LLM features require your own API key. Configure it in Settings → API & Keys."
    );
    this.name = "ApiKeyNotConfiguredError";
  }
}

export class ClientLimitError extends Error {
  public readonly errorType: ApiErrorType = "CLIENT_LIMIT_REACHED";
  public readonly safetyResult: SafetyCheckResult;

  constructor(result: SafetyCheckResult) {
    super(
      result.message ||
        "Pytrix paused extra API calls to protect your key. You've hit your personal safety limit for this session."
    );
    this.name = "ClientLimitError";
    this.safetyResult = result;
  }
}

export class ApiError extends Error {
  public readonly errorType: ApiErrorType;

  constructor(
    message: string,
    errorType: ApiErrorType = "UNKNOWN_ERROR",
    public status?: number
  ) {
    super(message);
    this.name = "ApiError";
    this.errorType = errorType;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getApiKey(): string {
  if (!isApiKeyConfigured()) {
    throw new ApiKeyNotConfiguredError();
  }
  const key = getApiKeyForProvider("gemini");
  if (!key) {
    throw new ApiKeyNotConfiguredError();
  }
  return key;
}

interface UsageData {
  model: string;
  inputTokens: number;
  outputTokens: number;
}

interface RecordOptions {
  feature: ApiFeature;
  topic?: string;
  difficulty?: string; // Accept any difficulty string
  questionId?: string;
  status?: ApiCallStatus;
}

function recordUsageIfPresent(
  usage: UsageData | null | undefined,
  options: RecordOptions
): void {
  if (usage && usage.model) {
    // Record to legacy store
    recordApiUsage(usage.model, usage.inputTokens, usage.outputTokens);

    // Record to new detailed store
    recordApiUsageEntry(
      usage.model,
      options.feature,
      usage.inputTokens,
      usage.outputTokens,
      options.status || "success",
      {
        topic: options.topic,
        difficulty: options.difficulty,
        questionId: options.questionId,
      }
    );
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    // Determine error type from status
    let errorType: ApiErrorType = "UNKNOWN_ERROR";

    if (response.status === 401 || response.status === 403) {
      errorType = "INVALID_KEY";
    } else if (response.status === 429) {
      errorType = "RATE_LIMIT";
      if (data.model) {
        recordRateLimitHit(data.model);
      }
    } else if (response.status >= 500) {
      errorType = "NETWORK_ERROR";
    }

    // Never include raw response details in error message
    const message = getErrorMessage(errorType);
    throw new ApiError(message, errorType, response.status);
  }

  return response.json();
}

/**
 * Get user-friendly error message for each error type.
 */
function getErrorMessage(errorType: ApiErrorType): string {
  switch (errorType) {
    case "NO_API_KEY":
      return "API key required. Add your Gemini API key in Settings.";
    case "INVALID_KEY":
      return "Invalid API key. Please check your key in Settings.";
    case "RATE_LIMIT":
      return "Rate limit reached. Please wait a moment and try again.";
    case "QUOTA_EXCEEDED":
      return "API quota exceeded. Check your usage in Google AI Studio.";
    case "NETWORK_ERROR":
      return "Network error. Check your connection and try again.";
    case "CLIENT_LIMIT_REACHED":
      return "Session limit reached. Refresh the page to reset.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

// ============================================
// AI API FUNCTIONS
// ============================================

/**
 * Generate a new question for a topic and difficulty.
 */
export async function generateQuestion(
  topic: string,
  difficulty: Difficulty
): Promise<Question> {
  // Check safety limits first
  const safetyCheck = checkAndRecordCall("question");
  if (!safetyCheck.allowed) {
    throw new ClientLimitError(safetyCheck);
  }

  const apiKey = getApiKey();

  const response = await fetch("/api/ai/generate-question", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({ topic, difficulty }),
  });

  const data = await handleResponse<{
    question: Question;
    usage: UsageData | null;
    fallback?: boolean;
  }>(response);

  recordUsageIfPresent(data.usage, {
    feature: "manual-question",
    topic,
    difficulty,
  });
  return data.question;
}

/**
 * Get a hint for the current question.
 */
export async function getHints(
  question: Question,
  code: string,
  hintsCount: number
): Promise<Hint> {
  // Check safety limits first
  const safetyCheck = checkAndRecordCall("hint");
  if (!safetyCheck.allowed) {
    throw new ClientLimitError(safetyCheck);
  }

  const apiKey = getApiKey();

  const response = await fetch("/api/ai/get-hints", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({ question, code, hintsCount }),
  });

  const data = await handleResponse<{
    hint: Hint;
    usage: UsageData | null;
    fallback?: boolean;
  }>(response);

  recordUsageIfPresent(data.usage, {
    feature: "hint",
    topic: question.topic,
    difficulty: question.difficulty,
  });
  return data.hint;
}

/**
 * Reveal the reference solution for a question.
 */
export async function revealSolution(
  question: Question,
  failedAttempts: number
): Promise<{ referenceSolution: string }> {
  // Check safety limits first
  const safetyCheck = checkAndRecordCall("optimal-solution");
  if (!safetyCheck.allowed) {
    throw new ClientLimitError(safetyCheck);
  }

  const apiKey = getApiKey();

  const response = await fetch("/api/ai/reveal-solution", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({ question, failedAttempts }),
  });

  const data = await handleResponse<{
    referenceSolution: string;
    usage: UsageData | null;
    cached?: boolean;
  }>(response);

  recordUsageIfPresent(data.usage, {
    feature: "optimal-solution",
    topic: question.topic,
    difficulty: question.difficulty,
  });
  return { referenceSolution: data.referenceSolution };
}

interface ExecutionContext {
  stdout?: string;
  stderr?: string;
  didExecute?: boolean;
}

interface EvaluationResult {
  status: "correct" | "incorrect" | "error";
  explanation: string;
  expectedBehavior?: string;
  nextHint?: string | null;
}

/**
 * Evaluate user's code against the question.
 */
export async function evaluateCode(
  question: Question,
  code: string,
  executionContext?: ExecutionContext
): Promise<EvaluationResult> {
  // Check safety limits first
  const safetyCheck = checkAndRecordCall("evaluation");
  if (!safetyCheck.allowed) {
    throw new ClientLimitError(safetyCheck);
  }

  const apiKey = getApiKey();

  const response = await fetch("/api/ai/evaluate-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({
      question,
      code,
      output: executionContext?.stdout,
      error: executionContext?.stderr,
    }),
  });

  const data = await handleResponse<{
    evaluation: {
      isCorrect: boolean;
      feedback: string;
      suggestions?: string[];
      score?: number;
    };
    usage: UsageData | null;
    fallback?: boolean;
  }>(response);

  recordUsageIfPresent(data.usage, {
    feature: "code-evaluation",
    topic: question.topic,
    difficulty: question.difficulty,
  });

  // Map API response to EvaluationResult format expected by practice page
  return {
    status: data.evaluation.isCorrect ? "correct" : "incorrect",
    explanation: data.evaluation.feedback,
    expectedBehavior: "",
    nextHint: data.evaluation.suggestions?.[0] || null,
  };
}

/**
 * Test if the configured API key is valid.
 */
export async function testApiConnection(): Promise<{
  valid: boolean;
  error?: string;
}> {
  const apiKey = getApiKey();

  const response = await fetch("/api/ai/test-connection", {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
    },
  });

  return handleResponse<{ valid: boolean; error?: string }>(response);
}

interface OptimizedSolution {
  code: string;
  explanation: string;
  keyImprovements: string[];
}

/**
 * Get an optimized/idiomatic solution for a correct answer.
 * Note: This function currently makes a direct call to the optimize route.
 * If no API key is configured, it returns null gracefully.
 */
export async function optimizeSolution(
  question: Question,
  userCode: string
): Promise<OptimizedSolution | null> {
  try {
    const apiKey = getApiKey();

    const response = await fetch("/api/ai/optimize-solution", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ question, userCode }),
    });

    const data = await handleResponse<{
      optimized: OptimizedSolution | null;
      usage: UsageData | null;
    }>(response);

    recordUsageIfPresent(data.usage, {
      feature: "optimal-solution",
      topic: question.topic,
      difficulty: question.difficulty,
    });
    return data.optimized;
  } catch (error) {
    // Gracefully handle no API key - optimization is a nice-to-have
    if (error instanceof ApiKeyNotConfiguredError) {
      return null;
    }
    throw error;
  }
}
