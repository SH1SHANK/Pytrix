"use client";

import { CommandCenter } from "@/components/CommandCenter";

/**
 * Client-side providers and global components.
 * Wraps children and adds CommandCenter with Cmd+K listener.
 */
export function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CommandCenter />
    </>
  );
}
