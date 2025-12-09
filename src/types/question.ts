/**
 * Question Types
 *
 * Type definitions for question templates and generated questions.
 */

/**
 * Difficulty levels for questions
 */
export type Difficulty = "beginner" | "intermediate" | "advanced";

/**
 * Question template generated from a ProblemType + difficulty.
 * This is the pre-LLM structure that can be used to prompt an LLM
 * or serve as a template for questions.
 */
export interface QuestionTemplate {
  /** Unique identifier for this template */
  id: string;

  /** Problem type this template is based on */
  problemTypeId: string;
  problemTypeName: string;

  /** Context from the topics hierarchy */
  moduleId: string;
  moduleName: string;
  subtopicId: string;
  subtopicName: string;

  /** Difficulty level */
  difficulty: Difficulty;

  /** Generated title for the question */
  title: string;

  /** Prompt template describing the problem */
  promptTemplate: string;

  /** Compact prompt for LLM generation */
  compactPrompt: string;

  /** Sample input(s) for the problem */
  sampleInputs: string[];

  /** Expected sample output(s) */
  sampleOutputs: string[];

  /** Edge cases to consider */
  edgeCases: EdgeCase[];

  /** Constraints for the problem */
  constraints: string[];

  /** Hints for solving (progressive) */
  hints: string[];

  /** Tags for categorization */
  tags: string[];

  /** Estimated time to solve in minutes */
  estimatedMinutes: number;

  /** Python starter code template */
  starterCode: string;

  /** Test case templates */
  testCases: TestCaseTemplate[];
}

/**
 * Edge case for a problem
 */
export interface EdgeCase {
  description: string;
  input: string;
  expectedOutput: string;
}

/**
 * Test case template
 */
export interface TestCaseTemplate {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  description?: string;
}

/**
 * Difficulty configuration for generating templates
 */
export interface DifficultyConfig {
  level: Difficulty;
  inputSizeRange: [number, number];
  constraintComplexity: "low" | "medium" | "high";
  estimatedMinutes: number;
  hintsCount: number;
}

/**
 * Difficulty configurations
 */
export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  beginner: {
    level: "beginner",
    inputSizeRange: [1, 10],
    constraintComplexity: "low",
    estimatedMinutes: 5,
    hintsCount: 3,
  },
  intermediate: {
    level: "intermediate",
    inputSizeRange: [10, 100],
    constraintComplexity: "medium",
    estimatedMinutes: 15,
    hintsCount: 2,
  },
  advanced: {
    level: "advanced",
    inputSizeRange: [100, 10000],
    constraintComplexity: "high",
    estimatedMinutes: 30,
    hintsCount: 1,
  },
};
