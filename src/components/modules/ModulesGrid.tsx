"use client";

import { useMemo, useState } from "react";
import { getAllModules, getTopicsStats, Module } from "@/lib/stores/topicsStore";
import { ModuleCard } from "./ModuleCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { MagnifyingGlass, Stack, TreeStructure } from "@phosphor-icons/react";

/**
 * Grid container that displays all modules from topicsStore.
 * Includes search filtering and responsive layout.
 */
export function ModulesGrid() {
  const [searchQuery, setSearchQuery] = useState("");

  // Get data from store
  const modules = getAllModules();
  const stats = getTopicsStats();

  // Filter modules based on search
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) {
      return modules;
    }

    const query = searchQuery.toLowerCase();
    return modules.filter((module: Module) => {
      // Search in module name
      if (module.name.toLowerCase().includes(query)) return true;

      // Search in subtopic names
      if (
        module.subtopics.some((st) => st.name.toLowerCase().includes(query))
      ) {
        return true;
      }

      // Search in problem archetypes
      if (
        module.problemArchetypes.some((a) => a.toLowerCase().includes(query))
      ) {
        return true;
      }

      // Search in problem type names
      if (
        module.subtopics.some((st) =>
          st.problemTypes.some((pt) => pt.name.toLowerCase().includes(query))
        )
      ) {
        return true;
      }

      return false;
    });
  }, [modules, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Stack weight="duotone" className="h-4 w-4" />
          <span>
            <strong className="text-foreground">{stats.moduleCount}</strong>{" "}
            modules
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TreeStructure weight="duotone" className="h-4 w-4" />
          <span>
            <strong className="text-foreground">{stats.subtopicCount}</strong>{" "}
            subtopics
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>
            <strong className="text-foreground">
              {stats.problemTypeCount}
            </strong>{" "}
            problem types
          </span>
        </div>
        <Badge variant="secondary" className="text-xs">
          v{stats.version}
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search modules, subtopics, or problems..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results Count */}
      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          Found{" "}
          <strong className="text-foreground">{filteredModules.length}</strong>{" "}
          module{filteredModules.length !== 1 ? "s" : ""} matching &quot;
          {searchQuery}&quot;
        </p>
      )}

      {/* Modules Grid */}
      {filteredModules.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No modules found matching your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredModules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Loading skeleton for the modules grid.
 */
export function ModulesGridSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Search skeleton */}
      <Skeleton className="h-10 w-full" />

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex gap-2 mb-3">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-14" />
              </div>
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
