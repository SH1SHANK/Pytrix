"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Cpu, Warning, ArrowClockwise, Gauge } from "@phosphor-icons/react";
import {
  getApiUsage,
  getQuotaStatus,
  resetApiUsage,
  QuotaStatus,
  DailyUsage,
} from "@/lib/usageStore";
import { toast } from "sonner";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function getStatusColor(percent: number): string {
  if (percent >= 100) return "text-red-500";
  if (percent >= 80) return "text-yellow-500";
  return "text-green-500";
}

function getProgressColor(percent: number): string {
  if (percent >= 100) return "bg-red-500";
  if (percent >= 80) return "bg-yellow-500";
  return "";
}

export function ApiUsageCard() {
  const [usage, setUsage] = useState<DailyUsage | null>(null);
  const [quotas, setQuotas] = useState<QuotaStatus[]>([]);

  // Refresh usage data periodically
  useEffect(() => {
    const refresh = () => {
      setUsage(getApiUsage());
      setQuotas(getQuotaStatus());
    };

    refresh();

    // Refresh every 10 seconds to stay current
    const interval = setInterval(refresh, 10_000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = () => {
    resetApiUsage();
    setUsage(getApiUsage());
    setQuotas(getQuotaStatus());
    toast.success("API usage stats reset");
  };

  if (!usage) {
    return null;
  }

  const hasWarning = quotas.some((q) => q.isNearLimit);
  const hasRateLimits = quotas.some((q) => q.rateLimitHits > 0);

  return (
    <Card className={hasWarning ? "border-yellow-500/50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Cpu weight="duotone" className="h-4 w-4" />
          API Usage Today
        </CardTitle>
        <div className="flex items-center gap-2">
          {hasWarning && (
            <Badge
              variant="outline"
              className="text-yellow-500 border-yellow-500"
            >
              <Warning weight="fill" className="h-3 w-3 mr-1" />
              Near Limit
            </Badge>
          )}
          {hasRateLimits && (
            <Badge variant="destructive" className="text-xs">
              Rate Limited
            </Badge>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleReset}
                >
                  <ArrowClockwise className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset Usage Stats</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary Stats */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Calls</span>
          <span className="font-mono font-semibold">{usage.totalCalls}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tokens (In/Out)</span>
          <span className="font-mono text-xs">
            {formatNumber(usage.totalInputTokens)} /{" "}
            {formatNumber(usage.totalOutputTokens)}
          </span>
        </div>

        {/* Per-Model Breakdown */}
        {quotas.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            {quotas
              .filter((q) => q.calls > 0 || q.isNearLimit)
              .map((q) => (
                <div key={q.model} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono truncate max-w-[120px]">
                      {q.model.replace("gemini-2.5-", "")}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={getStatusColor(q.callsPercent)}>
                        {q.calls}/{q.maxCalls}
                      </span>
                      {q.rateLimitHits > 0 && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] px-1"
                        >
                          {q.rateLimitHits}x 429
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Progress
                    value={q.callsPercent}
                    className={`h-1 ${getProgressColor(q.callsPercent)}`}
                  />
                </div>
              ))}

            {/* Show message if no usage yet */}
            {quotas.every((q) => q.calls === 0) && (
              <div className="flex items-center justify-center py-2 text-xs text-muted-foreground">
                <Gauge weight="duotone" className="h-4 w-4 mr-2" />
                No API calls yet today
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
