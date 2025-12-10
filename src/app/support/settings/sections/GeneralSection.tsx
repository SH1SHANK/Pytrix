"use client";

/**
 * General Settings Section
 * - App language (disabled, future-proof)
 * - Default landing page
 * - Confirmation toggles
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, House, Warning } from "@phosphor-icons/react";
import { useSettingsStore, LandingPage } from "@/lib/stores/settingsStore";
import { useHydration } from "@/hooks/useHydration";

export function GeneralSection() {
  const { general, updateGeneral } = useSettingsStore();
  const isHydrated = useHydration();

  return (
    <div className="space-y-6">
      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe weight="duotone" className="h-5 w-5 text-primary" />
            Language
          </CardTitle>
          <CardDescription>
            Choose your preferred language for the app interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={general.appLanguage} disabled>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            More languages coming soon.
          </p>
        </CardContent>
      </Card>

      {/* Default Landing Page */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <House weight="duotone" className="h-5 w-5 text-primary" />
            Default Landing Page
          </CardTitle>
          <CardDescription>
            Choose where to land when you open Pytrix.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={general.defaultLandingPage}
            onValueChange={(value: LandingPage) =>
              updateGeneral({ defaultLandingPage: value })
            }
            disabled={!isHydrated}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dashboard">Dashboard</SelectItem>
              <SelectItem value="manual-practice">Manual Practice</SelectItem>
              <SelectItem value="auto-mode">Auto Mode</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Confirmations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Warning weight="duotone" className="h-5 w-5 text-primary" />
            Confirmations
          </CardTitle>
          <CardDescription>
            Control when Pytrix asks for confirmation before destructive
            actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="confirm-reset-stats" className="flex-1">
              Ask before resetting stats
            </Label>
            <Switch
              id="confirm-reset-stats"
              checked={general.askBeforeResetStats}
              onCheckedChange={(checked) =>
                updateGeneral({ askBeforeResetStats: checked })
              }
              disabled={!isHydrated}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="confirm-delete-runs" className="flex-1">
              Ask before deleting Auto Mode runs
            </Label>
            <Switch
              id="confirm-delete-runs"
              checked={general.askBeforeDeleteRuns}
              onCheckedChange={(checked) =>
                updateGeneral({ askBeforeDeleteRuns: checked })
              }
              disabled={!isHydrated}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
