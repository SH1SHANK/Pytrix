/**
 * Difficulty Validator
 *
 * Runtime validation to ensure question difficulty matches expected difficulty.
 * Logs violations for diagnostics and prevents silent mismatches.
 */

import { Question, DifficultyLevel } from "@/lib/types";

// ============================================
// TYPES
// ============================================

export interface DifficultyValidationResult {
  isValid: boolean;
  expected: DifficultyLevel;
  actual: DifficultyLevel;
  questionId: string;
  mismatchType?: "downgrade" | "upgrade";
}

// ============================================
// HELPERS
// ============================================

const DIFFICULTY_ORDER: Record<string, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

function getDifficultyOrder(difficulty: string): number {
  return DIFFICULTY_ORDER[difficulty] ?? 0;
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate that a question's difficulty matches the expected difficulty.
 */
export function validateQuestionDifficulty(
  question: Question,
  expectedDifficulty: DifficultyLevel
): DifficultyValidationResult {
  const actualDifficulty = question.difficulty as DifficultyLevel;
  const isValid = actualDifficulty === expectedDifficulty;

  let mismatchType: "downgrade" | "upgrade" | undefined;
  if (!isValid) {
    const expectedOrder = getDifficultyOrder(expectedDifficulty);
    const actualOrder = getDifficultyOrder(actualDifficulty);
    mismatchType = actualOrder < expectedOrder ? "downgrade" : "upgrade";
  }

  return {
    isValid,
    expected: expectedDifficulty,
    actual: actualDifficulty,
    questionId: question.id,
    mismatchType,
  };
}

/**
 * Assert that a question's difficulty matches expected.
 * Logs error if mismatch detected - never throws, never blocks.
 */
export function assertQuestionDifficulty(
  question: Question,
  expectedDifficulty: DifficultyLevel
): DifficultyValidationResult {
  const result = validateQuestionDifficulty(question, expectedDifficulty);

  if (!result.isValid) {
    console.error("[DIFFICULTY MISMATCH]", {
      questionId: result.questionId,
      questionTitle: question.title,
      expected: result.expected,
      actual: result.actual,
      mismatchType: result.mismatchType,
      timestamp: new Date().toISOString(),
    });
  }

  return result;
}

/**
 * Check if difficulty is valid (one of the known levels).
 */
export function isValidDifficulty(
  difficulty: string
): difficulty is DifficultyLevel {
  return difficulty in DIFFICULTY_ORDER;
}

/**
 * Normalize difficulty string to DifficultyLevel.
 * Returns "beginner" for unknown values.
 */
export function normalizeDifficulty(difficulty: string): DifficultyLevel {
  if (isValidDifficulty(difficulty)) {
    return difficulty;
  }
  console.warn(
    `[difficultyValidator] Unknown difficulty "${difficulty}", defaulting to "beginner"`
  );
  return "beginner";
}
