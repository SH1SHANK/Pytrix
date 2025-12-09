import { getAllModules } from "@/lib/topicsStore";

export type SearchResultType =
  | "page"
  | "module"
  | "subtopic"
  | "archetype"
  | "action";

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string; // Breadcrumb or description
  type: SearchResultType;
  href?: string; // Direct navigation
  onSelect?: () => void; // Function action
  keywords?: string[]; // Fuzzy matching helpers
  icon?: string; // Icon name (phosphor)
  score?: number; // Ranking score
  metadata?: {
    // For archetypes: store IDs for question generation
    moduleId?: string;
    subtopicId?: string;
    problemTypeId?: string;
  };
}

// ============================================
// STATIC DATA - Navigation Pages
// ============================================
const GO_TO_PAGES: SearchResult[] = [
  {
    id: "nav-dashboard",
    title: "Dashboard",
    type: "page",
    href: "/dashboard",
    icon: "House",
    keywords: ["home", "main", "overview"],
  },
  {
    id: "nav-modules",
    title: "Modules",
    type: "page",
    href: "/modules",
    icon: "Books",
    keywords: ["topics", "curriculum", "learning"],
  },
  {
    id: "nav-practice",
    title: "Manual Practice",
    type: "page",
    href: "/practice/manual",
    icon: "Code",
    keywords: ["practice", "coding", "problems"],
  },
  {
    id: "nav-auto",
    title: "Auto Mode",
    type: "page",
    href: "/practice/auto",
    icon: "Lightning",
    keywords: ["auto", "rapid", "fast"],
  },
  {
    id: "nav-history",
    title: "History",
    type: "page",
    href: "/history",
    icon: "Clock",
    keywords: ["past", "sessions", "previous"],
  },
  {
    id: "nav-api",
    title: "API Usage",
    type: "page",
    href: "/insights/api-usage",
    icon: "Cpu",
    keywords: ["tokens", "gemini", "usage"],
  },
  {
    id: "nav-settings",
    title: "Settings",
    type: "page",
    href: "/support/settings",
    icon: "Gear",
    keywords: ["preferences", "config", "options"],
  },
  {
    id: "nav-help",
    title: "Help & Docs",
    type: "page",
    href: "/support/help",
    icon: "Question",
    keywords: ["documentation", "guide", "faq"],
  },
];

// ============================================
// STATIC DATA - Help Actions
// ============================================
const HELP_ACTIONS: SearchResult[] = [
  {
    id: "help-shortcuts",
    title: "Keyboard Shortcuts",
    subtitle: "View all keyboard shortcuts",
    type: "action",
    href: "/support/help#shortcuts",
    icon: "Keyboard",
    keywords: ["hotkeys", "keys", "bindings"],
  },
  {
    id: "help-bug",
    title: "Report a Bug",
    subtitle: "Submit an issue report",
    type: "action",
    href: "/support/bug-report",
    icon: "Bug",
    keywords: ["issue", "problem", "feedback"],
  },
  {
    id: "help-getting-started",
    title: "Getting Started",
    subtitle: "Learn how to use Pytrix",
    type: "action",
    href: "/support/help#getting-started",
    icon: "Rocket",
    keywords: ["tutorial", "intro", "beginner"],
  },
];

// ============================================
// Lazy-loaded caches for performance
// ============================================
let cachedModuleItems: SearchResult[] | null = null;
let cachedSubtopicItems: SearchResult[] | null = null;
let cachedArchetypeItems: SearchResult[] | null = null;

// ============================================
// GETTER FUNCTIONS
// ============================================

/**
 * Get all navigation pages (Go To group)
 */
export function getStaticPages(): SearchResult[] {
  return GO_TO_PAGES;
}

/**
 * Get help-related actions
 */
export function getHelpActions(): SearchResult[] {
  return HELP_ACTIONS;
}

/**
 * Get all module items (cached for performance)
 */
export function getModuleItems(): SearchResult[] {
  if (cachedModuleItems) return cachedModuleItems;

  cachedModuleItems = getAllModules().map((mod) => ({
    id: `mod-${mod.id}`,
    title: mod.name,
    subtitle: mod.overview?.slice(0, 60) + "..." || `Module ${mod.order}`,
    type: "module",
    href: `/modules?search=${encodeURIComponent(mod.name)}`,
    icon: "BookOpen",
    keywords: ["module", mod.name],
  }));

  return cachedModuleItems;
}

/**
 * Get all subtopic items (lazy-loaded, cached)
 */
export function getSubtopicItems(): SearchResult[] {
  if (cachedSubtopicItems) return cachedSubtopicItems;

  const modules = getAllModules();
  const results: SearchResult[] = [];

  modules.forEach((mod) => {
    mod.subtopics.forEach((sub) => {
      results.push({
        id: `sub-${mod.id}-${sub.id}`,
        title: sub.name,
        subtitle: mod.name,
        type: "subtopic",
        href: `/practice?mode=topic-select&topic=${encodeURIComponent(
          sub.name
        )}&module=${mod.id}&subtopic=${encodeURIComponent(
          sub.name
        )}&difficulty=beginner&problemType=${sub.problemTypes[0]?.id || ""}`,
        icon: "Hash",
        keywords: [sub.name, mod.name, sub.sectionNumber || ""],
      });
    });
  });

  cachedSubtopicItems = results;
  return cachedSubtopicItems;
}

/**
 * Get all archetype/problem type items (lazy-loaded, cached)
 */
export function getArchetypeItems(): SearchResult[] {
  if (cachedArchetypeItems) return cachedArchetypeItems;

  const modules = getAllModules();
  const results: SearchResult[] = [];

  modules.forEach((mod) => {
    mod.subtopics.forEach((sub) => {
      sub.problemTypes.forEach((pt) => {
        results.push({
          id: `pt-${mod.id}-${sub.id}-${pt.id}`,
          title: pt.name,
          subtitle: `${mod.name} › ${sub.name}`,
          type: "archetype",
          href: `/practice?mode=topic-select&topic=${encodeURIComponent(
            pt.name
          )}&module=${mod.id}&subtopic=${encodeURIComponent(
            sub.name
          )}&problemType=${pt.id}&difficulty=beginner`,
          icon: "Lightning",
          keywords: [pt.name, sub.name, mod.name, pt.description || ""],
          metadata: {
            moduleId: mod.id,
            subtopicId: sub.id,
            problemTypeId: pt.id,
          },
        });
      });
    });
  });

  cachedArchetypeItems = results;
  return cachedArchetypeItems;
}

// ============================================
// SEARCH FUNCTIONS
// ============================================

/**
 * Generic fuzzy search over items
 */
export function searchItems(
  items: SearchResult[],
  query: string
): SearchResult[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return items;

  return items.filter((item) => {
    if (item.title.toLowerCase().includes(lowerQuery)) return true;
    if (item.subtitle?.toLowerCase().includes(lowerQuery)) return true;
    if (item.keywords?.some((k) => k.toLowerCase().includes(lowerQuery)))
      return true;
    return false;
  });
}

/**
 * Search commands (pages + help actions)
 */
export function searchCommands(query: string): SearchResult[] {
  const allCommands = [...GO_TO_PAGES, ...HELP_ACTIONS];
  return searchItems(allCommands, query);
}

/**
 * Search modules only
 */
export function searchModules(query: string): SearchResult[] {
  return searchItems(getModuleItems(), query);
}

/**
 * Search subtopics only (lazy-loaded)
 */
export function searchSubtopics(query: string): SearchResult[] {
  if (!query.trim()) return [];
  return searchItems(getSubtopicItems(), query);
}

/**
 * Search archetypes/problem types only (lazy-loaded)
 */
export function searchArchetypes(query: string): SearchResult[] {
  if (!query.trim()) return [];
  return searchItems(getArchetypeItems(), query);
}

/**
 * Legacy support - get all search items
 */
export function getAllSearchItems(): SearchResult[] {
  return [
    ...getStaticPages(),
    ...getHelpActions(),
    ...getModuleItems(),
    ...getSubtopicItems(),
    ...getArchetypeItems(),
  ];
}
