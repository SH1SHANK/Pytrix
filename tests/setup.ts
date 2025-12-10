/**
 * Global Test Setup
 *
 * This file runs before all tests and sets up the testing environment.
 * It configures jsdom, mocks browser APIs, and provides global utilities.
 */

import { vi, beforeEach, afterEach } from "vitest";

// ============================================
// MOCK LOCALSTORAGE
// ============================================

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ============================================
// MOCK WINDOW.MATCHMEDIA
// ============================================

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ============================================
// MOCK RESIZE OBSERVER
// ============================================

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(global, "ResizeObserver", {
  value: ResizeObserverMock,
  writable: true,
});

// ============================================
// MOCK INTERSECTION OBSERVER
// ============================================

class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  root = null;
  rootMargin = "";
  thresholds = [];
}

Object.defineProperty(global, "IntersectionObserver", {
  value: IntersectionObserverMock,
  writable: true,
});

// ============================================
// MOCK PERFORMANCE API
// ============================================

if (typeof global.performance === "undefined") {
  Object.defineProperty(global, "performance", {
    value: {
      now: vi.fn(() => Date.now()),
    },
    writable: true,
  });
}

// ============================================
// SUPPRESS CONSOLE OUTPUT IN TESTS
// ============================================

// Suppress console messages during tests to reduce noise
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Patterns to suppress (service logging, React warnings)
const suppressPatterns = [
  "[autoModeService]",
  "[statsStore]",
  "[DiversityService]",
  "[questionService]",
  "Warning: ReactDOM.render is no longer supported",
  "Warning: An update to",
  "act()",
];

function shouldSuppress(args: unknown[]): boolean {
  const message = args[0]?.toString() || "";
  return suppressPatterns.some((pattern) => message.includes(pattern));
}

console.log = (...args: unknown[]) => {
  if (shouldSuppress(args)) return;
  originalConsoleLog.apply(console, args);
};

console.warn = (...args: unknown[]) => {
  if (shouldSuppress(args)) return;
  originalConsoleWarn.apply(console, args);
};

console.error = (...args: unknown[]) => {
  if (shouldSuppress(args)) return;
  originalConsoleError.apply(console, args);
};

// ============================================
// CLEANUP BETWEEN TESTS
// ============================================

beforeEach(() => {
  // Clear localStorage before each test
  localStorageMock.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  // Additional cleanup if needed
  vi.restoreAllMocks();
});

// ============================================
// GLOBAL TEST UTILITIES
// ============================================

/**
 * Wait for a condition to be true.
 * Useful for async state updates.
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 5000,
  interval = 50
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error("waitFor timeout");
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Create a deferred promise for testing async flows.
 */
export function createDeferred<T>() {
  let resolve: (value: T) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve: resolve!, reject: reject! };
}

// ============================================
// API KEY TEST TRACKING
// ============================================

/**
 * Track API key dependent tests status.
 * Tests can use these utilities to report their status.
 */
interface ApiKeyTestStatus {
  testsRequiringApiKey: string[];
  testsRan: string[];
  testsSkipped: string[];
  apiKeyAvailable: boolean;
}

const apiKeyTestStatus: ApiKeyTestStatus = {
  testsRequiringApiKey: [],
  testsRan: [],
  testsSkipped: [],
  apiKeyAvailable: false,
};

/**
 * Check if the internal Gemini API key is available for integration tests.
 */
export function hasTestApiKey(): boolean {
  const key = process.env.INTERNAL_GEMINI_KEY;
  apiKeyTestStatus.apiKeyAvailable = !!(
    key &&
    key !== "API_KEY" &&
    key.length > 10
  );
  return apiKeyTestStatus.apiKeyAvailable;
}

/**
 * Register a test that requires an API key.
 * Call this at the start of a test that needs a real API key.
 */
export function registerApiKeyTest(testName: string): void {
  if (!apiKeyTestStatus.testsRequiringApiKey.includes(testName)) {
    apiKeyTestStatus.testsRequiringApiKey.push(testName);
  }
}

/**
 * Mark an API key test as ran successfully.
 */
export function markApiKeyTestRan(testName: string): void {
  if (!apiKeyTestStatus.testsRan.includes(testName)) {
    apiKeyTestStatus.testsRan.push(testName);
  }
}

/**
 * Mark an API key test as skipped.
 */
export function markApiKeyTestSkipped(testName: string): void {
  if (!apiKeyTestStatus.testsSkipped.includes(testName)) {
    apiKeyTestStatus.testsSkipped.push(testName);
  }
}

/**
 * Get the current API key test status.
 */
export function getApiKeyTestStatus(): ApiKeyTestStatus {
  return { ...apiKeyTestStatus };
}

/**
 * Helper to conditionally run a test only if API key is available.
 * Usage: describeWithApiKey('Real API tests', () => { ... });
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function describeWithApiKey(name: string, _fn: () => void): void {
  const hasKey = hasTestApiKey();

  if (hasKey) {
    // Will be handled by vitest's describe
    console.info(`\n🔑 [API Tests] Running: ${name}`);
  } else {
    console.info(`\n⏭️  [API Tests] Skipping (no API key): ${name}`);
  }
}

/**
 * Print API key test summary at the end of test run.
 * This is called via afterAll in vitest config.
 */
export function printApiKeyTestSummary(): void {
  const status = apiKeyTestStatus;
  const totalRegistered = status.testsRequiringApiKey.length;

  if (totalRegistered === 0) {
    return; // No API key tests registered
  }

  const originalLog = originalConsoleLog || console.log;

  originalLog("\n" + "=".repeat(60));
  originalLog("📊 API KEY TEST SUMMARY");
  originalLog("=".repeat(60));

  if (status.apiKeyAvailable) {
    originalLog("✅ API Key: Available (INTERNAL_GEMINI_KEY set)");
  } else {
    originalLog("⚠️  API Key: Not Available");
    originalLog(
      "   Set INTERNAL_GEMINI_KEY in .env.test.local to run real API tests"
    );
  }

  originalLog(`\n📋 Tests Requiring API Key: ${totalRegistered}`);
  originalLog(`   ✅ Ran: ${status.testsRan.length}`);
  originalLog(`   ⏭️  Skipped: ${status.testsSkipped.length}`);

  if (status.testsRan.length > 0) {
    originalLog("\n   Ran:");
    status.testsRan.forEach((t) => originalLog(`      • ${t}`));
  }

  if (status.testsSkipped.length > 0) {
    originalLog("\n   Skipped:");
    status.testsSkipped.forEach((t) => originalLog(`      • ${t}`));
  }

  originalLog("=".repeat(60) + "\n");
}
