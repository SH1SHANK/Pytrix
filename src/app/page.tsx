"use client";

import { StatsRow } from "@/components/dashboard/StatsRow";
import { TopicGrid } from "@/components/dashboard/TopicGrid";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RotateCcw } from "lucide-react";
import { resetStats } from "@/lib/statsStore";
import { usePractice } from "@/app/PracticeContext";
import { toast } from "sonner";

export default function Home() {
  const { refreshStats } = usePractice();

  const handleResetStats = () => {
    resetStats();
    refreshStats();
    toast.success("Stats have been reset.");
  };

  return (
    <main className="container min-h-screen py-8 px-4 md:px-8 mx-auto max-w-7xl">
      <div className="flex flex-col space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            PyPractice MVP
          </h1>
          <p className="text-lg text-muted-foreground">
            Master Python through hands-on coding challenges.
          </p>
        </div>

        <Separator />

        {/* Stats Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              Your Progress
            </h2>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Stats
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset All Stats?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your progress data. This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetStats}>
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <StatsRow />
        </section>

        <Separator />

        {/* Topics Section */}
        <section>
          <h2 className="text-2xl font-semibold tracking-tight mb-4">
            Start Practicing
          </h2>
          <TopicGrid />
        </section>
      </div>
    </main>
  );
}
