"use client";

import { useState } from "react";
import { usePractice } from "@/app/PracticeContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
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
} from "@phosphor-icons/react";
import { SaveFileDialog } from "@/components/automode/SaveFileDialog";

// Soft mastery target (not a fixed problem count)
const MASTERY_TARGET = 10;

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

export function TopicGrid() {
  const { topics } = usePractice();
  const [autoModeDialogOpen, setAutoModeDialogOpen] = useState(false);

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
            <CardDescription>AI-powered adaptive practice</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Focus on your weakest topics. Questions adapt to your skill level
              in real time.
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
          const progressPercent = Math.min(
            100,
            Math.round((topic.problemsSolved / MASTERY_TARGET) * 100)
          );
          const icon = topicIcons[topic.id] || (
            <Code weight="duotone" className="h-5 w-5" />
          );

          return (
            <Card
              key={topic.id}
              className="hover:border-primary/40 transition-all group"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">
                    {icon}
                  </span>
                  {topic.name}
                </CardTitle>
                <CardDescription>{topic.problemsSolved} solved</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={progressPercent} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {progressPercent}% mastery
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/practice?topic=${topic.id}`}>
                    Practice {topic.name}
                  </Link>
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
    </>
  );
}
