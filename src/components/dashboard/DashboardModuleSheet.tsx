"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Play,
  CheckCircle,
  Lightning,
  Brain,
  Rocket,
  CaretRight,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { Module, Subtopic, ProblemType } from "@/lib/topicsStore";
import type { ModuleStats, SubtopicStats } from "@/lib/statsStore";
import { pickWeakestSubtopic } from "@/lib/statsStore";

interface DashboardModuleSheetProps {
  module: Module | null;
  moduleStats: ModuleStats | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getMasteryColor(percent: number) {
  if (percent >= 80) return "bg-green-500";
  if (percent >= 40) return "bg-yellow-500";
  return "bg-red-500"; // Changed to red for low mastery to matching existing logic
}

export function DashboardModuleSheet({
  module,
  moduleStats,
  open,
  onOpenChange,
}: DashboardModuleSheetProps) {
  const router = useRouter();

  const handlePracticeSubtopic = (subtopicId: string) => {
    if (!module) return;
    const subtopicDef = module.subtopics.find((s) => s.id === subtopicId);
    if (!subtopicDef) return;

    router.push(
      `/practice?mode=manual&topic=${encodeURIComponent(
        subtopicDef.name
      )}&difficulty=beginner`
    );
    onOpenChange(false);
  };

  const handlePracticeModule = () => {
    if (!module) return;
    const weakest = pickWeakestSubtopic(module.id);
    const targetSubtopic = weakest?.subtopicId || module.subtopics[0]?.id;

    if (targetSubtopic) {
      handlePracticeSubtopic(targetSubtopic);
    }
  };

  if (!module) return null;

  // Merge definition with stats
  const subtopicRows = useMemo(() => {
    return module.subtopics.map((sub) => {
      const stats = moduleStats?.subtopics.find((s) => s.subtopicId === sub.id);
      return {
        def: sub,
        stats,
      };
    });
  }, [module, moduleStats]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0 h-full">
        {/* Header */}
        <SheetHeader className="p-6 pb-2 border-b">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="font-mono text-xs">
              Module {module.order}
            </Badge>
            {moduleStats && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs",
                  moduleStats.masteryPercent >= 80
                    ? "bg-green-100 text-green-800"
                    : moduleStats.masteryPercent >= 40
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                )}
              >
                {moduleStats.masteryPercent}% Mastery
              </Badge>
            )}
          </div>
          <SheetTitle className="text-2xl">{module.name}</SheetTitle>
          <SheetDescription>{module.overview}</SheetDescription>

          {moduleStats && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>
                  {moduleStats.solved} / {moduleStats.attempts} Solved
                </span>
              </div>
              <Progress
                value={moduleStats.masteryPercent}
                className="h-2"
                indicatorClassName={getMasteryColor(moduleStats.masteryPercent)}
              />
            </div>
          )}
        </SheetHeader>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                Subtopics
              </h3>

              <Accordion type="multiple" className="space-y-2">
                {subtopicRows.map(({ def, stats }) => (
                  <AccordionItem
                    key={def.id}
                    value={def.id}
                    className="border rounded-lg px-2"
                  >
                    <AccordionTrigger className="hover:no-underline py-3 px-2">
                      <div className="flex-1 flex items-center justify-between mr-4">
                        <div className="text-left">
                          <div className="font-medium">{def.name}</div>
                          <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                            <span>{def.problemTypes.length} Types</span>
                            {stats?.attempts ? (
                              <span>• {stats.attempts} Attempts</span>
                            ) : null}
                          </div>
                        </div>
                        {stats && (
                          <div className="text-right">
                            <div
                              className={cn(
                                "text-sm font-bold",
                                stats.masteryPercent >= 80
                                  ? "text-green-600"
                                  : stats.masteryPercent >= 40
                                  ? "text-yellow-600"
                                  : "text-muted-foreground"
                              )}
                            >
                              {stats.masteryPercent}%
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 px-2">
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-2 mb-3">
                          <Progress
                            value={stats?.masteryPercent || 0}
                            className="h-1.5 flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePracticeSubtopic(def.id);
                            }}
                          >
                            <Play weight="fill" className="h-3 w-3 mr-1" />
                            Practice
                          </Button>
                        </div>

                        {/* Breakdown of problem types */}
                        <div className="space-y-1">
                          {def.problemTypes.map((pt) => {
                            const ptStats = stats?.problemTypes.find(
                              (p) => p.problemTypeId === pt.id
                            );
                            return (
                              <div
                                key={pt.id}
                                className="flex justify-between items-center text-sm py-1"
                              >
                                <span className="text-muted-foreground">
                                  {pt.name}
                                </span>
                                {ptStats ? (
                                  <div className="flex gap-3 text-xs">
                                    <span
                                      title="Beginner"
                                      className="flex items-center text-green-600"
                                    >
                                      <Lightning className="mr-0.5" />{" "}
                                      {ptStats.beginner.attempts}
                                    </span>
                                    <span
                                      title="Intermediate"
                                      className="flex items-center text-yellow-600"
                                    >
                                      <Brain className="mr-0.5" />{" "}
                                      {ptStats.intermediate.attempts}
                                    </span>
                                    <span
                                      title="Advanced"
                                      className="flex items-center text-red-600"
                                    >
                                      <Rocket className="mr-0.5" />{" "}
                                      {ptStats.advanced.attempts}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground/50">
                                    Untouched
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-6">
          <Button size="lg" className="w-full" onClick={handlePracticeModule}>
            <Play weight="fill" className="h-4 w-4 mr-2" />
            Practice Recommended Subtopic
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
