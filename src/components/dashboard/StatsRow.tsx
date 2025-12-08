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
import { ApiUsageCard } from "./ApiUsageCard";

import { Skeleton } from "@/components/ui/skeleton";

export function StatsRow() {
  const { stats, isLoading } = usePractice();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-3 w-[120px] mt-2" />
              <Skeleton className="h-2 w-full mt-3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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

      {/* API Usage Card */}
      <ApiUsageCard />
    </div>
  );
}
