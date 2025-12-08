"use client";

/**
 * Key Bindings Settings Section
 * - Display current keyboard shortcuts
 * - Read-only for initial version (customization coming soon)
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Keyboard, Info } from "@phosphor-icons/react";
import { useSettingsStore } from "@/lib/settingsStore";

export function KeyBindingsSection() {
  const { keyBindings } = useSettingsStore();

  return (
    <div className="space-y-6">
      <Alert className="border-blue-500/20 bg-blue-500/5">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertTitle>Coming Soon</AlertTitle>
        <AlertDescription>
          Custom key binding configuration is under development. Currently
          showing default shortcuts.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Keyboard weight="duotone" className="h-5 w-5 text-primary" />
            Keyboard Shortcuts
          </CardTitle>
          <CardDescription>
            Quick reference for all available keyboard shortcuts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {keyBindings.map((binding) => (
              <div
                key={binding.action}
                className="flex items-center justify-between py-2 border-b last:border-b-0"
              >
                <span className="text-sm">{binding.displayName}</span>
                <div className="flex gap-1">
                  {binding.key.split("+").map((k, i) => (
                    <Kbd key={i}>{k === "Ctrl" ? "⌘" : k}</Kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Reserved browser shortcuts (⌘R, ⌘W, ⌘T) cannot be overridden.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
