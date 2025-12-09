"use client";

/**
 * Practice Modules View
 *
 * Grid of module cards for the practice context.
 * Shows mastery stats and allows drill-down into modules.
 */

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getAllModules, type Module } from "@/lib/topicsStore";
import { getStats, type TopicStats } from "@/lib/statsStore";
import { getTemplateQuestion } from "@/lib/questionService";
import type { Difficulty } from "@/lib/types";
import { PracticeModuleCard } from "./PracticeModuleCard";
import { ModuleSheet } from "./ModuleSheet";
import { Input } from "@/components/ui/input";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { toast } from "sonner";

interface PracticeModulesViewProps {
  difficulty: Difficulty;
}

/**
 * Calculate mastery percentage for a module based on subtopic stats.
 * Falls back to 0 if no stats available.
 */
function calculateModuleMastery(
  module: Module,
  topicStats: TopicStats[]
): number {
  // For now, we match module name to topic stats (legacy compatibility)
  // TODO: Update when statsStore supports module/subtopic IDs
  const stat = topicStats.find(
    (s) => s.topic.toLowerCase() === module.name.toLowerCase()
  );

  if (!stat || stat.attempts === 0) return 0;
  return Math.round((stat.solved / stat.attempts) * 100);
}

/**
 * Get the weakest subtopic in a module (or random if no stats).
 * Returns a random problem type from that subtopic.
 */
function getWeakestProblemType(module: Module): string | null {
  // For now, pick a random problem type since we don't have subtopic-level stats
  // TODO: Implement proper weakest-subtopic bias when stats support it
  const allProblemTypes = module.subtopics.flatMap((st) =>
    st.problemTypes.map((pt) => pt.id)
  );

  if (allProblemTypes.length === 0) return null;
  return allProblemTypes[Math.floor(Math.random() * allProblemTypes.length)];
}

export function PracticeModulesView({ difficulty }: PracticeModulesViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Get data
  const modules = getAllModules();
  const stats = getStats();

  // Filter modules based on search
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modules;

    const query = searchQuery.toLowerCase();
    return modules.filter((mod) => {
      if (mod.name.toLowerCase().includes(query)) return true;
      if (mod.subtopics.some((st) => st.name.toLowerCase().includes(query)))
        return true;
      if (
        mod.subtopics.some((st) =>
          st.problemTypes.some((pt) => pt.name.toLowerCase().includes(query))
        )
      )
        return true;
      return false;
    });
  }, [modules, searchQuery]);

  const moduleMasteries = useMemo(() => {
    const masteryMap: Record<string, number> = {};
    for (const mod of modules) {
      masteryMap[mod.id] = calculateModuleMastery(mod, stats.perTopic);
    }
    return masteryMap;
  }, [modules, stats.perTopic]);

  // Handle "Practice Module" quick action
  const handlePractice = useCallback(
    (module: Module) => {
      const problemTypeId = getWeakestProblemType(module);
      if (!problemTypeId) {
        toast.error("No problem types available in this module");
        return;
      }

      // Generate question and navigate
      const question = getTemplateQuestion(problemTypeId, difficulty);
      if (!question) {
        toast.error("Failed to generate question");
        return;
      }

      // Store in session and navigate
      sessionStorage.setItem("pendingQuestion", JSON.stringify({ question }));

      router.push(
        `/practice?mode=manual&module=${encodeURIComponent(
          module.id
        )}&problemType=${encodeURIComponent(
          problemTypeId
        )}&difficulty=${difficulty}`
      );
    },
    [difficulty, router]
  );

  // Handle opening module sheet
  const handleOpen = useCallback((module: Module) => {
    setSelectedModule(module);
    setIsSheetOpen(true);
  }, []);

  return (
    <div className="space-y-6">
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
          module{filteredModules.length !== 1 ? "s" : ""}
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
            <PracticeModuleCard
              key={module.id}
              module={module}
              mastery={moduleMasteries[module.id] || 0}
              onPractice={handlePractice}
              onOpen={handleOpen}
            />
          ))}
        </div>
      )}

      {/* Module Sheet */}
      <ModuleSheet
        module={selectedModule}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        difficulty={difficulty}
      />
    </div>
  );
}
