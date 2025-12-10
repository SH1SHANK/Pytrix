"use client";

/**
 * PastQuestionGenerations - Panel showing recent question generation API calls
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap, ArrowSquareOut } from "@phosphor-icons/react";
import { ApiUsageEntry } from "@/lib/stores/apiUsageEntryStore";
import Link from "next/link";

interface PastQuestionGenerationsProps {
  entries: ApiUsageEntry[];
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "bg-green-500/10 text-green-500 border-green-500/20",
  Intermediate: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  Advanced: "bg-red-500/10 text-red-500 border-red-500/20",
};

export function PastQuestionGenerations({
  entries,
}: PastQuestionGenerationsProps) {
  // Filter for question generation entries only
  const questionEntries = entries
    .filter(
      (e) =>
        e.feature === "manual-question" || e.feature === "auto-mode-question"
    )
    .slice(0, 15);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GraduationCap weight="duotone" className="h-5 w-5 text-primary" />
          Recent Question Generations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {questionEntries.length > 0 ? (
          <ScrollArea className="h-[280px]">
            <div className="divide-y">
              {questionEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {entry.feature === "auto-mode-question"
                            ? "Auto"
                            : "Manual"}
                        </Badge>
                        {entry.difficulty && (
                          <Badge
                            variant="outline"
                            className={`text-xs shrink-0 ${
                              DIFFICULTY_COLORS[entry.difficulty] || ""
                            }`}
                          >
                            {entry.difficulty}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm truncate">
                        {entry.topic || "General Python"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{formatTime(entry.timestamp)}</span>
                        <span>·</span>
                        <span className="font-mono">
                          {entry.model.replace("gemini-", "")}
                        </span>
                        <span>·</span>
                        <span>{entry.totalTokens.toLocaleString()} tokens</span>
                      </div>
                    </div>
                    {entry.questionId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        asChild
                      >
                        <Link href={`/history?q=${entry.questionId}`}>
                          <ArrowSquareOut className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-center px-4">
            <GraduationCap className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No question generations yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Start a practice session to see your history here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
