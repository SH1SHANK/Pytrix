import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  TestCasesPanel,
  TestCaseResult,
} from "@/components/practice/TestCasesPanel";
import { TestCase } from "@/lib/types";

describe("TestCasesPanel", () => {
  const mockTestCases: TestCase[] = [
    { id: "1", input: "1", expectedOutput: "1", description: "Test 1" },
    { id: "2", input: "2", expectedOutput: "2", description: "Test 2" },
  ];

  const mockResults = new Map<number, TestCaseResult>();

  it("renders 'No test cases' when list is empty", () => {
    render(
      <TestCasesPanel
        testCases={[]}
        results={mockResults}
        onRunAll={() => {}}
        onRunSingle={() => {}}
        isRunning={false}
      />
    );
    expect(screen.getByText(/No test cases available/)).toBeDefined();
  });

  it("renders a list of test cases", () => {
    render(
      <TestCasesPanel
        testCases={mockTestCases}
        results={mockResults}
        onRunAll={() => {}}
        onRunSingle={() => {}}
        isRunning={false}
      />
    );
    expect(screen.getByText("Test 1")).toBeDefined();
    expect(screen.getByText("Test 2")).toBeDefined();
  });

  it("displays results when provided", () => {
    const results = new Map<number, TestCaseResult>();
    results.set(0, {
      status: "passed",
      actualOutput: "1",
      executionTimeMs: 10,
    });
    results.set(1, { status: "failed", actualOutput: "3", error: "Fail" });

    render(
      <TestCasesPanel
        testCases={mockTestCases}
        results={results}
        onRunAll={() => {}}
        onRunSingle={() => {}}
        isRunning={false}
      />
    );

    expect(screen.getByText("✓ Output matches")).toBeDefined();
    expect(screen.getByText("✗ Output mismatch")).toBeDefined();
  });
});
