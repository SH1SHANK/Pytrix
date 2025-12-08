"use client";

/**
 * Stats & Progress Page
 * Displays detailed user statistics across all topics and difficulties.
 */

import { usePractice } from "@/app/PracticeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import {
  Sparkle,
  Barbell,
  Trophy as TrophyPhosphor,
} from "@phosphor-icons/react";
import { useRequireApiKey } from "@/hooks/useRequireApiKey";

export default function StatsPage() {
  const { stats, topics } = usePractice();
  const { isLoading } = useRequireApiKey();

  if (isLoading) return null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          Stats & Progress
        </h2>
        <p className="text-muted-foreground">
          Track your learning journey across all topics.
        </p>
      </div>

      {/* Global Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAttempts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Problems Solved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {stats.problemsSolved}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Topics Practiced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.topicsTouched}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mastery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {stats.masteryPercent}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Topic Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Topic Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((topic) => (
            <Card key={topic.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{topic.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-green-500">
                    <Sparkle weight="duotone" className="h-4 w-4" />
                    Beginner
                  </div>
                  <span>{topic.beginnerSolved} solved</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-yellow-500">
                    <Barbell weight="duotone" className="h-4 w-4" />
                    Intermediate
                  </div>
                  <span>{topic.intermediateSolved} solved</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-red-500">
                    <TrophyPhosphor weight="duotone" className="h-4 w-4" />
                    Advanced
                  </div>
                  <span>{topic.advancedSolved} solved</span>
                </div>
                <Progress
                  value={Math.min(topic.problemsSolved * 5, 100)}
                  className="h-2"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
