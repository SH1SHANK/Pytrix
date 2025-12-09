"use client";

import { useState } from "react";
import { getAllModules } from "@/lib/topicsStore";
import { ModuleSidebar } from "./ModuleSidebar";
import { ModuleDetailView } from "./ModuleDetailView";

export function CurriculumExplorer() {
  const modules = getAllModules();
  // Default to first module
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    modules[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filteredModules = modules.filter((m) => {
    const query = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(query) ||
      m.subtopics.some(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.problemTypes.some((pt) => pt.name.toLowerCase().includes(query))
      )
    );
  });

  const selectedModule = modules.find((m) => m.id === selectedModuleId);

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden bg-background">
      {/* Sidebar - Settings-style List */}
      <aside className="w-full md:w-64 lg:w-72 border-r shrink-0 z-20 bg-background md:block hidden">
        <ModuleSidebar
          modules={filteredModules}
          selectedModuleId={selectedModuleId}
          onSelectModule={setSelectedModuleId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </aside>

      {/* Mobile Drawer */}
      <div className="md:hidden h-64 border-b shrink-0">
        <ModuleSidebar
          modules={filteredModules}
          selectedModuleId={selectedModuleId}
          onSelectModule={setSelectedModuleId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 h-full overflow-hidden flex flex-col bg-background">
        {selectedModule ? (
          <ModuleDetailView module={selectedModule} searchQuery={searchQuery} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <div className="max-w-xs">
              <p className="text-lg font-medium text-foreground mb-2">
                No Module Selected
              </p>
              <p>
                Select a module from the sidebar to view its curriculum and
                start practicing.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
