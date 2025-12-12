"use client";

/**
 * Reveal Solution Dropdown for Auto Mode
 *
 * Provides two options:
 * - Full Solution: Thorough explanation with commented code
 * - Code Only: Just the working solution
 */

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, SpinnerGap, BookOpen, Code } from "@phosphor-icons/react";
import type { SolutionMode } from "@/lib/ai/aiClient";

interface RevealSolutionDropdownProps {
  onReveal: (mode: SolutionMode) => Promise<void>;
  disabled?: boolean;
  isRevealing?: boolean;
}

/**
 * Dropdown button for revealing solutions in Auto Mode.
 * Offers two modes: thorough (with explanation) or direct (code only).
 */
export function RevealSolutionDropdown({
  onReveal,
  disabled = false,
  isRevealing = false,
}: RevealSolutionDropdownProps) {
  const handleClick = async (mode: SolutionMode) => {
    await onReveal(mode);
  };

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled || isRevealing}
                className="gap-1.5 h-8 px-3"
              >
                {isRevealing ? (
                  <SpinnerGap className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye weight="duotone" className="h-4 w-4" />
                )}
                <span className="hidden sm:inline text-xs">
                  {isRevealing ? "Loading..." : "Reveal"}
                </span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reveal the solution</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Choose reveal mode
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Full Solution Option */}
        <DropdownMenuItem
          onClick={() => handleClick("thorough")}
          className="cursor-pointer gap-3 py-2.5"
        >
          <BookOpen weight="duotone" className="h-4 w-4 text-blue-500" />
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">Full Solution</span>
            <span className="text-xs text-muted-foreground">
              Explanation + commented code
            </span>
          </div>
        </DropdownMenuItem>

        {/* Code Only Option */}
        <DropdownMenuItem
          onClick={() => handleClick("direct")}
          className="cursor-pointer gap-3 py-2.5"
        >
          <Code weight="duotone" className="h-4 w-4 text-green-500" />
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">Code Only</span>
            <span className="text-xs text-muted-foreground">
              Just the working code
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
