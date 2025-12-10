"use client";

/**
 * Auto Mode Controls
 *
 * In-run quick settings popover for Auto Mode:
 * - Aggressive progression toggle
 * - Remediation mode toggle
 */

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { type AutoRunV2 } from "@/lib/auto-mode/autoRunTypes";
import { saveRun } from "@/lib/auto-mode";
import { GearSix, Lightning, FirstAid } from "@phosphor-icons/react";

interface AutoModeControlsProps {
  run: AutoRunV2;
  onRunUpdate: (run: AutoRunV2) => void;
}

export function AutoModeControls({ run, onRunUpdate }: AutoModeControlsProps) {
  const handleAggressiveChange = (checked: boolean) => {
    const updated: AutoRunV2 = {
      ...run,
      aggressiveProgression: checked,
      lastUpdatedAt: Date.now(),
    };
    saveRun(updated);
    onRunUpdate(updated);
  };

  const handleRemediationChange = (checked: boolean) => {
    const updated: AutoRunV2 = {
      ...run,
      remediationMode: checked,
      lastUpdatedAt: Date.now(),
    };
    saveRun(updated);
    onRunUpdate(updated);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
          <GearSix weight="bold" className="h-4 w-4" />
          <span className="sr-only">Auto Mode Settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Auto Mode Settings</h4>
            <p className="text-xs text-muted-foreground">
              Adjust pacing for this run
            </p>
          </div>

          <Separator />

          {/* Aggressive Progression */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Lightning weight="duotone" className="h-4 w-4 text-yellow-500" />
              <div>
                <Label htmlFor="aggressive" className="text-sm font-medium">
                  Fast Progression
                </Label>
                <p className="text-xs text-muted-foreground">
                  Promote after 2 correct (vs 3)
                </p>
              </div>
            </div>
            <Switch
              id="aggressive"
              checked={run.aggressiveProgression}
              onCheckedChange={handleAggressiveChange}
            />
          </div>

          {/* Remediation Mode */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FirstAid weight="duotone" className="h-4 w-4 text-green-500" />
              <div>
                <Label htmlFor="remediation" className="text-sm font-medium">
                  Remediation Mode
                </Label>
                <p className="text-xs text-muted-foreground">
                  Add extra questions on mistakes
                </p>
              </div>
            </div>
            <Switch
              id="remediation"
              checked={run.remediationMode}
              onCheckedChange={handleRemediationChange}
            />
          </div>

          <Separator />

          <div className="text-xs text-muted-foreground">
            <p>
              <strong>Streak:</strong> {run.streak} correct in a row
            </p>
            <p>
              <strong>Completed:</strong> {run.completedQuestions} questions
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
