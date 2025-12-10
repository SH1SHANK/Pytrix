/**
 * Archetype Registry Unit Tests
 *
 * Tests for the archetype and operation tag system:
 * - getArchetypeId
 * - getOperationTags
 * - formatOperationTags
 * - getTagOverlap
 */

import { describe, it, expect } from "vitest";
import {
  getArchetypeId,
  getOperationTags,
  formatOperationTags,
  getTagOverlap,
  ALL_OPERATION_TAGS,
  type OperationTag,
} from "@/lib/archetypeRegistry";
import { getAllModules } from "@/lib/topicsStore";

describe("archetypeRegistry", () => {
  describe("ALL_OPERATION_TAGS", () => {
    it("should contain all expected tags", () => {
      expect(ALL_OPERATION_TAGS).toContain("ITERATE");
      expect(ALL_OPERATION_TAGS).toContain("COUNT");
      expect(ALL_OPERATION_TAGS).toContain("TRANSFORM");
      expect(ALL_OPERATION_TAGS).toContain("VALIDATE");
      expect(ALL_OPERATION_TAGS).toContain("SEARCH");
      expect(ALL_OPERATION_TAGS).toContain("SORT");
      expect(ALL_OPERATION_TAGS).toContain("PARTITION");
      expect(ALL_OPERATION_TAGS).toContain("AGGREGATE");
      expect(ALL_OPERATION_TAGS).toContain("COMPARE");
      expect(ALL_OPERATION_TAGS).toContain("GENERATE");
    });

    it("should have exactly 10 tags", () => {
      expect(ALL_OPERATION_TAGS.length).toBe(10);
    });
  });

  describe("getArchetypeId", () => {
    it("should return the same string as input", () => {
      expect(getArchetypeId("binary-search")).toBe("binary-search");
      expect(getArchetypeId("string-reverse")).toBe("string-reverse");
      expect(getArchetypeId("two-sum")).toBe("two-sum");
    });
  });

  describe("getOperationTags", () => {
    it("should return array of operation tags", () => {
      const modules = getAllModules();
      const firstPT = modules[0].subtopics[0].problemTypes[0];

      const tags = getOperationTags(firstPT.id);

      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.length).toBeLessThanOrEqual(3);
    });

    it("should return valid operation tags", () => {
      const modules = getAllModules();
      const firstPT = modules[0].subtopics[0].problemTypes[0];

      const tags = getOperationTags(firstPT.id);

      tags.forEach((tag) => {
        expect(ALL_OPERATION_TAGS).toContain(tag);
      });
    });

    it("should derive tags from keyword matching", () => {
      // Test a problem type with 'sort' in the name
      const tags = getOperationTags("sort-array");
      expect(tags).toContain("SORT");
    });

    it("should derive tags from keyword matching - search", () => {
      const tags = getOperationTags("binary-search");
      expect(tags).toContain("SEARCH");
    });

    it("should derive tags from keyword matching - count", () => {
      const tags = getOperationTags("count-frequency");
      expect(tags).toContain("COUNT");
    });

    it("should derive tags from keyword matching - transform", () => {
      const tags = getOperationTags("reverse-string");
      expect(tags).toContain("TRANSFORM");
    });

    it("should default to ITERATE if no matches found", () => {
      const tags = getOperationTags("unknown-xyz-problem");
      expect(tags).toContain("ITERATE");
    });

    it("should accept optional subtopic parameter", () => {
      const tags = getOperationTags("some-problem", "some-subtopic");
      expect(Array.isArray(tags)).toBe(true);
    });
  });

  describe("formatOperationTags", () => {
    it("should join tags with commas", () => {
      const tags: OperationTag[] = ["ITERATE", "SEARCH", "SORT"];
      const formatted = formatOperationTags(tags);

      expect(formatted).toBe("ITERATE,SEARCH,SORT");
    });

    it("should handle single tag", () => {
      const tags: OperationTag[] = ["COUNT"];
      const formatted = formatOperationTags(tags);

      expect(formatted).toBe("COUNT");
    });

    it("should handle empty array", () => {
      const formatted = formatOperationTags([]);
      expect(formatted).toBe("");
    });
  });

  describe("getTagOverlap", () => {
    it("should return 1 for identical tag sets", () => {
      const tags: OperationTag[] = ["ITERATE", "SEARCH"];
      const overlap = getTagOverlap(tags, tags);

      expect(overlap).toBe(1);
    });

    it("should return 0 for completely different tag sets", () => {
      const tags1: OperationTag[] = ["ITERATE", "SEARCH"];
      const tags2: OperationTag[] = ["SORT", "PARTITION"];

      const overlap = getTagOverlap(tags1, tags2);

      expect(overlap).toBe(0);
    });

    it("should return partial overlap value", () => {
      const tags1: OperationTag[] = ["ITERATE", "SEARCH", "SORT"];
      const tags2: OperationTag[] = ["SEARCH", "COUNT"];

      const overlap = getTagOverlap(tags1, tags2);

      // 1 overlap (SEARCH) out of 4 unique tags
      expect(overlap).toBe(0.25);
    });

    it("should return 0 when either set is empty", () => {
      const tags: OperationTag[] = ["ITERATE"];

      expect(getTagOverlap([], tags)).toBe(0);
      expect(getTagOverlap(tags, [])).toBe(0);
      expect(getTagOverlap([], [])).toBe(0);
    });
  });
});
