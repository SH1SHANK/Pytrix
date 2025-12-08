"use client";

/**
 * FeatureBreakdownChart - Pie chart showing usage by feature
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartPie } from "@phosphor-icons/react";

interface FeatureBreakdownChartProps {
  data: Record<string, { calls: number; tokens: number }>;
}

const FEATURE_COLORS: Record<string, string> = {
  "manual-question": "#60a5fa", // blue
  "auto-mode-question": "#34d399", // green
  hint: "#fbbf24", // yellow
  "optimal-solution": "#a78bfa", // purple
  "code-evaluation": "#f472b6", // pink
  other: "#94a3b8", // gray
};

const FEATURE_LABELS: Record<string, string> = {
  "manual-question": "Manual Questions",
  "auto-mode-question": "Auto Mode",
  hint: "Hints",
  "optimal-solution": "Optimal Solutions",
  "code-evaluation": "Code Evaluation",
  other: "Other",
};

export function FeatureBreakdownChart({ data }: FeatureBreakdownChartProps) {
  const chartData = Object.entries(data)
    .filter(([, stats]) => stats.calls > 0)
    .map(([feature, stats]) => ({
      feature,
      name: FEATURE_LABELS[feature] || feature,
      value: stats.calls,
      tokens: stats.tokens,
    }));

  const hasData = chartData.length > 0;
  const totalCalls = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ChartPie weight="duotone" className="h-5 w-5 text-primary" />
          Feature Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="h-[150px] w-[150px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.feature}
                        fill={FEATURE_COLORS[entry.feature] || "#888"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const percent = (
                          (data.value / totalCalls) *
                          100
                        ).toFixed(1);
                        return (
                          <div className="bg-popover border rounded-lg shadow-lg p-2 text-sm">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-muted-foreground">
                              {data.value} calls ({percent}%)
                            </p>
                            <p className="text-muted-foreground">
                              {data.tokens.toLocaleString()} tokens
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              {chartData.map((item) => (
                <div key={item.feature} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: FEATURE_COLORS[item.feature] || "#888",
                    }}
                  />
                  <span className="text-sm truncate flex-1 min-w-0">
                    {item.name}
                  </span>
                  <span className="text-sm text-muted-foreground shrink-0 tabular-nums">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
            No feature usage data yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
