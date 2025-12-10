"use client";

/**
 * Practice Header
 *
 * Unified header for both Auto and Manual practice modes.
 * Enforces strict layout rules:
 * - Left: Navigation (Back + Breadcrumbs)
 * - Center: Status (Difficulty Badge + Streak)
 * - Right: Controls (Timer + Actions)
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Clock,
  Pause,
  Play,
  ArrowCounterClockwise,
  Fire,
  Lightning,
  Brain,
  Rocket,
  ArrowDown,
  CaretRight,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  type DifficultyLevel,
  type AutoRunV2,
} from "@/lib/auto-mode/autoRunTypes";
import {
  slowDown,
  jumpToQueueIndex,
  type NavigationItem,
} from "@/lib/auto-mode";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============================================
// TYPES
// ============================================

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface PracticeHeaderProps {
  mode: "auto" | "manual" | "review" | "topic-select";
  title: string;
  breadcrumbs: BreadcrumbItem[];
  difficulty: DifficultyLevel;
  streak: number;
  /** Auto Mode specific run data */
  run?: AutoRunV2 | null;
  /** Callback for Auto Mode difficulty adjustment */
  onRunUpdate?: (run: AutoRunV2) => void;
  /** Callback for timer toggle (if parent needs to know) */
  onTimerToggle?: (isPaused: boolean) => void;
  /** Optional container for primary actions (Run, Hint, etc.) */
  actions?: React.ReactNode;
  /** Auto Mode: Upcoming items for preview */
  upcomingItems?: NavigationItem[];
}

// ============================================
// SUB-COMPONENTS
// ============================================

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
        <Lightning weight="duotone" className={cn("h-4 w-4", className)} />
      );
    case "intermediate":
      return <Brain weight="duotone" className={cn("h-4 w-4", className)} />;
    case "advanced":
      return <Rocket weight="duotone" className={cn("h-4 w-4", className)} />;
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PracticeHeader({
  mode,
  breadcrumbs,
  difficulty,
  streak,
  run,
  onRunUpdate,
  onTimerToggle,
  actions,
  upcomingItems,
}: PracticeHeaderProps) {
  // -- TIMER STATE --
  // We manage timer locally here to ensure tight UI coupling with controls
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(() => Date.now());
  const [pausedTime, setPausedTime] = useState(0);

  useEffect(() => {
    if (isPaused || !startTime) return;
    const timer = setInterval(() => {
      setElapsed(Date.now() - startTime + pausedTime);
    }, 100);
    return () => clearInterval(timer);
  }, [isPaused, startTime, pausedTime]);

  // -- HANDLERS --

  const handlePauseToggle = useCallback(() => {
    if (isPaused) {
      setStartTime(Date.now());
      setPausedTime(elapsed);
    } else {
      setPausedTime(elapsed);
      setStartTime(null);
    }
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    onTimerToggle?.(newPaused);
  }, [isPaused, elapsed, onTimerToggle]);

  const handleResetTimer = useCallback(() => {
    setElapsed(0);
    setPausedTime(0);
    setStartTime(isPaused ? null : Date.now());
  }, [isPaused]);

  const handleLowerDifficulty = useCallback(() => {
    if (run && onRunUpdate) {
      const updated = slowDown(run);
      onRunUpdate(updated);
    }
  }, [run, onRunUpdate]);

  // -- FORMATTING --
  const mins = Math.floor(elapsed / 60000);
  const secs = Math.floor((elapsed % 60000) / 1000);
  const timeDisplay = `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;

  // -- STREAK COLOR LOGIC --
  const isHighStreak = streak >= 3;
  const isGodlike = streak >= 10;
  const streakColor = isGodlike
    ? "text-purple-500"
    : isHighStreak
    ? "text-orange-500"
    : "text-muted-foreground";

  const streakBg = isGodlike
    ? "bg-purple-500/10 border-purple-500/20"
    : isHighStreak
    ? "bg-orange-500/10 border-orange-500/20"
    : "bg-muted/50 border-border/50";

  return (
    <TooltipProvider>
      <header className="h-16 border-b flex items-center px-4 justify-between bg-card text-card-foreground shadow-xs shrink-0 z-50 relative">
        {/* =======================
            LEFT SECTION: Navigation
            ======================= */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href={mode === "auto" ? "/practice/auto" : "/"}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>

          {/* Breadcrumbs - strict no truncation rules logic handled by CSS + tooltip fallbacks if needed */}
          <nav className="flex items-center gap-1.5 text-sm overflow-hidden whitespace-nowrap mask-linear-fade">
            {breadcrumbs.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 shrink-0">
                {idx > 0 && (
                  <CaretRight className="h-3 w-3 text-muted-foreground/60" />
                )}
                {item.isCurrent ? (
                  mode === "auto" &&
                  upcomingItems &&
                  upcomingItems.length > 0 &&
                  run &&
                  onRunUpdate ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 hover:bg-transparent font-semibold text-foreground flex items-center gap-1"
                        >
                          <span
                            className="truncate max-w-[300px]"
                            title={item.label}
                          >
                            {item.label}
                          </span>
                          <CaretRight className="h-3 w-3 rotate-90 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-[300px] max-h-[400px] overflow-y-auto"
                      >
                        {upcomingItems.map((navItem, idx) => {
                          if (navItem.type === "header") {
                            return (
                              <div
                                key={idx}
                                className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/30 sticky top-0 z-10 backdrop-blur-sm border-b"
                              >
                                {navItem.title}
                              </div>
                            );
                          }

                          const { entry, index, isCurrent, status } = navItem;

                          return (
                            <DropdownMenuItem
                              key={idx}
                              className={`cursor-pointer flex justify-between items-center ${
                                isCurrent
                                  ? "bg-accent text-accent-foreground font-medium"
                                  : ""
                              }`}
                              onClick={() => {
                                if (onRunUpdate && run) {
                                  const updated = jumpToQueueIndex(run, index);
                                  onRunUpdate(updated);
                                }
                              }}
                            >
                              <span
                                className={`truncate ${
                                  isCurrent
                                    ? ""
                                    : status === "completed"
                                    ? "text-muted-foreground line-through opacity-70"
                                    : ""
                                }`}
                              >
                                {entry.subtopicName}
                              </span>
                              {status === "upcoming" && (
                                <span className="text-[10px] uppercase opacity-50 ml-2">
                                  Jump
                                </span>
                              )}
                              {isCurrent && (
                                <span className="text-[10px] uppercase bg-primary/10 text-primary px-1.5 rounded ml-2">
                                  Current
                                </span>
                              )}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span
                      className="font-semibold text-foreground truncate max-w-[300px]"
                      title={item.label}
                    >
                      {item.label}
                    </span>
                  )
                ) : item.href ? (
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px]"
                    title={item.label}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className="text-muted-foreground truncate max-w-[150px]"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* =======================
            CENTER SECTION: Status
            ======================= */}
        <div className="flex items-center gap-4 justify-center flex-none px-4 absolute left-1/2 -translate-x-1/2">
          {/* Difficulty Badge - Single source of truth */}
          <Badge
            variant="outline"
            className={cn(
              "h-8 px-3 gap-2 text-sm font-medium border transition-colors",
              difficulty === "beginner" &&
                "border-blue-500/20 text-blue-600 bg-blue-500/5",
              difficulty === "intermediate" &&
                "border-yellow-500/20 text-yellow-600 bg-yellow-500/5",
              difficulty === "advanced" &&
                "border-red-500/20 text-red-600 bg-red-500/5"
            )}
          >
            <DifficultyIcon difficulty={difficulty} />
            <span className="capitalize">{difficulty}</span>
          </Badge>

          {/* Streak Indicator */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full border transition-all",
              streakBg
            )}
          >
            <Fire
              weight={streak > 0 ? "fill" : "regular"}
              className={cn("h-4 w-4", streakColor)}
            />
            <span className={cn("text-sm font-bold capitalize", streakColor)}>
              {streak} Streak
            </span>
          </div>
        </div>

        {/* =======================
            RIGHT SECTION: Controls
            ======================= */}
        <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
          {/* Page Actions */}
          {actions && (
            <div className="flex items-center gap-2 mr-1">{actions}</div>
          )}

          {/* Auto Mode: Lower Difficulty Button */}
          {mode === "auto" && run && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-9 px-3 hidden xl:flex"
                  onClick={handleLowerDifficulty}
                >
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Lower Difficulty
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset to Beginner difficulty</TooltipContent>
            </Tooltip>
          )}

          <div className="h-6 w-px bg-border/50 mx-1" />

          {/* Timer & Controls */}
          <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-lg border border-border/40">
            {/* Timer Display */}
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1 min-w-[80px] justify-center text-sm font-mono font-medium rounded-md transition-colors",
                isPaused
                  ? "text-muted-foreground"
                  : "text-foreground bg-background shadow-xs"
              )}
            >
              <Clock className="h-4 w-4" />
              {timeDisplay}
            </div>

            {/* Controls - Explicitly labeled/icon+label and grouped */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePauseToggle}
                  className="h-7 w-7 md:h-8 md:w-auto md:px-2"
                >
                  {isPaused ? (
                    <Play weight="fill" className="h-3.5 w-3.5" />
                  ) : (
                    <Pause weight="fill" className="h-3.5 w-3.5" />
                  )}
                  <span className="sr-only md:not-sr-only md:ml-1.5 text-xs font-medium">
                    {isPaused ? "Resume" : "Pause"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isPaused ? "Resume Timer" : "Pause Timer"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetTimer}
                  className="h-7 w-7 md:h-8 md:w-auto md:px-2"
                >
                  <ArrowCounterClockwise className="h-3.5 w-3.5" />
                  <span className="sr-only md:not-sr-only md:ml-1.5 text-xs font-medium">
                    Reset
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset Timer</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
