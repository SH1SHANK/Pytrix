"use client";

import { CommandPalette } from "@/components/CommandPalette";

/**
 * Client-side providers and global components.
 * Wraps children and adds CommandPalette with Cmd+K listener.
 */
export function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CommandPalette />
    </>
  );
}
