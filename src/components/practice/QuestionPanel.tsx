"use client";

import { Question } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface QuestionPanelProps {
  question: Question | null;
  isLoading?: boolean;
}

export function QuestionPanel({ question, isLoading }: QuestionPanelProps) {
  if (isLoading || !question) {
    return (
      <Card className="h-full flex flex-col border-none shadow-none">
        <CardHeader className="pb-2">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </div>
          {/* Title skeleton */}
          <Skeleton className="h-7 w-3/4" />
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="h-full px-6 pb-6 pt-2 space-y-6">
            {/* Description skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <Separator />
            {/* Input/Output format skeleton */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            <Separator />
            {/* Sample Input/Output skeleton */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-16 w-full rounded-md" />
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
        {/* Breadcrumbs - show if we have topic hierarchy info */}
        {question.topic && question.topicName !== question.topic && (
          <Breadcrumb className="mb-3">
            <BreadcrumbList>
              <BreadcrumbItem>
                <span className="text-xs text-muted-foreground">
                  {question.topicName}
                </span>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-xs">
                  {question.topic}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        )}
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
