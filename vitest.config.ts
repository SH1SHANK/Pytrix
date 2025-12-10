import { defineConfig } from "vitest/config";
import path from "path";
import fs from "fs";

// Load .env.test.local for integration tests
const envPath = path.resolve(__dirname, ".env.test.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").replace(/^["']|["']$/g, ""); // Remove quotes
        process.env[key.trim()] = value;
      }
    }
  });
}

export default defineConfig({
  test: {
    environment: "jsdom",
    include: [
      "tests/unit/**/*.{test,spec}.{ts,tsx}",
      "tests/integration/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: ["tests/e2e/**/*", "node_modules/**/*"],
    setupFiles: ["./tests/setup.ts"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/tests": path.resolve(__dirname, "./tests"),
    },
    globals: true,
    testTimeout: 10000,
    hookTimeout: 10000,
    // Print API key test summary after all tests complete
    onConsoleLog(log) {
      // Allow API test summary to pass through
      if (log.includes("[API Tests]") || log.includes("API KEY TEST SUMMARY")) {
        return true;
      }
      return undefined;
    },
  },
});
