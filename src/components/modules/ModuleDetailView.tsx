"use client";

import Link from "next/link";
import {
  BookOpen,
  Tag as TagIcon,
  Play,
  CaretDown,
  Lightning,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent } from "@/components/ui/accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Module, Subtopic } from "@/types/topics";
import { getModuleStats, getSubtopicStats } from "@/lib/stores/statsStore";

interface ModuleDetailViewProps {
  module: Module;
  searchQuery?: string;
}

export function ModuleDetailView({
  module,
  searchQuery = "",
}: ModuleDetailViewProps) {
  const moduleStats = getModuleStats(module.id);
  const query = searchQuery.toLowerCase();

  // Filter subtopics based on search query
  const filteredSubtopics = module.subtopics.filter((subtopic) => {
    if (!query) return true;

    // If module name matches, show all
    if (module.name.toLowerCase().includes(query)) return true;

    // If subtopic name matches, show
    if (subtopic.name.toLowerCase().includes(query)) return true;

    // If any problem type matches, show
    return subtopic.problemTypes.some((pt) =>
      pt.name.toLowerCase().includes(query)
    );
  });

  // Calculate default expanded items based on search
  const defaultValue =
    query && !module.name.toLowerCase().includes(query)
      ? filteredSubtopics.map((s) => s.id)
      : [];

  return (
    <div className="h-full flex flex-col">
      {/* Module Header Area */}
      <div className="flex-none p-6 md:p-8 bg-muted/5 border-b">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-muted-foreground">
                    Module {module.order}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <TagIcon weight="duotone" /> {module.subtopics.length}{" "}
                    subtopics
                  </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {module.name}
                </h1>
                {module.overview && (
                  <p className="text-muted-foreground max-w-2xl leading-relaxed">
                    {module.overview}
                  </p>
                )}
              </div>

              {/* Stats Bar */}
              {moduleStats && moduleStats.attempts > 0 && (
                <div className="flex items-center gap-4 max-w-sm">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Progress</span>
                      <span>{moduleStats.masteryPercent}%</span>
                    </div>
                    <Progress
                      value={moduleStats.masteryPercent}
                      className="h-2"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {moduleStats.solved} / {moduleStats.attempts} Solved
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3 md:pt-2 shrink-0">
              <Button size="lg" className="shadow-sm gap-2" asChild>
                <Link
                  href={`/practice?mode=manual&module=${module.id}&difficulty=beginner`}
                >
                  <Play weight="fill" className="w-4 h-4" />
                  Practice Module
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Hierarchy */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 tracking-tight">
              <BookOpen weight="duotone" className="text-primary w-6 h-6" />
              Curriculum & Topics
            </h2>

            {filteredSubtopics.length > 0 ? (
              <Accordion
                type="multiple"
                className="w-full space-y-4"
                defaultValue={defaultValue}
                key={`${module.id}-${query}`} // Re-render to apply new defaultValues when search changes
              >
                {filteredSubtopics.map((subtopic) => (
                  <SubtopicItem
                    key={subtopic.id}
                    module={module}
                    subtopic={subtopic}
                    searchQuery={searchQuery}
                  />
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No topics found matching &ldquo;{searchQuery}&rdquo; in this
                module.
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
function SubtopicItem({
  module,
  subtopic,
  searchQuery = "",
}: {
  module: Module;
  subtopic: Subtopic;
  searchQuery?: string;
}) {
  const stats = getSubtopicStats(module.id, subtopic.id);
  const mastery = stats?.masteryPercent || 0;
  const query = searchQuery.toLowerCase();

  // Filter types logic...
  const showAllTypes =
    !query ||
    module.name.toLowerCase().includes(query) ||
    subtopic.name.toLowerCase().includes(query);

  const displayedTypes = showAllTypes
    ? subtopic.problemTypes
    : subtopic.problemTypes.filter((pt) =>
        pt.name.toLowerCase().includes(query)
      );

  return (
    <AccordionPrimitive.Item
      value={subtopic.id}
      className="border rounded-xl bg-card overflow-hidden shadow-sm"
    >
      <div className="flex items-center w-full bg-card p-0 transition-colors hover:bg-muted/30">
        {/* Main Trigger Area - Click anywhere to expand */}
        <AccordionPrimitive.Header className="flex flex-1 min-w-0">
          <AccordionPrimitive.Trigger className="flex flex-1 items-center gap-4 p-4 text-left outline-none">
            <div className="flex-1 min-w-0 grid gap-1">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-base truncate pr-2">
                  {subtopic.name}
                </h3>
                {mastery > 0 && (
                  <Badge
                    variant={mastery > 70 ? "default" : "secondary"}
                    className="text-[10px] h-5 px-1.5"
                  >
                    {mastery}%
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground flex gap-2 items-center">
                <span>{subtopic.problemTypes.length} Archetypes</span>
              </div>
            </div>
            {/* Chevron is typically here, let's keep it or move it? 
                Standard Accordion puts it at right. We can put it here.
            */}
            <CaretDown
              className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
              aria-hidden="true"
            />
          </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>

        {/* Separate Actions - Not part of trigger */}
        <div className="flex items-center gap-2 pr-4 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="hidden sm:flex h-8 gap-2 text-muted-foreground hover:bg-background border border-transparent hover:border-border"
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              href={`/practice?mode=manual&module=${module.id}&subtopic=${subtopic.name}&difficulty=beginner`}
            >
              <Play weight="duotone" className="w-4 h-4" />
              Practice
            </Link>
          </Button>
        </div>
      </div>

      <AccordionContent className="border-t bg-muted/20 px-4 py-4 pt-4 pb-4">
        <div className="space-y-3 pl-1 sm:pl-4">
          {displayedTypes.map((pt) => (
            <Link
              key={pt.id}
              href={`/practice?mode=manual&module=${module.id}&subtopic=${subtopic.name}&problemType=${pt.id}&difficulty=beginner`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg hover:bg-background/80 transition-all border border-transparent hover:border-border hover:shadow-sm cursor-pointer group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Lightning
                    weight="duotone"
                    className="w-4 h-4 text-primary shrink-0 transition-transform group-hover:scale-110"
                  />
                  <span className="font-medium text-sm text-foreground decoration-primary/50 group-hover:underline decoration-1 underline-offset-4">
                    {pt.name}
                  </span>
                </div>
                {pt.description && (
                  <p className="text-xs text-muted-foreground pl-6 line-clamp-1 group-hover:text-foreground/80 transition-colors">
                    {pt.description}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs sm:opacity-0 sm:group-hover:opacity-100 transition-opacity w-full sm:w-auto"
                asChild
              >
                <span className="pointer-events-none">Start</span>
              </Button>
            </Link>
          ))}
        </div>
      </AccordionContent>
    </AccordionPrimitive.Item>
  );
}
