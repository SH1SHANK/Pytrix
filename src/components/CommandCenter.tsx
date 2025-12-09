"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  GitBranch,
  Sun,
  Moon,
  Key,
} from "@phosphor-icons/react";
import {
  getStaticPages,
  getModuleItems,
  getSubtopicItems,
  getArchetypeItems,
  searchItems,
  SearchResult,
} from "@/lib/searchIndex";

export function CommandCenter() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const { theme, setTheme } = useTheme();

  // Memoize static lists
  const staticPages = useMemo(() => getStaticPages(), []);
  const moduleItems = useMemo(() => getModuleItems(), []);
  // Subtopics and Archetypes are loaded but filtering happens on render
  const subtopicItems = useMemo(() => getSubtopicItems(), []);
  const archetypeItems = useMemo(() => getArchetypeItems(), []);

  // Filter Logic
  const isSearching = query.trim().length > 0;

  const displayedPages = useMemo(
    () => (isSearching ? searchItems(staticPages, query) : staticPages),
    [isSearching, query, staticPages]
  );

  const displayedModules = useMemo(
    () => (isSearching ? searchItems(moduleItems, query) : moduleItems),
    [isSearching, query, moduleItems]
  );

  const displayedSubtopics = useMemo(
    () => (isSearching ? searchItems(subtopicItems, query) : []),
    [isSearching, query, subtopicItems]
  );

  const displayedArchetypes = useMemo(
    () => (isSearching ? searchItems(archetypeItems, query) : []),
    [isSearching, query, archetypeItems]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (item: SearchResult) => {
    setOpen(false);
    if (item.onSelect) {
      item.onSelect();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  // Icon mapping
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
    GitBranch,
  };

  // Stats integration
  const [weakestSubtopic, setWeakestSubtopic] = useState<{
    id: string;
    name: string;
    moduleId: string;
  } | null>(null);

  useEffect(() => {
    if (open && !isSearching) {
      // Dynamic import to avoid SSR issues with localStorage
      import("@/lib/statsStore").then(({ getWeakestSubtopics }) => {
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

  return (
    <>
      {/* Removed trigger button since it's global shortcut, but could add a hidden one or use context */}
      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <CommandInput
          placeholder="Type a command or search topic..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Initial State Groups */}
          {!isSearching && (
            <>
              <CommandGroup heading="Practice">
                <CommandItem
                  value="start-auto"
                  onSelect={() => {
                    router.push("/practice/auto");
                    setOpen(false);
                  }}
                >
                  <Lightning className="mr-2 h-4 w-4 text-amber-500" />
                  <span>Start Auto Mode</span>
                </CommandItem>

                {weakestSubtopic && (
                  <CommandItem
                    value="weakest-subtopic"
                    onSelect={() => {
                      router.push(
                        `/practice?mode=manual&module=${
                          weakestSubtopic.moduleId
                        }&subtopic=${encodeURIComponent(
                          weakestSubtopic.name
                        )}&difficulty=beginner`
                      );
                      setOpen(false);
                    }}
                  >
                    <ChartLine className="mr-2 h-4 w-4 text-red-500" />
                    <span>Practice Weakest: {weakestSubtopic.name}</span>
                  </CommandItem>
                )}

                <CommandItem
                  value="manual-practice"
                  onSelect={() => {
                    router.push("/practice/manual");
                    setOpen(false);
                  }}
                >
                  <Code className="mr-2 h-4 w-4" />
                  <span>Open Manual Practice</span>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              {/* Suggestions / Context (Merged into specific actions or hidden if redundant) */}
              {/* Keeping context-aware items if they add value beyond the standard groups */}
              {pathname === "/practice/auto" && (
                <CommandGroup heading="Suggestions">
                  <CommandItem
                    value="go-home"
                    onSelect={() => {
                      router.push("/");
                      setOpen(false);
                    }}
                  >
                    <House className="mr-2 h-4 w-4" />
                    <span>Go Home</span>
                  </CommandItem>
                </CommandGroup>
              )}
            </>
          )}

          {/* Core Navigation */}
          {displayedPages.length > 0 && (
            <CommandGroup heading="Go To">
              {displayedPages.map((page) => {
                const Icon = page.icon ? IconMap[page.icon] : House;
                return (
                  <CommandItem
                    key={page.id}
                    value={page.id}
                    onSelect={() => handleSelect(page)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{page.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          <CommandSeparator />

          {/* Modules */}
          {displayedModules.length > 0 && (
            <CommandGroup heading="Modules">
              {displayedModules.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => handleSelect(item)}
                >
                  <BookOpen className="mr-2 h-4 w-4 opacity-70" />
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Subtopics - Search Only */}
          {isSearching && displayedSubtopics.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Subtopics">
                {displayedSubtopics.map((item) => (
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

          {/* Archetypes - Search Only */}
          {isSearching && displayedArchetypes.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Problem Archetypes">
                {displayedArchetypes.map((item) => (
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

          {/* Settings & Toggles - Initial Only */}
          {!isSearching && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Settings & Toggles">
                <CommandItem
                  value="toggle-theme"
                  onSelect={() => {
                    setTheme(theme === "dark" ? "light" : "dark");
                  }}
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
                  onSelect={() => {
                    router.push("/support/settings?tab=api");
                    setOpen(false);
                  }}
                >
                  <Key className="mr-2 h-4 w-4" />
                  <span>API Key Settings</span>
                </CommandItem>
                <CommandItem
                  value="general-settings"
                  onSelect={() => {
                    router.push("/support/settings?tab=general");
                    setOpen(false);
                  }}
                >
                  <Gear className="mr-2 h-4 w-4" />
                  <span>General Settings</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          {/* Help - Initial Only */}
          {!isSearching && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Help">
                <CommandItem
                  value="docs"
                  onSelect={() => {
                    router.push("/support/help");
                    setOpen(false);
                  }}
                >
                  <Question className="mr-2 h-4 w-4" />
                  <span>Search Documentation</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
