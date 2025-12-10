"use client";

/**
 * API Usage Page
 * Full observability dashboard for Gemini API usage.
 */

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
import {
  getApiUsage,
  getQuotaStatus,
  DailyUsage,
  QuotaStatus,
} from "@/lib/stores/usageStore";
import { useApiUsageEntryStore } from "@/lib/stores/apiUsageEntryStore";
import {
  Gauge,
  Warning,
  CheckCircle,
  ArrowsClockwise,
  Trash,
  Lightning,
} from "@phosphor-icons/react";
import { useRequireApiKey } from "@/hooks/useRequireApiKey";
import { toast } from "sonner";

// Chart components
import {
  UsageOverTimeChart,
  TokensPerModelChart,
  FeatureBreakdownChart,
} from "@/components/insights/charts";
import { ApiUsageLogs } from "@/components/insights/ApiUsageLogs";
import { PastQuestionGenerations } from "@/components/insights/PastQuestionGenerations";

export default function ApiUsagePage() {
  const [usage, setUsage] = useState<DailyUsage | null>(null);
  const [quotaStatuses, setQuotaStatuses] = useState<QuotaStatus[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isLoading } = useRequireApiKey();

  // Get entry store data
  const {
    entries,
    getTodayAggregates,
    getLast7DaysData,
    getLast30DaysData,
    clearEntries,
  } = useApiUsageEntryStore();

  const refreshData = useCallback(() => {
    const data = getApiUsage();
    const statuses = getQuotaStatus();
    setUsage(data);
    setQuotaStatuses(statuses);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    // Defer state update to next tick
    setTimeout(refreshData, 0);
  }, [refreshData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
    refreshData();
    setIsRefreshing(false);
    toast.success(`Limits refreshed at ${new Date().toLocaleTimeString()}`);
  };

  const handleClearData = () => {
    clearEntries();
    toast.success("Usage data cleared");
    refreshData();
  };

  if (isLoading) return null;

  if (!usage) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading usage data...</p>
      </div>
    );
  }

  const hasWarning = quotaStatuses.some((s) => s.isNearLimit);
  const todayAggregates = getTodayAggregates();
  const data7Days = getLast7DaysData();
  const data30Days = getLast30DaysData();

  const getStatusBadge = (status: QuotaStatus) => {
    if (status.isAtLimit) {
      return <Badge variant="destructive">At Limit</Badge>;
    } else if (status.isNearLimit) {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
          Near Limit
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-green-500 text-green-500">
        Good
      </Badge>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">API Usage</h1>
        <p className="text-muted-foreground">
          Monitor your Pytrix AI usage, limits, and costs.
        </p>
      </div>

      {/* Daily Overview Card */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gauge weight="duotone" className="h-5 w-5 text-primary" />
                Daily Usage Overview
              </CardTitle>
              <CardDescription>
                Resets daily at midnight · Date: {usage.date}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Usage Data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will clear all stored API usage logs. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData}>
                      Clear Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <ArrowsClockwise
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{todayAggregates.totalCalls}</p>
              <p className="text-xs text-muted-foreground">Calls Today</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">
                {todayAggregates.totalTokens.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Tokens Used</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">
                {Object.keys(todayAggregates.byModel).length}
              </p>
              <p className="text-xs text-muted-foreground">Models Used</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">
                {Object.keys(todayAggregates.byFeature).length}
              </p>
              <p className="text-xs text-muted-foreground">Features Used</p>
            </div>
          </div>

          {hasWarning ? (
            <div className="flex items-center gap-2 text-yellow-500 p-3 rounded-lg bg-yellow-500/10">
              <Warning className="h-5 w-5" />
              <span className="text-sm">
                Some models are approaching their daily quota.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-500 p-3 rounded-lg bg-green-500/10">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm">
                All systems operational. Last refreshed:{" "}
                {lastRefresh.toLocaleTimeString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-Model Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quotaStatuses.map((status) => (
          <Card key={status.model} className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightning
                    weight="duotone"
                    className="h-4 w-4 text-primary"
                  />
                  <CardTitle className="text-sm font-mono">
                    {status.model.replace("gemini-", "")}
                  </CardTitle>
                </div>
                {getStatusBadge(status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Calls</span>
                  <span>
                    {status.calls} / {status.maxCalls}
                  </span>
                </div>
                <Progress value={status.callsPercent} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Tokens</span>
                  <span>
                    {status.tokens.toLocaleString()} /{" "}
                    {(status.maxTokens / 1000).toFixed(0)}k
                  </span>
                </div>
                <Progress value={status.tokensPercent} className="h-1.5" />
              </div>
              {status.rateLimitHits > 0 && (
                <p className="text-xs text-destructive">
                  {status.rateLimitHits} rate limit hit(s) today
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <UsageOverTimeChart data7Days={data7Days} data30Days={data30Days} />
        <TokensPerModelChart data={todayAggregates.byModel} />
        <FeatureBreakdownChart data={todayAggregates.byFeature} />
      </div>

      {/* Logs and Past Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ApiUsageLogs entries={entries} />
        </div>
        <div>
          <PastQuestionGenerations entries={entries} />
        </div>
      </div>
    </div>
  );
}
