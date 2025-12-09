"use client";

/**
 * Module Stats Grid
 *
 * Displays all modules with their hierarchical stats.
 * Uses the new statsStore v2 structure.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ModuleStatCard } from "./ModuleStatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Code,
  ListBullets,
  TreeStructure,
  ArrowsClockwise,
  MagnifyingGlass,
  Function as FunctionIcon,
  Stack,
  Tree,
  Sparkle,
} from "@phosphor-icons/react";
import {
  getStatsV2,
  type ModuleStats,
  type GlobalStatsV2,
} from "@/lib/statsStore";
import { getAllModules } from "@/lib/topicsStore";

// Module ID to icon mapping
const moduleIcons: Record<string, React.ReactNode> = {
  "string-manipulation": <Code weight="duotone" className="h-5 w-5" />,
  "lists-and-arrays": <ListBullets weight="duotone" className="h-5 w-5" />,
  "dictionaries-and-hashmaps": (
    <TreeStructure weight="duotone" className="h-5 w-5" />
  ),
  "loops-and-iteration": (
    <ArrowsClockwise weight="duotone" className="h-5 w-5" />
  ),
  "searching-and-sorting": (
    <MagnifyingGlass weight="duotone" className="h-5 w-5" />
  ),
  recursion: <FunctionIcon weight="duotone" className="h-5 w-5" />,
  "stacks-and-queues": <Stack weight="duotone" className="h-5 w-5" />,
  "trees-and-graphs": <Tree weight="duotone" className="h-5 w-5" />,
};

function getModuleIcon(moduleId: string): React.ReactNode {
  return (
    moduleIcons[moduleId] || <Sparkle weight="duotone" className="h-5 w-5" />
  );
}

interface ModuleStatsGridProps {
  showEmptyModules?: boolean;
}

export function ModuleStatsGrid({
  showEmptyModules = true,
}: ModuleStatsGridProps) {
  const router = useRouter();
  const [stats, setStats] = useState<GlobalStatsV2 | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = () => {
      const loaded = getStatsV2();
      setStats(loaded);
      setIsLoading(false);
    };

    loadStats();
  }, []);

  const handlePractice = (moduleId: string) => {
    router.push(`/practice/manual?module=${moduleId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkle
            weight="duotone"
            className="h-10 w-10 text-muted-foreground mb-3"
          />
          <p className="text-sm font-medium">No stats available</p>
        </CardContent>
      </Card>
    );
  }

  // Get all modules from topicsStore for complete list
  const allModules = getAllModules();

  // Create a map of existing stats
  const statsMap = new Map(stats.modules.map((m) => [m.moduleId, m]));

  // Build display list: either only touched modules or all
  const displayModules: Array<{
    moduleId: string;
    moduleName: string;
    stats: ModuleStats | null;
  }> = [];

  if (showEmptyModules) {
    // Show all modules, with stats if available
    for (const mod of allModules) {
      displayModules.push({
        moduleId: mod.id,
        moduleName: mod.name,
        stats: statsMap.get(mod.id) || null,
      });
    }
  } else {
    // Only show modules with stats
    for (const modStats of stats.modules) {
      if (modStats.attempts > 0) {
        displayModules.push({
          moduleId: modStats.moduleId,
          moduleName: modStats.moduleName,
          stats: modStats,
        });
      }
    }
  }

  // Sort: modules with stats first, then by mastery
  displayModules.sort((a, b) => {
    if (a.stats && !b.stats) return -1;
    if (!a.stats && b.stats) return 1;
    if (a.stats && b.stats) {
      return b.stats.masteryPercent - a.stats.masteryPercent;
    }
    return 0;
  });

  if (displayModules.length === 0) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkle
            weight="duotone"
            className="h-10 w-10 text-muted-foreground mb-3"
          />
          <p className="text-sm font-medium">
            Start practicing to see your progress
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Modules:</span>
          <Badge variant="secondary">{stats.modulesTouched} touched</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span>Subtopics:</span>
          <Badge variant="secondary">{stats.subtopicsTouched} practiced</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span>Overall:</span>
          <Badge variant={stats.masteryPercent >= 60 ? "default" : "secondary"}>
            {stats.masteryPercent}% mastery
          </Badge>
        </div>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {displayModules.map(({ moduleId, moduleName, stats: modStats }) =>
          modStats ? (
            <ModuleStatCard
              key={moduleId}
              moduleStats={modStats}
              moduleName={moduleName}
              moduleIcon={getModuleIcon(moduleId)}
              onPractice={handlePractice}
            />
          ) : (
            <Card
              key={moduleId}
              className="border-l-4 border-l-muted opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => handlePractice(moduleId)}
            >
              <CardContent className="flex items-center gap-3 py-4">
                <div className="p-2 bg-muted rounded-lg">
                  {getModuleIcon(moduleId)}
                </div>
                <div>
                  <p className="font-medium">{moduleName}</p>
                  <p className="text-xs text-muted-foreground">
                    Not started yet
                  </p>
                </div>
                <Badge variant="outline" className="ml-auto text-xs">
                  Start
                </Badge>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
