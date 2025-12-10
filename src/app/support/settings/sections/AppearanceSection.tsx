"use client";

/**
 * Appearance Settings Section
 * - Theme (GitHub Dark / System / Light)
 * - Accent color palette
 * - Sidebar density
 * - Card shadows toggle
 * - UI and Code font customization
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Sun, Palette, TextT, Rows, Square } from "@phosphor-icons/react";
import {
  useSettingsStore,
  Theme,
  AccentColor,
  SidebarDensity,
  UIFont,
  CodeFont,
} from "@/lib/stores/settingsStore";
import { cn } from "@/lib/utils";
import { useHydration } from "@/hooks/useHydration";

const accentColors: { value: AccentColor; color: string; label: string }[] = [
  { value: "blue", color: "bg-blue-500", label: "Blue" },
  { value: "green", color: "bg-green-500", label: "Green" },
  { value: "purple", color: "bg-purple-500", label: "Purple" },
  { value: "orange", color: "bg-orange-500", label: "Orange" },
];

export function AppearanceSection() {
  const { appearance, updateAppearance } = useSettingsStore();
  const isHydrated = useHydration();

  return (
    <div className="space-y-6">
      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sun weight="duotone" className="h-5 w-5 text-primary" />
            Theme
          </CardTitle>
          <CardDescription>Choose your preferred color scheme.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={appearance.theme}
            onValueChange={(value: Theme) => updateAppearance({ theme: value })}
            className="flex flex-wrap gap-4"
            disabled={!isHydrated}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="github-dark" id="theme-dark" />
              <Label htmlFor="theme-dark">GitHub Dark</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="theme-system" />
              <Label htmlFor="theme-system">System</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="github-light" id="theme-light" />
              <Label htmlFor="theme-light">GitHub Light</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette weight="duotone" className="h-5 w-5 text-primary" />
            Accent Color
          </CardTitle>
          <CardDescription>
            Customize the highlight color for badges and buttons.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {accentColors.map((c) => (
              <Button
                key={c.value}
                variant="outline"
                size="icon"
                className={cn(
                  "w-10 h-10 rounded-full p-0 border-2",
                  appearance.accentColor === c.value
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "border-transparent"
                )}
                onClick={() => updateAppearance({ accentColor: c.value })}
                title={c.label}
                disabled={!isHydrated}
              >
                <div className={cn("w-6 h-6 rounded-full", c.color)} />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sidebar Density */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Rows weight="duotone" className="h-5 w-5 text-primary" />
            Sidebar Density
          </CardTitle>
          <CardDescription>
            Adjust the spacing of sidebar items.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={appearance.sidebarDensity}
            onValueChange={(value: SidebarDensity) =>
              updateAppearance({ sidebarDensity: value })
            }
            className="flex gap-4"
            disabled={!isHydrated}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="compact" id="density-compact" />
              <Label htmlFor="density-compact">Compact</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="comfortable" id="density-comfortable" />
              <Label htmlFor="density-comfortable">Comfortable</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Card Shadows */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Square weight="duotone" className="h-5 w-5 text-primary" />
            Card Shadows
          </CardTitle>
          <CardDescription>
            Toggle subtle shadows on cards for depth.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="card-shadows">Use subtle shadows</Label>
            <Switch
              id="card-shadows"
              checked={appearance.useCardShadows}
              onCheckedChange={(checked) =>
                updateAppearance({ useCardShadows: checked })
              }
              disabled={!isHydrated}
            />
          </div>
        </CardContent>
      </Card>

      {/* Font Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TextT weight="duotone" className="h-5 w-5 text-primary" />
            Fonts
          </CardTitle>
          <CardDescription>
            Customize the fonts used in the interface and code editor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>UI Font</Label>
              <Select
                value={appearance.uiFont}
                onValueChange={(value: UIFont) =>
                  updateAppearance({ uiFont: value })
                }
                disabled={!isHydrated}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="satoshi">Satoshi</SelectItem>
                  <SelectItem value="system">System Font</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Code Font</Label>
              <Select
                value={appearance.codeFont}
                onValueChange={(value: CodeFont) =>
                  updateAppearance({ codeFont: value })
                }
                disabled={!isHydrated}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jetbrains-mono">JetBrains Mono</SelectItem>
                  <SelectItem value="fira-code">Fira Code</SelectItem>
                  <SelectItem value="system-monospace">
                    System Monospace
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
