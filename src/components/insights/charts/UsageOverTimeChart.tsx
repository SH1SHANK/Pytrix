"use client";

/**
 * UsageOverTimeChart - Line/bar chart showing API calls over 7/30 days
 */

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendUp } from "@phosphor-icons/react";

interface UsageOverTimeChartProps {
  data7Days: { date: string; calls: number; tokens: number }[];
  data30Days: { date: string; calls: number; tokens: number }[];
}

export function UsageOverTimeChart({
  data7Days,
  data30Days,
}: UsageOverTimeChartProps) {
  const [range, setRange] = useState<"7d" | "30d">("7d");

  const data = range === "7d" ? data7Days : data30Days;

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formattedData = data.map((d) => ({
    ...d,
    displayDate: formatDate(d.date),
  }));

  const hasData = data.some((d) => d.calls > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendUp weight="duotone" className="h-5 w-5 text-primary" />
            Usage Over Time
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={range === "7d" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setRange("7d")}
              className="h-7 px-2 text-xs"
            >
              7 days
            </Button>
            <Button
              variant={range === "30d" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setRange("30d")}
              className="h-7 px-2 text-xs"
            >
              30 days
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedData}>
                <defs>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#58a6ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#30363d"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11, fill: "#8b949e" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#8b949e" }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border rounded-lg shadow-lg p-2 text-sm">
                          <p className="font-medium">
                            {payload[0].payload.displayDate}
                          </p>
                          <p className="text-muted-foreground">
                            {payload[0].value} calls
                          </p>
                          <p className="text-muted-foreground">
                            {payload[0].payload.tokens.toLocaleString()} tokens
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="calls"
                  stroke="#58a6ff"
                  fill="url(#colorCalls)"
                  strokeWidth={2}
                  dot={{ fill: "#58a6ff", strokeWidth: 0, r: 3 }}
                  activeDot={{ fill: "#58a6ff", strokeWidth: 0, r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            No usage data yet. Start practicing to see your trends.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
