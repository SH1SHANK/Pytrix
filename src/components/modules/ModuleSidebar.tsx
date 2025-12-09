"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MagnifyingGlass, CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { Module } from "@/types/topics";
import { getModuleStats } from "@/lib/statsStore";

interface ModuleSidebarProps {
  modules: Module[];
  selectedModuleId: string;
  onSelectModule: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  className?: string;
}

export function ModuleSidebar({
  modules,
  selectedModuleId,
  onSelectModule,
  searchQuery,
  onSearchChange,
  className,
}: ModuleSidebarProps) {
  return (
    <div className={cn("flex flex-col h-full bg-muted/10 border-r", className)}>
      <div className="p-4 border-b space-y-3 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="relative">
          <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search curriculum..."
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
          <span>{modules.length} Modules Found</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-3 space-y-1">
          {modules.map((module) => {
            const stats = getModuleStats(module.id);
            const isActive = module.id === selectedModuleId;
            const subtopicsCount = module.subtopics.length;

            return (
              <button
                key={module.id}
                onClick={() => onSelectModule(module.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all hover:bg-muted group relative flex items-start gap-3",
                  isActive
                    ? "bg-primary/10 border-primary/20 shadow-sm"
                    : "bg-transparent border-transparent hover:border-border"
                )}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <span
                      className={cn(
                        "font-medium line-clamp-1",
                        isActive ? "text-primary" : "text-foreground"
                      )}
                    >
                      {module.name}
                    </span>
                    {stats && stats.attempts > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-4 px-1 ml-2 shrink-0"
                      >
                        {stats.masteryPercent}%
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{subtopicsCount} topics</span>
                  </div>
                </div>

                {isActive && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 md:block hidden">
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
