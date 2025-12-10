"use client";

/**
 * Practice & Defaults Settings Section
 * - Default mode and difficulty
 * - Auto Mode settings (adaptive, prefetch)
 * - Manual Practice settings
 * - Stats behaviour toggles
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
import { Slider } from "@/components/ui/slider";
import {
  GraduationCap,
  Lightning,
  Target,
  ChartBar,
} from "@phosphor-icons/react";
import {
  useSettingsStore,
  DefaultMode,
  DefaultDifficulty,
} from "@/lib/stores/settingsStore";
import { useHydration } from "@/hooks/useHydration";

export function PracticeSection() {
  const { practice, updatePractice } = useSettingsStore();
  const isHydrated = useHydration();

  return (
    <div className="space-y-6">
      {/* Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap weight="duotone" className="h-5 w-5 text-primary" />
            Session Defaults
          </CardTitle>
          <CardDescription>
            Set your preferred starting mode and difficulty.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Default Mode</Label>
              <Select
                value={practice.defaultMode}
                onValueChange={(value: DefaultMode) =>
                  updatePractice({ defaultMode: value })
                }
                disabled={!isHydrated}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Practice</SelectItem>
                  <SelectItem value="auto">Auto Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Difficulty</Label>
              <Select
                value={practice.defaultDifficulty}
                onValueChange={(value: DefaultDifficulty) =>
                  updatePractice({ defaultDifficulty: value })
                }
                disabled={!isHydrated}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto Mode Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightning weight="duotone" className="h-5 w-5 text-primary" />
            Auto Mode
          </CardTitle>
          <CardDescription>
            Configure how Auto Mode selects and buffers questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="adaptive-difficulty">
                Use Adaptive Difficulty
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically adjust difficulty based on performance.
              </p>
            </div>
            <Switch
              id="adaptive-difficulty"
              checked={practice.useAdaptiveDifficulty}
              onCheckedChange={(checked) =>
                updatePractice({ useAdaptiveDifficulty: checked })
              }
              disabled={!isHydrated}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Max Prefetch Questions per Topic</Label>
              <span className="text-sm font-medium">
                {practice.maxPrefetchPerTopic}
              </span>
            </div>
            <Slider
              value={[practice.maxPrefetchPerTopic]}
              onValueChange={([value]) =>
                updatePractice({ maxPrefetchPerTopic: value })
              }
              min={1}
              max={3}
              step={1}
              className="w-full"
              disabled={!isHydrated}
            />
            <p className="text-xs text-muted-foreground">
              Higher values reduce loading times but use more API calls.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Manual Practice Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target weight="duotone" className="h-5 w-5 text-primary" />
            Manual Practice
          </CardTitle>
          <CardDescription>Configure Manual Practice behavior.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-generate">
                Auto-generate Next Question After Success
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically load a new question when you solve one correctly.
              </p>
            </div>
            <Switch
              id="auto-generate"
              checked={practice.autoGenerateNextQuestion}
              onCheckedChange={(checked) =>
                updatePractice({ autoGenerateNextQuestion: checked })
              }
              disabled={!isHydrated}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Behaviour */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ChartBar weight="duotone" className="h-5 w-5 text-primary" />
            Stats Behavior
          </CardTitle>
          <CardDescription>
            Control how stats are calculated and displayed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="unsolved-mastery">
                Include Unsolved Attempts in Mastery
              </Label>
              <p className="text-xs text-muted-foreground">
                Count failed attempts when calculating mastery percentage.
              </p>
            </div>
            <Switch
              id="unsolved-mastery"
              checked={practice.includeUnsolvedInMastery}
              onCheckedChange={(checked) =>
                updatePractice({ includeUnsolvedInMastery: checked })
              }
              disabled={!isHydrated}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="per-difficulty-stats">
                Show Per-Difficulty Stats on Cards
              </Label>
              <p className="text-xs text-muted-foreground">
                Display breakdown by Beginner/Intermediate/Advanced on topic
                cards.
              </p>
            </div>
            <Switch
              id="per-difficulty-stats"
              checked={practice.showPerDifficultyStats}
              onCheckedChange={(checked) =>
                updatePractice({ showPerDifficultyStats: checked })
              }
              disabled={!isHydrated}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
