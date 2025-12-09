"use client";

/**
 * Auto Mode Stats Bar v2
 *
 * Enhanced stats bar showing:
 * - Module → Subtopic breadcrumb
 * - Streak indicator with animation
 * - Difficulty badge per subtopic
 * - Progress in run
 * - Quick controls (Slow Down, Settings)
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type AutoRunV2, type DifficultyLevel } from "@/lib/autoRunTypes";
import {
  getCurrentQueueEntry,
  getSubtopicDifficulty,
  slowDown,
} from "@/lib/autoModeServiceV2";
import {
  CaretRight,
  Fire,
  Lightning,
  Brain,
  Rocket,
  Pause,
  GearSix,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface AutoModeStatsBarV2Props {
  run: AutoRunV2;
  onRunUpdate: (run: AutoRunV2) => void;
  onOpenSettings?: () => void;
}

/**
 * Get icon for difficulty level.
 */
function DifficultyIcon({
  difficulty,
  className,
}: {
  difficulty: DifficultyLevel;
  className?: string;
}) {
  switch (difficulty) {
    case "beginner":
      return (
        <Lightning weight="duotone" className={cn("h-3 w-3", className)} />
      );
    case "intermediate":
      return <Brain weight="duotone" className={cn("h-3 w-3", className)} />;
    case "advanced":
      return <Rocket weight="duotone" className={cn("h-3 w-3", className)} />;
  }
}

/**
 * Get difficulty badge variant.
 */
function getDifficultyVariant(
  difficulty: DifficultyLevel
): "default" | "secondary" | "destructive" {
  switch (difficulty) {
    case "beginner":
      return "secondary";
    case "intermediate":
      return "default";
    case "advanced":
      return "destructive";
  }
}

export function AutoModeStatsBarV2({
  run,
  onRunUpdate,
  onOpenSettings,
}: AutoModeStatsBarV2Props) {
  const entry = getCurrentQueueEntry(run);
  const [isAnimatingStreak, setIsAnimatingStreak] = useState(false);
  const [prevStreak, setPrevStreak] = useState(run.streak);

  // Animate streak changes
  useEffect(() => {
    if (run.streak !== prevStreak) {
      setTimeout(() => {
        setIsAnimatingStreak(true);
        setPrevStreak(run.streak);
      }, 0);
      const timer = setTimeout(() => setIsAnimatingStreak(false), 500);
      return () => clearTimeout(timer);
    }
  }, [run.streak, prevStreak]);

  if (!entry) return null;

  const difficulty = getSubtopicDifficulty(run, entry.subtopicId);
  const progress = run.miniCurriculumComplete
    ? {
        current: run.completedQuestions,
        total: run.completedQuestions + 10,
        label: "Ongoing",
      }
    : {
        current: run.currentIndex + 1,
        total: run.topicQueue.length,
        label: "Mini-Curriculum",
      };

  const handleSlowDown = () => {
    const updated = slowDown(run);
    onRunUpdate(updated);
  };

  return (
    <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b px-4 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">
            {entry.moduleName}
          </span>
          <CaretRight className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground truncate">
            {entry.subtopicName}
          </span>
        </div>

        {/* Center: Streak + Difficulty + Progress */}
        <div className="flex items-center gap-4">
          {/* Streak */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full",
                  run.streak > 0
                    ? "bg-orange-500/10 text-orange-500"
                    : "bg-muted text-muted-foreground",
                  isAnimatingStreak && "animate-pulse"
                )}
              >
                <Fire
                  weight={run.streak > 0 ? "fill" : "regular"}
                  className={cn("h-4 w-4", run.streak >= 3 && "animate-bounce")}
                />
                <span className="text-sm font-semibold">{run.streak}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {run.streak > 0
                  ? `${run.streak} correct in a row!`
                  : "Get questions right to build a streak"}
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Difficulty Badge */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant={getDifficultyVariant(difficulty)}
                className="flex items-center gap-1"
              >
                <DifficultyIcon difficulty={difficulty} />
                <span className="capitalize">{difficulty}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Current difficulty for {entry.subtopicName}</p>
            </TooltipContent>
          </Tooltip>

          {/* Progress */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {progress.label}:
            </span>
            <div className="flex items-center gap-1.5">
              <Progress
                value={(progress.current / progress.total) * 100}
                className="w-16 h-1.5"
              />
              <span className="text-xs font-medium">
                {progress.current}/{progress.total}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Aggressive Mode Indicator */}
          {run.aggressiveProgression && (
            <Badge variant="outline" className="text-xs">
              Fast Mode
            </Badge>
          )}

          {/* Slow Down Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={handleSlowDown}
              >
                <Pause weight="bold" className="h-3.5 w-3.5 mr-1" />
                Slow Down
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset streak and add easier questions</p>
            </TooltipContent>
          </Tooltip>

          {/* Settings */}
          {onOpenSettings && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={onOpenSettings}
            >
              <GearSix weight="bold" className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Promotion/Demotion Toast Area (handled by parent) */}
    </div>
  );
}
