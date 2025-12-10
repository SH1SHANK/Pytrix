"use client";

/**
 * Advanced Settings Section
 * - API usage caps (safety limits)
 * - Developer options
 * - Reset to defaults
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  GearSix,
  Warning,
  Bug,
  Flask,
  ArrowCounterClockwise,
  Gauge,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { useHydration } from "@/hooks/useHydration";

export function AdvancedSection() {
  const { advanced, updateAdvanced, resetToDefaults } = useSettingsStore();
  const isHydrated = useHydration();

  const handleReset = () => {
    resetToDefaults();
    toast.success("All settings reset to defaults");
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <Alert className="border-yellow-500/20 bg-yellow-500/5">
        <Warning className="h-4 w-4 text-yellow-500" />
        <AlertTitle>Advanced Settings</AlertTitle>
        <AlertDescription>
          These options are for power users. Changing them may affect
          performance or API usage. Proceed with caution.
        </AlertDescription>
      </Alert>

      {/* API Usage Caps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge weight="duotone" className="h-5 w-5 text-primary" />
            API Usage Caps
          </CardTitle>
          <CardDescription>
            Client-side safety limits to help you stay within free tier quotas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Max API Calls per Session</Label>
              <span className="text-sm font-medium">
                {advanced.maxApiCallsPerSession}
              </span>
            </div>
            <Slider
              value={[advanced.maxApiCallsPerSession]}
              onValueChange={([value]) =>
                updateAdvanced({ maxApiCallsPerSession: value })
              }
              min={10}
              max={100}
              step={5}
              className="w-full"
              disabled={!isHydrated}
            />
            <p className="text-xs text-muted-foreground">
              Limits total AI calls per browser session. Prevents runaway usage.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Max Optimal Solution Calls per Session</Label>
              <span className="text-sm font-medium">
                {advanced.maxOptimalSolutionCallsPerSession}
              </span>
            </div>
            <Slider
              value={[advanced.maxOptimalSolutionCallsPerSession]}
              onValueChange={([value]) =>
                updateAdvanced({ maxOptimalSolutionCallsPerSession: value })
              }
              min={3}
              max={25}
              step={1}
              className="w-full"
              disabled={!isHydrated}
            />
            <p className="text-xs text-muted-foreground">
              Limits &quot;Reveal Solution&quot; and &quot;Optimize&quot; calls.
              These use more tokens.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Developer Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bug weight="duotone" className="h-5 w-5 text-primary" />
            Developer Options
          </CardTitle>
          <CardDescription>
            Tools for debugging and experimentation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="debug-info">
                Show Debug Info for LLM Requests
              </Label>
              <p className="text-xs text-muted-foreground">
                Display request metadata in console (never shows API key).
              </p>
            </div>
            <Switch
              id="debug-info"
              checked={advanced.showDebugInfo}
              onCheckedChange={(checked) =>
                updateAdvanced({ showDebugInfo: checked })
              }
              disabled={!isHydrated}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flask weight="duotone" className="h-4 w-4 text-purple-500" />
              <div>
                <Label htmlFor="experimental">
                  Enable Experimental Features
                </Label>
                <p className="text-xs text-muted-foreground">
                  Access beta features that may be unstable.
                </p>
              </div>
            </div>
            <Switch
              id="experimental"
              checked={advanced.enableExperimentalFeatures}
              onCheckedChange={(checked) =>
                updateAdvanced({ enableExperimentalFeatures: checked })
              }
              disabled={!isHydrated}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reset to Defaults */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowCounterClockwise
              weight="duotone"
              className="h-5 w-5 text-primary"
            />
            Reset Settings
          </CardTitle>
          <CardDescription>
            Restore all settings to their original values.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">
                Reset All Settings to Defaults
              </p>
              <p className="text-xs text-muted-foreground">
                This will not clear your stats, history, or API key.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={!isHydrated}>
                  Reset to Defaults
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <GearSix className="h-5 w-5" />
                    Reset All Settings?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all settings (General, Appearance, Editor,
                    Practice, Key Bindings, Advanced, Privacy) to their default
                    values. Your stats, history, and API key will NOT be
                    affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>
                    Reset Settings
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
