"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import {
  Play,
  PaperPlaneTilt,
  Lightbulb,
  ArrowCounterClockwise,
  FastForward,
  SpinnerGap,
  Eye,
  Robot,
  User,
  Fire,
} from "@phosphor-icons/react";
import type { DifficultyLevel } from "@/lib/types";
import { PracticeTimer } from "./PracticeTimer";

interface BottomActionBarProps {
  // Actions
  onRun: () => void;
  onSubmit: () => void;
  onHint: () => void;
  onReset: () => void;
  onNext: () => void;
  onReveal: () => void;

  // State
  isRunning: boolean;
  isSubmitting: boolean;
  isGeneratingHint?: boolean;
  hintsUsed: number;
  maxHints?: number;
  showNext: boolean;
  canSubmit: boolean;
  canReveal: boolean;
  isRevealed: boolean;
  failedAttempts: number;

  // Streak & Mode
  mode: "auto" | "manual";
  streak: number;
  difficulty: DifficultyLevel;
  moduleName?: string;

  // Timer (Manual Mode)
  showTimer?: boolean;
}

/**
 * Sticky bottom action bar with primary controls.
 * Layout: Left = Mode + Stats, Center = Hints/Reveal/Reset, Right = Run/Submit/Next
 */
export function BottomActionBar({
  onRun,
  onSubmit,
  onHint,
  onReset,
  onNext,
  onReveal,
  isRunning,
  isSubmitting,
  hintsUsed,
  maxHints = 2,
  showNext,
  canSubmit,
  canReveal,
  isRevealed,
  failedAttempts,
  mode,
  streak,
  difficulty,
  moduleName,
  showTimer = false,
  isGeneratingHint = false,
}: BottomActionBarProps) {
  const isWorking = isRunning || isSubmitting || isGeneratingHint;

  const getDifficultyColor = () => {
    switch (difficulty) {
      case "beginner":
        return "text-green-500 border-green-500/30";
      case "intermediate":
        return "text-yellow-500 border-yellow-500/30";
      case "advanced":
        return "text-red-500 border-red-500/30";
      default:
        return "";
    }
  };

  return (
    <div className="h-14 border-t bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80 px-4 flex items-center justify-between gap-4 shrink-0">
      {/* Left Section: Mode + Streak */}
      <div className="flex items-center gap-3">
        {/* Mode Chip */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`gap-1.5 px-2 py-1 ${
              mode === "auto"
                ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                : "bg-blue-500/10 text-blue-500 border-blue-500/30"
            }`}
          >
            {mode === "auto" ? (
              <Robot weight="fill" className="h-3 w-3" />
            ) : (
              <User weight="fill" className="h-3 w-3" />
            )}
            <span className="text-xs font-medium capitalize">{mode}</span>
          </Badge>

          {/* Module + Difficulty */}
          {moduleName && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {moduleName}
            </span>
          )}
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 capitalize ${getDifficultyColor()}`}
          >
            {difficulty}
          </Badge>
        </div>

        <Separator orientation="vertical" className="h-6 hidden sm:block" />

        {/* Streak Widget */}
        <div className="items-center gap-1.5 hidden sm:flex">
          <Fire
            weight={streak > 0 ? "fill" : "regular"}
            className={`h-4 w-4 ${
              streak > 0 ? "text-orange-500" : "text-muted-foreground"
            }`}
          />
          <span
            className={`text-sm font-bold tabular-nums ${
              streak > 0 ? "text-orange-500" : "text-muted-foreground"
            }`}
          >
            {streak}
          </span>
        </div>

        {/* Session Timer (Manual Mode) */}
        {showTimer && mode === "manual" && (
          <>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <div className="hidden sm:block">
              <PracticeTimer size="sm" />
            </div>
          </>
        )}
      </div>

      {/* Center Section: Secondary Actions */}
      <div className="flex items-center gap-1">
        {/* Get Hint Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={hintsUsed > 0 ? "secondary" : "outline"}
                size="sm"
                onClick={onHint}
                disabled={hintsUsed >= maxHints || isWorking}
                className="gap-1.5 h-8"
              >
                {isGeneratingHint ? (
                  <SpinnerGap className="h-4 w-4 animate-spin" />
                ) : (
                  <Lightbulb
                    weight={hintsUsed > 0 ? "fill" : "duotone"}
                    className={`h-4 w-4 ${
                      hintsUsed > 0 ? "text-yellow-500" : ""
                    }`}
                  />
                )}
                <span className="hidden sm:inline text-xs">Hint</span>
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1 py-0 h-4 min-w-4"
                >
                  {maxHints - hintsUsed}
                </Badge>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {hintsUsed >= maxHints ? (
                "No hints remaining"
              ) : (
                <div className="text-center">
                  <p>Get AI-powered hint</p>
                  <p className="text-[10px] text-muted-foreground">
                    {maxHints - hintsUsed} hint
                    {maxHints - hintsUsed !== 1 ? "s" : ""} left
                  </p>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Reveal Solution Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={
                  isRevealed
                    ? "secondary"
                    : failedAttempts >= 2
                    ? "outline"
                    : "ghost"
                }
                size="sm"
                onClick={onReveal}
                disabled={(!canReveal && !isRevealed) || isWorking}
                className="gap-1.5 h-8"
              >
                <Eye
                  weight={isRevealed ? "fill" : "duotone"}
                  className={`h-4 w-4 ${
                    isRevealed
                      ? "text-green-500"
                      : failedAttempts >= 2
                      ? "text-orange-500"
                      : ""
                  }`}
                />
                <span className="hidden sm:inline text-xs">
                  {isRevealed ? "View" : "Reveal"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isRevealed ? (
                "Solution tab is visible"
              ) : failedAttempts >= 2 ? (
                "Show reference solution"
              ) : (
                <div className="text-center">
                  <p>Reveal solution</p>
                  <p className="text-[10px] text-muted-foreground">
                    Unlocks after 2 attempts ({failedAttempts}/2)
                  </p>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Reset Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onReset}
                disabled={isWorking}
                className="h-8 w-8"
              >
                <ArrowCounterClockwise className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset to starter code</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Right Section: Primary Actions */}
      <div className="flex items-center gap-2">
        {showNext ? (
          /* Next Question Button */
          <Button size="sm" onClick={onNext} className="gap-2 px-4 h-9">
            Next
            <FastForward weight="fill" className="h-4 w-4" />
          </Button>
        ) : (
          <>
            {/* Run Button - Local Only */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRun}
                    disabled={isWorking}
                    className="gap-2 h-9 px-3 sm:px-4"
                  >
                    {isRunning ? (
                      <SpinnerGap className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play weight="fill" className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">Run</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="flex items-center gap-2">
                  <span>Run locally</span>
                  <div className="flex items-center gap-0.5">
                    <Kbd>Ctrl</Kbd>
                    <span className="text-muted-foreground">+</span>
                    <Kbd>Enter</Kbd>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Submit Button - AI Evaluation */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={onSubmit}
                    disabled={isWorking || !canSubmit}
                    className="gap-2 h-9 px-3 sm:px-4 bg-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? (
                      <SpinnerGap className="h-4 w-4 animate-spin" />
                    ) : (
                      <PaperPlaneTilt weight="fill" className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">Submit</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="flex items-center gap-2">
                  <span>Submit for AI evaluation</span>
                  <div className="flex items-center gap-0.5">
                    <Kbd>Ctrl</Kbd>
                    <span className="text-muted-foreground">+</span>
                    <Kbd>Shift</Kbd>
                    <span className="text-muted-foreground">+</span>
                    <Kbd>Enter</Kbd>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>
    </div>
  );
}
