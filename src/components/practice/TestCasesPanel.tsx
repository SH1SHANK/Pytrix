"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  CheckCircle,
  XCircle,
  Circle,
  Play,
  SpinnerGap,
} from "@phosphor-icons/react";
import type { TestCase } from "@/lib/types";

// Test case result status
export type TestCaseStatus = "pending" | "running" | "passed" | "failed";

export interface TestCaseResult {
  status: TestCaseStatus;
  actualOutput?: string;
  executionTimeMs?: number;
  error?: string;
}

interface TestCasesPanelProps {
  testCases: TestCase[];
  results: Map<number, TestCaseResult>;
  onRunAll: () => void;
  onRunSingle: (index: number) => void;
  isRunning: boolean;
  runningIndex?: number;
}

/**
 * Displays test cases with input/expected output and run results.
 * Supports running all tests or individual tests.
 */
export function TestCasesPanel({
  testCases,
  results,
  onRunAll,
  onRunSingle,
  isRunning,
  runningIndex,
}: TestCasesPanelProps) {
  // Debug logging - to be removed in production or used for diagnostics
  if (process.env.NODE_ENV !== "production") {
    console.log("[TestCasesPanel] Rendering with:", {
      numTestCases: testCases?.length,
      numResults: results?.size,
      isRunning,
      runningIndex,
    });
  }

  // Safe guard against missing testCases
  const SafeTestCases = Array.isArray(testCases) ? testCases : [];

  if (SafeTestCases.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm p-4 space-y-2">
        <p>No test cases available for this question.</p>
        <div className="text-xs font-mono bg-muted p-2 rounded">
          Payload: {JSON.stringify(testCases || "undefined").slice(0, 100)}...
        </div>
      </div>
    );
  }

  // Count results
  const passedCount = Array.from(results.values()).filter(
    (r) => r.status === "passed"
  ).length;
  const failedCount = Array.from(results.values()).filter(
    (r) => r.status === "failed"
  ).length;
  const totalRun = passedCount + failedCount;

  const getStatusIcon = (status: TestCaseStatus, index: number) => {
    if (isRunning && runningIndex === index) {
      return <SpinnerGap className="h-4 w-4 animate-spin text-primary" />;
    }
    switch (status) {
      case "passed":
        return <CheckCircle weight="fill" className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle weight="fill" className="h-4 w-4 text-red-500" />;
      case "running":
        return <SpinnerGap className="h-4 w-4 animate-spin text-primary" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">Test Cases</span>
          {totalRun > 0 && (
            <Badge
              variant="outline"
              className={`text-xs ${
                failedCount > 0
                  ? "border-red-500/30 text-red-500"
                  : "border-green-500/30 text-green-500"
              }`}
            >
              {passedCount}/{SafeTestCases.length} passed
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onRunAll}
          disabled={isRunning}
          className="gap-2 h-7"
        >
          {isRunning && runningIndex === undefined ? (
            <SpinnerGap className="h-3 w-3 animate-spin" />
          ) : (
            <Play weight="fill" className="h-3 w-3" />
          )}
          Run All
        </Button>
      </div>

      {/* Test Cases List - wrapped in flex container for proper scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
        {SafeTestCases.map((testCase, index) => {
          const result = results.get(index);
          const status = result?.status || "pending";

          return (
            <Card
              key={index}
              className={`p-3 transition-colors ${
                status === "passed"
                  ? "border-green-500/30 bg-green-500/5"
                  : status === "failed"
                  ? "border-red-500/30 bg-red-500/5"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(status, index)}
                  <span className="text-sm font-medium">
                    {testCase.description || `Test ${index + 1}`}
                    {testCase.isHidden && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Hidden
                      </Badge>
                    )}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRunSingle(index)}
                  disabled={isRunning}
                  className="h-6 px-2 text-xs"
                >
                  {isRunning && runningIndex === index ? (
                    <SpinnerGap className="h-3 w-3 animate-spin" />
                  ) : (
                    <Play weight="fill" className="h-3 w-3" />
                  )}
                </Button>
              </div>

              {/* Input/Output Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Input
                  </span>
                  <pre className="bg-muted/50 p-2 rounded font-mono overflow-x-auto max-h-20">
                    {testCase.input || "(empty)"}
                  </pre>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Expected
                  </span>
                  {/* Show first 2 test cases fully, hide rest until run */}
                  {index < 2 || status === "passed" || status === "failed" ? (
                    <pre className="bg-muted/50 p-2 rounded font-mono overflow-x-auto max-h-20">
                      {testCase.expectedOutput || "(empty)"}
                    </pre>
                  ) : (
                    <div className="bg-muted/50 p-2 rounded font-mono overflow-x-auto max-h-20 text-muted-foreground/50 italic flex items-center gap-2">
                      <Circle className="h-3 w-3" />
                      <span>Run to reveal</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Result - Actual Output */}
              {result && status !== "pending" && (
                <div className="mt-2 text-xs">
                  <span
                    className={`block mb-1 ${
                      status === "passed"
                        ? "text-green-500"
                        : status === "failed"
                        ? "text-red-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {status === "passed"
                      ? "✓ Output matches"
                      : status === "failed"
                      ? "✗ Output mismatch"
                      : "Actual"}
                  </span>
                  {result.actualOutput !== undefined && (
                    <pre
                      className={`p-2 rounded font-mono overflow-x-auto max-h-20 ${
                        status === "failed"
                          ? "bg-red-500/10 text-red-300"
                          : "bg-green-500/10 text-green-300"
                      }`}
                    >
                      {result.actualOutput || "(empty)"}
                    </pre>
                  )}
                  {result.error && (
                    <pre className="bg-red-500/10 p-2 rounded font-mono text-red-400 overflow-x-auto max-h-20 mt-1">
                      {result.error}
                    </pre>
                  )}
                  {result.executionTimeMs !== undefined && (
                    <span className="text-muted-foreground mt-1 block">
                      Executed in {result.executionTimeMs.toFixed(0)}ms
                    </span>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
