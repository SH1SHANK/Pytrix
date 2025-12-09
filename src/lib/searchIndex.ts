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
}

// Static Page Navigation
const STATIC_PAGES: SearchResult[] = [
  {
    id: "nav-dashboard",
    title: "Dashboard",
    type: "page",
    href: "/dashboard",
    icon: "House",
  },
  {
    id: "nav-modules",
    title: "Modules",
    type: "page",
    href: "/modules",
    icon: "Books",
  },
  {
    id: "nav-practice",
    title: "Manual Practice",
    type: "page",
    href: "/practice/manual",
    icon: "Code",
  },
  {
    id: "nav-auto",
    title: "Auto Mode",
    type: "page",
    href: "/practice/auto",
    icon: "Lightning",
  },
  {
    id: "nav-history",
    title: "History",
    type: "page",
    href: "/history",
    icon: "Clock",
  },
  {
    id: "nav-stats",
    title: "Stats & Progress",
    type: "page",
    href: "/insights/stats",
    icon: "ChartLine",
  },
  {
    id: "nav-api",
    title: "API Usage",
    type: "page",
    href: "/insights/api-usage",
    icon: "Cpu",
  },
  {
    id: "nav-settings",
    title: "Settings",
    type: "page",
    href: "/support/settings",
    icon: "Gear",
  },
  {
    id: "nav-help",
    title: "Help & Docs",
    type: "page",
    href: "/support/help",
    icon: "Question",
  },
];

/**
 * flattens the curriculum into searchable items
 */
// Export raw lists for filtered access
export function getStaticPages(): SearchResult[] {
  return STATIC_PAGES;
}

export function getModuleItems(): SearchResult[] {
  return getAllModules().map((mod) => ({
    id: `mod-${mod.id}`,
    title: mod.name,
    subtitle: `Module ${mod.order}`,
    type: "module",
    href: `/modules?search=${encodeURIComponent(mod.name)}`,
    icon: "BookOpen",
    keywords: ["module", mod.name],
  }));
}

export function getSubtopicItems(): SearchResult[] {
  const modules = getAllModules();
  const results: SearchResult[] = [];
  modules.forEach((mod) => {
    mod.subtopics.forEach((sub) => {
      results.push({
        id: `sub-${sub.id}`,
        title: sub.name,
        subtitle: `${mod.name} › ${sub.name}`,
        type: "subtopic",
        href: `/practice?mode=topic-select&topic=${encodeURIComponent(
          sub.name
        )}&module=${mod.id}&subtopic=${encodeURIComponent(
          sub.name
        )}&difficulty=beginner&problemType=${sub.problemTypes[0]?.id || ""}`,
        icon: "Hash",
        keywords: [sub.name, mod.name],
      });
    });
  });
  return results;
}

export function getArchetypeItems(): SearchResult[] {
  const modules = getAllModules();
  const results: SearchResult[] = [];
  modules.forEach((mod) => {
    mod.subtopics.forEach((sub) => {
      sub.problemTypes.forEach((pt) => {
        results.push({
          id: `pt-${pt.id}`,
          title: pt.name,
          subtitle: `${mod.name} › ${sub.name} › ${pt.name}`,
          type: "archetype",
          href: `/practice?mode=topic-select&topic=${encodeURIComponent(
            pt.name
          )}&module=${mod.id}&subtopic=${encodeURIComponent(
            sub.name
          )}&problemType=${pt.id}&difficulty=beginner`,
          icon: "Lightning",
          keywords: [pt.name, sub.name, mod.name, pt.description || ""],
        });
      });
    });
  });
  return results;
}

/**
 * Searches items by query string (case-insensitive fuzzy matchish)
 */
export function searchItems(
  items: SearchResult[],
  query: string
): SearchResult[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return items;

  return items.filter((item) => {
    // Check title
    if (item.title.toLowerCase().includes(lowerQuery)) return true;
    // Check subtitle
    if (item.subtitle?.toLowerCase().includes(lowerQuery)) return true;
    // Check keywords
    if (item.keywords?.some((k) => k.toLowerCase().includes(lowerQuery)))
      return true;
    return false;
  });
}

/**
 * Legacy support if needed, but prefer specific getters
 */
export function getAllSearchItems(): SearchResult[] {
  return [
    ...getStaticPages(),
    ...getModuleItems(),
    ...getSubtopicItems(),
    ...getArchetypeItems(),
  ];
}
