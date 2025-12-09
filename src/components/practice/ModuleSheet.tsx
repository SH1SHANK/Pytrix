"use client";

/**
 * Module Sheet
 *
 * Right-side drawer showing module details:
 * - Module header with stats
 * - Accordion of subtopics
 * - Problem types with Generate buttons
 */

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Lightning, Brain, Rocket, Code } from "@phosphor-icons/react";
import type { Module, Subtopic, ProblemType } from "@/lib/topicsStore";
import { getTemplateQuestion } from "@/lib/questionService";
import type { Difficulty } from "@/lib/types";
import { toast } from "sonner";

interface ModuleSheetProps {
  module: Module | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  difficulty: Difficulty;
}

/**
 * Get icon for difficulty
 */
function DifficultyIcon({ difficulty }: { difficulty: Difficulty }) {
  switch (difficulty) {
    case "beginner":
      return <Lightning weight="duotone" className="h-3 w-3" />;
    case "intermediate":
      return <Brain weight="duotone" className="h-3 w-3" />;
    case "advanced":
      return <Rocket weight="duotone" className="h-3 w-3" />;
  }
}

/**
 * Problem type row with Generate button
 */
function ProblemTypeRow({
  problemType,
  subtopic,
  module,
  onGenerate,
}: {
  problemType: ProblemType;
  subtopic: Subtopic;
  module: Module;
  onGenerate: (
    module: Module,
    subtopic: Subtopic,
    problemType: ProblemType
  ) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-1 hover:bg-muted/50 rounded-md group">
      <div className="flex items-center gap-2 min-w-0">
        <Code
          weight="duotone"
          className="h-4 w-4 text-muted-foreground shrink-0"
        />
        <span className="text-sm truncate">{problemType.name}</span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onGenerate(module, subtopic, problemType)}
      >
        <Play weight="fill" className="h-3 w-3 mr-1" />
        Generate
      </Button>
    </div>
  );
}

/**
 * Subtopic accordion item
 */
function SubtopicSection({
  subtopic,
  module,
  difficulty,
  onGenerate,
}: {
  subtopic: Subtopic;
  module: Module;
  difficulty: Difficulty;
  onGenerate: (
    module: Module,
    subtopic: Subtopic,
    problemType: ProblemType
  ) => void;
}) {
  return (
    <AccordionItem value={subtopic.id}>
      <AccordionTrigger className="hover:no-underline py-3">
        <div className="flex items-center gap-3 text-left">
          <span className="font-medium">{subtopic.name}</span>
          <Badge variant="secondary" className="text-xs">
            {subtopic.problemTypes.length}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-1 pl-2">
          {subtopic.problemTypes.map((pt) => (
            <ProblemTypeRow
              key={pt.id}
              problemType={pt}
              subtopic={subtopic}
              module={module}
              onGenerate={onGenerate}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function ModuleSheet({
  module,
  open,
  onOpenChange,
  difficulty,
}: ModuleSheetProps) {
  const router = useRouter();

  // Count totals
  const stats = useMemo(() => {
    if (!module) return { subtopics: 0, problemTypes: 0 };
    return {
      subtopics: module.subtopics.length,
      problemTypes: module.subtopics.reduce(
        (acc, st) => acc + st.problemTypes.length,
        0
      ),
    };
  }, [module]);

  // Handle Generate button
  const handleGenerate = useCallback(
    (mod: Module, subtopic: Subtopic, problemType: ProblemType) => {
      const question = getTemplateQuestion(problemType.id, difficulty);
      if (!question) {
        toast.error("Failed to generate question");
        return;
      }

      // Store in session and navigate
      sessionStorage.setItem("pendingQuestion", JSON.stringify({ question }));

      onOpenChange(false);
      router.push(
        `/practice?mode=manual&module=${encodeURIComponent(
          mod.id
        )}&subtopic=${encodeURIComponent(
          subtopic.id
        )}&problemType=${encodeURIComponent(
          problemType.id
        )}&difficulty=${difficulty}`
      );
    },
    [difficulty, router, onOpenChange]
  );

  if (!module) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 h-full overflow-hidden"
      >
        <SheetHeader className="border-b p-6 pb-4 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono text-xs">
              {module.order.toString().padStart(2, "0")}
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs flex items-center gap-1"
            >
              <DifficultyIcon difficulty={difficulty} />
              {difficulty}
            </Badge>
          </div>
          <SheetTitle className="text-xl">{module.name}</SheetTitle>
          {module.overview && (
            <SheetDescription className="line-clamp-2">
              {module.overview}
            </SheetDescription>
          )}
          <div className="flex gap-4 text-sm text-muted-foreground pt-2">
            <span>{stats.subtopics} subtopics</span>
            <span>{stats.problemTypes} problem types</span>
          </div>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-auto">
          <div className="px-6 py-4">
            <Accordion type="multiple" className="w-full">
              {module.subtopics.map((subtopic) => (
                <SubtopicSection
                  key={subtopic.id}
                  subtopic={subtopic}
                  module={module}
                  difficulty={difficulty}
                  onGenerate={handleGenerate}
                />
              ))}
            </Accordion>
          </div>
        </div>

        {/* Footer with quick practice */}
        <div className="border-t p-6 pt-4">
          <Button
            className="w-full"
            onClick={() => {
              // Pick random problem type and generate
              const allPts = module.subtopics.flatMap((st) =>
                st.problemTypes.map((pt) => ({ pt, st }))
              );
              if (allPts.length === 0) {
                toast.error("No problem types in this module");
                return;
              }
              const random = allPts[Math.floor(Math.random() * allPts.length)];
              handleGenerate(module, random.st, random.pt);
            }}
          >
            <Play weight="fill" className="h-4 w-4 mr-2" />
            Practice Random Problem
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
