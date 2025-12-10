"use client";

/**
 * Curriculum Explorer - Single Page Scroll Experience
 *
 * Features:
 * - ResizablePanelGroup for flexible layout
 * - Scroll spy for two-way binding (sidebar <-> content)
 * - Enhanced search with Cmd+J shortcut
 * - All modules rendered in continuous stream
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { getAllModules } from "@/lib/stores/topicsStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MagnifyingGlass, CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { getModuleStats } from "@/lib/stores/statsStore";
import { ModuleSection } from "./ModuleSection";
import type { Module } from "@/types/topics";

// ============================================
// SCROLL SPY HOOK
// ============================================

function useScrollSpy(
  sectionIds: string[],
  scrollContainerRef: React.RefObject<HTMLElement | null>
) {
  const [activeId, setActiveId] = useState<string | null>(
    sectionIds[0] || null
  );

  useEffect(() => {
    if (!scrollContainerRef.current || sectionIds.length === 0) return;

    const scrollContainer = scrollContainerRef.current;

    const handleScroll = () => {
      // Get the scroll container's bounding rect
      const containerRect = scrollContainer.getBoundingClientRect();
      const containerTop = containerRect.top;

      // Find the section closest to the top of the viewport
      let closestId: string | null = null;
      let closestDistance = Infinity;

      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (!element) continue;

        const rect = element.getBoundingClientRect();
        // Distance from the top of the container (with some offset)
        const distance = Math.abs(rect.top - containerTop - 100);

        // If this section is above the fold or close to top
        if (rect.top <= containerTop + 150 && distance < closestDistance) {
          closestDistance = distance;
          closestId = id;
        }
      }

      // Fallback: if nothing is above the fold, use the first section
      if (!closestId && sectionIds.length > 0) {
        closestId = sectionIds[0];
      }

      if (closestId && closestId !== activeId) {
        setActiveId(closestId);
      }
    };

    // Initial check
    handleScroll();

    // Listen to scroll events on the container
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [sectionIds, scrollContainerRef, activeId]);

  return activeId;
}

// ============================================
// SIDEBAR COMPONENT
// ============================================

interface SidebarProps {
  modules: Module[];
  activeModuleId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onModuleClick: (moduleId: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

function Sidebar({
  modules,
  activeModuleId,
  searchQuery,
  onSearchChange,
  onModuleClick,
  searchInputRef,
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full bg-muted/5">
      {/* Sticky Search Header */}
      <div className="p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10 space-y-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search modules & topics..."
                className="pl-9 pr-12 bg-background"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Kbd>⌘J</Kbd>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Search modules & topics</p>
          </TooltipContent>
        </Tooltip>
        <div className="text-xs text-muted-foreground px-1">
          {modules.length} modules found
        </div>
      </div>

      {/* Module List */}
      <ScrollArea className="flex-1 min-h-0">
        <nav className="p-3 space-y-1">
          {modules.map((module) => {
            const stats = getModuleStats(module.id);
            const isActive = module.id === activeModuleId;

            return (
              <button
                key={module.id}
                onClick={() => onModuleClick(module.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all hover:bg-muted group relative flex items-start gap-3",
                  isActive
                    ? "bg-primary/10 border-primary/20 shadow-sm"
                    : "bg-transparent border-transparent hover:border-border"
                )}
              >
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <span
                      className={cn(
                        "font-medium line-clamp-1 text-sm",
                        isActive ? "text-primary" : "text-foreground"
                      )}
                    >
                      {module.name}
                    </span>
                    {stats && stats.attempts > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-4 px-1 shrink-0"
                      >
                        {stats.masteryPercent}%
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {module.subtopics.length} topics
                  </div>
                </div>

                {isActive && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <CaretRight
                      weight="bold"
                      className="text-primary w-4 h-4"
                    />
                  </div>
                )}
              </button>
            );
          })}

          {modules.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No modules match your search.
            </div>
          )}
        </nav>
      </ScrollArea>
    </div>
  );
}

// ============================================
// MAIN EXPLORER COMPONENT
// ============================================

export function CurriculumExplorer() {
  const allModules = getAllModules();
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // Filter modules based on search
  const filteredModules = allModules.filter((m) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    return (
      m.name.toLowerCase().includes(query) ||
      m.subtopics.some(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.problemTypes.some((pt) => pt.name.toLowerCase().includes(query))
      )
    );
  });

  // Get section IDs for scroll spy
  const sectionIds = filteredModules.map((m) => `module-${m.id}`);
  const activeModuleId = useScrollSpy(sectionIds, scrollViewportRef);

  // Extract just the module ID from the section ID
  const activeModule =
    activeModuleId?.replace("module-", "") || filteredModules[0]?.id || null;

  // Handle module click - smooth scroll to section
  const handleModuleClick = useCallback((moduleId: string) => {
    const element = document.getElementById(`module-${moduleId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Keyboard shortcut: Cmd+J / Ctrl+J to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Left Panel - Sidebar */}
      <ResizablePanel
        defaultSize={22}
        minSize={15}
        maxSize={30}
        className="hidden md:block"
      >
        <Sidebar
          modules={filteredModules}
          activeModuleId={activeModule}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onModuleClick={handleModuleClick}
          searchInputRef={searchInputRef}
        />
      </ResizablePanel>

      <ResizableHandle withHandle className="hidden md:flex" />

      {/* Right Panel - Content Stream */}
      <ResizablePanel defaultSize={78}>
        <div className="h-full overflow-auto" ref={scrollViewportRef}>
          <div className="p-6 md:p-8 space-y-12">
            {/* Mobile Search */}
            <div className="md:hidden mb-6">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search modules & topics..."
                  className="pl-9 bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* All Modules - Continuous Stream */}
            {filteredModules.map((module) => (
              <ModuleSection
                key={module.id}
                module={module}
                searchQuery={searchQuery}
              />
            ))}

            {filteredModules.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                <p className="text-lg font-medium text-foreground mb-2">
                  No results found
                </p>
                <p>Try a different search term.</p>
              </div>
            )}
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
