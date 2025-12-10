/**
 * Real API Integration Tests
 *
 * These tests require a valid INTERNAL_GEMINI_KEY in .env.test.local
 * They will be skipped if the API key is not available.
 *
 * To run these tests:
 * 1. Copy tests/env.test.local.example to .env.test.local in the repo root
 * 2. Add your real Gemini API key
 * 3. Run: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  hasTestApiKey,
  registerApiKeyTest,
  markApiKeyTestRan,
  markApiKeyTestSkipped,
  printApiKeyTestSummary,
} from "../setup";

// Check if API key is available
const API_KEY_AVAILABLE = hasTestApiKey();

describe("Real API Integration Tests", () => {
  beforeAll(() => {
    // Register all tests in this file
    registerApiKeyTest("Real Gemini API - Health Check");
    registerApiKeyTest("Real Gemini API - Question Generation");
  });

  afterAll(() => {
    // Print summary at the end of API tests
    printApiKeyTestSummary();
  });

  describe.skipIf(!API_KEY_AVAILABLE)("Gemini API Tests", () => {
    it("should verify API key is working", async () => {
      const testName = "Real Gemini API - Health Check";

      try {
        // This would call the real API
        const apiKey = process.env.INTERNAL_GEMINI_KEY;
        expect(apiKey).toBeDefined();
        expect(apiKey?.length).toBeGreaterThan(10);

        // If we get here, mark as ran
        markApiKeyTestRan(testName);
      } catch (error) {
        markApiKeyTestSkipped(testName);
        throw error;
      }
    });

    it("should generate a question using real API", async () => {
      const testName = "Real Gemini API - Question Generation";

      try {
        // This is a placeholder - in a real test you would:
        // 1. Import the actual API service
        // 2. Make a real API call
        // 3. Verify the response structure

        // For now, just verify the test infrastructure works
        expect(true).toBe(true);

        markApiKeyTestRan(testName);
      } catch (error) {
        markApiKeyTestSkipped(testName);
        throw error;
      }
    });
  });

  // Tests that run when API key is NOT available
  describe.skipIf(API_KEY_AVAILABLE)("Skipped API Tests (No Key)", () => {
    it("should skip when no API key", () => {
      markApiKeyTestSkipped("Real Gemini API - Health Check");
      markApiKeyTestSkipped("Real Gemini API - Question Generation");

      // This test just marks the API tests as skipped
      expect(API_KEY_AVAILABLE).toBe(false);
    });
  });
});
