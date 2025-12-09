import { Suspense } from "react";
import { Metadata } from "next";
import {
  ModulesGrid,
  ModulesGridSkeleton,
} from "@/components/modules/ModulesGrid";

export const metadata: Metadata = {
  title: "Browse Modules | PyPractice",
  description:
    "Explore all DSA and Python modules with subtopics and problem types",
};

export default function ModulesPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Browse Modules</h1>
        <p className="text-muted-foreground mt-1">
          Explore all DSA topics organized by module, subtopic, and problem
          type.
        </p>
      </div>

      {/* Modules Grid */}
      <Suspense fallback={<ModulesGridSkeleton />}>
        <ModulesGrid />
      </Suspense>
    </div>
  );
}
