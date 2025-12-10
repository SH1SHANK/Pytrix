"use client";

/**
 * Subtopic Tile
 *
 * Compact tile showing subtopic stats with mastery and difficulty breakdown.
 */

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Lightning, Brain, Rocket, CheckCircle } from "@phosphor-icons/react";
import type { SubtopicStats } from "@/lib/stores/statsStore";
import { cn } from "@/lib/utils";

interface SubtopicTileProps {
  subtopicStats: SubtopicStats;
  onClick?: () => void;
}

/**
 * Get background based on mastery.
 */
function getMasteryBg(mastery: number): string {
  if (mastery >= 80) return "bg-green-500/10 border-green-500/20";
  if (mastery >= 60) return "bg-yellow-500/10 border-yellow-500/20";
  if (mastery >= 40) return "bg-orange-500/10 border-orange-500/20";
  if (mastery > 0) return "bg-red-500/10 border-red-500/20";
  return "bg-muted/50 border-muted";
}

export function SubtopicTile({ subtopicStats, onClick }: SubtopicTileProps) {
  const hasStats = subtopicStats.attempts > 0;

  // Aggregate difficulty counts from problem types
  const diffCounts = { beginner: 0, intermediate: 0, advanced: 0 };
  for (const pt of subtopicStats.problemTypes) {
    diffCounts.beginner += pt.beginner.attempts;
    diffCounts.intermediate += pt.intermediate.attempts;
    diffCounts.advanced += pt.advanced.attempts;
  }
  const totalDiff =
    diffCounts.beginner + diffCounts.intermediate + diffCounts.advanced;

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-colors",
        getMasteryBg(subtopicStats.masteryPercent),
        onClick && "cursor-pointer hover:bg-accent"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">
            {subtopicStats.subtopicName}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{subtopicStats.attempts} attempts</span>
            {hasStats && (
              <span className="flex items-center gap-0.5">
                <CheckCircle weight="fill" className="h-3 w-3 text-green-500" />
                {subtopicStats.solved}
              </span>
            )}
          </div>
        </div>

        {/* Mastery Badge */}
        {hasStats ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant={
                  subtopicStats.masteryPercent >= 60 ? "default" : "secondary"
                }
                className="text-xs shrink-0"
              >
                {subtopicStats.masteryPercent}%
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mastery: {subtopicStats.masteryPercent}%</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Badge
            variant="outline"
            className="text-xs text-muted-foreground shrink-0"
          >
            New
          </Badge>
        )}
      </div>

      {/* Progress Bar */}
      {hasStats && (
        <Progress value={subtopicStats.masteryPercent} className="h-1 mt-2" />
      )}

      {/* Difficulty Distribution (mini) */}
      {totalDiff > 0 && (
        <div className="flex items-center gap-2 mt-2">
          {diffCounts.beginner > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-0.5 text-xs">
                  <Lightning weight="fill" className="h-3 w-3 text-green-500" />
                  <span>{diffCounts.beginner}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{diffCounts.beginner} beginner attempts</p>
              </TooltipContent>
            </Tooltip>
          )}
          {diffCounts.intermediate > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-0.5 text-xs">
                  <Brain weight="fill" className="h-3 w-3 text-yellow-500" />
                  <span>{diffCounts.intermediate}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{diffCounts.intermediate} intermediate attempts</p>
              </TooltipContent>
            </Tooltip>
          )}
          {diffCounts.advanced > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-0.5 text-xs">
                  <Rocket weight="fill" className="h-3 w-3 text-red-500" />
                  <span>{diffCounts.advanced}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{diffCounts.advanced} advanced attempts</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}
