"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Command } from "@phosphor-icons/react";
import { CommandPalette } from "./CommandPalette";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Button to open the Command Palette manually.
 * Shows Cmd+K shortcut hint.
 */
export function CommandPaletteButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setOpen(true)}
              aria-label="Open Command Palette"
            >
              <Command weight="duotone" className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Command Palette <kbd className="ml-1 font-mono text-xs">⌘K</kbd>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
