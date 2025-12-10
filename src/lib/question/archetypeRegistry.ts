/**
 * Archetype Registry
 *
 * Provides stable archetype IDs and operation tags for question fingerprinting.
 * Uses problem type IDs from topics.json as the primary archetype identifier.
 */

import { getProblemTypeWithContext } from "@/lib/stores/topicsStore";

// ============================================================================
// Operation Tags
// ============================================================================

/**
 * Fixed set of operation tags for fingerprinting.
 * These represent the core algorithmic operations a problem may require.
 */
export type OperationTag =
  | "ITERATE"
  | "COUNT"
  | "TRANSFORM"
  | "VALIDATE"
  | "SEARCH"
  | "SORT"
  | "PARTITION"
  | "AGGREGATE"
  | "COMPARE"
  | "GENERATE";

/**
 * All available operation tags (for validation/iteration).
 */
export const ALL_OPERATION_TAGS: OperationTag[] = [
  "ITERATE",
  "COUNT",
  "TRANSFORM",
  "VALIDATE",
  "SEARCH",
  "SORT",
  "PARTITION",
  "AGGREGATE",
  "COMPARE",
  "GENERATE",
];

// ============================================================================
// Keyword to Operation Tag Mapping
// ============================================================================

/**
 * Maps keywords found in problem type names/descriptions to operation tags.
 * Multiple keywords can map to the same tag.
 */
const KEYWORD_TO_OPERATION: Record<string, OperationTag> = {
  // ITERATE
  traverse: "ITERATE",
  traversal: "ITERATE",
  iteration: "ITERATE",
  loop: "ITERATE",
  scan: "ITERATE",
  walk: "ITERATE",

  // COUNT
  count: "COUNT",
  frequency: "COUNT",
  occurrences: "COUNT",
  tally: "COUNT",
  histogram: "COUNT",

  // TRANSFORM
  transform: "TRANSFORM",
  convert: "TRANSFORM",
  encode: "TRANSFORM",
  decode: "TRANSFORM",
  compress: "TRANSFORM",
  decompress: "TRANSFORM",
  reverse: "TRANSFORM",
  rotate: "TRANSFORM",
  map: "TRANSFORM",

  // VALIDATE
  validate: "VALIDATE",
  valid: "VALIDATE",
  check: "VALIDATE",
  palindrome: "VALIDATE",
  balanced: "VALIDATE",
  match: "VALIDATE",
  verify: "VALIDATE",

  // SEARCH
  search: "SEARCH",
  find: "SEARCH",
  lookup: "SEARCH",
  binary: "SEARCH",
  locate: "SEARCH",
  index: "SEARCH",

  // SORT
  sort: "SORT",
  order: "SORT",
  arrange: "SORT",
  merge: "SORT",
  quick: "SORT",

  // PARTITION
  partition: "PARTITION",
  split: "PARTITION",
  divide: "PARTITION",
  segregate: "PARTITION",
  group: "PARTITION",

  // AGGREGATE
  sum: "AGGREGATE",
  max: "AGGREGATE",
  min: "AGGREGATE",
  average: "AGGREGATE",
  total: "AGGREGATE",
  product: "AGGREGATE",
  prefix: "AGGREGATE",
  cumulative: "AGGREGATE",

  // COMPARE
  compare: "COMPARE",
  anagram: "COMPARE",
  subsequence: "COMPARE",
  substring: "COMPARE",
  lcs: "COMPARE",
  diff: "COMPARE",

  // GENERATE
  generate: "GENERATE",
  permutation: "GENERATE",
  combination: "GENERATE",
  backtrack: "GENERATE",
  enumerate: "GENERATE",
  create: "GENERATE",
};

/**
 * Maps subtopic patterns to default operation tags.
 * Used when problem type keywords don't yield enough tags.
 */
const SUBTOPIC_DEFAULT_TAGS: Record<string, OperationTag[]> = {
  "two-pointer": ["ITERATE", "COMPARE"],
  "sliding-window": ["ITERATE", "AGGREGATE"],
  "binary-search": ["SEARCH"],
  sorting: ["SORT"],
  "prefix-sum": ["AGGREGATE"],
  recursion: ["GENERATE"],
  backtracking: ["GENERATE"],
  "dynamic-programming": ["AGGREGATE", "COMPARE"],
  tree: ["ITERATE", "SEARCH"],
  graph: ["ITERATE", "SEARCH"],
  hash: ["SEARCH", "COUNT"],
  dictionary: ["SEARCH", "COUNT"],
  string: ["TRANSFORM", "COMPARE"],
  array: ["ITERATE", "TRANSFORM"],
  matrix: ["ITERATE", "TRANSFORM"],
  interval: ["SORT", "PARTITION"],
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Gets the archetype ID for a problem type.
 * Uses the problem type ID directly as the archetype identifier.
 *
 * @param problemTypeId - The problem type ID from topics.json
 * @returns The archetype ID (same as problemTypeId)
 */
export function getArchetypeId(problemTypeId: string): string {
  return problemTypeId;
}

/**
 * Derives operation tags from problem type and subtopic.
 * Analyzes keywords in names and descriptions.
 *
 * @param problemTypeId - The problem type ID
 * @param subtopicId - Optional subtopic ID for additional context
 * @returns Array of 1-3 operation tags
 */
export function getOperationTags(
  problemTypeId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _subtopicId?: string
): OperationTag[] {
  const tags = new Set<OperationTag>();

  // Get problem type context
  const context = getProblemTypeWithContext(problemTypeId);

  if (context) {
    const { problemType, subtopic } = context;

    // Extract keywords from problem type name and description
    const textToAnalyze = [
      problemType.name.toLowerCase(),
      problemType.description?.toLowerCase() || "",
    ].join(" ");

    // Match keywords to operation tags
    for (const [keyword, tag] of Object.entries(KEYWORD_TO_OPERATION)) {
      if (textToAnalyze.includes(keyword)) {
        tags.add(tag);
      }
    }

    // Use subtopic defaults if not enough tags found
    if (tags.size < 1) {
      const subtopicKey = subtopic.id.toLowerCase();
      for (const [pattern, defaultTags] of Object.entries(
        SUBTOPIC_DEFAULT_TAGS
      )) {
        if (subtopicKey.includes(pattern)) {
          defaultTags.forEach((t) => tags.add(t));
          break;
        }
      }
    }
  }

  // Fallback: derive from problemTypeId itself
  if (tags.size === 0) {
    const idLower = problemTypeId.toLowerCase();
    for (const [keyword, tag] of Object.entries(KEYWORD_TO_OPERATION)) {
      if (idLower.includes(keyword)) {
        tags.add(tag);
      }
    }
  }

  // Default to ITERATE if nothing found
  if (tags.size === 0) {
    tags.add("ITERATE");
  }

  // Return at most 3 tags
  return Array.from(tags).slice(0, 3);
}

/**
 * Gets a compact string representation of operation tags.
 * Used for avoid-lists in prompts.
 *
 * @param tags - Array of operation tags
 * @returns Comma-separated string of tag abbreviations
 */
export function formatOperationTags(tags: OperationTag[]): string {
  return tags.join(",");
}

/**
 * Checks if two sets of operation tags overlap significantly.
 *
 * @param tags1 - First set of tags
 * @param tags2 - Second set of tags
 * @returns Overlap ratio (0-1)
 */
export function getTagOverlap(
  tags1: OperationTag[],
  tags2: OperationTag[]
): number {
  if (tags1.length === 0 || tags2.length === 0) return 0;

  const set1 = new Set(tags1);
  const overlap = tags2.filter((t) => set1.has(t)).length;
  const unionSize = new Set([...tags1, ...tags2]).size;

  return overlap / unionSize;
}
