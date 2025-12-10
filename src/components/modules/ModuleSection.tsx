"use client";

/**
 * Module Section Component
 *
 * Renders a single module with its subtopics and problem types
 * in the continuous curriculum stream.
 */

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
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent } from "@/components/ui/accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import type { Module, Subtopic } from "@/types/topics";
import { getModuleStats, getSubtopicStats } from "@/lib/statsStore";
import { cn } from "@/lib/utils";

interface ModuleSectionProps {
  module: Module;
  searchQuery?: string;
}

export function ModuleSection({
  module,
  searchQuery = "",
}: ModuleSectionProps) {
  const moduleStats = getModuleStats(module.id);
  const query = searchQuery.toLowerCase();

  // Filter subtopics based on search query
  const filteredSubtopics = module.subtopics.filter((subtopic) => {
    if (!query) return true;
    if (module.name.toLowerCase().includes(query)) return true;
    if (subtopic.name.toLowerCase().includes(query)) return true;
    return subtopic.problemTypes.some((pt) =>
      pt.name.toLowerCase().includes(query)
    );
  });

  // Determine default expanded items based on search
  const defaultValue =
    query && !module.name.toLowerCase().includes(query)
      ? filteredSubtopics.map((s) => s.id)
      : [];

  return (
    <section id={`module-${module.id}`} className="scroll-mt-8">
      {/* Module Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-muted-foreground">
                Module {module.order}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <TagIcon weight="duotone" /> {module.subtopics.length} subtopics
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {module.name}
            </h2>
            {module.overview && (
              <p className="text-muted-foreground max-w-2xl leading-relaxed">
                {module.overview}
              </p>
            )}

            {/* Stats Bar */}
            {moduleStats && moduleStats.attempts > 0 && (
              <div className="flex items-center gap-4 max-w-sm pt-2">
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
                  {moduleStats.solved} / {moduleStats.attempts}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Button size="sm" className="shadow-sm gap-2" asChild>
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

      {/* Subtopics */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 tracking-tight">
          <BookOpen weight="duotone" className="text-primary w-5 h-5" />
          Topics
        </h3>

        {filteredSubtopics.length > 0 ? (
          <Accordion
            type="multiple"
            className="w-full space-y-3"
            defaultValue={defaultValue}
            key={`${module.id}-${query}`}
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
          <div className="text-center py-8 text-muted-foreground text-sm">
            No topics found matching &ldquo;{searchQuery}&rdquo;
          </div>
        )}
      </div>

      <Separator className="mt-10" />
    </section>
  );
}

// ============================================
// SUBTOPIC ITEM
// ============================================

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
        <AccordionPrimitive.Header className="flex flex-1 min-w-0">
          <AccordionPrimitive.Trigger className="flex flex-1 items-center gap-4 p-4 text-left outline-none">
            <div className="flex-1 min-w-0 grid gap-1">
              <div className="flex items-center gap-3">
                <h4 className="font-semibold text-base truncate pr-2">
                  {subtopic.name}
                </h4>
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
                <span>{subtopic.problemTypes.length} archetypes</span>
              </div>
            </div>
            <CaretDown
              className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
              aria-hidden="true"
            />
          </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>

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

      <AccordionContent className="border-t bg-muted/20 px-4 py-4">
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
