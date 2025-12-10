"use client";

/**
 * AppShell - Global layout wrapper with sidebar navigation.
 *
 * This component:
 * - Wraps all pages for consistent navigation
 * - Syncs safety controller with settings
 * - Applies appearance settings (theme, fonts, density)
 */

import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "./AppSidebar";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { useSyncSafetyWithSettings } from "@/lib/safety/apiSafetyController";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  // Sync safety controller with settings
  useSyncSafetyWithSettings();

  // Read appearance settings
  const { sidebarDensity, codeFont, uiFont, useCardShadows } = useSettingsStore(
    (s) => s.appearance
  );

  // Apply CSS variables for fonts on mount and when settings change
  useEffect(() => {
    const root = document.documentElement;

    // Apply UI font
    const uiFontFamily =
      uiFont === "satoshi"
        ? "'Satoshi', sans-serif"
        : "system-ui, -apple-system, sans-serif";
    root.style.setProperty("--font-sans", uiFontFamily);

    // Apply code font
    let codeFontFamily = "monospace";
    switch (codeFont) {
      case "jetbrains-mono":
        codeFontFamily = "'JetBrains Mono', monospace";
        break;
      case "fira-code":
        codeFontFamily = "'Fira Code', monospace";
        break;
      case "system-monospace":
        codeFontFamily = "ui-monospace, monospace";
        break;
    }
    root.style.setProperty("--font-mono", codeFontFamily);

    // Apply card shadow preference
    root.style.setProperty(
      "--card-shadow",
      useCardShadows ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
    );
  }, [uiFont, codeFont, useCardShadows]);

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex min-h-screen w-full bg-background",
          sidebarDensity === "compact" && "sidebar-compact"
        )}
      >
        <AppSidebar />
        <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </TooltipProvider>
  );
}
