/**
 * API Usage Entry Store
 *
 * Detailed logging of every LLM call with feature, topic, tokens, and status.
 * Persisted to localStorage for historical analysis.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================
// TYPES
// ============================================

export type ApiFeature =
  | "manual-question"
  | "auto-mode-question"
  | "hint"
  | "optimal-solution"
  | "code-evaluation"
  | "other";

export type ApiCallStatus =
  | "success"
  | "rate-limited"
  | "quota-exceeded"
  | "error";

export interface ApiUsageEntry {
  id: string;
  timestamp: string; // ISO string
  provider: string;
  model: string;
  feature: ApiFeature;
  topic?: string;
  difficulty?: string; // Any difficulty string
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  status: ApiCallStatus;
  errorCode?: string;
  errorMessage?: string;
  // Optional link to question in history
  questionId?: string;
}

export interface ApiUsageEntryState {
  entries: ApiUsageEntry[];

  // Actions
  recordEntry: (
    entry: Omit<ApiUsageEntry, "id" | "timestamp" | "totalTokens">
  ) => void;
  getTodayEntries: () => ApiUsageEntry[];
  getEntriesByDateRange: (
    startDate: string,
    endDate: string
  ) => ApiUsageEntry[];
  getEntriesByFeature: (feature: ApiFeature) => ApiUsageEntry[];
  getQuestionGenerationEntries: () => ApiUsageEntry[];
  clearEntries: () => void;

  // Aggregates
  getTodayAggregates: () => {
    totalCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    byModel: Record<string, { calls: number; tokens: number }>;
    byFeature: Record<string, { calls: number; tokens: number }>;
    byStatus: Record<string, number>;
  };
  getLast7DaysData: () => { date: string; calls: number; tokens: number }[];
  getLast30DaysData: () => { date: string; calls: number; tokens: number }[];
}

// ============================================
// HELPERS
// ============================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function getDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function isToday(timestamp: string): boolean {
  return timestamp.startsWith(getTodayDateString());
}

function isInDateRange(
  timestamp: string,
  startDate: string,
  endDate: string
): boolean {
  const date = timestamp.split("T")[0];
  return date >= startDate && date <= endDate;
}

// ============================================
// STORE
// ============================================

export const useApiUsageEntryStore = create<ApiUsageEntryState>()(
  persist(
    (set, get) => ({
      entries: [],

      recordEntry: (entryData) => {
        const entry: ApiUsageEntry = {
          ...entryData,
          id: generateId(),
          timestamp: new Date().toISOString(),
          totalTokens: entryData.inputTokens + entryData.outputTokens,
        };

        set((state) => ({
          entries: [entry, ...state.entries].slice(0, 1000), // Keep last 1000 entries
        }));
      },

      getTodayEntries: () => {
        return get().entries.filter((e) => isToday(e.timestamp));
      },

      getEntriesByDateRange: (startDate, endDate) => {
        return get().entries.filter((e) =>
          isInDateRange(e.timestamp, startDate, endDate)
        );
      },

      getEntriesByFeature: (feature) => {
        return get().entries.filter((e) => e.feature === feature);
      },

      getQuestionGenerationEntries: () => {
        return get().entries.filter(
          (e) =>
            e.feature === "manual-question" ||
            e.feature === "auto-mode-question"
        );
      },

      clearEntries: () => {
        set({ entries: [] });
      },

      getTodayAggregates: () => {
        const todayEntries = get().getTodayEntries();

        const byModel: Record<string, { calls: number; tokens: number }> = {};
        const byFeature: Record<string, { calls: number; tokens: number }> = {};
        const byStatus: Record<string, number> = {};

        let totalCalls = 0;
        let totalInputTokens = 0;
        let totalOutputTokens = 0;

        for (const entry of todayEntries) {
          totalCalls++;
          totalInputTokens += entry.inputTokens;
          totalOutputTokens += entry.outputTokens;

          // By model
          if (!byModel[entry.model]) {
            byModel[entry.model] = { calls: 0, tokens: 0 };
          }
          byModel[entry.model].calls++;
          byModel[entry.model].tokens += entry.totalTokens;

          // By feature
          if (!byFeature[entry.feature]) {
            byFeature[entry.feature] = { calls: 0, tokens: 0 };
          }
          byFeature[entry.feature].calls++;
          byFeature[entry.feature].tokens += entry.totalTokens;

          // By status
          byStatus[entry.status] = (byStatus[entry.status] || 0) + 1;
        }

        return {
          totalCalls,
          totalInputTokens,
          totalOutputTokens,
          totalTokens: totalInputTokens + totalOutputTokens,
          byModel,
          byFeature,
          byStatus,
        };
      },

      getLast7DaysData: () => {
        const data: { date: string; calls: number; tokens: number }[] = [];
        const entries = get().entries;

        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = getDateString(date);

          const dayEntries = entries.filter((e) =>
            e.timestamp.startsWith(dateStr)
          );

          data.push({
            date: dateStr,
            calls: dayEntries.length,
            tokens: dayEntries.reduce((sum, e) => sum + e.totalTokens, 0),
          });
        }

        return data;
      },

      getLast30DaysData: () => {
        const data: { date: string; calls: number; tokens: number }[] = [];
        const entries = get().entries;

        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = getDateString(date);

          const dayEntries = entries.filter((e) =>
            e.timestamp.startsWith(dateStr)
          );

          data.push({
            date: dateStr,
            calls: dayEntries.length,
            tokens: dayEntries.reduce((sum, e) => sum + e.totalTokens, 0),
          });
        }

        return data;
      },
    }),
    {
      name: "pytrix_api_usage_v2",
      version: 1,
    }
  )
);

// ============================================
// HELPER FUNCTION FOR RECORDING
// ============================================

/**
 * Record an API usage entry from anywhere in the app.
 * This is a convenience function that can be imported directly.
 */
export function recordApiUsageEntry(
  model: string,
  feature: ApiFeature,
  inputTokens: number,
  outputTokens: number,
  status: ApiCallStatus = "success",
  options?: {
    topic?: string;
    difficulty?: string;
    questionId?: string;
    errorCode?: string;
    errorMessage?: string;
  }
): void {
  useApiUsageEntryStore.getState().recordEntry({
    provider: "google-gemini",
    model,
    feature,
    inputTokens,
    outputTokens,
    status,
    ...options,
  });
}
