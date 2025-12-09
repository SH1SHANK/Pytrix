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
  ArrowCounterClockwise,
  SpinnerGap,
  ArrowsClockwise,
  Question as QuestionIcon,
} from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { QuestionPanel } from "@/components/practice/QuestionPanel";
import { CodeEditorPanel } from "@/components/practice/CodeEditorPanel";
import { OutputPanel } from "@/components/practice/OutputPanel";
// AutoModeStatsBar removed (replaced by V2)
import { HelpSheet } from "@/components/help/HelpSheet";
import { RuntimeStatusBar } from "@/components/practice/RuntimeStatusBar";
import { Kbd } from "@/components/ui/kbd";

// AI Client (uses API routes with user's API key)
import {
  generateQuestion,
  revealSolution, // was generateSolution
  getHints, // was generateHint
  evaluateCode,
} from "@/lib/aiClient";

// Question Service for topic-select mode
import { getTemplateQuestion } from "@/lib/questionService";

// Question Buffer Service
import {
  initBuffer,
  nextQuestion as bufferNextQuestion,
} from "@/lib/questionBufferService";

// Python Runtime
import { runPython, isRuntimeReady } from "@/lib/pythonRuntime";

// Auto Mode V2 Imports
import {
  loadAutoRunV2,
  getCurrentQueueEntry,
  recordAttemptV2,
  advanceQueue,
} from "@/lib/autoModeServiceV2";
import { type AutoRunV2 } from "@/lib/autoRunTypes";
import { AutoModeStatsBarV2 } from "@/components/automode/AutoModeStatsBarV2";

// History tracking
import { upsertHistoryEntry, getHistoryEntry } from "@/lib/historyStore";

function PracticeWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { incrementSolved, incrementAttempts } = usePractice();

  const mode = searchParams.get("mode");
  const topicId = searchParams.get("topic") || "Strings";
  const saveId = searchParams.get("saveId");
  const historyId = searchParams.get("historyId"); // For review mode
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _moduleParam = searchParams.get("module"); // For manual mode
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _subtopicParam = searchParams.get("subtopic"); // For manual mode
  const problemTypeParam = searchParams.get("problemType"); // For topic-select/manual mode
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

  // Auto Mode V2 state
  const [saveFile, setSaveFile] = useState<AutoRunV2 | null>(null);

  // Session limit tracking

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

  // Load save file for Auto Mode V2
  useEffect(() => {
    if (mode === "auto" && saveId) {
      const run = loadAutoRunV2(saveId);
      if (run) {
        setSaveFile(run);
      } else {
        toast.error("Auto run not found. Redirecting...");
        router.push("/practice/auto");
      }
    }
  }, [mode, saveId, router]);

  // Review mode: Load question from history
  useEffect(() => {
    if (mode === "review" && historyId) {
      const entry = getHistoryEntry(historyId);
      if (entry) {
        // Reconstruct question object from history entry
        const restoredQuestion: Question = {
          id: entry.questionId,
          topicId: entry.topic.toLowerCase(),
          topicName: entry.topic,
          topic: entry.topic,
          difficulty: entry.difficulty || "beginner",
          title: entry.questionTitle,
          description: entry.questionText,
          inputDescription: "",
          outputDescription: "",
          constraints: [],
          sampleInput: entry.sampleInput || "",
          sampleOutput: entry.sampleOutput || "",
          starterCode: entry.codeSnapshot,
          referenceSolution: null,
          testCases: [],
        };

        setQuestion(restoredQuestion);
        setCode(entry.codeSnapshot);
        setCurrentDifficulty(entry.difficulty || "beginner");
        setIsLoading(false);
        toast.info(`Reviewing: ${entry.questionTitle}`);
      } else {
        toast.error("History entry not found");
        router.push("/history");
      }
    }
  }, [mode, historyId, router]);

  // Topic-select mode: Load question from sessionStorage or generate new
  useEffect(() => {
    if (mode !== "topic-select") return;
    if (!problemTypeParam) {
      toast.error("No problem type specified");
      router.push("/practice/manual");
      return;
    }

    // Try to load from sessionStorage first
    const pending = sessionStorage.getItem("pendingQuestion");
    if (pending) {
      try {
        const { question: pendingQ } = JSON.parse(pending);
        setQuestion(pendingQ);
        setCode(
          pendingQ.starterCode ||
            `def solve(input_data):\n    # Write your solution here\n    pass`
        );
        sessionStorage.removeItem("pendingQuestion");
        setIsLoading(false);
        toast.info(`Practice: ${pendingQ.title}`);
        return;
      } catch {
        // Fall through to generate
      }
    }

    // Generate from problemTypeParam
    const newQ = getTemplateQuestion(problemTypeParam, currentDifficulty);
    if (newQ) {
      setQuestion(newQ);
      setCode(
        newQ.starterCode ||
          `def solve(input_data):\n    # Write your solution here\n    pass`
      );
      setIsLoading(false);
      toast.info(`Practice: ${newQ.title}`);
    } else {
      toast.error("Failed to generate question");
      router.push("/practice/manual");
    }
  }, [mode, problemTypeParam, currentDifficulty, router]);

  // Load Question via Buffer Service
  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);

      try {
        let targetTopic = topicId;
        const targetDiff: DifficultyLevel = currentDifficulty;
        const bufferMode = mode === "auto" ? "auto" : "manual";

        // For Auto Mode, get topic from V2 save file
        if (mode === "auto" && saveFile) {
          const entry = getCurrentQueueEntry(saveFile);
          // If queue is exhausted or corrupted, default to strings
          if (entry) {
            targetTopic = entry.problemTypeId; // Use ID for fetch
          } else {
            targetTopic = "reverse-string";
          }
        }

        // Use buffer service - gets first question immediately, prefetches in background
        const newQuestion = await initBuffer(
          bufferMode,
          targetTopic,
          targetDiff
        );

        if (!newQuestion) {
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

    // Only load if we have what we need (skip if review or topic-select mode)
    if (mode === "review" || mode === "topic-select") {
      // These modes handled by separate effects
      return;
    }

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

        // Log to history
        upsertHistoryEntry({
          mode: mode === "auto" ? "auto" : "manual",
          topic: question.topic,
          difficulty: currentDifficulty,
          questionId: question.id,
          questionTitle: question.title,
          questionText: question.description,
          codeSnapshot: code,
          wasSubmitted: true,
          wasCorrect: true,
          executedAt: Date.now(),
          runId: saveId || null,
          sampleInput: question.sampleInput,
          sampleOutput: question.sampleOutput,
        });

        // Update Auto Mode V2 Logic
        if (mode === "auto" && saveFile) {
          // Record success
          const updated = recordAttemptV2(
            saveFile,
            "correct",
            lastExecutionTimeMs || 0
          );
          // Advance queue regardless of rotation (V2 is strict queue based)
          const advanced = advanceQueue(updated);
          setSaveFile(advanced);
        }
      } else {
        // Log incorrect attempt to history
        upsertHistoryEntry({
          mode: mode === "auto" ? "auto" : "manual",
          topic: question.topic,
          difficulty: currentDifficulty,
          questionId: question.id,
          questionTitle: question.title,
          questionText: question.description,
          codeSnapshot: code,
          wasSubmitted: true,
          wasCorrect: false,
          executedAt: Date.now(),
          runId: saveId || null,
          sampleInput: question.sampleInput,
          sampleOutput: question.sampleOutput,
        });

        // Update Auto Mode V2 Logic (Failure)
        if (mode === "auto" && saveFile) {
          const updated = recordAttemptV2(
            saveFile,
            "incorrect",
            lastExecutionTimeMs || 0
          );
          setSaveFile(updated);
        }

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

    // Auto Mode V2: strictly follows queue
    if (mode === "auto" && saveFile) {
      // Logic: we assume user is clicking next *after* solving?
      // Or skipping? If skipping, we might need a skip handler.
      // Assuming this is "Next Question" button which usually appears after success.
      // In V2, success update already advances queue.
      // So here we just need to get the NEW current topic.
      // But wait, if handleNext is manual skip...
      // If runResult.status === 'correct', we likely already advanced queue in handleRun.
      // If we are skipping, we should call advanceQueue explicitly.

      // Check if we are already advanced (handled in handleRun?)
      // Actually previous code only advanced if shouldRotateTopic.
      // In V2, every question is a step.
      // If handleRun executed and was correct, it CALLED advanceQueue.
      // So saveFile is ALREADY pointing to next question.
      // WE just need to read it.

      const entry = getCurrentQueueEntry(saveFile);
      if (entry) {
        targetTopic = entry.problemTypeId;
      }
    }

    // Use buffered question - instant if available
    const nextQ = await bufferNextQuestion(
      bufferMode,
      targetTopic,
      currentDifficulty
    );

    if (!nextQ) {
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
    // Topic-select mode: use questionService template
    if (mode === "topic-select" && problemTypeParam) {
      setIsLoading(true);
      try {
        const newQ = getTemplateQuestion(problemTypeParam, currentDifficulty);
        if (newQ) {
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
        } else {
          toast.error("Failed to regenerate question.");
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

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
        const entry = getCurrentQueueEntry(saveFile);
        if (!entry) throw new Error("Queue exhausted");

        const newQ = await generateQuestion(
          entry.problemTypeId,
          currentDifficulty
        );

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

  // if (isLoading || !question) removed to allow Skeleton rendering

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Auto Mode Stats Bar V2 */}
      {mode === "auto" && saveFile && (
        <AutoModeStatsBarV2 run={saveFile} onRunUpdate={setSaveFile} />
      )}

      {/* Top Bar */}
      <header className="h-14 border-b flex items-center px-4 justify-between bg-card text-card-foreground">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <span className="font-semibold truncate max-w-[200px] md:max-w-md">
            {question ? question.title : <Skeleton className="h-5 w-48" />}
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
                  <ArrowsClockwise className="h-4 w-4 mr-2" /> New
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
                  <ArrowCounterClockwise className="h-4 w-4 mr-2" /> Reset
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

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={handleRun}
                  disabled={isRunning || runResult.status === "correct"}
                >
                  {isRunning ? (
                    <SpinnerGap className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Run & Check
                </Button>
              </TooltipTrigger>
              <TooltipContent className="flex items-center gap-1">
                Run Code
                <div className="flex items-center gap-0.5 ml-1">
                  <Kbd>Ctrl</Kbd>{" "}
                  <span className="text-muted-foreground">+</span>{" "}
                  <Kbd>Enter</Kbd>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

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
          <ResizablePanel defaultSize={40} minSize={30}>
            <QuestionPanel question={question} isLoading={isLoading} />
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
