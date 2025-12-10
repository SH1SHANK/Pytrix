"use client";

/**
 * Module Stat Card
 *
 * Displays a module with its mastery percentage and expandable subtopic stats.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CaretDown,
  Lightning,
  Brain,
  Rocket,
  Target,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";
import type { ModuleStats } from "@/lib/stores/statsStore";
import { cn } from "@/lib/utils";
import { SubtopicTile } from "./SubtopicTile";

interface ModuleStatCardProps {
  moduleStats: ModuleStats;
  moduleName?: string;
  moduleIcon?: React.ReactNode;
  onPractice?: (moduleId: string) => void;
}

/**
 * Get mastery badge variant.
 */
function getMasteryBadgeVariant(
  mastery: number
): "default" | "secondary" | "destructive" | "outline" {
  if (mastery >= 80) return "default";
  if (mastery >= 40) return "secondary";
  if (mastery > 0) return "destructive";
  return "outline";
}

export function ModuleStatCard({
  moduleStats,
  moduleName,
  moduleIcon,
  onPractice,
}: ModuleStatCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const displayName = moduleName || moduleStats.moduleName;
  const hasStats = moduleStats.attempts > 0;

  // Difficulty distribution
  const diffCounts = { beginner: 0, intermediate: 0, advanced: 0 };
  for (const subtopic of moduleStats.subtopics) {
    for (const pt of subtopic.problemTypes) {
      diffCounts.beginner += pt.beginner.attempts;
      diffCounts.intermediate += pt.intermediate.attempts;
      diffCounts.advanced += pt.advanced.attempts;
    }
  }
  const totalDiffAttempts =
    diffCounts.beginner + diffCounts.intermediate + diffCounts.advanced;

  return (
    <Card
      className={cn(
        "transition-all",
        hasStats ? "border-l-4" : "border-l-4 border-l-muted",
        hasStats && moduleStats.masteryPercent >= 80 && "border-l-green-500",
        hasStats &&
          moduleStats.masteryPercent >= 40 &&
          moduleStats.masteryPercent < 80 &&
          "border-l-yellow-500",
        hasStats && moduleStats.masteryPercent < 40 && "border-l-red-500"
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {moduleIcon && (
                <div className="p-2 bg-primary/10 rounded-lg">{moduleIcon}</div>
              )}
              <div>
                <CardTitle className="text-lg">{displayName}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {moduleStats.subtopics.length} subtopics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Mastery Badge */}
              {hasStats ? (
                <Badge
                  variant={getMasteryBadgeVariant(moduleStats.masteryPercent)}
                  className="text-sm font-semibold"
                >
                  {moduleStats.masteryPercent}% Mastery
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-xs text-muted-foreground"
                >
                  Not started
                </Badge>
              )}

              {/* Expand Button */}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <CaretDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          {/* Stats Row */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Target
                weight="duotone"
                className="h-4 w-4 text-muted-foreground"
              />
              <span>{moduleStats.attempts} attempts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle
                weight="duotone"
                className="h-4 w-4 text-green-500"
              />
              <span>{moduleStats.solved} solved</span>
            </div>
            {moduleStats.attempts > 0 &&
              moduleStats.attempts !== moduleStats.solved && (
                <div className="flex items-center gap-1.5">
                  <XCircle weight="duotone" className="h-4 w-4 text-red-500" />
                  <span>
                    {moduleStats.attempts - moduleStats.solved} missed
                  </span>
                </div>
              )}
          </div>

          {/* Progress Bar */}
          {hasStats && (
            <div className="mt-3">
              <Progress value={moduleStats.masteryPercent} className="h-2" />
            </div>
          )}

          {/* Difficulty Distribution */}
          {totalDiffAttempts > 0 && (
            <div className="flex items-center gap-3 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <Lightning
                  weight="duotone"
                  className="h-3 w-3 text-green-500"
                />
                <span>{diffCounts.beginner}</span>
              </div>
              <div className="flex items-center gap-1">
                <Brain weight="duotone" className="h-3 w-3 text-yellow-500" />
                <span>{diffCounts.intermediate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Rocket weight="duotone" className="h-3 w-3 text-red-500" />
                <span>{diffCounts.advanced}</span>
              </div>
            </div>
          )}
        </CardContent>

        {/* Expanded Subtopics */}
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <div className="border-t pt-4 mt-2">
              <h4 className="text-sm font-medium mb-3">Subtopics</h4>
              {moduleStats.subtopics.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {moduleStats.subtopics.map((subtopic) => (
                    <SubtopicTile
                      key={subtopic.subtopicId}
                      subtopicStats={subtopic}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No subtopic activity yet
                </p>
              )}
            </div>

            {/* Practice Button */}
            {onPractice && (
              <div className="mt-4 pt-3 border-t">
                <Button
                  size="sm"
                  onClick={() => onPractice(moduleStats.moduleId)}
                  className="w-full"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Practice {displayName}
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
