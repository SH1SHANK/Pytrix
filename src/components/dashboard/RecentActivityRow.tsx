"use client";

import { useEffect, useState } from "react";
import { getHistory, type QuestionHistoryEntry } from "@/lib/historyStore";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export function RecentActivityRow() {
  const [history, setHistory] = useState<QuestionHistoryEntry[]>([]);

  useEffect(() => {
    setTimeout(() => setHistory(getHistory().slice(0, 10)), 0); // Top 10 recent
  }, []);

  if (history.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No recent activity. Start practicing to see your history here!
      </div>
    );
  }

  return (
    <ScrollArea className="w-full whitespace-nowrap pb-4">
      <div className="flex w-max space-x-4">
        {history.map((entry) => (
          <Link
            key={entry.id}
            href={
              entry.mode === "auto" && entry.runId
                ? `/practice?mode=auto&saveId=${entry.runId}`
                : `/practice?mode=review&historyId=${entry.id}`
            }
          >
            <Card className="w-[250px] hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge
                    variant="outline"
                    className="text-xs max-w-[150px] truncate"
                  >
                    {entry.topic}
                  </Badge>
                  {entry.wasCorrect ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <h4
                  className="font-medium text-sm truncate mb-1"
                  title={entry.questionTitle}
                >
                  {entry.questionTitle}
                </h4>
                {entry.mode === "auto" && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-4 px-1 mb-1 w-fit"
                  >
                    Auto Run
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(entry.executedAt, { addSuffix: true })}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
