"use client";

/**
 * Practice Timer Component
 *
 * Reusable timer with pause and reset functionality.
 * Used in both Manual Practice and can be integrated into Auto Mode.
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Clock,
  Pause,
  Play,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface PracticeTimerProps {
  /** External control for initial pause state */
  initiallyPaused?: boolean;
  /** Called when pause state changes */
  onPauseChange?: (isPaused: boolean) => void;
  /** Called when timer is reset */
  onReset?: () => void;
  /** Show pause/reset control buttons */
  showControls?: boolean;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional class names */
  className?: string;
}

export function PracticeTimer({
  initiallyPaused = false,
  onPauseChange,
  onReset,
  showControls = true,
  size = "md",
  className,
}: PracticeTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(initiallyPaused);
  // Initialize startTime immediately if not paused (lazy initialization)
  const [startTime, setStartTime] = useState<number | null>(() =>
    initiallyPaused ? null : Date.now()
  );
  const [pausedTime, setPausedTime] = useState(0);

  // Timer tick
  useEffect(() => {
    if (isPaused || !startTime) return;

    const timer = setInterval(() => {
      const now = Date.now();
      setElapsed(now - startTime + pausedTime);
    }, 100); // Update more frequently for smoother display

    return () => clearInterval(timer);
  }, [isPaused, startTime, pausedTime]);

  const handlePauseToggle = useCallback(() => {
    if (isPaused) {
      // Resuming - start a new timer from now
      setStartTime(Date.now());
      setPausedTime(elapsed);
    } else {
      // Pausing - save current elapsed time
      setPausedTime(elapsed);
      setStartTime(null);
    }
    setIsPaused(!isPaused);
    onPauseChange?.(!isPaused);
  }, [isPaused, elapsed, onPauseChange]);

  const handleReset = useCallback(() => {
    setElapsed(0);
    setPausedTime(0);
    setStartTime(isPaused ? null : Date.now());
    onReset?.();
  }, [isPaused, onReset]);

  // Format time as MM:SS
  const mins = Math.floor(elapsed / 60000);
  const secs = Math.floor((elapsed % 60000) / 1000);
  const timeDisplay = `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;

  const isSmall = size === "sm";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Timer Display */}
      <div
        className={cn(
          "flex items-center gap-1.5 font-mono text-muted-foreground bg-muted/30 rounded-md",
          isSmall ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-1",
          isPaused && "opacity-60"
        )}
      >
        <Clock className={cn(isSmall ? "h-3 w-3" : "h-3.5 w-3.5")} />
        <span className="tabular-nums">{timeDisplay}</span>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex items-center">
          {/* Pause/Resume */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePauseToggle}
                className={cn(
                  "text-muted-foreground hover:text-foreground",
                  isSmall ? "h-6 w-6" : "h-7 w-7"
                )}
              >
                {isPaused ? (
                  <Play
                    className={cn(isSmall ? "h-3 w-3" : "h-3.5 w-3.5")}
                    weight="fill"
                  />
                ) : (
                  <Pause
                    className={cn(isSmall ? "h-3 w-3" : "h-3.5 w-3.5")}
                    weight="fill"
                  />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isPaused ? "Resume Timer" : "Pause Timer"}
            </TooltipContent>
          </Tooltip>

          {/* Reset */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                className={cn(
                  "text-muted-foreground hover:text-foreground",
                  isSmall ? "h-6 w-6" : "h-7 w-7"
                )}
              >
                <ArrowCounterClockwise
                  className={cn(isSmall ? "h-3 w-3" : "h-3.5 w-3.5")}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset Timer</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
