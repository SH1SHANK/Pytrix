"use client";

/**
 * Stats & Progress Page
 * Displays detailed user statistics across all modules (v2 system).
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Sparkle,
  Barbell,
  Trophy as TrophyPhosphor,
  CircleNotch,
} from "@phosphor-icons/react";
import { useRequireApiKey } from "@/hooks/useRequireApiKey";
import { getStatsV2, GlobalStatsV2 } from "@/lib/statsStore";
import { getAllModules, Module } from "@/lib/topicsStore";

export default function StatsPage() {
  const [stats, setStats] = useState<GlobalStatsV2 | null>(null);
  const [allModules] = useState<Module[]>(() => getAllModules());
  const { isLoading: isAuthLoading } = useRequireApiKey();

  useEffect(() => {
    // Load local stats on mount (client-only)
    // Using setTimeout to avoid synchronous setState warning in strict mode
    const timer = setTimeout(() => {
      setStats(getStatsV2());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (isAuthLoading || !stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <CircleNotch className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Helper to aggregate stats for a specific module
  const getModuleAggregates = (moduleId: string) => {
    const modStats = stats.modules.find((m) => m.moduleId === moduleId);
    if (!modStats) {
      return {
        mastery: 0,
        solved: 0,
        attempts: 0,
        beginnerSolved: 0,
        intermediateSolved: 0,
        advancedSolved: 0,
      };
    }

    let beginnerSolved = 0;
    let intermediateSolved = 0;
    let advancedSolved = 0;

    for (const sub of modStats.subtopics) {
      for (const pt of sub.problemTypes) {
        beginnerSolved += pt?.beginner ? pt.beginner.solved : 0;
        intermediateSolved += pt?.intermediate ? pt.intermediate.solved : 0;
        advancedSolved += pt?.advanced ? pt.advanced.solved : 0;
      }
    }

    return {
      mastery: modStats.masteryPercent,
      solved: modStats.solved,
      attempts: modStats.attempts,
      beginnerSolved,
      intermediateSolved,
      advancedSolved,
    };
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">
          Stats & Progress
        </h2>
        <p className="text-muted-foreground text-lg">
          Track your learning journey across the entire Python curriculum.
        </p>
      </div>

      {/* Global Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Total Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.totalAttempts}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Problems Solved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              {stats.totalSolved}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Modules Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {stats.modulesTouched}
              <span className="text-xl text-muted-foreground font-medium ml-2">
                / {allModules.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Overall Mastery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {stats.masteryPercent}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Module Breakdown */}
      <div>
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <code className="bg-primary/10 text-primary px-2 py-1 rounded">
            Curriculum Progress
          </code>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {allModules.map((module) => {
            const mStats = getModuleAggregates(module.id);
            const isStarted = mStats.attempts > 0;

            return (
              <Card
                key={module.id}
                className={`transition-all hover:shadow-md ${
                  isStarted
                    ? "border-primary/20 bg-card"
                    : "opacity-80 bg-muted/20"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg leading-tight">
                      {module.name}
                    </CardTitle>
                    {isStarted ? (
                      <div className="text-xl font-bold text-primary">
                        {mStats.mastery}%
                      </div>
                    ) : (
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
                        Not Started
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex flex-col items-center p-2 bg-green-500/10 rounded-lg">
                      <div className="flex items-center gap-1 text-green-600 font-semibold mb-1">
                        <Sparkle weight="bold" />
                        <span>Beginner</span>
                      </div>
                      <span className="text-lg font-bold">
                        {mStats.beginnerSolved}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-yellow-500/10 rounded-lg">
                      <div className="flex items-center gap-1 text-yellow-600 font-semibold mb-1">
                        <Barbell weight="bold" />
                        <span>Intermediate</span>
                      </div>
                      <span className="text-lg font-bold">
                        {mStats.intermediateSolved}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-red-500/10 rounded-lg">
                      <div className="flex items-center gap-1 text-red-600 font-semibold mb-1">
                        <TrophyPhosphor weight="bold" />
                        <span>Advanced</span>
                      </div>
                      <span className="text-lg font-bold">
                        {mStats.advancedSolved}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>
                        {mStats.solved} / {mStats.attempts} correct
                      </span>
                    </div>
                    <Progress
                      value={mStats.mastery}
                      className="h-2"
                      indicatorClassName={
                        mStats.mastery > 80
                          ? "bg-green-500"
                          : mStats.mastery > 40
                          ? "bg-yellow-500"
                          : "bg-primary"
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
