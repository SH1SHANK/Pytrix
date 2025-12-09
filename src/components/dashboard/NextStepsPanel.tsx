"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightning, TrendUp, ArrowRight, Robot } from "@phosphor-icons/react";
import Link from "next/link";
import { getWeakestSubtopics, type SubtopicStats } from "@/lib/statsStore";

export function NextStepsPanel() {
  const [weakest, setWeakest] = useState<{
    moduleId: string;
    subtopic: SubtopicStats;
  } | null>(null);

  useEffect(() => {
    // Load weakest subtopic
    const weak = getWeakestSubtopics(1);
    if (weak.length > 0) {
      setTimeout(() => setWeakest(weak[0]), 0);
    }
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* 1. Auto Mode */}
      <Card className="bg-linear-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-card border-indigo-200 dark:border-indigo-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-md flex items-center gap-2">
            <Robot className="h-5 w-5 text-indigo-500" />
            Auto Practice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Rapid-fire questions with instant feedback. Great for warmup.
          </p>
          <Button asChild className="w-full" variant="secondary">
            <Link href="/practice/auto">
              Start Auto Mode <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* 2. Weakest Link */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md flex items-center gap-2">
            <TrendUp className="h-5 w-5 text-orange-500" />
            Improve Weaker Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weakest ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Your mastery in{" "}
                <span className="font-semibold text-foreground">
                  {weakest.subtopic.subtopicName}
                </span>{" "}
                is low.
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link
                  href={`/practice?mode=manual&module=${weakest.moduleId}&subtopic=${weakest.subtopic.subtopicName}`}
                >
                  Practice Now <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                No weak areas detected yet! Try exploring new topics.
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link href="/modules">
                  Browse Modules <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* 3. Manual Config */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md flex items-center gap-2">
            <Lightning className="h-5 w-5 text-yellow-500" />
            Custom Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Configure difficulty, topic, and constraints manually.
          </p>
          <Button asChild className="w-full" variant="outline">
            <Link href="/practice/manual">
              Configure <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
