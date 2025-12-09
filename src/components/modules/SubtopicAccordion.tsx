"use client";

import { Subtopic, ProblemType } from "@/lib/topicsStore";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleDashed } from "@phosphor-icons/react";

interface SubtopicAccordionProps {
  subtopics: Subtopic[];
}

/**
 * Accordion component that displays subtopics and their problem types.
 * Used within ModuleCard to show the full hierarchy.
 */
export function SubtopicAccordion({ subtopics }: SubtopicAccordionProps) {
  if (subtopics.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No subtopics available.
      </p>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Accordion type="multiple" className="w-full">
        {subtopics.map((subtopic) => (
          <AccordionItem key={subtopic.id} value={subtopic.id}>
            <AccordionTrigger className="text-sm hover:no-underline">
              <div className="flex items-center gap-2 flex-1 pr-2">
                {subtopic.sectionNumber && (
                  <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                    {subtopic.sectionNumber}
                  </span>
                )}
                <span className="font-medium">{subtopic.name}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {subtopic.problemTypes.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pl-4 border-l-2 border-muted ml-2 space-y-2">
                {subtopic.problemTypes.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    No problem types defined.
                  </p>
                ) : (
                  subtopic.problemTypes.map((pt) => (
                    <ProblemTypeItem key={pt.id} problemType={pt} />
                  ))
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </TooltipProvider>
  );
}

interface ProblemTypeItemProps {
  problemType: ProblemType;
}

/**
 * Single problem type item with optional tooltip for description.
 */
function ProblemTypeItem({ problemType }: ProblemTypeItemProps) {
  const content = (
    <div className="flex items-start gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors cursor-default">
      <CircleDashed
        weight="duotone"
        className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{problemType.name}</p>
        {problemType.description && (
          <p className="text-xs text-muted-foreground truncate">
            {problemType.description}
          </p>
        )}
      </div>
    </div>
  );

  // If there's a long description, show full content in tooltip
  if (problemType.description && problemType.description.length > 50) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p className="font-medium">{problemType.name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {problemType.description}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
