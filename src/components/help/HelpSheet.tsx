"use client";

import { useState, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Question,
  Gear,
  Lightning,
  Target,
  ChartLineUp,
  FloppyDisk,
  Moon,
  Code,
  Warning,
  Trash,
  Export,
  UploadSimple,
  Keyboard,
  Info,
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { resetStats } from "@/lib/stores/statsStore";
import { exportAllRuns, importRuns } from "@/lib/auto-mode";
import { usePractice } from "@/app/PracticeContext";

interface HelpSheetProps {
  trigger?: React.ReactNode;
}

export function HelpSheet({ trigger }: HelpSheetProps) {
  const { theme, setTheme } = useTheme();
  const { refreshStats } = usePractice();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  // Delete all Auto Mode runs
  const handleDeleteAllRuns = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pypractice-savefiles");
      toast.success("All Auto Mode runs deleted");
    }
  };

  // Reset all stats
  const handleResetStats = () => {
    resetStats();
    refreshStats();
    toast.success("Stats reset successfully");
  };

  // Export all runs
  const handleExportAll = () => {
    const data = exportAllRuns();
    if (data.runs.length === 0) {
      toast.error("No runs to export");
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pypractice-runs-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${data.runs.length} runs`);
  };

  // Import runs
  const handleImportRuns = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const result = importRuns(data);
        if (result.errors.length > 0) {
          toast.error(result.errors[0]);
        } else if (result.imported === 0) {
          toast.info("No new runs imported");
        } else {
          toast.success(`Imported ${result.imported} runs`);
        }
      } catch {
        toast.error("Failed to parse import file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" aria-label="Help and Settings">
            <Question weight="duotone" className="h-5 w-5" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Info weight="duotone" className="h-5 w-5" />
            Help & Settings
          </SheetTitle>
          <SheetDescription>
            Learn how PyPractice works and customize your experience.
          </SheetDescription>
        </SheetHeader>

        {/* Hidden file input for import */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleImportRuns}
          className="hidden"
        />

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="faq" className="text-xs">
              FAQ
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              Settings
            </TabsTrigger>
            <TabsTrigger value="help" className="text-xs">
              Help
            </TabsTrigger>
          </TabsList>

          {/* ==================== OVERVIEW TAB ==================== */}
          <TabsContent value="overview">
            <ScrollArea className="h-[calc(100vh-200px)] pr-4">
              <div className="space-y-4">
                {/* Auto Mode */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Lightning
                        weight="duotone"
                        className="h-4 w-4 text-primary"
                      />
                      Auto Mode
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    AI-powered adaptive practice that focuses on your weakest
                    topics. Questions rotate after 3 correct answers per topic.
                    Your progress is saved automatically.
                  </CardContent>
                </Card>

                {/* Manual Practice */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target
                        weight="duotone"
                        className="h-4 w-4 text-green-500"
                      />
                      Manual Practice
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Choose any topic to practice at your own pace. Click
                    &quot;New&quot; to generate a different question. Great for
                    focused learning.
                  </CardContent>
                </Card>

                {/* Stats & Progress */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ChartLineUp
                        weight="duotone"
                        className="h-4 w-4 text-blue-500"
                      />
                      Stats & Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Track problems solved, mastery percentage, and topics
                    explored. All stats persist across browser sessions in
                    localStorage.
                  </CardContent>
                </Card>

                {/* Save Files */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FloppyDisk
                        weight="duotone"
                        className="h-4 w-4 text-purple-500"
                      />
                      Save Files & Export
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Auto Mode runs are saved automatically. Export your runs as
                    JSON to backup or share progress. Import runs to restore.
                  </CardContent>
                </Card>

                {/* Dark Theme */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Moon
                        weight="duotone"
                        className="h-4 w-4 text-yellow-500"
                      />
                      GitHub Dark Theme
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Optimized for extended coding sessions with high-contrast
                    text. Uses Satoshi Variable for UI and JetBrains Mono for
                    code.
                  </CardContent>
                </Card>

                {/* Code Editor */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Code
                        weight="duotone"
                        className="h-4 w-4 text-orange-500"
                      />
                      Code Editor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Monaco editor with GitHub Dark syntax highlighting,
                    JetBrains Mono font, and smooth animations. Code is
                    evaluated by AI, not executed.
                  </CardContent>
                </Card>

                {/* Keyboard Shortcuts */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Keyboard weight="duotone" className="h-4 w-4" />
                      Keyboard Shortcuts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Run & Check
                        </span>
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          Ctrl+Enter
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Get Hint</span>
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          Ctrl+Shift+H
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ==================== FAQ TAB ==================== */}
          <TabsContent value="faq">
            <ScrollArea className="h-[calc(100vh-200px)] pr-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="q1">
                  <AccordionTrigger className="text-sm">
                    How does Auto Mode choose topics?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    It prioritizes topics with the lowest solve rate, ensuring
                    you practice what you need most. After 3 questions per
                    topic, it rotates to the next.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="q2">
                  <AccordionTrigger className="text-sm">
                    Can I skip a question?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Yes! Click the &quot;New&quot; button to regenerate a
                    different question for the current topic. This won&apos;t
                    affect your stats.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="q3">
                  <AccordionTrigger className="text-sm">
                    Where are my stats stored?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    All data is stored locally in your browser (localStorage).
                    Nothing is sent to external servers. Clear your browser data
                    to reset everything.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="q4">
                  <AccordionTrigger className="text-sm">
                    How do I reset my progress?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Go to Settings tab → Data Management section → Click
                    &quot;Reset Stats&quot;. This clears your progress but keeps
                    Auto Mode save files.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="q5">
                  <AccordionTrigger className="text-sm">
                    Does the code actually run?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    No—the AI analyzes your code logic and simulates execution.
                    It checks if your solution would produce the expected output
                    without actually running Python.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="q6">
                  <AccordionTrigger className="text-sm">
                    Can I export my progress?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Yes! You can export Auto Mode runs as JSON from the Auto
                    Mode dialog or Settings tab. Stats are browser-local and
                    can&apos;t be exported separately.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ScrollArea>
          </TabsContent>

          {/* ==================== SETTINGS TAB ==================== */}
          <TabsContent value="settings">
            <ScrollArea className="h-[calc(100vh-200px)] pr-4">
              <div className="space-y-6">
                {/* Theme */}
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <Moon weight="duotone" className="h-4 w-4" />
                    Appearance
                  </h3>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm">Dark Mode</p>
                      <p className="text-xs text-muted-foreground">
                        Use dark theme for the interface
                      </p>
                    </div>
                    <Switch
                      checked={theme === "dark"}
                      onCheckedChange={(checked) =>
                        setTheme(checked ? "dark" : "light")
                      }
                    />
                  </div>
                </div>

                <Separator />

                {/* Data Management */}
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <Gear weight="duotone" className="h-4 w-4" />
                    Data Management
                  </h3>

                  <div className="space-y-3">
                    {/* Reset Stats */}
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm">Reset Stats</p>
                        <p className="text-xs text-muted-foreground">
                          Clear all progress (keeps save files)
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetStats}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </div>

                    {/* Delete Runs */}
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm">Delete All Runs</p>
                        <p className="text-xs text-muted-foreground">
                          Remove all Auto Mode save files
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteAllRuns}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>

                    {/* Export Runs */}
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm">Export Runs</p>
                        <p className="text-xs text-muted-foreground">
                          Download all runs as JSON
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportAll}
                      >
                        <Export className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>

                    {/* Import Runs */}
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm">Import Runs</p>
                        <p className="text-xs text-muted-foreground">
                          Restore runs from JSON file
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <UploadSimple className="h-4 w-4 mr-2" />
                        Import
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Info */}
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <Info weight="duotone" className="h-4 w-4" />
                    About
                  </h3>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>PyPractice MVP v0.1.0</p>
                    <p>Fonts: Satoshi Variable (UI), JetBrains Mono (Code)</p>
                    <p>Theme: GitHub Dark Mode</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ==================== TROUBLESHOOTING TAB ==================== */}
          <TabsContent value="help">
            <ScrollArea className="h-[calc(100vh-200px)] pr-4">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Warning
                    weight="duotone"
                    className="h-4 w-4 text-yellow-500"
                  />
                  Troubleshooting
                </h3>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Questions not loading?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Check your internet connection. The AI requires network
                    access to generate questions. Try refreshing the page.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Stats not updating?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Refresh the page. If the issue persists, check that your
                    browser allows localStorage. Private/incognito mode may
                    cause issues.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Run button disabled?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    You may have already solved the question. Click
                    &quot;Next&quot; to move to the next question, or
                    &quot;New&quot; to get a different one.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Code not being executed?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    This app uses AI to evaluate your code logic—it doesn&apos;t
                    actually run Python. The AI simulates execution and checks
                    your solution.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Auto Mode runs not saving?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Ensure your browser allows localStorage. Clear browser cache
                    if data seems corrupted. Export your runs regularly as
                    backup.
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
