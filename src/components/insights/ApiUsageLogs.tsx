"use client";

/**
 * ApiUsageLogs - Data table for API call history
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  List,
  CaretUp,
  CaretDown,
  FunnelSimple,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { ApiUsageEntry } from "@/lib/apiUsageEntryStore";
import Link from "next/link";

interface ApiUsageLogsProps {
  entries: ApiUsageEntry[];
}

type SortField = "timestamp" | "totalTokens" | "model";
type SortDirection = "asc" | "desc";

const FEATURE_LABELS: Record<string, string> = {
  "manual-question": "Manual",
  "auto-mode-question": "Auto",
  hint: "Hint",
  "optimal-solution": "Solution",
  "code-evaluation": "Eval",
  other: "Other",
};

const STATUS_COLORS: Record<string, string> = {
  success: "bg-green-500/10 text-green-500 border-green-500/20",
  "rate-limited": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  "quota-exceeded": "bg-orange-500/10 text-orange-500 border-orange-500/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
};

export function ApiUsageLogs({ entries }: ApiUsageLogsProps) {
  const [dateFilter, setDateFilter] = useState<"today" | "7d" | "30d" | "all">(
    "today"
  );
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [featureFilter, setFeatureFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Get unique models and features for filters
  const models = useMemo(
    () => [...new Set(entries.map((e) => e.model))],
    [entries]
  );
  const features = useMemo(
    () => [...new Set(entries.map((e) => e.feature))],
    [entries]
  );

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // Date filter
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    if (dateFilter === "today") {
      result = result.filter((e) => e.timestamp.startsWith(today));
    } else if (dateFilter === "7d") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter((e) => new Date(e.timestamp) >= weekAgo);
    } else if (dateFilter === "30d") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter((e) => new Date(e.timestamp) >= monthAgo);
    }

    // Model filter
    if (modelFilter !== "all") {
      result = result.filter((e) => e.model === modelFilter);
    }

    // Feature filter
    if (featureFilter !== "all") {
      result = result.filter((e) => e.feature === featureFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((e) => e.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "timestamp") {
        comparison =
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortField === "totalTokens") {
        comparison = a.totalTokens - b.totalTokens;
      } else if (sortField === "model") {
        comparison = a.model.localeCompare(b.model);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [
    entries,
    dateFilter,
    modelFilter,
    featureFilter,
    statusFilter,
    sortField,
    sortDirection,
  ]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <CaretUp className="h-3 w-3" />
    ) : (
      <CaretDown className="h-3 w-3" />
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <List weight="duotone" className="h-5 w-5 text-primary" />
            API Logs
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <FunnelSimple className="h-4 w-4 text-muted-foreground" />
            <Select
              value={dateFilter}
              onValueChange={(v) => setDateFilter(v as typeof dateFilter)}
            >
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Select value={modelFilter} onValueChange={setModelFilter}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {models.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m.replace("gemini-", "")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={featureFilter} onValueChange={setFeatureFilter}>
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue placeholder="Feature" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Features</SelectItem>
                {features.map((f) => (
                  <SelectItem key={f} value={f}>
                    {FEATURE_LABELS[f] || f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="rate-limited">Rate Limited</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredEntries.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleSort("timestamp")}
                  >
                    <span className="flex items-center gap-1">
                      Time {getSortIcon("timestamp")}
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleSort("model")}
                  >
                    <span className="flex items-center gap-1">
                      Model {getSortIcon("model")}
                    </span>
                  </TableHead>
                  <TableHead>Feature</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => toggleSort("totalTokens")}
                  >
                    <span className="flex items-center justify-end gap-1">
                      Tokens {getSortIcon("totalTokens")}
                    </span>
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.slice(0, 50).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs">
                      <div>{formatTime(entry.timestamp)}</div>
                      <div className="text-muted-foreground">
                        {formatDate(entry.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {entry.model.replace("gemini-", "")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {FEATURE_LABELS[entry.feature] || entry.feature}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {entry.topic || "–"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${STATUS_COLORS[entry.status]}`}
                      >
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {entry.totalTokens.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {entry.questionId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          asChild
                        >
                          <Link href={`/history?q=${entry.questionId}`}>
                            <ArrowSquareOut className="h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            No API logs found for the selected filters.
          </div>
        )}
        {filteredEntries.length > 50 && (
          <div className="px-4 py-2 text-xs text-muted-foreground border-t">
            Showing 50 of {filteredEntries.length} entries
          </div>
        )}
      </CardContent>
    </Card>
  );
}
