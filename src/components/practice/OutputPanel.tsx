"use client";

import { useState, useRef, useEffect } from "react";
import { RunResult, Question } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  WarningCircle,
  CheckCircle,
  XCircle,
  SpinnerGap,
  Sparkle,
  ArrowRight,
  Copy,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { optimizeSolution } from "@/lib/ai/aiClient";
import {
  TestCasesPanel,
  TestCaseResult,
} from "@/components/practice/TestCasesPanel";
import { diffLines, Change } from "diff";

interface OutputPanelProps {
  runResult: RunResult;
  question: Question | null;
  isRevealed: boolean;
  currentCode?: string;
  onApplyOptimizedCode?: (code: string) => void;
  testCaseResults?: Map<number, TestCaseResult>;
  onRunAllTests?: () => void;
  onRunSingleTest?: (index: number) => void;
  isRunningTests?: boolean;
  runningTestIndex?: number;
}

interface OptimizedResult {
  code: string;
  explanation: string;
  keyImprovements: string[];
  complexityComparison?: {
    user: { time: string; space: string };
    optimized: { time: string; space: string };
  };
}

interface UserProgress {
  totalOptimizationsSeen: number;
  totalApplied: number;
  questionsCompleted: string[];
  lastUpdated: string;
}

// LRU Cache implementation for memory management
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 20) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key)!;
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    // Remove if exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Add to end
    this.cache.set(key, value);
    // Remove oldest if over capacity
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global LRU cache for optimization results
const optimizationCache = new LRUCache<string, OptimizedResult>(20);

function getCacheKey(questionId: string, code: string): string {
  return `${questionId}:${code.trim().slice(0, 200)}`;
}

export function OutputPanel({
  runResult,
  question,
  isRevealed,
  currentCode,
  onApplyOptimizedCode,
  testCaseResults = new Map(),
  onRunAllTests,
  onRunSingleTest,
  isRunningTests = false,
  runningTestIndex,
}: OutputPanelProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedResult, setOptimizedResult] =
    useState<OptimizedResult | null>(null);
  const [isOptimalMatch, setIsOptimalMatch] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(
    null
  );
  const [showDiff, setShowDiff] = useState(false);
  const [isLoadingFromStorage, setIsLoadingFromStorage] = useState(false);

  const lastQuestionIdRef = useRef(question?.id);

  // Load cached optimization from persistent storage
  useEffect(() => {
    const loadCachedOptimization = () => {
      if (!question?.id) return;

      setIsLoadingFromStorage(true);
      try {
        const stored = localStorage.getItem(`optimization:${question.id}`);
        if (stored) {
          const cached = JSON.parse(stored) as OptimizedResult;
          setOptimizedResult(cached);
          optimizationCache.set(
            getCacheKey(question.id, currentCode || ""),
            cached
          );
          if (currentCode) {
            const normalizedUser = normalizeCode(currentCode);
            const normalizedOptimal = normalizeCode(cached.code);
            setIsOptimalMatch(normalizedUser === normalizedOptimal);
          }
        }
      } catch {
        // Key doesn't exist or parsing error - this is fine
        console.log("No cached optimization found");
      } finally {
        setIsLoadingFromStorage(false);
      }
    };

    loadCachedOptimization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);

  // Reset state when question changes
  useEffect(() => {
    if (question?.id !== lastQuestionIdRef.current) {
      lastQuestionIdRef.current = question?.id;
      setOptimizedResult(null);
      setIsOptimalMatch(false);
      setOptimizationError(null);
      setShowDiff(false);
    }
  }, [question?.id]);

  // Track user progress
  const trackProgress = (action: "seen" | "applied") => {
    if (!question?.id) return;

    try {
      const progressKey = "user-progress:optimizations";
      let progress: UserProgress;

      try {
        const stored = localStorage.getItem(progressKey);
        progress = stored
          ? JSON.parse(stored)
          : {
              totalOptimizationsSeen: 0,
              totalApplied: 0,
              questionsCompleted: [],
              lastUpdated: new Date().toISOString(),
            };
      } catch {
        progress = {
          totalOptimizationsSeen: 0,
          totalApplied: 0,
          questionsCompleted: [],
          lastUpdated: new Date().toISOString(),
        };
      }

      if (action === "seen") {
        progress.totalOptimizationsSeen++;
        if (!progress.questionsCompleted.includes(question.id)) {
          progress.questionsCompleted.push(question.id);
        }
      } else if (action === "applied") {
        progress.totalApplied++;
      }

      progress.lastUpdated = new Date().toISOString();
      localStorage.setItem(progressKey, JSON.stringify(progress));
    } catch (error) {
      console.error("Failed to track progress:", error);
    }
  };

  const normalizeCode = (code: string) => {
    return code
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .join("\n");
  };

  const handleOptimize = async () => {
    if (!question || !currentCode) return;

    // Check memory cache first
    const cacheKey = getCacheKey(question.id, currentCode);
    const cached = optimizationCache.get(cacheKey);
    if (cached) {
      setOptimizedResult(cached);
      checkIfOptimal(currentCode, cached.code);
      return;
    }

    setIsOptimizing(true);
    setOptimizationError(null);

    try {
      const result = await optimizeSolution(question, currentCode);
      if (result) {
        setOptimizedResult(result);
        optimizationCache.set(cacheKey, result);

        // Persist to storage
        localStorage.setItem(
          `optimization:${question.id}`,
          JSON.stringify(result)
        );

        checkIfOptimal(currentCode, result.code);
        trackProgress("seen");
        toast.success("Optimal solution generated!");
      } else {
        setOptimizationError(
          "Could not generate optimization. The AI service may be unavailable."
        );
      }
    } catch (error) {
      setOptimizationError("Optimization failed. Please try again.");
      console.error("Optimization error:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const checkIfOptimal = (userCode: string, optimalCode: string) => {
    const normalizedUser = normalizeCode(userCode);
    const normalizedOptimal = normalizeCode(optimalCode);
    setIsOptimalMatch(normalizedUser === normalizedOptimal);
  };

  const handleCopy = async () => {
    if (optimizedResult?.code) {
      try {
        await navigator.clipboard.writeText(optimizedResult.code);
        toast.success("Code copied to clipboard");
      } catch {
        toast.error("Failed to copy code");
      }
    }
  };

  const handleApply = () => {
    if (optimizedResult?.code && onApplyOptimizedCode) {
      onApplyOptimizedCode(optimizedResult.code);
      trackProgress("applied");
      toast.success("Optimized code applied!");
    }
  };

  const handleRetry = () => {
    setOptimizationError(null);
    handleOptimize();
  };

  const renderDiff = () => {
    if (!currentCode || !optimizedResult?.code) return null;

    const changes: Change[] = diffLines(currentCode, optimizedResult.code);

    return (
      <div className="space-y-1">
        {changes.map((change, index) => {
          if (change.added) {
            return (
              <pre
                key={index}
                className="bg-green-500/10 border-l-2 border-green-500 px-3 py-1 text-xs font-mono text-green-700 dark:text-green-300"
              >
                + {change.value}
              </pre>
            );
          }
          if (change.removed) {
            return (
              <pre
                key={index}
                className="bg-red-500/10 border-l-2 border-red-500 px-3 py-1 text-xs font-mono text-red-700 dark:text-red-300"
              >
                - {change.value}
              </pre>
            );
          }
          return (
            <pre
              key={index}
              className="px-3 py-1 text-xs font-mono text-muted-foreground"
            >
              {change.value}
            </pre>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="h-full border-none shadow-none flex flex-col">
      <Tabs defaultValue="output" className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="testcases">
              Test Cases
              {testCaseResults.size > 0 && (
                <span className="ml-1 text-xs">
                  (
                  {
                    Array.from(testCaseResults.values()).filter(
                      (r) => r.status === "passed"
                    ).length
                  }
                  /{testCaseResults.size})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="solution"
              disabled={!isRevealed && runResult.status !== "correct"}
            >
              Solution{" "}
              {!isRevealed && runResult.status !== "correct" && "(Locked)"}
            </TabsTrigger>
            {optimizedResult && (
              <TabsTrigger value="optimized" className="text-green-500">
                ✨ Optimized
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="output" className="flex-1 p-0 m-0 relative min-h-0">
          <ScrollArea className="h-full p-4">
            {runResult.status === "not_run" ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                <p>Run your code to see output.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Result Badge / Status */}
                <div
                  className={`flex items-center gap-2 p-3 rounded-md ${
                    runResult.status === "correct"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : runResult.status === "incorrect"
                      ? "bg-red-500/10 text-red-600 dark:text-red-400"
                      : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                  }`}
                  role="status"
                  aria-live="polite"
                  aria-label={`Test result: ${runResult.status}`}
                >
                  {runResult.status === "correct" && (
                    <CheckCircle className="h-5 w-5" aria-hidden="true" />
                  )}
                  {runResult.status === "incorrect" && (
                    <XCircle className="h-5 w-5" aria-hidden="true" />
                  )}
                  {runResult.status === "error" && (
                    <WarningCircle className="h-5 w-5" aria-hidden="true" />
                  )}

                  <span className="font-semibold uppercase text-sm">
                    {runResult.status === "correct"
                      ? "Accepted"
                      : runResult.status === "incorrect"
                      ? "Wrong Answer"
                      : "Runtime Error"}
                  </span>

                  {/* Suggest Optimal Solution Button */}
                  {runResult.status === "correct" &&
                    !optimizedResult &&
                    !isLoadingFromStorage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto text-xs"
                        onClick={handleOptimize}
                        disabled={isOptimizing}
                        aria-label="Get optimal solution suggestion"
                      >
                        {isOptimizing ? (
                          <>
                            <SpinnerGap
                              className="h-3 w-3 mr-1 animate-spin"
                              aria-hidden="true"
                            />
                            Optimizing...
                          </>
                        ) : (
                          <>
                            <Sparkle
                              weight="duotone"
                              className="h-3 w-3 mr-1"
                              aria-hidden="true"
                            />
                            Suggest Optimal
                          </>
                        )}
                      </Button>
                    )}

                  {isLoadingFromStorage && (
                    <Skeleton className="ml-auto h-7 w-32" />
                  )}
                </div>

                {/* Optimization Error */}
                {optimizationError && (
                  <Alert variant="destructive">
                    <WarningCircle className="h-4 w-4" />
                    <AlertTitle>Optimization Failed</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span>{optimizationError}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        className="ml-2"
                      >
                        <ArrowCounterClockwise className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {runResult.message && (
                  <p className="text-sm font-medium">{runResult.message}</p>
                )}

                {/* Standard Output */}
                {runResult.stdout && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                      Standard Output
                    </h4>
                    <pre className="bg-muted p-3 rounded-md text-xs font-mono whitespace-pre-wrap">
                      {runResult.stdout}
                    </pre>
                  </div>
                )}

                {/* Standard Error */}
                {runResult.stderr && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-red-500 mb-1">
                      Error Output
                    </h4>
                    <pre className="bg-destructive/10 text-destructive p-3 rounded-md text-xs font-mono whitespace-pre-wrap">
                      {runResult.stderr}
                    </pre>
                  </div>
                )}

                {/* AI Feedback */}
                {runResult.status !== "correct" && (
                  <Alert>
                    <WarningCircle className="h-4 w-4" />
                    <AlertTitle>Feedback</AlertTitle>
                    <AlertDescription>
                      {runResult.status === "error"
                        ? "It seems there is a syntax or runtime error in your code. Check the error message above."
                        : "Your output did not match the expected output. Double check your logic."}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Test Cases Tab */}
        <TabsContent
          value="testcases"
          className="flex-1 p-0 m-0 min-h-0 flex flex-col"
        >
          {question?.testCases && (
            <TestCasesPanel
              testCases={question.testCases}
              results={testCaseResults}
              onRunAll={onRunAllTests || (() => {})}
              onRunSingle={onRunSingleTest || (() => {})}
              isRunning={isRunningTests}
              runningIndex={runningTestIndex}
            />
          )}
        </TabsContent>

        <TabsContent value="solution" className="flex-1 p-0 m-0 min-h-0">
          <ScrollArea className="h-full p-4">
            {isRevealed || runResult.status === "correct" ? (
              <div>
                <h3 className="font-semibold mb-2">Reference Solution</h3>
                <pre className="bg-muted p-4 rounded-md text-sm font-mono whitespace-pre-wrap">
                  {question?.referenceSolution}
                </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                Solution is hidden.
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Optimized Solution Tab */}
        {optimizedResult && (
          <TabsContent value="optimized" className="flex-1 p-0 m-0 min-h-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkle
                      weight="duotone"
                      className="h-4 w-4 text-green-500"
                      aria-hidden="true"
                    />
                    Optimized Solution
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      <Copy weight="bold" className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    {onApplyOptimizedCode && !isOptimalMatch && (
                      <Button size="sm" onClick={handleApply}>
                        <ArrowRight weight="bold" className="h-3 w-3 mr-1" />
                        Apply to Editor
                      </Button>
                    )}
                  </div>
                </div>

                {isOptimalMatch ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center space-y-3">
                    <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-600">
                      <CheckCircle weight="fill" className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-green-700 dark:text-green-400">
                      Perfect Match!
                    </h4>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Your solution is already identical to the optimized
                      version. Excellent work! 🎉
                    </p>
                    <div className="pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground text-xs"
                        onClick={() => setIsOptimalMatch(false)}
                      >
                        Show code anyway
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {currentCode && (
                      <div className="flex justify-end mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDiff(!showDiff)}
                        >
                          {showDiff ? "Show Code" : "Show Diff"}
                        </Button>
                      </div>
                    )}

                    {showDiff ? (
                      <div className="bg-muted p-4 rounded-md overflow-x-auto">
                        {renderDiff()}
                      </div>
                    ) : (
                      <pre className="bg-muted p-4 rounded-md text-sm font-mono whitespace-pre-wrap">
                        {optimizedResult.code}
                      </pre>
                    )}
                  </>
                )}

                {/* Complexity Comparison */}
                {optimizedResult.complexityComparison && (
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                    <h4 className="font-semibold mb-3 text-sm">
                      Performance Comparison
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-2">
                          Your Solution
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Time:</span>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {optimizedResult.complexityComparison.user.time}
                            </code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Space:
                            </span>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {optimizedResult.complexityComparison.user.space}
                            </code>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-green-600 dark:text-green-400 mb-2">
                          Optimized
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Time:</span>
                            <code className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded">
                              {
                                optimizedResult.complexityComparison.optimized
                                  .time
                              }
                            </code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Space:
                            </span>
                            <code className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded">
                              {
                                optimizedResult.complexityComparison.optimized
                                  .space
                              }
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-sm">
                  <h4 className="font-semibold mb-1">What&apos;s improved:</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    {optimizedResult.keyImprovements.map((imp, i) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>

                <p className="text-sm text-muted-foreground">
                  {optimizedResult.explanation}
                </p>
              </div>
            </ScrollArea>
          </TabsContent>
        )}
      </Tabs>
    </Card>
  );
}
