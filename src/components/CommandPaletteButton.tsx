"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Command } from "@phosphor-icons/react";
import { CommandCenter } from "./CommandCenter";
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
import { Kbd } from "@/components/ui/kbd";

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
          <TooltipContent className="flex items-center gap-1">
            Command Palette
            <div className="flex items-center gap-0.5 ml-1">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <CommandCenter open={open} onOpenChange={setOpen} />
    </>
  );
}
