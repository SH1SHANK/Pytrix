"use client";

import React, { useEffect, useState, Suspense, useMemo } from "react";
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
  Play,
  FastForward,
  Lock,
  ArrowCounterClockwise,
  SpinnerGap,
  ArrowsClockwise,
  Question as QuestionIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { QuestionPanel } from "@/components/practice/QuestionPanel";
import { CodeEditorPanel } from "@/components/practice/CodeEditorPanel";
import { OutputPanel } from "@/components/practice/OutputPanel";
// PracticeHeader imported
import { PracticeHeader } from "@/components/practice/PracticeHeader";
import { HelpSheet } from "@/components/help/HelpSheet";
import { RuntimeStatusBar } from "@/components/practice/RuntimeStatusBar";
import { HintPanel } from "@/components/practice/HintPanel";

// AI Client (uses API routes with user's API key)
import {
  generateQuestion,
  revealSolution, // was generateSolution
  getHints, // was generateHint
  evaluateCode,
} from "@/lib/ai/aiClient";

// Question Service for topic-select mode
import { getTemplateQuestion } from "@/lib/question/questionService";

// Question Buffer Service
import {
  initBuffer,
  nextQuestion as bufferNextQuestion,
} from "@/lib/question/questionBufferService";

// Python Runtime
import { runPython, isRuntimeReady } from "@/lib/runtime/pythonRuntime";

// Auto Mode V2 Imports
import {
  loadAutoRunV2,
  getCurrentQueueEntry,
  recordAttemptV2,
  advanceQueue,
  skipToNextModule,
  getSubtopicDifficulty,
  isRepeatedSubtopic,
  getModuleNavigationItems,
  type NavigationItem,
} from "@/lib/auto-mode";
import { type AutoRunV2 } from "@/lib/auto-mode/autoRunTypes";

// History tracking
import { upsertHistoryEntry, getHistoryEntry } from "@/lib/stores/historyStore";
import {
  getManualStreak,
  incrementManualStreak,
  resetManualStreak,
} from "@/lib/stores/statsStore";

function PracticeWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { incrementSolved, incrementAttempts } = usePractice();
  // Manual streak state
  const [manualStreak, setManualStreak] = useState(0);

  // Initialize manual streak
  useEffect(() => {
    setManualStreak(getManualStreak());
  }, []);

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
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [lastExecutionTimeMs, setLastExecutionTimeMs] = useState<number | null>(
    null
  );
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);

  // Hint panel state
  const [hint1, setHint1] = useState<string | null>(null);
  const [hint2, setHint2] = useState<string | null>(null);

  // Reset hints when question changes
  useEffect(() => {
    setHint1(null);
    setHint2(null);
    setHintsUsed(0);
  }, [question?.id]);

  // Auto Mode V2 state
  const [saveFile, setSaveFile] = useState<AutoRunV2 | null>(null);

  // Session limit tracking

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Auto Mode: Shift + Enter for unified run/next
      if (
        mode === "auto" &&
        e.shiftKey &&
        e.key === "Enter" &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        e.preventDefault();
        if (runResult.status === "correct") {
          // Advance to next question
          handleNext();
        } else if (!isRunning && question) {
          // Submit current solution
          handleRun();
        }
        return;
      }

      // Manual/Review Mode: Ctrl/Cmd + Enter to run
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && mode !== "auto") {
        e.preventDefault();
        if (!isRunning && runResult.status !== "correct" && question) {
          handleRun();
        }
      }
      // Removed: Hint keyboard shortcut - hints are now accessed via the HintPanel
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, isRunning, runResult.status, mode]);

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
        let targetTopic = problemTypeParam || topicId;
        const targetDiff: DifficultyLevel = currentDifficulty;
        const bufferMode = mode === "auto" ? "auto" : "manual";

        // For Auto Mode, get topic from V2 save file
        if (mode === "auto" && saveFile) {
          const entry = getCurrentQueueEntry(saveFile);
          // If queue is exhausted or corrupted, default to strings
          if (entry) {
            targetTopic = entry.subtopicId; // Use subtopic ID for fetch
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
          // Sync difficulty state to match question (ensures UI consistency)
          setCurrentDifficulty(newQuestion.difficulty as DifficultyLevel);
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
  }, [mode, topicId, saveFile, currentDifficulty, problemTypeParam]);

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
          runId: saveFile?.id || saveId || null,
          sampleInput: question.sampleInput,
          sampleOutput: question.sampleOutput,
        });

        // Manual Mode Streak Logic
        if (mode !== "auto") {
          const isPerfect = hintsUsed === 0 && !isSolutionRevealed;
          if (isPerfect) {
            const newStreak = incrementManualStreak();
            setManualStreak(newStreak);
          } else {
            // Assisted solve: streak doesn't increment, but doesn't necessarily reset if we only count "wrong" as reset
            // Requirement: "Increment currentStreak only when... Solution revealed before submission -> mark as 'assisted'."
            // Requirement: "Reset... when User Submits and answer is incorrect... OR User reveals full solution before correct Submit"
            // If we are here, status is "correct". If revealed, we should have reset ALREADY when revealed?
            // Let's safe-guard: if revealed, it's assisted. Streak stays same.
          }
        }

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

        // Manual Mode Streak Logic (Failure)
        if (mode !== "auto") {
          resetManualStreak();
          setManualStreak(0);
        }

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

  /**
   * Request a hint for display in the HintPanel.
   * Replaces the old toast-based handleHint - hints now appear only in the dedicated panel.
   */
  const handleRequestHint = async (hintNumber: 1 | 2) => {
    if (!question) return;

    // Prevent requesting hint 2 before hint 1
    if (hintNumber === 2 && hint1 === null) return;

    setIsGeneratingHint(true);

    try {
      // hintsUsed tracks which hints have been unlocked (0 = none, 1 = first, 2 = both)
      const hintObj = await getHints(question, code, hintNumber - 1);

      if (hintNumber === 1) {
        setHint1(hintObj.hint);
      } else {
        setHint2(hintObj.hint);
      }

      setHintsUsed(hintNumber);
    } catch {
      // Show error only - no hint toast
      toast.error("Could not get hint. Please try again.");
    } finally {
      setIsGeneratingHint(false);
    }
  };

  const handleReveal = async () => {
    if (!question) return;

    try {
      const { referenceSolution } = await revealSolution(
        question,
        failedAttempts,
        hintsUsed
      );
      setIsSolutionRevealed(true);
      setQuestion((prev) =>
        prev ? { ...prev, referenceSolution: referenceSolution } : null
      );

      toast.warning("Solution revealed!");

      // Reset streak on reveal for manual mode
      if (mode !== "auto") {
        resetManualStreak();
        setManualStreak(0);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Cannot reveal solution yet.";
      toast.error(message);
    }
  };

  const handleNext = async () => {
    setIsLoadingNext(true);
    try {
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
          targetTopic = entry.subtopicId;
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
      // Sync difficulty state to match question (ensures UI consistency)
      setCurrentDifficulty(nextQ.difficulty as DifficultyLevel);
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
    } finally {
      setIsLoadingNext(false);
    }
  };

  /**
   * Skip Advanced question and move to next module.
   * Only available for Advanced difficulty in Auto Mode.
   * Does NOT affect streak or difficulty - purely neutral progression.
   */
  const handleSkipAdvanced = async () => {
    if (mode !== "auto" || !saveFile) return;

    // Verify this is an Advanced question
    const entry = getCurrentQueueEntry(saveFile);
    if (!entry) return;

    const currentDiff = getSubtopicDifficulty(saveFile, entry.subtopicId);
    if (currentDiff !== "advanced") {
      toast.error("Skip is only available for Advanced questions");
      return;
    }

    setIsLoadingNext(true);
    try {
      // Skip to next module (no streak/difficulty penalty)
      const updated = skipToNextModule(saveFile);
      setSaveFile(updated);

      // Load next question from the new module
      const nextEntry = getCurrentQueueEntry(updated);
      if (nextEntry) {
        const nextDiff = getSubtopicDifficulty(updated, nextEntry.subtopicId);
        const nextQ = await bufferNextQuestion(
          "auto",
          nextEntry.subtopicId,
          nextDiff
        );

        if (nextQ) {
          setQuestion(nextQ);
          setCurrentDifficulty(nextQ.difficulty as DifficultyLevel);
          setCode(
            nextQ.starterCode ||
              `def solve(input_data):\n    # Write your solution here\n    pass`
          );
          setRunResult({ status: "not_run", stdout: "", stderr: "" });
          setFailedAttempts(0);
          setIsSolutionRevealed(false);
          setHintsUsed(0);
          setLastExecutionTimeMs(null);
          toast.success("Skipped to next module - streak preserved! 🔥");
        }
      }
    } catch (err) {
      console.error("Skip failed:", err);
      toast.error("Failed to skip. Please try again.");
    } finally {
      setIsLoadingNext(false);
    }
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
        // Use problemTypeParam if available (specific archetype), otherwise fallback to topicId
        const targetTopic = problemTypeParam || topicId;
        const newQ = await generateQuestion(targetTopic, currentDifficulty);
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
          entry.subtopicId,
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

  // Auto Mode specific logic
  // Auto Mode specific logic
  const upcomingItems: NavigationItem[] = useMemo(() => {
    if (mode === "auto" && saveFile) {
      return getModuleNavigationItems(saveFile);
    }
    return [];
  }, [mode, saveFile]);

  const canSkip = useMemo(() => {
    if (mode !== "auto" || !saveFile || !question) return false;

    const isAdvanced = currentDifficulty === "advanced";
    // Actually question.topic usually stores subtopic ID or name. Let's assume subtopic ID for now or verify.
    // In AutoMode, question is generated with moduleId/subtopicId.
    // Actually question.topic is typically the name. saveFile entries have subtopicId.
    // We should use getCurrentQueueEntry(saveFile).subtopicId
    const currentEntry = getCurrentQueueEntry(saveFile);
    if (!currentEntry) return false;
    const isRepeatedById = isRepeatedSubtopic(
      saveFile,
      currentEntry.subtopicId
    );

    return isAdvanced || isRepeatedById;
  }, [mode, saveFile, question, currentDifficulty]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <PracticeHeader
        mode={
          mode === "auto"
            ? "auto"
            : mode === "review"
            ? "review"
            : mode === "topic-select"
            ? "topic-select"
            : "manual"
        }
        title={question ? question.title : "Practice"}
        breadcrumbs={[
          { label: "Practice", href: "/" },
          ...(mode === "auto" && saveFile
            ? [
                {
                  label:
                    getCurrentQueueEntry(saveFile)?.moduleName || "Auto Mode",
                  href: "/practice/auto",
                },
                {
                  label:
                    getCurrentQueueEntry(saveFile)?.subtopicName || "Topic",
                  isCurrent: true,
                },
              ]
            : [{ label: question?.topic || topicId, isCurrent: true }]),
        ]}
        difficulty={currentDifficulty}
        streak={mode === "auto" && saveFile ? saveFile.streak : manualStreak}
        run={saveFile}
        onRunUpdate={setSaveFile}
        upcomingItems={upcomingItems}
        actions={
          <>
            {/* Manual Mode / Topic Select Actions */}
            {mode !== "auto" && (
              <>
                {/* New Question */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerate}
                        disabled={isLoading}
                        className="hidden lg:flex h-8"
                      >
                        <ArrowsClockwise className="h-4 w-4 lg:mr-2" />
                        <span className="hidden lg:inline">New</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Generate New Question</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Reset Code */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCode(
                            question?.starterCode ||
                              "def solve(input_data):\n    # Write your solution here\n    pass"
                          )
                        }
                        className="hidden md:flex h-8"
                      >
                        <ArrowCounterClockwise className="h-4 w-4 lg:mr-2" />
                        <span className="hidden lg:inline">Reset</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset Code</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Hint button removed - hints are now in the HintPanel below the question */}

                {/* Reveal Solution */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={
                        failedAttempts < 2 &&
                        hintsUsed < 2 &&
                        !isSolutionRevealed
                      }
                      className="hidden sm:flex h-8"
                    >
                      <Lock className="h-4 w-4 lg:mr-2" />
                      <span className="hidden lg:inline">
                        {isSolutionRevealed ? "Open" : "Reveal"}
                      </span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Revealing the solution will mark this attempt as
                        unassisted but you won&apos;t get full mastery points.
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

                {/* Run Button (Manual) */}
                <Button
                  size="sm"
                  onClick={handleRun}
                  disabled={isRunning}
                  className="min-w-[80px] h-8"
                >
                  {isRunning ? (
                    <SpinnerGap className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 lg:mr-2" />
                  )}
                  <span className="hidden lg:inline">Run</span>
                </Button>

                {/* Help & Settings */}
                <div className="flex items-center gap-1 ml-2 border-l pl-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="h-8 w-8 text-muted-foreground"
                  >
                    <Link href="/settings">
                      <SpinnerGap className="h-4 w-4" />
                    </Link>
                  </Button>
                  <HelpSheet
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                      >
                        <QuestionIcon weight="duotone" className="h-4 w-4" />
                      </Button>
                    }
                  />
                </div>
              </>
            )}

            {/* Auto Mode Actions */}
            {mode === "auto" && (
              <div className="flex items-center gap-2">
                {/* Skip Advanced / Repeated */}
                {canSkip && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkipAdvanced}
                    disabled={isLoadingNext}
                    className="hidden xl:flex text-muted-foreground h-8"
                  >
                    Skip
                  </Button>
                )}

                {/* Run / Next */}
                <Button
                  size="sm"
                  onClick={
                    runResult.status === "correct" ? handleNext : handleRun
                  }
                  disabled={isRunning || isLoading || isLoadingNext}
                  className="min-w-[100px] h-8"
                >
                  {isRunning ? (
                    <SpinnerGap className="h-4 w-4 animate-spin" />
                  ) : isLoadingNext ? (
                    <SpinnerGap className="h-4 w-4 animate-spin" />
                  ) : runResult.status === "correct" ? (
                    <FastForward className="h-4 w-4 lg:mr-2" />
                  ) : (
                    <Play className="h-4 w-4 lg:mr-2" />
                  )}
                  <span className="hidden lg:inline">
                    {runResult.status === "correct" ? "Next" : "Run"}
                  </span>
                </Button>
              </div>
            )}
          </>
        }
      />

      {/* Main Workspace */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left: Question */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <QuestionPanel
              question={question}
              isLoading={isLoading || isLoadingNext}
              hintPanelSlot={
                mode !== "review" && (
                  <HintPanel
                    hint1={hint1}
                    hint2={hint2}
                    onRequestHint={handleRequestHint}
                    isGenerating={isGeneratingHint}
                    isLoading={isLoading || isLoadingNext}
                  />
                )
              }
            />
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
                      isTransitioning={isLoading || isLoadingNext}
                    />
                  </div>
                  {/* Runtime Status Bar - between editor and output */}
                  <RuntimeStatusBar executionTimeMs={lastExecutionTimeMs} />
                </div>
              </ResizablePanel>

              <ResizableHandle />

              <ResizablePanel defaultSize={40} minSize={20}>
                <OutputPanel
                  key={question?.id} // Force reset state on question change
                  runResult={runResult}
                  question={question}
                  isRevealed={isSolutionRevealed}
                  currentCode={code}
                  onApplyOptimizedCode={(optCode) => {
                    setCode(optCode);
                    setRunResult((prev) => ({ ...prev, status: "not_run" }));
                  }}
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
