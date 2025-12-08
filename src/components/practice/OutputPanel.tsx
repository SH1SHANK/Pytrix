"use client";

import { RunResult, Question } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface OutputPanelProps {
  runResult: RunResult;
  question: Question;
  isRevealed: boolean;
}

export function OutputPanel({
  runResult,
  question,
  isRevealed,
}: OutputPanelProps) {
  return (
    <Card className="h-full border-none shadow-none flex flex-col">
      <Tabs defaultValue="output" className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger
              value="solution"
              disabled={!isRevealed && runResult.status !== "correct"}
            >
              Solution{" "}
              {!isRevealed && runResult.status !== "correct" && "(Locked)"}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="output" className="flex-1 p-0 m-0 relative h-full">
          <ScrollArea className="h-full p-4">
            {runResult.status === "not_run" ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                <p>Run your code to see output.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Result Badge / Status */}
                <div
                  className={`flex items-center gap-2 p-3 rounded-md ${
                    runResult.status === "correct"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : runResult.status === "incorrect"
                      ? "bg-red-500/10 text-red-600 dark:text-red-400"
                      : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                  }`}
                >
                  {runResult.status === "correct" && (
                    <CheckCircle className="h-5 w-5" />
                  )}
                  {runResult.status === "incorrect" && (
                    <XCircle className="h-5 w-5" />
                  )}
                  {runResult.status === "error" && (
                    <AlertCircle className="h-5 w-5" />
                  )}

                  <span className="font-semibold uppercase text-sm">
                    {runResult.status === "correct"
                      ? "Accepted"
                      : runResult.status === "incorrect"
                      ? "Wrong Answer"
                      : "Runtime Error"}
                  </span>
                </div>

                {runResult.message && (
                  <p className="text-sm font-medium">{runResult.message}</p>
                )}

                {/* Standard Output */}
                {runResult.stdout && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                      Standard Output
                    </h4>
                    <pre className="bg-muted p-3 rounded-md text-xs font-mono whitespace-pre-wrap">
                      {runResult.stdout}
                    </pre>
                  </div>
                )}

                {/* Standard Error */}
                {runResult.stderr && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-red-500 mb-1">
                      Error Output
                    </h4>
                    <pre className="bg-destructive/10 text-destructive p-3 rounded-md text-xs font-mono whitespace-pre-wrap">
                      {runResult.stderr}
                    </pre>
                  </div>
                )}

                {/* AI Mock Feedback */}
                {runResult.status !== "correct" && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Feedback</AlertTitle>
                    <AlertDescription>
                      {runResult.status === "error"
                        ? "It seems there is a syntax or runtime error in your code. Check the error message above."
                        : "Your output did not match the expected output. Double check your logic."}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="solution" className="flex-1 p-0 m-0 h-full">
          <ScrollArea className="h-full p-4">
            {isRevealed || runResult.status === "correct" ? (
              <div>
                <h3 className="font-semibold mb-2">Reference Solution</h3>
                <pre className="bg-muted p-4 rounded-md text-sm font-mono whitespace-pre-wrap">
                  {question.referenceSolution}
                </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                Solution is hidden.
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
