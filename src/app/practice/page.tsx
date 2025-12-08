"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePractice } from "@/app/PracticeContext";
import { Question, RunResult, DifficultyLevel } from "@/lib/types";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Play,
  FastForward,
  Lightbulb,
  Lock,
  RotateCcw,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { QuestionPanel } from "@/components/practice/QuestionPanel";
import { CodeEditorPanel } from "@/components/practice/CodeEditorPanel";
import { OutputPanel } from "@/components/practice/OutputPanel";
import { AutoModeStatsBar } from "@/components/automode/AutoModeStatsBar";
import { HelpSheet } from "@/components/help/HelpSheet";
import { Question as QuestionIcon } from "@phosphor-icons/react";
import { RuntimeStatusBar } from "@/components/practice/RuntimeStatusBar";

// AI Actions
import { generateQuestion } from "@/lib/ai/generateQuestion";
import { evaluateCode } from "@/lib/ai/evaluateCode";
import { getHints } from "@/lib/ai/getHints";
import { revealSolution } from "@/lib/ai/revealSolution";

// Question Buffer Service
import {
  initBuffer,
  nextQuestion as bufferNextQuestion,
} from "@/lib/questionBufferService";

// Python Runtime
import { runPython, initPyodide, isRuntimeReady } from "@/lib/pythonRuntime";

import {
  loadSaveFile,
  getCurrentTopic,
  recordQuestionCompleted,
  shouldRotateTopic,
  advanceTopic,
  AutoModeSaveFile,
} from "@/lib/autoModeService";

function PracticeWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { incrementSolved, incrementAttempts } = usePractice();

  const mode = searchParams.get("mode");
  const topicId = searchParams.get("topic") || "Strings";
  const saveId = searchParams.get("saveId");
  const difficultyParam = searchParams.get(
    "difficulty"
  ) as DifficultyLevel | null;

  // Current difficulty for this session (defaults to beginner)
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>(
    difficultyParam || "beginner"
  );

  // Core state
  const [question, setQuestion] = useState<Question | null>(null);
  const [code, setCode] = useState<string>("");
  const [runResult, setRunResult] = useState<RunResult>({
    status: "not_run",
    stdout: "",
    stderr: "",
  });
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isSolutionRevealed, setIsSolutionRevealed] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [lastExecutionTimeMs, setLastExecutionTimeMs] = useState<number | null>(
    null
  );

  // Auto Mode state
  const [saveFile, setSaveFile] = useState<AutoModeSaveFile | null>(null);

  // Session limit tracking
  const [sessionLimitReached, setSessionLimitReached] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to run
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!isRunning && runResult.status !== "correct" && question) {
          handleRun();
        }
      }
      // Ctrl/Cmd + Shift + H for hint
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "h"
      ) {
        e.preventDefault();
        if (hintsUsed < 2 && question) {
          handleHint();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, isRunning, runResult.status, hintsUsed]);

  // Load save file for Auto Mode
  useEffect(() => {
    if (mode === "auto" && saveId) {
      const file = loadSaveFile(saveId);
      if (file) {
        setSaveFile(file);
      } else {
        toast.error("Save file not found. Redirecting...");
        router.push("/");
      }
    }
  }, [mode, saveId, router]);

  // Load Question via Buffer Service
  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);

      try {
        let targetTopic = topicId;
        const targetDiff: DifficultyLevel = currentDifficulty;
        const bufferMode = mode === "auto" ? "auto" : "manual";

        // For Auto Mode, get topic from save file
        if (mode === "auto" && saveFile) {
          targetTopic = getCurrentTopic(saveFile);
        }

        // Use buffer service - gets first question immediately, prefetches in background
        const newQuestion = await initBuffer(
          bufferMode,
          targetTopic,
          targetDiff
        );

        if (!newQuestion) {
          setSessionLimitReached(true);
          toast.error("Session limit reached. Please try again later.");
          if (isMounted) setIsLoading(false);
          return;
        }

        if (isMounted) {
          setQuestion(newQuestion);
          setCode(
            newQuestion.starterCode ||
              `def solve(input_data):\n    # Write your solution here\n    pass`
          );
          setRunResult({ status: "not_run", stdout: "", stderr: "" });
          setFailedAttempts(0);
          setIsSolutionRevealed(false);
          setHintsUsed(0);
          toast.info(`Generated: ${newQuestion.title}`);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to generate question. Try refreshing.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    // Only load if we have what we need
    if (mode === "auto") {
      if (saveFile) load();
    } else {
      load();
    }

    return () => {
      isMounted = false;
    };
  }, [mode, topicId, saveFile, currentDifficulty]);

  const handleRun = async () => {
    if (!question) return;

    setIsRunning(true);
    incrementAttempts(question.topic, false, currentDifficulty); // Record attempt first

    // Step 1: Execute in Pyodide
    toast.info("Running code...");
    let executionOutput = "";
    let executionError = "";
    let executionSuccess = false;

    if (isRuntimeReady()) {
      const execResult = await runPython(code);
      executionSuccess = execResult.success;
      executionOutput = execResult.stdout;
      executionError = execResult.stderr || execResult.error || "";

      if (execResult.traceback) {
        executionError = execResult.traceback;
      }

      // Store execution time for status bar
      setLastExecutionTimeMs(execResult.executionTimeMs);

      // Show raw output immediately
      setRunResult({
        status: executionSuccess ? "not_run" : "error",
        stdout: executionOutput,
        stderr: executionError,
        message: executionSuccess
          ? `Executed in ${execResult.executionTimeMs.toFixed(0)}ms`
          : "Runtime error",
      });

      if (!executionSuccess) {
        setFailedAttempts((prev) => prev + 1);
        toast.error("Runtime error. Check the output.");
        setIsRunning(false);
        return;
      }
    } else {
      toast.info("Python runtime initializing, using AI evaluation...");
    }

    // Step 2: LLM Evaluation (with execution context if available)
    toast.info("Checking solution...");
    try {
      // Pass execution output to evaluator for context
      const result = await evaluateCode(question, code, {
        stdout: executionOutput,
        stderr: executionError,
        didExecute: isRuntimeReady(),
      });

      setRunResult({
        status: result.status,
        stdout:
          executionOutput ||
          (result.expectedBehavior
            ? `Expected: ${result.expectedBehavior}`
            : ""),
        stderr:
          executionError ||
          (result.status === "error" ? result.explanation : ""),
        message: result.explanation,
      });

      if (result.status === "correct") {
        toast.success("Correct! " + result.explanation);
        incrementSolved(question.topic, currentDifficulty);

        // Update save file for Auto Mode
        if (mode === "auto" && saveFile) {
          const updated = recordQuestionCompleted(saveFile.id, question.topic);
          if (updated) {
            setSaveFile(updated);

            // Check if we should rotate to next topic
            if (shouldRotateTopic(updated)) {
              const rotated = advanceTopic(updated);
              setSaveFile(rotated);
            }
          }
        }
      } else {
        setFailedAttempts((prev) => prev + 1);
        toast.error("Incorrect. Check the feedback.");
        if (result.nextHint) {
          toast("Hint: " + result.nextHint);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Evaluation failed.");
      setRunResult({
        status: "error",
        stdout: executionOutput,
        stderr: executionError || "Failed to connect to AI evaluator.",
        message: "Network error.",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleHint = async () => {
    if (!question) return;
    const nextLimit = hintsUsed + 1;
    toast.info(`Generating hint (${nextLimit}/2)...`);

    try {
      const hintObj = await getHints(question, code, hintsUsed);

      toast("AI Hint: " + hintObj.hint, {
        duration: 8000,
        icon: <Lightbulb className="h-4 w-4 text-yellow-500" />,
      });

      setHintsUsed(nextLimit);
    } catch {
      toast.error("Could not get hint.");
    }
  };

  const handleReveal = async () => {
    if (!question) return;

    try {
      const { referenceSolution } = await revealSolution(
        question,
        failedAttempts
      );
      setIsSolutionRevealed(true);
      setQuestion((prev) =>
        prev ? { ...prev, referenceSolution: referenceSolution } : null
      );

      toast.warning("Solution revealed!");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Cannot reveal solution yet.";
      toast.error(message);
    }
  };

  const handleNext = async () => {
    const bufferMode = mode === "auto" ? "auto" : "manual";
    let targetTopic = topicId;

    // For Auto Mode, handle topic rotation
    if (mode === "auto" && saveFile) {
      // Check if we should rotate to next topic
      if (shouldRotateTopic(saveFile)) {
        const rotated = advanceTopic(saveFile);
        setSaveFile(rotated);
      }
      targetTopic = getCurrentTopic(saveFile);
    }

    // Use buffered question - instant if available
    const nextQ = await bufferNextQuestion(
      bufferMode,
      targetTopic,
      currentDifficulty
    );

    if (!nextQ) {
      setSessionLimitReached(true);
      toast.error("Session limit reached. No more questions available.");
      return;
    }

    setQuestion(nextQ);
    setCode(
      nextQ.starterCode ||
        `def solve(input_data):\n    # Write your solution here\n    pass`
    );
    setRunResult({ status: "not_run", stdout: "", stderr: "" });
    setFailedAttempts(0);
    setIsSolutionRevealed(false);
    setHintsUsed(0);
    setLastExecutionTimeMs(null);
    toast.info(`Next: ${nextQ.title}`);
  };

  const handleRegenerate = async () => {
    if (!saveFile && mode !== "auto") {
      // Manual mode regenerate
      setIsLoading(true);
      try {
        const newQ = await generateQuestion(topicId, currentDifficulty);
        setQuestion(newQ);
        setCode(
          newQ.starterCode ||
            `def solve(input_data):\n    # Write your solution here\n    pass`
        );
        setRunResult({ status: "not_run", stdout: "", stderr: "" });
        setFailedAttempts(0);
        setIsSolutionRevealed(false);
        setHintsUsed(0);
        toast.info(`Regenerated: ${newQ.title}`);
      } catch (err) {
        console.error(err);
        toast.error("Failed to regenerate question.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (mode === "auto" && saveFile) {
      setIsLoading(true);
      try {
        const currentTopic = getCurrentTopic(saveFile);
        const newQ = await generateQuestion(currentTopic, currentDifficulty);

        setQuestion(newQ);
        setCode(
          newQ.starterCode ||
            `def solve(input_data):\n    # Write your solution here\n    pass`
        );
        setRunResult({ status: "not_run", stdout: "", stderr: "" });
        setFailedAttempts(0);
        setIsSolutionRevealed(false);
        setHintsUsed(0);
        toast.info(`Regenerated: ${newQ.title}`);
      } catch (err) {
        console.error(err);
        toast.error("Failed to regenerate question.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isLoading || !question) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">
          Consulting the AI...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Auto Mode Stats Bar */}
      {mode === "auto" && saveFile && <AutoModeStatsBar saveFile={saveFile} />}

      {/* Top Bar */}
      <header className="h-14 border-b flex items-center px-4 justify-between bg-card text-card-foreground">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <span className="font-semibold truncate max-w-[200px] md:max-w-md">
            {question.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Regenerate Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> New
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate New Question</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCode(
                      `def solve(input_data):\n    # Write your solution here\n    pass`
                    )
                  }
                >
                  <RotateCcw className="h-4 w-4 mr-2" /> Reset
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset Code</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleHint}
                  disabled={hintsUsed >= 2}
                >
                  <Lightbulb className="h-4 w-4 mr-2" /> Hint ({hintsUsed}/2)
                </Button>
              </TooltipTrigger>
              <TooltipContent>Get AI Help</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={failedAttempts < 2 && !isSolutionRevealed}
              >
                <Lock className="h-4 w-4 mr-2" />{" "}
                {isSolutionRevealed ? "Solution Open" : "Reveal Solution"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  Revealing the solution will mark this attempt as unassisted
                  but you won&apos;t get full mastery points.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReveal}>
                  Reveal
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            size="sm"
            onClick={handleRun}
            disabled={isRunning || runResult.status === "correct"}
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run & Check
          </Button>

          {runResult.status === "correct" && (
            <Button size="sm" variant="default" onClick={handleNext}>
              Next <FastForward className="h-4 w-4 ml-2" />
            </Button>
          )}

          {/* Help Button */}
          <HelpSheet
            trigger={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Help and Settings"
              >
                <QuestionIcon weight="duotone" className="h-5 w-5" />
              </Button>
            }
          />
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left: Question */}
          <ResizablePanel defaultSize={30} minSize={20}>
            <QuestionPanel question={question} />
          </ResizablePanel>

          <ResizableHandle />

          {/* Right: Editor + Output */}
          <ResizablePanel defaultSize={70}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={60} minSize={30}>
                <div className="h-full flex flex-col">
                  <div className="flex-1">
                    <CodeEditorPanel
                      code={code}
                      onChange={(val) => setCode(val || "")}
                    />
                  </div>
                  {/* Runtime Status Bar - between editor and output */}
                  <RuntimeStatusBar executionTimeMs={lastExecutionTimeMs} />
                </div>
              </ResizablePanel>

              <ResizableHandle />

              <ResizablePanel defaultSize={40} minSize={20}>
                <OutputPanel
                  runResult={runResult}
                  question={question}
                  isRevealed={isSolutionRevealed}
                  currentCode={code}
                  onApplyOptimizedCode={(optimizedCode) =>
                    setCode(optimizedCode)
                  }
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

// Suspense wrapper for useSearchParams
export default function PracticePage() {
  return (
    <Suspense fallback={<div>Loading workspace...</div>}>
      <PracticeWorkspace />
    </Suspense>
  );
}
