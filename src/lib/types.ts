export type Difficulty = "easy" | "medium" | "hard";

export type RunStatus = "not_run" | "correct" | "incorrect" | "error";

export interface Stats {
  problemsSolved: number;
  totalAttempts: number;
  topicsTouched: number; // Count of topics with at least 1 attempt
  totalTopics: number;
  masteryPercent: number; // Overall mastery
  easyPercent: number;
  mediumPercent: number;
  hardPercent: number;
}

export interface Topic {
  id: string; // e.g., "strings", "lists"
  name: string; // Display name
  problemsSolved: number;
}

export interface Question {
  id: string;
  topicId: string; // Normalized ID (e.g., "strings")
  topicName: string; // Display Name (e.g., "Strings")
  topic: string; // AI field (usually same as topicName)
  difficulty: Difficulty;
  title: string;
  description: string;
  inputDescription: string;
  outputDescription: string;
  constraints: string[];
  sampleInput: string;
  sampleOutput: string;
  starterCode: string;
  referenceSolution: string | null;
  testCases?: TestCase[]; // Made optional for AI questions
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface RunResult {
  status: RunStatus;
  stdout: string;
  stderr: string;
  message?: string; // For "Correct!" or "Wrong Answer"
}

// Re-export from centralized modules
export type { TopicStats, GlobalStats } from "./statsStore";
export type { AutoModeSaveFile } from "./autoModeService";
