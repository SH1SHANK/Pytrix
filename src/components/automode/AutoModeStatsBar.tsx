"use client";

/**
 * Auto Mode Stats Bar v2.1
 *
 * Enhanced "HUD" stats bar with:
 * - Glassmorphism UI
 * - Session Timer
 * - Animated Streak Counter with Flame
 * - Next Topic Preview
 * - Difficulty Badges
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type AutoRunV2, type DifficultyLevel } from "@/lib/auto-mode/autoRunTypes";
import {
  getCurrentQueueEntry,
  getNextTopics,
  getSubtopicDifficulty,
  slowDown,
} from "@/lib/auto-mode";
import {
  CaretRight,
  Fire,
  Lightning,
  Brain,
  Rocket,
  Pause,
  GearSix,
  Clock,
  ListDashes,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface AutoModeStatsBarProps {
  run: AutoRunV2;
  onRunUpdate: (run: AutoRunV2) => void;
  onOpenSettings?: () => void;
}

// ----------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------

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
        <Lightning weight="duotone" className={cn("h-3.5 w-3.5", className)} />
      );
    case "intermediate":
      return (
        <Brain weight="duotone" className={cn("h-3.5 w-3.5", className)} />
      );
    case "advanced":
      return (
        <Rocket weight="duotone" className={cn("h-3.5 w-3.5", className)} />
      );
  }
}

// function SessionTimer() { // Removed unused startTime prop
function SessionTimer() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // Calculate initial elapsed based on run start time (simplified to session start)
    // Actually, for a specific "session", we might want to track connection time.
    // For now, let's just track time since component mount as "Session".
    const mountTime = Date.now();
    const timer = setInterval(() => {
      setElapsed(Date.now() - mountTime);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(elapsed / 60000);
  const secs = Math.floor((elapsed % 60000) / 1000);

  return (
    <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
      <Clock className="h-3 w-3" />
      <span>
        {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
      </span>
    </div>
  );
}

function QueuePreview({ run }: { run: AutoRunV2 }) {
  const nextTopics = getNextTopics(run, 1);
  const next = nextTopics[0];

  if (!next) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 pl-2 pr-3 py-1 rounded-full border border-border/50">
      <ListDashes className="h-3.5 w-3.5 opacity-70" />
      <span className="opacity-50 mr-1">Next:</span>
      <span className="font-medium truncate max-w-[120px]">
        {next.subtopicName}
      </span>
    </div>
  );
}

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
export function AutoModeStatsBar({
  run,
  onRunUpdate,
  onOpenSettings,
}: AutoModeStatsBarProps) {
  const entry = getCurrentQueueEntry(run);
  const difficulty = entry
    ? getSubtopicDifficulty(run, entry.subtopicId)
    : "beginner";

  // Animation states
  const [prevStreak, setPrevStreak] = useState(run.streak);
  const [streakChanged, setStreakChanged] = useState(false);

  useEffect(() => {
    if (run.streak !== prevStreak) {
      setTimeout(() => {
        setStreakChanged(true);
        setPrevStreak(run.streak);
      }, 0);
      const timer = setTimeout(() => setStreakChanged(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [run.streak, prevStreak]);

  const handleSlowDown = () => {
    const updated = slowDown(run);
    onRunUpdate(updated);
  };

  if (!entry) return null;

  // Streak styles
  const isHighStreak = run.streak >= 3;
  const isGodlike = run.streak >= 10;

  const streakColor = isGodlike
    ? "text-purple-500"
    : isHighStreak
    ? "text-orange-500"
    : "text-muted-foreground";

  const streakBg = isGodlike
    ? "bg-purple-500/10 border-purple-500/20"
    : isHighStreak
    ? "bg-orange-500/10 border-orange-500/20"
    : "bg-muted/50 border-transparent";

  return (
    <div className="sticky top-0 z-40 w-full backdrop-blur-md bg-background/80 border-b border-border/40 shadow-sm transition-all duration-300">
      <div className="h-14 px-4 flex items-center justify-between gap-4 max-w-[1600px] mx-auto">
        {/* LEFT: Context & Difficulty */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Difficulty Badge */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  "h-7 pl-1.5 pr-2.5 gap-1.5 transition-colors",
                  difficulty === "beginner" &&
                    "border-blue-500/20 text-blue-600 bg-blue-500/5 hover:bg-blue-500/10",
                  difficulty === "intermediate" &&
                    "border-yellow-500/20 text-yellow-600 bg-yellow-500/5 hover:bg-yellow-500/10",
                  difficulty === "advanced" &&
                    "border-red-500/20 text-red-600 bg-red-500/5 hover:bg-red-500/10"
                )}
              >
                <DifficultyIcon difficulty={difficulty} />
                <span className="capitalize font-medium">{difficulty}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Current Difficulty Level</p>
            </TooltipContent>
          </Tooltip>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-sm truncate opacity-80">
            <span className="font-medium text-foreground/80 hidden md:inline">
              {entry.moduleName}
            </span>
            <CaretRight className="h-3 w-3 text-muted-foreground hidden md:inline" />
            <span className="font-semibold text-foreground">
              {entry.subtopicName}
            </span>
          </div>
        </div>

        {/* CENTER: HUD Stats */}
        <div className="flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
          {/* Session Timer */}
          <div className="hidden md:block">
            <SessionTimer />
          </div>

          {/* MAIN STREAK INDICATOR */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "relative group flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-300",
                  streakBg,
                  streakChanged && "scale-110"
                )}
              >
                <motion.div
                  animate={isHighStreak ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Fire
                    weight={run.streak > 0 ? "fill" : "regular"}
                    className={cn(
                      "h-5 w-5 transition-colors",
                      streakColor,
                      isGodlike && "drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                    )}
                  />
                </motion.div>

                <div className="flex flex-col items-start leading-none">
                  <span
                    className={cn(
                      "text-xs font-bold uppercase tracking-wider opacity-70",
                      streakColor
                    )}
                  >
                    Streak
                  </span>
                  <span
                    className={cn(
                      "text-lg font-black font-mono leading-none",
                      streakColor
                    )}
                  >
                    {run.streak}
                  </span>
                </div>

                {/* Particle effects for high streaks could go here */}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isGodlike
                  ? "UNSTOPPABLE!"
                  : isHighStreak
                  ? "On Fire!"
                  : "Build your streak"}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* RIGHT: Controls & Preview */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          {/* Up Next Preview */}
          <div className="hidden lg:block">
            <QueuePreview run={run} />
          </div>

          <div className="h-6 w-px bg-border/50 mx-1" />

          {/* Slow Down (only visible if struggling or high difficulty) */}
          {/* Alternatively, always visible but subtle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleSlowDown}
              >
                <Pause className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Slow Down (Reset Difficulty)</TooltipContent>
          </Tooltip>

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={onOpenSettings}
              >
                <GearSix className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
