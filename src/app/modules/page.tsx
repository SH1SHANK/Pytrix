"use client";

import { Suspense } from "react";
import { CurriculumExplorer } from "@/components/modules/CurriculumExplorer";
import { Skeleton } from "@/components/ui/skeleton";
import { Books } from "@phosphor-icons/react";

function CurriculumSkeleton() {
  return (
    <div className="flex h-full">
      <div className="w-72 border-r p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-full max-w-md mb-8" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ModulesPage() {
  return (
    <div className="h-dvh flex flex-col">
      {/* Hero Header */}
      <header className="border-b bg-muted/30 shrink-0">
        <div className="px-6 py-6 md:py-8">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Books weight="duotone" className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Curriculum
              </h1>
              <p className="text-muted-foreground text-sm md:text-base mt-1">
                Explore modules, subtopics, and problem archetypes
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Two-Column Curriculum Explorer */}
      <div className="flex-1 min-h-0">
        <Suspense fallback={<CurriculumSkeleton />}>
          <CurriculumExplorer />
        </Suspense>
      </div>
    </div>
  );
}
