/**
 * API Usage Entry Store Unit Tests
 *
 * Tests for API usage tracking:
 * - Recording entries
 * - Filtering by date range and feature
 * - Aggregation functions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useApiUsageEntryStore } from "@/lib/stores/apiUsageEntryStore";

describe("apiUsageEntryStore", () => {
  beforeEach(() => {
    // Clear the store state before each test
    useApiUsageEntryStore.setState({ entries: [] });
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-12-10T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("recordEntry", () => {
    it("should record an API usage entry", () => {
      useApiUsageEntryStore.getState().recordEntry({
        provider: "google-gemini",
        model: "gemini-2.0-flash-lite",
        feature: "manual-question",
        inputTokens: 100,
        outputTokens: 200,
        status: "success",
      });

      const entries = useApiUsageEntryStore.getState().entries;
      expect(entries).toHaveLength(1);
      expect(entries[0].model).toBe("gemini-2.0-flash-lite");
      expect(entries[0].totalTokens).toBe(300);
    });

    it("should auto-generate id and timestamp", () => {
      useApiUsageEntryStore.getState().recordEntry({
        provider: "google-gemini",
        model: "gemini-2.0-flash",
        feature: "hint",
        inputTokens: 50,
        outputTokens: 100,
        status: "success",
      });

      const entry = useApiUsageEntryStore.getState().entries[0];
      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeDefined();
    });

    it("should include optional fields", () => {
      useApiUsageEntryStore.getState().recordEntry({
        provider: "google-gemini",
        model: "gemini-2.0-flash-lite",
        feature: "auto-mode-question",
        inputTokens: 150,
        outputTokens: 250,
        status: "success",
        topic: "arrays",
        difficulty: "intermediate",
      });

      const entry = useApiUsageEntryStore.getState().entries[0];
      expect(entry.topic).toBe("arrays");
      expect(entry.difficulty).toBe("intermediate");
    });

    it("should limit entries to 1000", () => {
      // Add 1001 entries
      for (let i = 0; i < 1001; i++) {
        useApiUsageEntryStore.getState().recordEntry({
          provider: "google-gemini",
          model: "gemini-2.0-flash-lite",
          feature: "manual-question",
          inputTokens: 10,
          outputTokens: 20,
          status: "success",
        });
      }

      const entries = useApiUsageEntryStore.getState().entries;
      expect(entries.length).toBeLessThanOrEqual(1000);
    });
  });

  describe("getTodayEntries", () => {
    it("should return only today's entries", () => {
      // Add today's entry
      useApiUsageEntryStore.getState().recordEntry({
        provider: "google-gemini",
        model: "gemini-2.0-flash-lite",
        feature: "manual-question",
        inputTokens: 100,
        outputTokens: 200,
        status: "success",
      });

      const todayEntries = useApiUsageEntryStore.getState().getTodayEntries();
      expect(todayEntries.length).toBe(1);
    });
  });

  describe("getEntriesByFeature", () => {
    it("should filter by feature type", () => {
      useApiUsageEntryStore.getState().recordEntry({
        provider: "google-gemini",
        model: "gemini-2.0-flash-lite",
        feature: "manual-question",
        inputTokens: 100,
        outputTokens: 200,
        status: "success",
      });

      useApiUsageEntryStore.getState().recordEntry({
        provider: "google-gemini",
        model: "gemini-2.0-flash",
        feature: "hint",
        inputTokens: 50,
        outputTokens: 100,
        status: "success",
      });

      const hintEntries = useApiUsageEntryStore
        .getState()
        .getEntriesByFeature("hint");
      expect(hintEntries).toHaveLength(1);
      expect(hintEntries[0].feature).toBe("hint");
    });
  });

  describe("getQuestionGenerationEntries", () => {
    it("should return manual and auto-mode question entries", () => {
      useApiUsageEntryStore.getState().recordEntry({
        provider: "google-gemini",
        model: "gemini-2.0-flash-lite",
        feature: "manual-question",
        inputTokens: 100,
        outputTokens: 200,
        status: "success",
      });

      useApiUsageEntryStore.getState().recordEntry({
        provider: "google-gemini",
        model: "gemini-2.0-flash-lite",
        feature: "auto-mode-question",
        inputTokens: 100,
        outputTokens: 200,
        status: "success",
      });

      useApiUsageEntryStore.getState().recordEntry({
        provider: "google-gemini",
        model: "gemini-2.0-flash",
        feature: "hint",
        inputTokens: 50,
        outputTokens: 100,
        status: "success",
      });

      const questionEntries = useApiUsageEntryStore
        .getState()
        .getQuestionGenerationEntries();
      expect(questionEntries).toHaveLength(2);
    });
  });

  describe("getTodayAggregates", () => {
    it("should aggregate today's usage correctly", () => {
      useApiUsageEntryStore.getState().recordEntry({
        provider: "google-gemini",
        model: "gemini-2.0-flash-lite",
        feature: "manual-question",
        inputTokens: 100,
        outputTokens: 200,
        status: "success",
      });

      useApiUsageEntryStore.getState().recordEntry({
        provider: "google-gemini",
        model: "gemini-2.0-flash-lite",
        feature: "hint",
        inputTokens: 50,
        outputTokens: 100,
        status: "success",
      });

      const aggregates = useApiUsageEntryStore.getState().getTodayAggregates();

      expect(aggregates.totalCalls).toBe(2);
      expect(aggregates.totalInputTokens).toBe(150);
      expect(aggregates.totalOutputTokens).toBe(300);
      expect(aggregates.totalTokens).toBe(450);
    });

    it("should aggregate by model", () => {
      useApiUsageEntryStore.getState().recordEntry({
        provider: "google-gemini",
        model: "gemini-2.0-flash-lite",
        feature: "manual-question",
        inputTokens: 100,
        outputTokens: 200,
        status: "success",
      });

      useApiUsageEntryStore.getState().recordEntry({
        provider: "google-gemini",
        model: "gemini-2.0-flash",
        feature: "hint",
        inputTokens: 50,
        outputTokens: 100,
        status: "success",
      });

      const aggregates = useApiUsageEntryStore.getState().getTodayAggregates();

      expect(aggregates.byModel["gemini-2.0-flash-lite"]).toBeDefined();
      expect(aggregates.byModel["gemini-2.0-flash"]).toBeDefined();
    });

    it("should aggregate by status", () => {
      useApiUsageEntryStore.getState().recordEntry({
        provider: "google-gemini",
        model: "gemini-2.0-flash-lite",
        feature: "manual-question",
        inputTokens: 100,
        outputTokens: 200,
        status: "success",
      });

      useApiUsageEntryStore.getState().recordEntry({
        provider: "google-gemini",
        model: "gemini-2.0-flash-lite",
        feature: "manual-question",
        inputTokens: 100,
        outputTokens: 0,
        status: "error",
        errorMessage: "Rate limited",
      });

      const aggregates = useApiUsageEntryStore.getState().getTodayAggregates();

      expect(aggregates.byStatus["success"]).toBe(1);
      expect(aggregates.byStatus["error"]).toBe(1);
    });
  });

  describe("getLast7DaysData", () => {
    it("should return 7 days of data", () => {
      const data = useApiUsageEntryStore.getState().getLast7DaysData();

      expect(data).toHaveLength(7);
      expect(data[0].date).toBeDefined();
      expect(typeof data[0].calls).toBe("number");
      expect(typeof data[0].tokens).toBe("number");
    });
  });

  describe("getLast30DaysData", () => {
    it("should return 30 days of data", () => {
      const data = useApiUsageEntryStore.getState().getLast30DaysData();

      expect(data).toHaveLength(30);
    });
  });

  describe("clearEntries", () => {
    it("should clear all entries", () => {
      useApiUsageEntryStore.getState().recordEntry({
        provider: "google-gemini",
        model: "gemini-2.0-flash-lite",
        feature: "manual-question",
        inputTokens: 100,
        outputTokens: 200,
        status: "success",
      });

      expect(useApiUsageEntryStore.getState().entries.length).toBeGreaterThan(
        0
      );

      useApiUsageEntryStore.getState().clearEntries();

      expect(useApiUsageEntryStore.getState().entries).toHaveLength(0);
    });
  });
});
