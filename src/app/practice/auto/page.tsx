"use client";

/**
 * Auto Mode Landing Page v2
 *
 * Dashboard-style control center for adaptive learning:
 * - Curriculum path preview
 * - Adaptive learning cards
 * - Past insights
 * - Action zone with New/Continue buttons
 * - Settings panel
 */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SaveFileDialog } from "@/components/automode/SaveFileDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Lightning,
  Sparkle,
  Target,
  TrendUp,
  CaretRight,
  Play,
  ArrowRight,
  Fire,
  Hourglass,
  Stairs,
  GearSix,
  CaretDown,
  Brain,
  Rocket,
  Info,
} from "@phosphor-icons/react";
import { useApiKey } from "@/app/ApiKeyContext";
import { getStats } from "@/lib/statsStore";
import {
  getAllAutoRunsV2,
  createAutoRunV2,
  getCurrentQueueEntry,
  getSubtopicDifficulty,
  generateMiniCurriculum,
  DEFAULT_AUTO_RUN_CONFIG,
} from "@/lib/autoModeServiceV2";
import type { AutoRunV2, DifficultyLevel } from "@/lib/autoRunTypes";
import { cn } from "@/lib/utils";

// ============================================
// DIFFICULTY ICON COMPONENT
// ============================================

function DifficultyIcon({
  difficulty,
  className,
}: {
  difficulty: DifficultyLevel;
  className?: string;
}) {
  switch (difficulty) {
    case "beginner":
      return (
        <Lightning weight="duotone" className={cn("h-3 w-3", className)} />
      );
    case "intermediate":
      return <Brain weight="duotone" className={cn("h-3 w-3", className)} />;
    case "advanced":
      return <Rocket weight="duotone" className={cn("h-3 w-3", className)} />;
  }
}

// ============================================
// CURRICULUM PATH PREVIEW
// ============================================

function CurriculumPathPreview({ run }: { run: AutoRunV2 | null }) {
  const curriculum = useMemo(() => generateMiniCurriculum(6), []);
  const currentIndex = run?.currentIndex ?? 0;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Stairs weight="duotone" className="h-4 w-4 text-primary" />
          Curriculum Path
        </CardTitle>
        <CardDescription className="text-xs">
          New runs start with String Manipulation and expand based on mastery
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {curriculum.slice(0, 5).map((entry, idx) => {
            const isActive = run && idx === currentIndex;
            const isCompleted = run && idx < currentIndex;

            return (
              <div
                key={entry.problemTypeId}
                className="flex items-center shrink-0"
              >
                <Badge
                  variant={
                    isActive ? "default" : isCompleted ? "secondary" : "outline"
                  }
                  className={cn(
                    "text-xs whitespace-nowrap",
                    isActive &&
                      "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  {entry.subtopicName}
                </Badge>
                {idx < 4 && (
                  <CaretRight className="h-3 w-3 text-muted-foreground mx-1 shrink-0" />
                )}
              </div>
            );
          })}
          <Badge
            variant="outline"
            className="text-xs text-muted-foreground shrink-0"
          >
            + more
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// ADAPTIVE LEARNING CARDS
// ============================================

function AdaptiveLearningCards({ run }: { run: AutoRunV2 | null }) {
  const entry = run ? getCurrentQueueEntry(run) : null;
  const difficulty =
    run && entry ? getSubtopicDifficulty(run, entry.subtopicId) : "beginner";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card A: Streak-Based Progression */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full" />
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-1">
            <Fire weight="duotone" className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-sm">Dynamic Difficulty</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <CardDescription className="text-xs">
            Difficulty increases after 2–3 consecutive correct answers. Mistakes
            trigger targeted remediation.
          </CardDescription>
          {run && (
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 rounded-full">
                <Fire weight="fill" className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-xs font-semibold">{run.streak}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                <DifficultyIcon difficulty={difficulty} className="mr-1" />
                {difficulty}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card B: Weakness Detection */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full" />
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-1">
            <Target weight="duotone" className="h-5 w-5 text-red-500" />
            <CardTitle className="text-sm">Focus Where You Struggle</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <CardDescription className="text-xs">
            Prioritizes weaker subtopics and inserts extra beginner-level
            questions when needed.
          </CardDescription>
          {run && Object.keys(run.perSubtopicStats).length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                {Object.keys(run.perSubtopicStats).length} subtopics tracked
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card C: Question Buffering */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-1">
            <Hourglass weight="duotone" className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-sm">Low-Latency Questions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <CardDescription className="text-xs">
            2–3 upcoming questions prefetched using light models for
            near-instant transitions.
          </CardDescription>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline" className="text-xs">
              Buffer:{" "}
              {run?.prefetchSize ?? DEFAULT_AUTO_RUN_CONFIG.prefetchBufferSize}
            </Badge>
            <Badge variant="outline" className="text-xs">
              flash-lite
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Card D: Personalized Trajectory */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-green-500/10 to-transparent rounded-bl-full" />
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-1">
            <TrendUp weight="duotone" className="h-5 w-5 text-green-500" />
            <CardTitle className="text-sm">Skill Growth Path</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-xs">
            Curriculum expands: Strings → Lists → Dictionaries → Loops →
            Patterns based on evolving mastery.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// PAST INSIGHTS
// ============================================

function PastInsights({ run }: { run: AutoRunV2 | null }) {
  const stats = getStats();

  if (!run && stats.totalAttempts === 0) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkle
            weight="duotone"
            className="h-10 w-10 text-muted-foreground mb-3"
          />
          <p className="text-sm font-medium">No practice history yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Start your first adaptive run to see insights here
          </p>
        </CardContent>
      </Card>
    );
  }

  const accuracy =
    stats.totalAttempts > 0
      ? Math.round((stats.totalSolved / stats.totalAttempts) * 100)
      : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendUp weight="duotone" className="h-4 w-4 text-green-500" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-2xl font-bold">{stats.totalAttempts}</p>
            <p className="text-xs text-muted-foreground">Total Attempts</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-green-500">{accuracy}%</p>
            <p className="text-xs text-muted-foreground">Accuracy</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{run?.streak ?? 0}</p>
            <p className="text-xs text-muted-foreground">Current Streak</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{run?.completedQuestions ?? 0}</p>
            <p className="text-xs text-muted-foreground">This Run</p>
          </div>
        </div>

        {run && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">Run Progress</span>
              <span>
                {run.currentIndex + 1} / {run.topicQueue.length}
              </span>
            </div>
            <Progress
              value={((run.currentIndex + 1) / run.topicQueue.length) * 100}
              className="h-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// SETTINGS PANEL
// ============================================

function SettingsPanel({
  aggressiveProgression,
  remediationMode,
  onAggressiveChange,
  onRemediationChange,
}: {
  aggressiveProgression: boolean;
  remediationMode: boolean;
  onAggressiveChange: (v: boolean) => void;
  onRemediationChange: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between">
          <span className="flex items-center gap-2">
            <GearSix weight="bold" className="h-4 w-4" />
            Advanced Settings
          </span>
          <CaretDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Fast Progression</Label>
                <p className="text-xs text-muted-foreground">
                  Promote difficulty after 2 correct (vs 3)
                </p>
              </div>
              <Switch
                checked={aggressiveProgression}
                onCheckedChange={onAggressiveChange}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Remediation Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Add extra questions when struggling
                </p>
              </div>
              <Switch
                checked={remediationMode}
                onCheckedChange={onRemediationChange}
              />
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function AutoModePage() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { isLoading: apiKeyLoading } = useApiKey();

  // Load runs lazily to avoid setState in effect
  const [initialData] = useState(() => {
    if (typeof window === "undefined") {
      return { runs: [], latestRun: null };
    }
    const runs = getAllAutoRunsV2();
    return {
      runs,
      latestRun: runs.length > 0 ? runs[0] : null,
    };
  });

  const [latestRun] = useState<AutoRunV2 | null>(initialData.latestRun);
  const [aggressiveProgression, setAggressiveProgression] = useState(
    initialData.latestRun?.aggressiveProgression ?? false
  );
  const [remediationMode, setRemediationMode] = useState(
    initialData.latestRun?.remediationMode ?? true
  );

  const handleStartNewRun = () => {
    const newRun = createAutoRunV2(undefined, {
      aggressiveProgression,
      remediationMode,
    });
    router.push(`/practice?mode=auto&saveId=${newRun.id}`);
  };

  const handleContinueRun = () => {
    if (latestRun) {
      router.push(`/practice?mode=auto&saveId=${latestRun.id}`);
    }
  };

  if (apiKeyLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            Adaptive Auto Mode
          </h1>
          {latestRun && (
            <Badge variant="secondary" className="text-xs">
              Run Active
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Personalized Python practice driven by real-time performance and an
          evolving curriculum.
        </p>
        <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10 mt-3">
          <Info
            weight="duotone"
            className="h-4 w-4 text-primary mt-0.5 shrink-0"
          />
          <p className="text-xs text-muted-foreground">
            New runs begin with <strong>Basic String Manipulation</strong> and
            adapt difficulty based on your streak and mastery. Prepare for a
            personalized learning journey.
          </p>
        </div>
      </div>

      {/* Curriculum Path Preview */}
      <CurriculumPathPreview run={latestRun} />

      {/* Adaptive Learning Cards */}
      <AdaptiveLearningCards run={latestRun} />

      {/* Past Insights */}
      <PastInsights run={latestRun} />

      {/* Action Zone */}
      <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={handleStartNewRun}
              className="w-full sm:w-auto min-w-[200px]"
            >
              <Play weight="fill" className="mr-2 h-5 w-5" />
              Start New Adaptive Run
            </Button>
            {latestRun && (
              <Button
                size="lg"
                variant="outline"
                onClick={handleContinueRun}
                className="w-full sm:w-auto min-w-[200px]"
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                Continue Last Run
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            New runs always begin at basic strings and scale up quickly if you
            demonstrate mastery.
          </p>
        </CardContent>
      </Card>

      {/* Settings Panel */}
      <SettingsPanel
        aggressiveProgression={aggressiveProgression}
        remediationMode={remediationMode}
        onAggressiveChange={setAggressiveProgression}
        onRemediationChange={setRemediationMode}
      />

      {/* Legacy Dialog (for backwards compatibility) */}
      <SaveFileDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
