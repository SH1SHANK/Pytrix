"use client";

/**
 * Manual Practice Landing Page
 *
 * Modules-first layout with toggle for "By Problem Type" view.
 * Persists view preference in localStorage.
 */

import { useState } from "react";
import { PracticeModulesView } from "@/components/practice/PracticeModulesView";
import { PracticeByProblemTypeView } from "@/components/practice/PracticeByProblemTypeView";
import { useRequireApiKey } from "@/hooks/useRequireApiKey";
import type { Difficulty } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SquaresFour,
  ListBullets,
  Lightning,
  Brain,
  Rocket,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// Storage key for view preference
const VIEW_PREF_KEY = "pypractice-manual-view";
type ViewMode = "modules" | "problem-type";

// Get initial view mode from localStorage
function getInitialViewMode(): ViewMode {
  if (typeof window === "undefined") return "modules";
  const stored = localStorage.getItem(VIEW_PREF_KEY);
  if (stored === "modules" || stored === "problem-type") return stored;
  return "modules";
}

export default function ManualPracticePage() {
  const { isLoading: apiKeyLoading } = useRequireApiKey();

  // View mode (modules or problem-type)
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");

  // Persist preference
  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_PREF_KEY, mode);
  };

  if (apiKeyLoading) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-1">
            Manual Practice
          </h2>
          <p className="text-muted-foreground text-sm">
            Choose a topic and start practicing at your own pace.
          </p>
        </div>

        {/* View Toggle + Difficulty */}
        <div className="flex items-center gap-3">
          {/* Difficulty Toggle (for modules view) */}
          {viewMode === "modules" && (
            <div className="hidden sm:flex items-center gap-1 border rounded-md p-1">
              <Button
                size="sm"
                variant={difficulty === "beginner" ? "default" : "ghost"}
                className="h-7 gap-1.5"
                onClick={() => setDifficulty("beginner")}
              >
                <Lightning weight="duotone" className="h-3.5 w-3.5" />
                <span>Beginner</span>
              </Button>
              <Button
                size="sm"
                variant={difficulty === "intermediate" ? "default" : "ghost"}
                className="h-7 gap-1.5"
                onClick={() => setDifficulty("intermediate")}
              >
                <Brain weight="duotone" className="h-3.5 w-3.5" />
                <span>Intermediate</span>
              </Button>
              <Button
                size="sm"
                variant={difficulty === "advanced" ? "default" : "ghost"}
                className="h-7 gap-1.5"
                onClick={() => setDifficulty("advanced")}
              >
                <Rocket weight="duotone" className="h-3.5 w-3.5" />
                <span>Advanced</span>
              </Button>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              size="sm"
              variant={viewMode === "modules" ? "default" : "ghost"}
              className="h-7 gap-1.5"
              onClick={() => handleViewChange("modules")}
            >
              <SquaresFour weight="duotone" className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Modules</span>
            </Button>
            <Button
              size="sm"
              variant={viewMode === "problem-type" ? "default" : "ghost"}
              className="h-7 gap-1.5"
              onClick={() => handleViewChange("problem-type")}
            >
              <ListBullets weight="duotone" className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">By Problem Type</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Difficulty Selector (shown in modules view) */}
      {viewMode === "modules" && (
        <div className="flex sm:hidden items-center gap-2">
          <span className="text-sm text-muted-foreground">Difficulty:</span>
          <Badge
            variant={difficulty === "beginner" ? "default" : "outline"}
            className={cn(
              "cursor-pointer",
              difficulty === "beginner" && "bg-primary"
            )}
            onClick={() => setDifficulty("beginner")}
          >
            Beginner
          </Badge>
          <Badge
            variant={difficulty === "intermediate" ? "default" : "outline"}
            className={cn(
              "cursor-pointer",
              difficulty === "intermediate" && "bg-primary"
            )}
            onClick={() => setDifficulty("intermediate")}
          >
            Intermediate
          </Badge>
          <Badge
            variant={difficulty === "advanced" ? "default" : "outline"}
            className={cn(
              "cursor-pointer",
              difficulty === "advanced" && "bg-primary"
            )}
            onClick={() => setDifficulty("advanced")}
          >
            Advanced
          </Badge>
        </div>
      )}

      {/* Content */}
      {viewMode === "modules" ? (
        <PracticeModulesView difficulty={difficulty} />
      ) : (
        <PracticeByProblemTypeView
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
        />
      )}
    </div>
  );
}
