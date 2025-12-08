"use client";

import { usePractice } from "@/app/PracticeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ChartLineUp,
  CheckCircle,
  Target,
  Lightning,
} from "@phosphor-icons/react";

export function StatsRow() {
  const { stats } = usePractice();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Topics Coverage */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Topics Exploration
          </CardTitle>
          <Badge variant="outline">
            {stats.topicsTouched} / {stats.totalTopics}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Target weight="duotone" className="h-6 w-6 text-primary" />
            <div className="text-2xl font-bold">
              {Math.round((stats.topicsTouched / stats.totalTopics) * 100)}%
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Topics attempted at least once
          </p>
          <Progress
            value={(stats.topicsTouched / stats.totalTopics) * 100}
            className="mt-3 h-2"
          />
        </CardContent>
      </Card>

      {/* Problems Solved */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Problems Solved</CardTitle>
          <CheckCircle
            weight="duotone"
            className="h-5 w-5 text-muted-foreground"
          />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <ChartLineUp weight="duotone" className="h-6 w-6 text-green-500" />
            <div className="text-2xl font-bold">{stats.problemsSolved}</div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total successful submissions
          </p>
        </CardContent>
      </Card>

      {/* Mastery */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Global Mastery</CardTitle>
          <Badge variant="secondary">{stats.masteryPercent}%</Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Lightning weight="duotone" className="h-6 w-6 text-yellow-500" />
            <div className="text-2xl font-bold">{stats.masteryPercent}%</div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Based on solve rate
          </p>
          <Progress value={stats.masteryPercent} className="mt-3 h-2" />
        </CardContent>
      </Card>

      {/* Total Attempts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
          <Target weight="duotone" className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <ChartLineUp weight="duotone" className="h-6 w-6 text-blue-500" />
            <div className="text-2xl font-bold">{stats.totalAttempts}</div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Code runs initiated
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
