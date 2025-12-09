/**
 * Topic Hierarchy Types
 *
 * Canonical hierarchy: Module → Subtopic → ProblemType
 * All IDs use kebab-case format for consistency.
 */

/**
 * Converts a display name to kebab-case ID.
 * Example: "Two-Pointer Techniques" → "two-pointer-techniques"
 */
export function toKebabCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/[&]/g, "and")
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Individual problem category within a subtopic.
 * Represents a specific type of problem or technique.
 */
export interface ProblemType {
  /** Kebab-case identifier, e.g. "two-sum-variations" */
  id: string;
  /** Display name, e.g. "Two Sum Variations" */
  name: string;
  /** Optional explanation or description */
  description?: string;
}

/**
 * A grouped section within a module.
 * Contains related problem types and concepts.
 */
export interface Subtopic {
  /** Kebab-case identifier, e.g. "frequency-counting" */
  id: string;
  /** Display name, e.g. "Frequency Counting" */
  name: string;
  /** Section number within module, e.g. "3.2" */
  sectionNumber?: string;
  /** Key concepts and techniques covered */
  concepts?: string[];
  /** Problem types within this subtopic */
  problemTypes: ProblemType[];
}

/**
 * Top-level DSA topic module.
 * There are 20 modules covering all major DSA areas.
 */
export interface Module {
  /** Kebab-case identifier, e.g. "string-manipulation" */
  id: string;
  /** Display name, e.g. "String Manipulation" */
  name: string;
  /** Section number (1-20) */
  order: number;
  /** Module overview/description */
  overview?: string;
  /** Subtopics within this module */
  subtopics: Subtopic[];
  /** Classic problems for this module */
  problemArchetypes: string[];
  /** Python-specific tips and considerations */
  pythonConsiderations?: string[];
}

/**
 * Root container for all topics data.
 * Includes metadata about the schema version and generation.
 */
export interface TopicsData {
  /** Schema version for compatibility checking */
  version: string;
  /** ISO timestamp of when this was generated */
  generatedAt: string;
  /** All modules in order */
  modules: Module[];
}

/**
 * Type guard to check if an object is a valid Module
 */
export function isValidModule(obj: unknown): obj is Module {
  if (typeof obj !== "object" || obj === null) return false;
  const m = obj as Record<string, unknown>;
  return (
    typeof m.id === "string" &&
    typeof m.name === "string" &&
    typeof m.order === "number" &&
    Array.isArray(m.subtopics) &&
    Array.isArray(m.problemArchetypes)
  );
}

/**
 * Validates that an ID is in proper kebab-case format
 */
export function isValidKebabCase(id: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id);
}
