"use client";

/**
 * Practice Module Card
 *
 * Module card designed for the practice context with:
 * - Module name, order badge
 * - Mastery progress bar (from statsStore)
 * - Counts: subtopics, problem types
 * - Quick actions: "Practice Module", "Open" (opens sheet)
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Play, CaretRight, TreeStructure, Code } from "@phosphor-icons/react";
import type { Module } from "@/lib/topicsStore";

interface PracticeModuleCardProps {
  module: Module;
  mastery: number; // 0-100 percentage
  onPractice: (module: Module) => void;
  onOpen: (module: Module) => void;
}

/**
 * Get color for mastery based on percentage
 */
function getMasteryColor(mastery: number): string {
  if (mastery >= 80) return "text-green-500";
  if (mastery >= 50) return "text-yellow-500";
  if (mastery >= 20) return "text-orange-500";
  return "text-muted-foreground";
}

export function PracticeModuleCard({
  module,
  mastery,
  onPractice,
  onOpen,
}: PracticeModuleCardProps) {
  // Count totals
  const subtopicCount = module.subtopics.length;
  const problemTypeCount = useMemo(
    () => module.subtopics.reduce((acc, st) => acc + st.problemTypes.length, 0),
    [module.subtopics]
  );

  return (
    <Card
      className="group relative overflow-hidden transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-primary"
      tabIndex={0}
      role="button"
      aria-label={`${module.name} module, ${mastery}% mastery`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(module);
        }
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className="shrink-0 font-mono text-xs">
              {module.order.toString().padStart(2, "0")}
            </Badge>
            <CardTitle className="text-lg truncate">{module.name}</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={`text-sm font-semibold ${getMasteryColor(
                    mastery
                  )}`}
                >
                  {mastery}%
                </span>
              </TooltipTrigger>
              <TooltipContent>Module mastery</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mastery Progress */}
        <div className="space-y-1">
          <Progress value={mastery} className="h-2" />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <TreeStructure weight="duotone" className="h-4 w-4" />
            <span>{subtopicCount} subtopics</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Code weight="duotone" className="h-4 w-4" />
            <span>{problemTypeCount} problems</span>
          </div>
        </div>

        {/* Overview (truncated) */}
        {module.overview && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {module.overview}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onPractice(module);
            }}
          >
            <Play weight="fill" className="h-4 w-4 mr-1.5" />
            Practice
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(module);
            }}
          >
            <CaretRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
