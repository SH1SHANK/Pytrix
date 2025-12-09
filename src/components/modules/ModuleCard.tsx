"use client";

import { useState } from "react";
import { Module } from "@/lib/topicsStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubtopicAccordion } from "./SubtopicAccordion";
import {
  CaretDown,
  CaretUp,
  Stack,
  TreeStructure,
  Code,
  ListBullets,
  Database,
  Tree,
  Graph,
  ArrowsCounterClockwise,
  Calculator,
  Binary,
  SortAscending,
  Sliders,
  FileText,
  Gear,
  Rocket,
  CirclesThree,
  StackSimple,
  Queue,
  GitBranch,
} from "@phosphor-icons/react";

// Map module IDs to appropriate icons
const moduleIcons: Record<string, React.ReactNode> = {
  "string-manipulation": <Code weight="duotone" className="h-5 w-5" />,
  "arrays-and-lists-python-lists": (
    <ListBullets weight="duotone" className="h-5 w-5" />
  ),
  "hash-maps-dictionaries": <Database weight="duotone" className="h-5 w-5" />,
  sets: <CirclesThree weight="duotone" className="h-5 w-5" />,
  "linked-lists": <GitBranch weight="duotone" className="h-5 w-5" />,
  "stacks-and-queues": <StackSimple weight="duotone" className="h-5 w-5" />,
  "heaps-priority-queues": <Queue weight="duotone" className="h-5 w-5" />,
  trees: <Tree weight="duotone" className="h-5 w-5" />,
  graphs: <Graph weight="duotone" className="h-5 w-5" />,
  "recursion-and-backtracking": (
    <ArrowsCounterClockwise weight="duotone" className="h-5 w-5" />
  ),
  "dynamic-programming-dp": (
    <TreeStructure weight="duotone" className="h-5 w-5" />
  ),
  "greedy-algorithms": <Rocket weight="duotone" className="h-5 w-5" />,
  "binary-search": <Binary weight="duotone" className="h-5 w-5" />,
  "math-and-number-theory": <Calculator weight="duotone" className="h-5 w-5" />,
  "bit-manipulation": <Binary weight="duotone" className="h-5 w-5" />,
  "sorting-and-searching-algorithms": (
    <SortAscending weight="duotone" className="h-5 w-5" />
  ),
  "two-pointers-and-sliding-window-advanced": (
    <Sliders weight="duotone" className="h-5 w-5" />
  ),
  "file-handling-python-specific": (
    <FileText weight="duotone" className="h-5 w-5" />
  ),
  "system-design-patterns-coding-interview-context": (
    <Gear weight="duotone" className="h-5 w-5" />
  ),
  "advanced-topics-and-specialized-algorithms": (
    <Rocket weight="duotone" className="h-5 w-5" />
  ),
};

interface ModuleCardProps {
  module: Module;
}

/**
 * Card component for a single module with expandable subtopics.
 */
export function ModuleCard({ module }: ModuleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const icon = moduleIcons[module.id] || (
    <Stack weight="duotone" className="h-5 w-5" />
  );

  const totalProblemTypes = module.subtopics.reduce(
    (acc, st) => acc + st.problemTypes.length,
    0
  );

  return (
    <Card
      className={`transition-all duration-200 ${
        isExpanded
          ? "border-primary/40 shadow-md"
          : "hover:border-primary/30 hover:shadow-sm"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="text-muted-foreground">{icon}</div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {module.name}
                <Badge variant="outline" className="text-xs font-mono">
                  #{module.order}
                </Badge>
              </CardTitle>
              {module.overview && (
                <CardDescription className="mt-1 line-clamp-2">
                  {module.overview}
                </CardDescription>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1.5">
            <TreeStructure weight="duotone" className="h-4 w-4" />
            <span>
              {module.subtopics.length} subtopic
              {module.subtopics.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Stack weight="duotone" className="h-4 w-4" />
            <span>
              {totalProblemTypes} problem type
              {totalProblemTypes !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Problem Archetypes Preview */}
        {!isExpanded && module.problemArchetypes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {module.problemArchetypes.slice(0, 3).map((archetype, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-xs font-normal"
              >
                {archetype}
              </Badge>
            ))}
            {module.problemArchetypes.length > 3 && (
              <Badge variant="secondary" className="text-xs font-normal">
                +{module.problemArchetypes.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center gap-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <CaretUp weight="bold" className="h-4 w-4" />
              Collapse
            </>
          ) : (
            <>
              <CaretDown weight="bold" className="h-4 w-4" />
              View Subtopics
            </>
          )}
        </Button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t">
            <SubtopicAccordion subtopics={module.subtopics} />

            {/* Python Considerations */}
            {module.pythonConsiderations &&
              module.pythonConsiderations.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Code weight="duotone" className="h-4 w-4" />
                    Python Tips
                  </h4>
                  <ul className="space-y-1">
                    {module.pythonConsiderations
                      .filter((tip) => tip !== "--")
                      .slice(0, 5)
                      .map((tip, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-0"
                        >
                          {tip}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

            {/* All Archetypes when expanded */}
            {module.problemArchetypes.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Problem Archetypes</h4>
                <div className="flex flex-wrap gap-1.5">
                  {module.problemArchetypes.map((archetype, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-xs font-normal"
                    >
                      {archetype}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
