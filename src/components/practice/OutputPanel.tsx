"use client";

import { useState, useRef } from "react";
import { RunResult, Question } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  WarningCircle,
  CheckCircle,
  XCircle,
  SpinnerGap,
  Sparkle,
  ArrowRight,
  Copy,
} from "@phosphor-icons/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { optimizeSolution } from "@/lib/ai/aiClient";

interface OutputPanelProps {
  runResult: RunResult;
  question: Question | null;
  isRevealed: boolean;
  currentCode?: string;
  onApplyOptimizedCode?: (code: string) => void;
}

// Simple cache for optimization results
const optimizationCache = new Map<
  string,
  { code: string; explanation: string; keyImprovements: string[] }
>();

function getCacheKey(questionId: string, code: string): string {
  return `${questionId}:${code.trim().slice(0, 200)}`;
}

export function OutputPanel({
  runResult,
  question,
  isRevealed,
  currentCode,
  onApplyOptimizedCode,
}: OutputPanelProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedResult, setOptimizedResult] = useState<{
    code: string;
    explanation: string;
    keyImprovements: string[];
  } | null>(null);
  const [isOptimalMatch, setIsOptimalMatch] = useState(false);

  // Reset state when question changes
  // Ideally, the parent should change the key of OutputPanel, but we can also react to ID change
  const lastQuestionIdRef = useRef(question?.id);
  if (question?.id !== lastQuestionIdRef.current) {
    lastQuestionIdRef.current = question?.id;
    setOptimizedResult(null);
    setIsOptimalMatch(false);
  }

  const normalizeCode = (code: string) => {
    return code
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#")) // Remove empty lines and comments
      .join("\n");
  };

  const handleOptimize = async () => {
    if (!question || !currentCode) return;

    // Check cache first
    const cacheKey = getCacheKey(question.id, currentCode);
    const cached = optimizationCache.get(cacheKey);
    if (cached) {
      setOptimizedResult(cached);
      checkIfOptimal(currentCode, cached.code);
      return;
    }

    setIsOptimizing(true);

    try {
      const result = await optimizeSolution(question, currentCode);
      if (result) {
        setOptimizedResult(result);
        optimizationCache.set(cacheKey, result);
        checkIfOptimal(currentCode, result.code);
        toast.success("Optimal solution generated!");
      } else {
        toast.error("Could not generate optimization.");
      }
    } catch {
      toast.error("Optimization failed.");
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
      toast.success("Optimized code applied!");
    }
  };

  return (
    <Card className="h-full border-none shadow-none flex flex-col">
      <Tabs defaultValue="output" className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="output">Output</TabsTrigger>
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
                >
                  {runResult.status === "correct" && (
                    <CheckCircle className="h-5 w-5" />
                  )}
                  {runResult.status === "incorrect" && (
                    <XCircle className="h-5 w-5" />
                  )}
                  {runResult.status === "error" && (
                    <WarningCircle className="h-5 w-5" />
                  )}

                  <span className="font-semibold uppercase text-sm">
                    {runResult.status === "correct"
                      ? "Accepted"
                      : runResult.status === "incorrect"
                      ? "Wrong Answer"
                      : "Runtime Error"}
                  </span>

                  {/* Suggest Optimal Solution Button - Only after correct */}
                  {runResult.status === "correct" && !optimizedResult && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-xs"
                      onClick={handleOptimize}
                      disabled={isOptimizing}
                    >
                      {isOptimizing ? (
                        <>
                          <SpinnerGap className="h-3 w-3 mr-1 animate-spin" />
                          Optimizing...
                        </>
                      ) : (
                        <>
                          <Sparkle weight="duotone" className="h-3 w-3 mr-1" />
                          Suggest Optimal
                        </>
                      )}
                    </Button>
                  )}
                </div>

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
                  <pre className="bg-muted p-4 rounded-md text-sm font-mono whitespace-pre-wrap">
                    {optimizedResult.code}
                  </pre>
                )}

                <div className="text-sm">
                  <h4 className="font-semibold mb-1">What&apos;s improved:</h4>
                  <ul className="list-disc list-inside text-muted-foreground">
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
