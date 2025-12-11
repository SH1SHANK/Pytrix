"use client";

import { Question } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Copy,
  Check,
  CaretDown,
  CaretUp,
  WarningCircle,
  FileText,
} from "@phosphor-icons/react";
import { memo, useState, useCallback, ReactNode } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface QuestionPanelProps {
  question: Question | null;
  isLoading?: boolean;
  error?: Error | string | null;
  hintPanelSlot?: ReactNode;
}

// Code block component with copy functionality
const CodeBlock = memo(
  ({ code, language = "python" }: { code: string; language?: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }, [code]);

    return (
      <div
        className="relative group"
        role="region"
        aria-label={`${language} code block`}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
          aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
          }}
          showLineNumbers={false}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  }
);

CodeBlock.displayName = "CodeBlock";

// Expandable text component
const ExpandableText = memo(
  ({ text, maxLength = 300 }: { text: string; maxLength?: number }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const needsExpansion = text.length > maxLength;

    if (!needsExpansion) {
      return (
        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {text}
        </p>
      );
    }

    return (
      <div>
        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {isExpanded ? text : `${text.slice(0, maxLength)}...`}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 h-8 px-2"
          aria-expanded={isExpanded}
          aria-controls="question-description"
        >
          {isExpanded ? (
            <>
              Show less <CaretUp className="ml-1 h-4 w-4" />
            </>
          ) : (
            <>
              Show more <CaretDown className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    );
  }
);

ExpandableText.displayName = "ExpandableText";

// Loading skeleton component
const LoadingSkeleton = memo(() => (
  <Card
    className="h-full flex flex-col border-none shadow-none"
    role="status"
    aria-label="Loading question"
  >
    <CardHeader className="pb-2">
      <div className="flex items-center gap-2 mb-3" aria-hidden="true">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-7 w-3/4" />
    </CardHeader>
    <CardContent className="flex-1 overflow-hidden p-0">
      <div className="h-full px-6 pb-6 pt-2 space-y-6">
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
    <span className="sr-only">Loading question details...</span>
  </Card>
));

LoadingSkeleton.displayName = "LoadingSkeleton";

// Empty state component
const EmptyState = memo(() => (
  <Card className="h-full flex flex-col border-none shadow-none">
    <CardContent className="flex-1 flex items-center justify-center p-6">
      <div
        className="text-center space-y-4 max-w-md"
        role="status"
        aria-live="polite"
      >
        <div className="flex justify-center">
          <FileText
            className="h-16 w-16 text-muted-foreground/50"
            aria-hidden="true"
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">No Question Selected</h3>
          <p className="text-sm text-muted-foreground">
            Select a problem from the list to view its description, constraints,
            and sample test cases.
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
));

EmptyState.displayName = "EmptyState";

// Error state component
const ErrorState = memo(({ error }: { error: Error | string }) => {
  const errorMessage = typeof error === "string" ? error : error.message;

  return (
    <Card className="h-full flex flex-col border-none shadow-none">
      <CardContent className="flex-1 flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md" role="alert">
          <WarningCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            <strong className="font-semibold">Failed to load question</strong>
            <p className="mt-1 text-sm">{errorMessage}</p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
});

ErrorState.displayName = "ErrorState";

// Main component
export const QuestionPanel = memo(function QuestionPanel({
  question,
  isLoading = false,
  error = null,
  hintPanelSlot,
}: QuestionPanelProps) {
  // Handle loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Handle error state
  if (error) {
    return <ErrorState error={error} />;
  }

  // Handle empty state
  if (!question) {
    return <EmptyState />;
  }

  return (
    <Card
      className="h-full flex flex-col border-none shadow-none"
      role="article"
      aria-labelledby="question-title"
    >
      <CardHeader className="pb-2 shrink-0">
        {question.topic && question.topicName !== question.topic && (
          <Breadcrumb className="mb-3" aria-label="Question category">
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
        <CardTitle id="question-title" className="text-xl">
          {question.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0 min-h-0">
        <ScrollArea className="h-full px-6 pb-4" aria-label="Question details">
          <div className="space-y-6">
            <div>
              <h3
                className="font-semibold mb-2"
                id="question-description-heading"
              >
                Description
              </h3>
              <div
                id="question-description"
                aria-labelledby="question-description-heading"
              >
                <ExpandableText text={question.description} />
              </div>
            </div>

            <Separator aria-hidden="true" />

            <div className="grid grid-cols-1 gap-4">
              <div>
                <h3
                  className="font-semibold text-sm mb-1"
                  id="input-format-heading"
                >
                  Input Format
                </h3>
                <p
                  className="text-sm text-muted-foreground"
                  aria-labelledby="input-format-heading"
                >
                  {question.inputDescription}
                </p>
              </div>
              <div>
                <h3
                  className="font-semibold text-sm mb-1"
                  id="output-format-heading"
                >
                  Output Format
                </h3>
                <p
                  className="text-sm text-muted-foreground"
                  aria-labelledby="output-format-heading"
                >
                  {question.outputDescription}
                </p>
              </div>
            </div>

            {question.constraints && question.constraints.length > 0 && (
              <>
                <Separator aria-hidden="true" />
                <div>
                  <h3
                    className="font-semibold text-sm mb-2"
                    id="constraints-heading"
                  >
                    Constraints
                  </h3>
                  <ul
                    className="list-disc list-inside text-sm text-muted-foreground space-y-1"
                    aria-labelledby="constraints-heading"
                  >
                    {question.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <Separator aria-hidden="true" />

            <div className="space-y-4">
              <div>
                <h3
                  className="font-semibold text-sm mb-2"
                  id="sample-input-heading"
                >
                  Sample Input
                </h3>
                <div aria-labelledby="sample-input-heading">
                  <CodeBlock code={question.sampleInput} />
                </div>
              </div>
              <div>
                <h3
                  className="font-semibold text-sm mb-2"
                  id="sample-output-heading"
                >
                  Sample Output
                </h3>
                <div aria-labelledby="sample-output-heading">
                  <CodeBlock code={question.sampleOutput} />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>

      {hintPanelSlot && (
        <div className="shrink-0" role="complementary" aria-label="Hints panel">
          {hintPanelSlot}
        </div>
      )}
    </Card>
  );
});
