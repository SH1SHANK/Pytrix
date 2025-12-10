"use client";

/**
 * Privacy & Data Settings Section
 * - Explanation of local storage
 * - Privacy toggles
 * - Clear data actions with confirmations
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
  ShieldCheck,
  Database,
  Trash,
  Warning,
  ClockCounterClockwise,
  ChartBar,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { useHydration } from "@/hooks/useHydration";

export function PrivacySection() {
  const { privacy, updatePrivacy, clearStats, clearHistory, clearAllData } =
    useSettingsStore();
  const isHydrated = useHydration();

  const handleClearStats = () => {
    clearStats();
    toast.success("Stats cleared successfully");
  };

  const handleClearHistory = () => {
    clearHistory();
    toast.success("History cleared successfully");
  };

  const handleClearAll = () => {
    clearAllData();
    toast.success("All local data cleared. Reload to complete.");
    // Reload after brief delay
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Privacy Explanation */}
      <Alert className="border-green-500/20 bg-green-500/5">
        <ShieldCheck className="h-4 w-4 text-green-500" />
        <AlertTitle>Local-First Privacy</AlertTitle>
        <AlertDescription>
          All your data—stats, history, API key, and settings—is stored locally
          in your browser. Nothing is sent to Pytrix servers.
        </AlertDescription>
      </Alert>

      {/* Data Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database weight="duotone" className="h-5 w-5 text-primary" />
            Data Storage
          </CardTitle>
          <CardDescription>
            Understanding where your data lives.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <ChartBar weight="duotone" className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Stats & Mastery</p>
              <p>
                Your attempt counts, solve rates, and mastery scores are stored
                in{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  localStorage
                </code>
                .
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ClockCounterClockwise
              weight="duotone"
              className="h-5 w-5 shrink-0 mt-0.5"
            />
            <div>
              <p className="font-medium text-foreground">History</p>
              <p>
                A log of every question, your code, and the result. Also in
                localStorage.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck weight="duotone" className="h-5 w-5 text-primary" />
            Privacy Options
          </CardTitle>
          <CardDescription>Control what data is tracked.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="track-history">Track Detailed History</Label>
              <p className="text-xs text-muted-foreground">
                When off, only aggregate stats are kept (no individual
                attempts).
              </p>
            </div>
            <Switch
              id="track-history"
              checked={privacy.trackDetailedHistory}
              onCheckedChange={(checked) =>
                updatePrivacy({ trackDetailedHistory: checked })
              }
              disabled={!isHydrated}
            />
          </div>
          <div className="flex items-center justify-between opacity-50">
            <div>
              <Label htmlFor="diagnostics">Enable Anonymous Diagnostics</Label>
              <p className="text-xs text-muted-foreground">
                Help improve Pytrix with anonymized usage data (not
                implemented).
              </p>
            </div>
            <Switch
              id="diagnostics"
              checked={privacy.enableAnonymousDiagnostics}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Clear Data Actions */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <Trash weight="duotone" className="h-5 w-5" />
            Clear Data
          </CardTitle>
          <CardDescription>
            Permanently delete your stored data. These actions cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Clear Stats */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Clear Stats Only</p>
              <p className="text-xs text-muted-foreground">
                Remove all attempt counts and mastery data.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={!isHydrated}>
                  Clear Stats
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <Warning className="h-5 w-5 text-destructive" />
                    Clear All Stats?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your practice stats,
                    including attempts, solve counts, and mastery percentages.
                    Your history and API key will be preserved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearStats}>
                    Clear Stats
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Clear History */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Clear History Only</p>
              <p className="text-xs text-muted-foreground">
                Remove all past questions and code snapshots.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={!isHydrated}>
                  Clear History
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <Warning className="h-5 w-5 text-destructive" />
                    Clear All History?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your question history,
                    including all code snapshots and results. Your stats and API
                    key will be preserved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearHistory}>
                    Clear History
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Clear All */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium text-sm text-destructive">
                Clear All Local Data
              </p>
              <p className="text-xs text-muted-foreground">
                Remove stats, history, Auto Mode runs, and API key.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={!isHydrated}>
                  Clear Everything
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <Warning className="h-5 w-5 text-destructive" />
                    Clear All Data?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete ALL Pytrix data from your
                    browser, including:
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Practice stats and mastery</li>
                      <li>Question history</li>
                      <li>Auto Mode save files</li>
                      <li>Your API key</li>
                    </ul>
                    <br />
                    The page will reload after clearing.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Clear Everything
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
