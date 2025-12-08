"use client";

import { Question } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { Skeleton } from "@/components/ui/skeleton";

interface QuestionPanelProps {
  question: Question | null;
  isLoading?: boolean;
}

function getDifficultyVariant(difficulty: string) {
  switch (difficulty) {
    case "beginner":
      return "secondary";
    case "intermediate":
      return "default";
    case "advanced":
      return "destructive";
    default:
      return "outline";
  }
}

export function QuestionPanel({ question, isLoading }: QuestionPanelProps) {
  if (isLoading || !question) {
    return (
      <Card className="h-full flex flex-col border-none shadow-none">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-7 w-3/4" />
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="h-full px-6 pb-6 pt-2 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full rounded-md" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col border-none shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline">{question.topicName}</Badge>
          <Badge variant={getDifficultyVariant(question.difficulty)}>
            {question.difficulty}
          </Badge>
        </div>
        <CardTitle className="text-xl">{question.title}</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-6">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {question.description}
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4">
              <div>
                <h3 className="font-semibold text-sm mb-1">Input Format</h3>
                <p className="text-sm text-muted-foreground">
                  {question.inputDescription}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Output Format</h3>
                <p className="text-sm text-muted-foreground">
                  {question.outputDescription}
                </p>
              </div>
            </div>

            {question.constraints.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-sm mb-2">Constraints</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {question.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm mb-2">Sample Input</h3>
                <div className="rounded-md bg-muted p-3 font-mono text-sm">
                  {question.sampleInput}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-2">Sample Output</h3>
                <div className="rounded-md bg-muted p-3 font-mono text-sm">
                  {question.sampleOutput}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
