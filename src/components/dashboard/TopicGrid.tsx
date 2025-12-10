"use client";

import { useState } from "react";
import { usePractice } from "@/app/PracticeContext";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Lightning,
  Code,
  ListBullets,
  Function as FunctionIcon,
  Tree,
  CirclesThree,
  Database,
  Warning,
  Cube,
  Package,
  FileText,
  Table,
  ArrowRight,
  Sparkle,
  Barbell,
  Trophy,
  Play,
  ChartBar,
  ArrowUp,
  Trash,
} from "@phosphor-icons/react";
import { SaveFileDialog } from "@/components/automode/SaveFileDialog";
import { DifficultySelectionSheet } from "./DifficultySelectionSheet";
import { Topic } from "@/lib/types";
import { resetTopicStats } from "@/lib/stores/statsStore";
import { toast } from "sonner";

// Map topic IDs to Phosphor icons
const topicIcons: Record<string, React.ReactNode> = {
  strings: <Code weight="duotone" className="h-5 w-5" />,
  lists: <ListBullets weight="duotone" className="h-5 w-5" />,
  tuples: <CirclesThree weight="duotone" className="h-5 w-5" />,
  sets: <CirclesThree weight="duotone" className="h-5 w-5" />,
  dictionaries: <Database weight="duotone" className="h-5 w-5" />,
  functions: <FunctionIcon weight="duotone" className="h-5 w-5" />,
  errors: <Warning weight="duotone" className="h-5 w-5" />,
  oop: <Tree weight="duotone" className="h-5 w-5" />,
  classes: <Cube weight="duotone" className="h-5 w-5" />,
  modules: <Package weight="duotone" className="h-5 w-5" />,
  files: <FileText weight="duotone" className="h-5 w-5" />,
  pandas: <Table weight="duotone" className="h-5 w-5" />,
};

function DifficultyBadge({
  level,
  solved,
  icon,
  color,
}: {
  level: string;
  solved: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${color}`}>
      {icon}
      <span className="font-medium">{level}:</span>
      <span className="text-muted-foreground">{solved}</span>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export function TopicGrid() {
  const { topics, refreshStats, isLoading } = usePractice();
  // ... existing state hooks ...
  const [autoModeDialogOpen, setAutoModeDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [difficultySheetOpen, setDifficultySheetOpen] = useState(false);

  // Context menu state (following shadcn patterns from llms.txt)
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [topicToReset, setTopicToReset] = useState<Topic | null>(null);
  const [statsSheetOpen, setStatsSheetOpen] = useState(false);
  const [statsSheetTopic, setStatsSheetTopic] = useState<Topic | null>(null);

  const handlePracticeClick = (topic: Topic) => {
    setSelectedTopic(topic);
    setDifficultySheetOpen(true);
  };

  const handleResetClick = (topic: Topic) => {
    setTopicToReset(topic);
    setResetDialogOpen(true);
  };

  const confirmReset = () => {
    if (topicToReset) {
      resetTopicStats(topicToReset.id);
      refreshStats();
      toast.success(`Stats reset for ${topicToReset.name}`);
    }
    setResetDialogOpen(false);
    setTopicToReset(null);
  };

  const handleViewStats = (topic: Topic) => {
    setStatsSheetTopic(topic);
    setStatsSheetOpen(true);
  };

  const handleBoostInAutoMode = (topic: Topic) => {
    // Mark topic as boosted (store in localStorage)
    const boosted = JSON.parse(
      localStorage.getItem("pypractice-boosted-topics") || "[]"
    );
    if (!boosted.includes(topic.id)) {
      boosted.push(topic.id);
      localStorage.setItem(
        "pypractice-boosted-topics",
        JSON.stringify(boosted)
      );
      toast.success(`${topic.name} will be prioritized in Auto Mode`);
    } else {
      toast.info(`${topic.name} is already boosted`);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Render 6 skeletons to simulate grid */}
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="h-[200px]">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-32" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full rounded-md" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Auto Mode Card */}
        <Card className="border-primary/30 bg-linear-to-br from-primary/5 to-primary/10 shadow-lg relative overflow-hidden group hover:border-primary/50 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Lightning weight="fill" className="h-24 w-24" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightning weight="duotone" className="h-5 w-5 text-primary" />
              Auto Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              AI-powered adaptive practice across all topics and difficulties.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full font-semibold"
              onClick={() => setAutoModeDialogOpen(true)}
            >
              Start Auto Mode <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* Topic Cards */}
        {topics.map((topic) => {
          const icon = topicIcons[topic.id] || (
            <Code weight="duotone" className="h-5 w-5" />
          );
          const totalSolved = topic.problemsSolved;

          return (
            <ContextMenu key={topic.id}>
              <ContextMenuTrigger asChild>
                <Card className="hover:border-primary/40 transition-all group">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-muted-foreground group-hover:text-primary transition-colors">
                        {icon}
                      </span>
                      {topic.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {/* Difficulty Breakdown */}
                    <div className="space-y-1.5">
                      <DifficultyBadge
                        level="Beginner"
                        solved={topic.beginnerSolved}
                        icon={
                          <Sparkle weight="duotone" className="h-3.5 w-3.5" />
                        }
                        color="text-green-500"
                      />
                      <DifficultyBadge
                        level="Intermediate"
                        solved={topic.intermediateSolved}
                        icon={
                          <Barbell weight="duotone" className="h-3.5 w-3.5" />
                        }
                        color="text-yellow-500"
                      />
                      <DifficultyBadge
                        level="Advanced"
                        solved={topic.advancedSolved}
                        icon={
                          <Trophy weight="duotone" className="h-3.5 w-3.5" />
                        }
                        color="text-red-500"
                      />
                    </div>
                    {totalSolved > 0 && (
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                        {totalSolved} total solved
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handlePracticeClick(topic)}
                    >
                      Practice {topic.name}
                    </Button>
                  </CardFooter>
                </Card>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-52">
                <ContextMenuItem onClick={() => handlePracticeClick(topic)}>
                  <Play className="mr-2 h-4 w-4" weight="duotone" />
                  Start Manual Practice
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleBoostInAutoMode(topic)}>
                  <ArrowUp className="mr-2 h-4 w-4" weight="duotone" />
                  Boost in Auto Mode
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => handleViewStats(topic)}>
                  <ChartBar className="mr-2 h-4 w-4" weight="duotone" />
                  View Topic Stats
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => handleResetClick(topic)}
                >
                  <Trash className="mr-2 h-4 w-4" weight="duotone" />
                  Reset Topic Stats
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
      </div>

      {/* Auto Mode Save File Dialog */}
      <SaveFileDialog
        open={autoModeDialogOpen}
        onOpenChange={setAutoModeDialogOpen}
      />

      {/* Difficulty Selection Sheet */}
      {selectedTopic && (
        <DifficultySelectionSheet
          open={difficultySheetOpen}
          onOpenChange={setDifficultySheetOpen}
          topicId={selectedTopic.id}
          topicName={selectedTopic.name}
        />
      )}

      {/* Reset Stats Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Topic Stats?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all stats for &quot;{topicToReset?.name}&quot;
              across all difficulty levels.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stats Detail Sheet */}
      <Sheet open={statsSheetOpen} onOpenChange={setStatsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{statsSheetTopic?.name} Stats</SheetTitle>
            <SheetDescription>
              Your progress across all difficulty levels
            </SheetDescription>
          </SheetHeader>
          {statsSheetTopic && (
            <div className="space-y-6 mt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-500">
                    <Sparkle weight="duotone" className="h-4 w-4" />
                    <span>Beginner</span>
                  </div>
                  <span className="font-medium">
                    {statsSheetTopic.beginnerSolved} solved
                  </span>
                </div>
                <Progress
                  value={Math.min(statsSheetTopic.beginnerSolved * 10, 100)}
                  className="h-2"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-yellow-500">
                    <Barbell weight="duotone" className="h-4 w-4" />
                    <span>Intermediate</span>
                  </div>
                  <span className="font-medium">
                    {statsSheetTopic.intermediateSolved} solved
                  </span>
                </div>
                <Progress
                  value={Math.min(statsSheetTopic.intermediateSolved * 10, 100)}
                  className="h-2"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-500">
                    <Trophy weight="duotone" className="h-4 w-4" />
                    <span>Advanced</span>
                  </div>
                  <span className="font-medium">
                    {statsSheetTopic.advancedSolved} solved
                  </span>
                </div>
                <Progress
                  value={Math.min(statsSheetTopic.advancedSolved * 10, 100)}
                  className="h-2"
                />
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Total: {statsSheetTopic.problemsSolved} problems solved
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
