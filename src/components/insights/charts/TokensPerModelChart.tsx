"use client";

/**
 * TokensPerModelChart - Bar chart showing token usage by model
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartBar } from "@phosphor-icons/react";

interface TokensPerModelChartProps {
  data: Record<string, { calls: number; tokens: number }>;
}

const MODEL_COLORS: Record<string, string> = {
  "gemini-2.0-flash-lite": "#60a5fa", // blue
  "gemini-2.0-flash": "#34d399", // green
  "gemini-1.5-pro": "#a78bfa", // purple
};

export function TokensPerModelChart({ data }: TokensPerModelChartProps) {
  const chartData = Object.entries(data).map(([model, stats]) => ({
    model: model.replace("gemini-", "").replace("-", " "),
    fullModel: model,
    tokens: stats.tokens,
    calls: stats.calls,
  }));

  const hasData = chartData.some((d) => d.tokens > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ChartBar weight="duotone" className="h-5 w-5 text-primary" />
          Tokens by Model
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#30363d"
                  opacity={0.5}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#8b949e" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
                  }
                />
                <YAxis
                  type="category"
                  dataKey="model"
                  tick={{ fontSize: 10, fill: "#8b949e" }}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border rounded-lg shadow-lg p-2 text-sm">
                          <p className="font-medium font-mono text-xs">
                            {data.fullModel}
                          </p>
                          <p className="text-muted-foreground">
                            {data.tokens.toLocaleString()} tokens
                          </p>
                          <p className="text-muted-foreground">
                            {data.calls} calls
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="tokens" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.fullModel}
                      fill={MODEL_COLORS[entry.fullModel] || "#888"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            No token usage data yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
