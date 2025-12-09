"use client";

import { Badge } from "@/components/ui/badge";
import { Flame, Lightning } from "@phosphor-icons/react";
import type { DifficultyLevel } from "@/lib/types";

interface StreakWidgetProps {
  streak: number;
  mode: "auto" | "manual";
  difficulty?: DifficultyLevel;
  moduleName?: string;
}

/**
 * Compact streak display for the bottom action bar.
 * Shows current streak with flame icon and mode indicator.
 */
export function StreakWidget({
  streak,
  mode,
  difficulty,
  moduleName,
}: StreakWidgetProps) {
  const streakColor =
    streak >= 5
      ? "text-orange-500"
      : streak >= 3
      ? "text-yellow-500"
      : "text-muted-foreground";

  const difficultyColors: Record<DifficultyLevel, string> = {
    beginner: "bg-green-500/10 text-green-500 border-green-500/20",
    intermediate: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    advanced: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <div className="flex items-center gap-2">
      {/* Mode Indicator */}
      <Badge
        variant="outline"
        className={`text-xs ${
          mode === "auto"
            ? "bg-primary/10 text-primary border-primary/20"
            : "bg-muted"
        }`}
      >
        <Lightning weight="fill" className="h-3 w-3 mr-1" />
        {mode === "auto" ? "Auto" : "Manual"}
      </Badge>

      {/* Difficulty Badge */}
      {difficulty && (
        <Badge
          variant="outline"
          className={`text-xs capitalize ${difficultyColors[difficulty]}`}
        >
          {difficulty}
        </Badge>
      )}

      {/* Module Name (truncated) */}
      {moduleName && (
        <span className="text-xs text-muted-foreground hidden md:inline truncate max-w-[100px]">
          {moduleName}
        </span>
      )}

      {/* Streak Counter */}
      <div
        className={`flex items-center gap-1 ${streakColor} transition-colors duration-300`}
      >
        <Flame
          weight={streak > 0 ? "fill" : "regular"}
          className={`h-4 w-4 ${streak >= 3 ? "animate-pulse" : ""}`}
        />
        <span className="font-semibold text-sm tabular-nums">{streak}</span>
      </div>
    </div>
  );
}
