"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  House,
  Books,
  Code,
  Lightning,
  Clock,
  ChartLine,
  Cpu,
  Gear,
  Question,
  BookOpen,
  Hash,
  Sun,
  Moon,
  Key,
  Keyboard,
  Bug,
  Rocket,
} from "@phosphor-icons/react";
import {
  getStaticPages,
  getModuleItems,
  getHelpActions,
  searchCommands,
  searchModules,
  searchSubtopics,
  searchArchetypes,
  SearchResult,
} from "@/lib/search/searchIndex";

// Icon mapping for dynamic rendering
const IconMap: Record<string, React.ElementType> = {
  House,
  Books,
  Code,
  Lightning,
  Clock,
  ChartLine,
  Cpu,
  Gear,
  Question,
  BookOpen,
  Hash,
  Keyboard,
  Bug,
  Rocket,
};

interface CommandCenterProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandCenter({
  open: controlledOpen,
  onOpenChange,
}: CommandCenterProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { theme, setTheme } = useTheme();

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  // Memoize static lists (only modules needed for initial view)
  const staticPages = useMemo(() => getStaticPages(), []);
  const moduleItems = useMemo(() => getModuleItems(), []);
  const helpActions = useMemo(() => getHelpActions(), []);

  // Determine if searching
  const isSearching = query.trim().length > 0;

  // Search results - only computed when searching
  const searchResults = useMemo(() => {
    if (!isSearching) return null;
    return {
      commands: searchCommands(query),
      modules: searchModules(query),
      subtopics: searchSubtopics(query),
      archetypes: searchArchetypes(query),
    };
  }, [isSearching, query]);

  // Keyboard shortcut listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  // Stats integration - weakest subtopic
  const [weakestSubtopic, setWeakestSubtopic] = useState<{
    id: string;
    name: string;
    moduleId: string;
  } | null>(null);

  useEffect(() => {
    if (open && !isSearching) {
      import("@/lib/stores/statsStore").then(({ getWeakestSubtopics }) => {
        const weakest = getWeakestSubtopics(1);
        if (weakest.length > 0) {
          setWeakestSubtopic({
            id: weakest[0].subtopic.subtopicId,
            name: weakest[0].subtopic.subtopicName,
            moduleId: weakest[0].moduleId,
          });
        }
      });
    }
  }, [open, isSearching]);

  // Handle item selection
  const handleSelect = (item: SearchResult) => {
    setOpen(false);
    setQuery("");
    if (item.onSelect) {
      item.onSelect();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  // Navigate and close helper
  const navigateTo = (path: string) => {
    setOpen(false);
    setQuery("");
    router.push(path);
  };

  // Render icon helper
  const renderIcon = (iconName?: string, className?: string) => {
    const Icon = iconName ? IconMap[iconName] : House;
    return <Icon className={className || "mr-2 h-4 w-4"} />;
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Type a command or search topic..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          No results found. Try a broader topic name or module.
        </CommandEmpty>

        {/* ===== INITIAL STATE (no search) ===== */}
        {!isSearching && (
          <>
            {/* Practice Group */}
            <CommandGroup heading="Practice">
              <CommandItem
                value="start-auto"
                onSelect={() => navigateTo("/practice/auto")}
              >
                <Lightning className="mr-2 h-4 w-4 text-amber-500" />
                <span>Start Auto Mode</span>
              </CommandItem>

              {weakestSubtopic && (
                <CommandItem
                  value="weakest-subtopic"
                  onSelect={() =>
                    navigateTo(
                      `/practice?mode=manual&module=${
                        weakestSubtopic.moduleId
                      }&subtopic=${encodeURIComponent(
                        weakestSubtopic.name
                      )}&difficulty=beginner`
                    )
                  }
                >
                  <ChartLine className="mr-2 h-4 w-4 text-red-500" />
                  <span>Practice Weakest: {weakestSubtopic.name}</span>
                </CommandItem>
              )}

              <CommandItem
                value="manual-practice"
                onSelect={() => navigateTo("/practice/manual")}
              >
                <Code className="mr-2 h-4 w-4" />
                <span>Open Manual Practice</span>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            {/* Go To Group */}
            <CommandGroup heading="Go To">
              {staticPages.map((page) => (
                <CommandItem
                  key={page.id}
                  value={page.id}
                  onSelect={() => handleSelect(page)}
                >
                  {renderIcon(page.icon)}
                  <span>{page.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            {/* Modules Group */}
            <CommandGroup heading="Modules">
              {moduleItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => handleSelect(item)}
                >
                  <BookOpen className="mr-2 h-4 w-4 opacity-70" />
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    {item.subtitle && (
                      <span className="text-xs text-muted-foreground truncate max-w-[250px]">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            {/* Settings & Toggles Group */}
            <CommandGroup heading="Settings & Toggles">
              <CommandItem
                value="toggle-theme"
                onSelect={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                <span>Toggle Theme</span>
              </CommandItem>
              <CommandItem
                value="api-settings"
                onSelect={() => navigateTo("/support/settings?tab=api")}
              >
                <Key className="mr-2 h-4 w-4" />
                <span>API Key Settings</span>
              </CommandItem>
              <CommandItem
                value="general-settings"
                onSelect={() => navigateTo("/support/settings?tab=general")}
              >
                <Gear className="mr-2 h-4 w-4" />
                <span>General Settings</span>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            {/* Help Group */}
            <CommandGroup heading="Help">
              {helpActions.map((action) => (
                <CommandItem
                  key={action.id}
                  value={action.id}
                  onSelect={() => handleSelect(action)}
                >
                  {renderIcon(action.icon)}
                  <span>{action.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* ===== SEARCH STATE ===== */}
        {isSearching && searchResults && (
          <>
            {/* Commands (matching navigation/practice/settings/help) */}
            {searchResults.commands.length > 0 && (
              <CommandGroup heading="Commands">
                {searchResults.commands.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item)}
                  >
                    {renderIcon(item.icon)}
                    <span>{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Modules */}
            {searchResults.modules.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Modules">
                  {searchResults.modules.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelect(item)}
                    >
                      <BookOpen className="mr-2 h-4 w-4 opacity-70" />
                      <div className="flex flex-col">
                        <span>{item.title}</span>
                        {item.subtitle && (
                          <span className="text-xs text-muted-foreground">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {/* Subtopics - Search Only */}
            {searchResults.subtopics.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Subtopics">
                  {searchResults.subtopics.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelect(item)}
                    >
                      <Hash className="mr-2 h-4 w-4 opacity-70" />
                      <div className="flex flex-col">
                        <span>{item.title}</span>
                        {item.subtitle && (
                          <span className="text-xs text-muted-foreground">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {/* Problem Archetypes - Search Only */}
            {searchResults.archetypes.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Problem Archetypes">
                  {searchResults.archetypes.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelect(item)}
                    >
                      <Lightning className="mr-2 h-4 w-4 opacity-70" />
                      <div className="flex flex-col">
                        <span>{item.title}</span>
                        {item.subtitle && (
                          <span className="text-xs text-muted-foreground">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
