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
import { Button } from "@/components/ui/button";
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
} from "@phosphor-icons/react";
import { SaveFileDialog } from "@/components/automode/SaveFileDialog";
import { DifficultySelectionSheet } from "./DifficultySelectionSheet";
import { Topic } from "@/lib/types";

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

export function TopicGrid() {
  const { topics } = usePractice();
  const [autoModeDialogOpen, setAutoModeDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [difficultySheetOpen, setDifficultySheetOpen] = useState(false);

  const handlePracticeClick = (topic: Topic) => {
    setSelectedTopic(topic);
    setDifficultySheetOpen(true);
  };

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
            <Card
              key={topic.id}
              className="hover:border-primary/40 transition-all group"
            >
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
                    icon={<Sparkle weight="duotone" className="h-3.5 w-3.5" />}
                    color="text-green-500"
                  />
                  <DifficultyBadge
                    level="Intermediate"
                    solved={topic.intermediateSolved}
                    icon={<Barbell weight="duotone" className="h-3.5 w-3.5" />}
                    color="text-yellow-500"
                  />
                  <DifficultyBadge
                    level="Advanced"
                    solved={topic.advancedSolved}
                    icon={<Trophy weight="duotone" className="h-3.5 w-3.5" />}
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
    </>
  );
}
