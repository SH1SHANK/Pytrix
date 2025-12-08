"use client";

/**
 * Editor Settings Section
 * - Tab size, auto indent, line numbers, minimap, word wrap
 * - Highlight active line, editor theme
 * - Python version display, auto-run on Ctrl+Enter
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
import { Code, Sliders, Play } from "@phosphor-icons/react";
import { useSettingsStore, EditorTheme } from "@/lib/settingsStore";
import { useHydration } from "@/hooks/useHydration";

export function EditorSection() {
  const { editor, updateEditor } = useSettingsStore();
  const isHydrated = useHydration();

  return (
    <div className="space-y-6">
      {/* Basic Editor Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Code weight="duotone" className="h-5 w-5 text-primary" />
            Editor Basics
          </CardTitle>
          <CardDescription>
            Configure the code editing experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tab Size */}
          <div className="space-y-2">
            <Label>Tab Size</Label>
            <RadioGroup
              value={String(editor.tabSize)}
              onValueChange={(value) =>
                updateEditor({ tabSize: Number(value) as 2 | 4 })
              }
              className="flex gap-4"
              disabled={!isHydrated}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="tab-2" />
                <Label htmlFor="tab-2">2 spaces</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4" id="tab-4" />
                <Label htmlFor="tab-4">4 spaces</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Toggles Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-indent">Auto Indent</Label>
              <Switch
                id="auto-indent"
                checked={editor.autoIndent}
                onCheckedChange={(checked) =>
                  updateEditor({ autoIndent: checked })
                }
                disabled={!isHydrated}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="line-numbers">Line Numbers</Label>
              <Switch
                id="line-numbers"
                checked={editor.showLineNumbers}
                onCheckedChange={(checked) =>
                  updateEditor({ showLineNumbers: checked })
                }
                disabled={!isHydrated}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="minimap">Minimap</Label>
              <Switch
                id="minimap"
                checked={editor.showMinimap}
                onCheckedChange={(checked) =>
                  updateEditor({ showMinimap: checked })
                }
                disabled={!isHydrated}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="word-wrap">Word Wrap</Label>
              <Switch
                id="word-wrap"
                checked={editor.wordWrap}
                onCheckedChange={(checked) =>
                  updateEditor({ wordWrap: checked })
                }
                disabled={!isHydrated}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="highlight-line">Highlight Active Line</Label>
              <Switch
                id="highlight-line"
                checked={editor.highlightActiveLine}
                onCheckedChange={(checked) =>
                  updateEditor({ highlightActiveLine: checked })
                }
                disabled={!isHydrated}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sliders weight="duotone" className="h-5 w-5 text-primary" />
            Editor Theme
          </CardTitle>
          <CardDescription>
            Choose a color theme for the code editor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={editor.editorTheme}
            onValueChange={(value: EditorTheme) =>
              updateEditor({ editorTheme: value })
            }
            disabled={!isHydrated}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="github-dark">GitHub Dark</SelectItem>
              <SelectItem value="monokai">Monokai</SelectItem>
              <SelectItem value="solarized-dark">Solarized Dark</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Behavior */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Play weight="duotone" className="h-5 w-5 text-primary" />
            Behavior
          </CardTitle>
          <CardDescription>
            Control how the editor behaves during practice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-python-version">
                Show Python Version in Footer
              </Label>
              <p className="text-xs text-muted-foreground">
                Display the Pyodide Python version in the status bar.
              </p>
            </div>
            <Switch
              id="show-python-version"
              checked={editor.showPythonVersion}
              onCheckedChange={(checked) =>
                updateEditor({ showPythonVersion: checked })
              }
              disabled={!isHydrated}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-run">Auto-run on Ctrl+Enter</Label>
              <p className="text-xs text-muted-foreground">
                When disabled, you must click the &quot;Run &amp; Check&quot;
                button.
              </p>
            </div>
            <Switch
              id="auto-run"
              checked={editor.autoRunOnCtrlEnter}
              onCheckedChange={(checked) =>
                updateEditor({ autoRunOnCtrlEnter: checked })
              }
              disabled={!isHydrated}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
