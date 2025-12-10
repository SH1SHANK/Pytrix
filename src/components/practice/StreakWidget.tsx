"use client";

import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Fire, Robot, User } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface StreakWidgetProps {
  streak: number;
  mode: "auto" | "manual";
  className?: string;
}

export function StreakWidget({ streak, mode, className }: StreakWidgetProps) {
  const prevStreakRef = useRef(streak);
  const [isIncrementing, setIsIncrementing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (streak > prevStreakRef.current) {
      // Increment animation
      setTimeout(() => setIsIncrementing(true), 0);
      const timer = setTimeout(() => setIsIncrementing(false), 1000);
      return () => clearTimeout(timer);
    } else if (streak < prevStreakRef.current) {
      // Reset animation
      setTimeout(() => setIsResetting(true), 0);
      const timer = setTimeout(() => setIsResetting(false), 600);
      return () => clearTimeout(timer);
    }
    prevStreakRef.current = streak;
  }, [streak]);

  // Determine colors based on mode and streak level
  const isHighStreak = streak >= 3;
  const isGodlike = streak >= 10;

  const modeColor =
    mode === "auto"
      ? "text-purple-500 border-purple-500/30 bg-purple-500/10"
      : "text-blue-500 border-blue-500/30 bg-blue-500/10";

  const fireColor = isGodlike
    ? "text-purple-500"
    : isHighStreak
    ? "text-orange-500"
    : "text-muted-foreground";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge
        variant="outline"
        className={cn(
          "relative overflow-hidden gap-1.5 px-2 py-1 transition-all duration-300",
          modeColor,
          isResetting && "animate-shake opacity-50 border-red-500 text-red-500"
        )}
      >
        <AnimatePresence mode="wait">
          {isIncrementing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1.5, y: -20 }}
              exit={{ opacity: 0 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-green-500 pointer-events-none z-10"
            >
              +1
            </motion.div>
          )}
        </AnimatePresence>

        {mode === "auto" ? (
          <Robot weight="fill" className="h-3 w-3" />
        ) : (
          <User weight="fill" className="h-3 w-3" />
        )}
        <span className="text-xs font-medium capitalize">{mode}</span>
      </Badge>

      <div
        className={cn(
          "flex items-center gap-1.5 transition-all duration-300",
          isIncrementing && "scale-110"
        )}
      >
        <Fire
          weight={streak > 0 ? "fill" : "regular"}
          className={cn("h-4 w-4 transition-colors duration-300", fireColor)}
        />
        <span
          className={cn(
            "text-sm font-bold tabular-nums transition-colors duration-300",
            fireColor
          )}
        >
          {streak}
        </span>
      </div>
    </div>
  );
}
