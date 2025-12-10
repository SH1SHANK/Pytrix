/**
 * Mock Factories for Testing
 *
 * Provides factory functions to create mock data and store overrides.
 */

import { vi } from "vitest";

// ============================================
// MOCK STATS DATA
// ============================================

export interface MockStatsData {
  totalAttempts?: number;
  totalSolved?: number;
  modules?: Array<{
    moduleId: string;
    moduleName: string;
    attempts?: number;
    solved?: number;
    masteryPercent?: number;
  }>;
}

export function createMockStats(overrides: MockStatsData = {}) {
  return {
    version: 3,
    totalAttempts: overrides.totalAttempts ?? 10,
    totalSolved: overrides.totalSolved ?? 7,
    totalTimeTakenMs: 300000,
    modulesTouched: overrides.modules?.length ?? 2,
    subtopicsTouched: 4,
    masteryPercent: 70,
    modules:
      overrides.modules?.map((m) => ({
        moduleId: m.moduleId,
        moduleName: m.moduleName,
        attempts: m.attempts ?? 5,
        solved: m.solved ?? 3,
        masteryPercent: m.masteryPercent ?? 60,
        subtopics: [],
      })) ?? [],
    lastUpdatedAt: Date.now(),
  };
}

// ============================================
// MOCK QUESTION DATA
// ============================================

export function createMockQuestion(overrides: Partial<MockQuestion> = {}) {
  return {
    id: overrides.id ?? `q-${Date.now()}`,
    title: overrides.title ?? "[Easy] Mock Question",
    description:
      overrides.description ?? "This is a mock question for testing.",
    inputDescription: overrides.inputDescription ?? "A list of integers",
    outputDescription: overrides.outputDescription ?? "The sum of all integers",
    constraints: overrides.constraints ?? ["1 <= len(arr) <= 1000"],
    sampleInput: overrides.sampleInput ?? "[1, 2, 3]",
    sampleOutput: overrides.sampleOutput ?? "6",
    testCases: overrides.testCases ?? [
      { input: "[1, 2, 3]", expectedOutput: "6", isHidden: false },
      { input: "[0]", expectedOutput: "0", isHidden: false },
      { input: "[-1, 1]", expectedOutput: "0", isHidden: true },
    ],
    starterCode: overrides.starterCode ?? "def solution(arr):\n    pass",
    difficulty: overrides.difficulty ?? "beginner",
    moduleId: overrides.moduleId ?? "arrays",
    subtopicId: overrides.subtopicId ?? "array-basics",
    problemTypeId: overrides.problemTypeId ?? "sum-elements",
    estimatedMinutes: overrides.estimatedMinutes ?? 10,
    hints: overrides.hints ?? ["Think about iteration", "Use a loop"],
  };
}

export interface MockQuestion {
  id: string;
  title: string;
  description: string;
  inputDescription: string;
  outputDescription: string;
  constraints: string[];
  sampleInput: string;
  sampleOutput: string;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>;
  starterCode: string;
  difficulty: string;
  moduleId: string;
  subtopicId: string;
  problemTypeId: string;
  estimatedMinutes: number;
  hints: string[];
}

// ============================================
// MOCK EXECUTION RESULT
// ============================================

export interface MockExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  returnValue?: unknown;
  error?: string;
  executionTimeMs: number;
}

export function createMockExecutionResult(
  overrides: Partial<MockExecutionResult> = {}
): MockExecutionResult {
  return {
    success: overrides.success ?? true,
    stdout: overrides.stdout ?? "",
    stderr: overrides.stderr ?? "",
    returnValue: overrides.returnValue,
    error: overrides.error,
    executionTimeMs: overrides.executionTimeMs ?? 50,
  };
}

// ============================================
// MOCK API USAGE ENTRY
// ============================================

export function createMockApiUsageEntry(overrides: Partial<MockApiEntry> = {}) {
  return {
    id: overrides.id ?? `entry-${Date.now()}`,
    timestamp: overrides.timestamp ?? new Date().toISOString(),
    provider: overrides.provider ?? "google-gemini",
    model: overrides.model ?? "gemini-2.0-flash-lite",
    feature: overrides.feature ?? "manual-question",
    inputTokens: overrides.inputTokens ?? 100,
    outputTokens: overrides.outputTokens ?? 200,
    totalTokens:
      (overrides.inputTokens ?? 100) + (overrides.outputTokens ?? 200),
    status: overrides.status ?? "success",
    topic: overrides.topic,
    difficulty: overrides.difficulty,
  };
}

export interface MockApiEntry {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  feature: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  status: string;
  topic?: string;
  difficulty?: string;
}

// ============================================
// MOCK SAVE FILE
// ============================================

export function createMockSaveFile(overrides: Partial<MockSaveFile> = {}) {
  return {
    id: overrides.id ?? `save-${Date.now()}`,
    name: overrides.name ?? "Test Run",
    createdAt: overrides.createdAt ?? Date.now(),
    lastUpdatedAt: overrides.lastUpdatedAt ?? Date.now(),
    currentIndex: overrides.currentIndex ?? 0,
    completedQuestions: overrides.completedQuestions ?? 0,
    topicQueue: overrides.topicQueue ?? [
      {
        moduleId: "strings",
        subtopicId: "string-basics",
        problemTypeId: "string-reverse",
        moduleName: "Strings",
        subtopicName: "String Basics",
        problemTypeName: "Reverse String",
      },
    ],
    perTopicCounts: overrides.perTopicCounts ?? {},
    recentProblemTypes: overrides.recentProblemTypes ?? [],
    prefetchSize: overrides.prefetchSize ?? 2,
  };
}

export interface MockSaveFile {
  id: string;
  name: string;
  createdAt: number;
  lastUpdatedAt: number;
  currentIndex: number;
  completedQuestions: number;
  topicQueue: Array<{
    moduleId: string;
    subtopicId: string;
    problemTypeId: string;
    moduleName: string;
    subtopicName: string;
    problemTypeName: string;
  }>;
  perTopicCounts: Record<string, number>;
  recentProblemTypes: string[];
  prefetchSize: number;
}

// ============================================
// MOCK NEXT.JS ROUTER
// ============================================

export function createMockRouter(overrides: Partial<MockRouter> = {}) {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: overrides.pathname ?? "/",
    query: overrides.query ?? {},
    asPath: overrides.asPath ?? "/",
    route: overrides.route ?? "/",
    isReady: overrides.isReady ?? true,
    ...overrides,
  };
}

export interface MockRouter {
  push: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  prefetch: ReturnType<typeof vi.fn>;
  back: ReturnType<typeof vi.fn>;
  forward: ReturnType<typeof vi.fn>;
  refresh: ReturnType<typeof vi.fn>;
  pathname: string;
  query: Record<string, string>;
  asPath: string;
  route: string;
  isReady: boolean;
}

// ============================================
// MOCK SEARCH PARAMS
// ============================================

export function createMockSearchParams(
  params: Record<string, string> = {}
): URLSearchParams {
  return new URLSearchParams(params);
}
