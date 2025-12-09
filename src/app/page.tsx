"use client";

import { StatsRow } from "@/components/dashboard/StatsRow";
import { TopicGrid } from "@/components/dashboard/TopicGrid";
import { ModuleStatsGrid } from "@/components/dashboard/ModuleStatsGrid";
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
import { ArrowCounterClockwise } from "@phosphor-icons/react";
import { resetStats } from "@/lib/statsStore";
import { usePractice } from "@/app/PracticeContext";
import { useApiKey } from "@/app/ApiKeyContext";
import { toast } from "sonner";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { useSettingsStore } from "@/lib/settingsStore";

export default function Home() {
  const { refreshStats } = usePractice();
  const { hasApiKey, isLoading } = useApiKey();
  const { hasCompletedOnboarding } = useSettingsStore();

  const handleResetStats = () => {
    resetStats();
    refreshStats();
    toast.success("Stats have been reset.");
  };

  // Show nothing while checking key state
  if (isLoading) {
    return null;
  }

  // Show onboarding if no API key or hasn't completed onboarding
  const showOnboarding = !hasApiKey || !hasCompletedOnboarding;

  return (
    <>
      {/* Onboarding Wizard - shown when no API key or first time */}
      <OnboardingWizard isVisible={showOnboarding} />

      {/* Dashboard Content - hidden during onboarding */}
      <div
        className={`p-6 space-y-6 transition-all duration-300 ${
          showOnboarding ? "blur-sm pointer-events-none select-none" : ""
        }`}
        aria-hidden={showOnboarding}
      >
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              Your Progress
            </h2>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowCounterClockwise className="h-4 w-4 mr-2" />
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

        {/* Module Progress Section (Hierarchical Stats) */}
        <section>
          <h2 className="text-2xl font-semibold tracking-tight mb-4">
            Module Progress
          </h2>
          <ModuleStatsGrid showEmptyModules={false} />
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
    </>
  );
}
