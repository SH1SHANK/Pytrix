/**
 * Question Template Generator
 *
 * Deterministic generator that maps ProblemType + difficulty → QuestionTemplate.
 * This is local logic that produces templates without calling LLM.
 */

import {
  getProblemTypeWithContext,
  type ProblemType,
  type Module,
  type Subtopic,
} from "@/lib/stores/topicsStore";

import topicsData from "@/data/topics.json";

import {
  type QuestionTemplate,
  type Difficulty,
  type EdgeCase,
  type TestCaseTemplate,
  DIFFICULTY_CONFIGS,
} from "@/types/question";

// ============================================================================
// Template Patterns by Problem Category
// ============================================================================

/**
 * Problem category patterns for generating templates.
 * Maps problem type keywords to specific template structures.
 */
interface TemplatePattern {
  titlePattern: string;
  promptPattern: string;
  sampleInputPattern: string;
  sampleOutputPattern: string;
  edgeCasePatterns: string[];
  constraintPatterns: string[];
  hintPatterns: string[];
  starterCodePattern: string;
  tags: string[];
}

/**
 * Default patterns categorized by common problem types
 */
const CATEGORY_PATTERNS: Record<string, Partial<TemplatePattern>> = {
  // String operations
  string: {
    titlePattern: "{action} String {target}",
    promptPattern:
      "Given a string `s`, {action} it according to the following rules:\n\n{description}\n\nReturn the resulting string.",
    sampleInputPattern: 's = "{sample}"',
    edgeCasePatterns: [
      "Empty string",
      "Single character",
      "All same characters",
      "Mixed case",
    ],
    constraintPatterns: [
      "1 <= len(s) <= {maxSize}",
      "s contains only lowercase/uppercase English letters",
    ],
    hintPatterns: [
      "Consider using Python's string methods",
      "Think about edge cases with empty strings",
      "Can you solve it in a single pass?",
    ],
    starterCodePattern:
      'def solution(s: str) -> str:\n    """{docstring}"""\n    # Your code here\n    pass',
    tags: ["string", "manipulation"],
  },

  // Array/List operations
  array: {
    titlePattern: "{action} in Array",
    promptPattern:
      "Given an array of integers `nums`, {action}.\n\n{description}\n\nReturn the result.",
    sampleInputPattern: "nums = [{sample}]",
    edgeCasePatterns: [
      "Empty array",
      "Single element",
      "All same elements",
      "Sorted array",
      "Reverse sorted",
    ],
    constraintPatterns: [
      "1 <= len(nums) <= {maxSize}",
      "-10^9 <= nums[i] <= 10^9",
    ],
    hintPatterns: [
      "Consider the time complexity of your approach",
      "Can you use extra space to optimize?",
      "Think about sorting first",
    ],
    starterCodePattern:
      'def solution(nums: list[int]) -> int:\n    """{docstring}"""\n    # Your code here\n    pass',
    tags: ["array", "list"],
  },

  // Two pointer techniques
  "two-pointer": {
    titlePattern: "Two Pointer {target}",
    promptPattern:
      "Given {input_description}, use the two-pointer technique to {action}.\n\n{description}",
    edgeCasePatterns: [
      "Pointers meet in middle",
      "All elements satisfy condition",
      "No elements satisfy condition",
    ],
    constraintPatterns: ["1 <= len(arr) <= {maxSize}", "Array is sorted"],
    hintPatterns: [
      "Start with pointers at opposite ends",
      "Consider when to move each pointer",
      "What invariant should the pointers maintain?",
    ],
    starterCodePattern:
      'def solution(arr: list[int], target: int) -> list[int]:\n    """{docstring}"""\n    left, right = 0, len(arr) - 1\n    # Your code here\n    pass',
    tags: ["two-pointer", "array"],
  },

  // Sliding window
  "sliding-window": {
    titlePattern: "Sliding Window {target}",
    promptPattern:
      "Given {input_description}, use the sliding window technique to find {target}.\n\n{description}",
    edgeCasePatterns: [
      "Window size equals array length",
      "Window size is 1",
      "All elements are the same",
    ],
    constraintPatterns: ["1 <= len(arr) <= {maxSize}", "1 <= k <= len(arr)"],
    hintPatterns: [
      "Maintain a window of fixed or variable size",
      "What information do you need to track in the window?",
      "How do you update when the window slides?",
    ],
    starterCodePattern:
      'def solution(arr: list[int], k: int) -> int:\n    """{docstring}"""\n    # Your code here\n    pass',
    tags: ["sliding-window", "array"],
  },

  // Hash map / Dictionary
  hash: {
    titlePattern: "{action} using Hash Map",
    promptPattern:
      "Given {input_description}, use a hash map (dictionary) to {action}.\n\n{description}",
    edgeCasePatterns: [
      "Empty input",
      "All unique elements",
      "All duplicate elements",
      "Key not found",
    ],
    constraintPatterns: [
      "1 <= len(arr) <= {maxSize}",
      "Elements can be negative",
    ],
    hintPatterns: [
      "Use a dictionary to store counts or indices",
      "What should be the key and value?",
      "Consider the expected time complexity",
    ],
    starterCodePattern:
      'def solution(arr: list[int]) -> int:\n    """{docstring}"""\n    seen = {}\n    # Your code here\n    pass',
    tags: ["hash-map", "dictionary"],
  },

  // Binary search
  "binary-search": {
    titlePattern: "Binary Search {target}",
    promptPattern:
      "Given a sorted array `nums` and a target value, {action}.\n\n{description}\n\nYou must write an algorithm with O(log n) runtime complexity.",
    edgeCasePatterns: [
      "Target at start",
      "Target at end",
      "Target not in array",
      "Single element array",
      "Duplicate elements",
    ],
    constraintPatterns: [
      "1 <= len(nums) <= {maxSize}",
      "nums is sorted in ascending order",
    ],
    hintPatterns: [
      "Use binary search to achieve O(log n)",
      "Be careful with the mid calculation to avoid overflow",
      "Consider the loop termination condition",
    ],
    starterCodePattern:
      'def solution(nums: list[int], target: int) -> int:\n    """{docstring}"""\n    left, right = 0, len(nums) - 1\n    # Your code here\n    pass',
    tags: ["binary-search", "search"],
  },

  // Dynamic programming
  dp: {
    titlePattern: "{target} (DP)",
    promptPattern:
      "Given {input_description}, find the {target} using dynamic programming.\n\n{description}",
    edgeCasePatterns: [
      "Base case (n=0 or n=1)",
      "Maximum constraints",
      "All elements same",
    ],
    constraintPatterns: ["1 <= n <= {maxSize}", "Values are non-negative"],
    hintPatterns: [
      "Define the state: what does dp[i] represent?",
      "Write the recurrence relation",
      "Can you optimize space complexity?",
    ],
    starterCodePattern:
      'def solution(n: int) -> int:\n    """{docstring}"""\n    # dp[i] represents ...\n    dp = [0] * (n + 1)\n    # Your code here\n    pass',
    tags: ["dynamic-programming", "dp"],
  },

  // Tree traversal
  tree: {
    titlePattern: "{action} Binary Tree",
    promptPattern:
      "Given the root of a binary tree, {action}.\n\n{description}",
    edgeCasePatterns: [
      "Empty tree (None)",
      "Single node",
      "Left-skewed tree",
      "Right-skewed tree",
      "Perfect binary tree",
    ],
    constraintPatterns: [
      "Number of nodes: 0 <= n <= {maxSize}",
      "Node values: -1000 <= val <= 1000",
    ],
    hintPatterns: [
      "Consider recursive vs iterative approach",
      "What traversal order is most suitable?",
      "Think about the base case carefully",
    ],
    starterCodePattern:
      'class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef solution(root: TreeNode | None) -> int:\n    """{docstring}"""\n    # Your code here\n    pass',
    tags: ["tree", "binary-tree"],
  },

  // Graph traversal
  graph: {
    titlePattern: "{action} in Graph",
    promptPattern:
      "Given a graph represented as {representation}, {action}.\n\n{description}",
    edgeCasePatterns: [
      "Empty graph",
      "Single node",
      "Disconnected components",
      "Cycle present",
    ],
    constraintPatterns: [
      "1 <= n <= {maxSize}",
      "0 <= edges.length <= n * (n - 1) / 2",
    ],
    hintPatterns: [
      "Consider BFS vs DFS for this problem",
      "How will you track visited nodes?",
      "What data structure represents the graph best?",
    ],
    starterCodePattern:
      'def solution(n: int, edges: list[list[int]]) -> int:\n    """{docstring}"""\n    # Build adjacency list\n    graph = [[] for _ in range(n)]\n    for u, v in edges:\n        graph[u].append(v)\n        graph[v].append(u)\n    # Your code here\n    pass',
    tags: ["graph", "traversal"],
  },

  // Recursion / Backtracking
  recursion: {
    titlePattern: "{action} ({technique})",
    promptPattern:
      "Given {input_description}, use {technique} to {action}.\n\n{description}",
    edgeCasePatterns: [
      "Base case",
      "Maximum recursion depth",
      "No valid solution",
      "Multiple valid solutions",
    ],
    constraintPatterns: ["1 <= n <= {maxSize}", "Solution exists"],
    hintPatterns: [
      "Define the base case clearly",
      "What choices do you have at each step?",
      "How do you backtrack when a path doesn't work?",
    ],
    starterCodePattern:
      'def solution(n: int) -> list[list[int]]:\n    """{docstring}"""\n    result = []\n    \n    def backtrack(path):\n        # Base case\n        if len(path) == n:\n            result.append(path[:])\n            return\n        # Recursive case\n        # Your code here\n        pass\n    \n    backtrack([])\n    return result',
    tags: ["recursion", "backtracking"],
  },

  // Default pattern
  default: {
    titlePattern: "{problemName}",
    promptPattern:
      "Solve the following problem:\n\n{description}\n\nImplement the solution function.",
    sampleInputPattern: "input = {sample}",
    edgeCasePatterns: ["Empty input", "Single element", "Maximum constraints"],
    constraintPatterns: ["Input size: 1 <= n <= {maxSize}"],
    hintPatterns: [
      "Read the problem carefully",
      "Consider edge cases",
      "Think about time and space complexity",
    ],
    starterCodePattern:
      'def solution(input):\n    """{docstring}"""\n    # Your code here\n    pass',
    tags: [],
  },
};

// ============================================================================
// Template Generation Functions
// ============================================================================

/**
 * Determines the category pattern to use based on problem type
 */
function getCategoryPattern(
  problemType: ProblemType,
  subtopic: Subtopic,
  mod: Module
): Partial<TemplatePattern> {
  const id = problemType.id.toLowerCase();
  const subtopicId = subtopic.id.toLowerCase();
  const moduleId = mod.id.toLowerCase();

  // Check for specific patterns
  if (id.includes("two-pointer") || subtopicId.includes("two-pointer")) {
    return CATEGORY_PATTERNS["two-pointer"];
  }
  if (id.includes("sliding-window") || subtopicId.includes("sliding-window")) {
    return CATEGORY_PATTERNS["sliding-window"];
  }
  if (id.includes("binary-search") || moduleId.includes("binary-search")) {
    return CATEGORY_PATTERNS["binary-search"];
  }
  if (moduleId.includes("dynamic-programming") || id.includes("dp")) {
    return CATEGORY_PATTERNS["dp"];
  }
  if (moduleId.includes("tree") || id.includes("tree")) {
    return CATEGORY_PATTERNS["tree"];
  }
  if (moduleId.includes("graph") || id.includes("graph")) {
    return CATEGORY_PATTERNS["graph"];
  }
  if (moduleId.includes("recursion") || moduleId.includes("backtracking")) {
    return CATEGORY_PATTERNS["recursion"];
  }
  if (moduleId.includes("hash") || moduleId.includes("dictionar")) {
    return CATEGORY_PATTERNS["hash"];
  }
  if (moduleId.includes("string")) {
    return CATEGORY_PATTERNS["string"];
  }
  if (moduleId.includes("array") || moduleId.includes("list")) {
    return CATEGORY_PATTERNS["array"];
  }

  return CATEGORY_PATTERNS["default"];
}

/**
 * Generates sample inputs based on difficulty
 */
function generateSampleInputs(
  difficulty: Difficulty,
  pattern: Partial<TemplatePattern>
): string[] {
  // Note: DIFFICULTY_CONFIGS[difficulty] could be used for dynamic sample generation
  // based on inputSizeRange for more difficulty-appropriate samples

  // Generate sample based on size range
  if (pattern === CATEGORY_PATTERNS["string"]) {
    return [`s = "hello"`, `s = "abcba"`, `s = ""`];
  }
  if (pattern === CATEGORY_PATTERNS["array"]) {
    if (difficulty === "beginner") {
      return [`nums = [1, 2, 3]`, `nums = [5]`, `nums = []`];
    } else if (difficulty === "intermediate") {
      return [
        `nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`,
        `nums = [-1, 0, 1, 2, -1, -4]`,
      ];
    } else {
      return [
        `nums = [${Array.from({ length: 20 }, () =>
          Math.floor(Math.random() * 100)
        ).join(", ")}]`,
      ];
    }
  }

  return [`input = [1, 2, 3]`];
}

/**
 * Generates sample outputs
 */
function generateSampleOutputs(
  difficulty: Difficulty,
  pattern: Partial<TemplatePattern>
): string[] {
  if (pattern === CATEGORY_PATTERNS["string"]) {
    return [`"olleh"`, `"abcba"`, `""`];
  }
  if (pattern === CATEGORY_PATTERNS["array"]) {
    return [`6`, `[[-1, -1, 2], [-1, 0, 1]]`];
  }
  return [`result`];
}

/**
 * Generates edge cases based on pattern and difficulty
 */
function generateEdgeCases(
  difficulty: Difficulty,
  pattern: Partial<TemplatePattern>
): EdgeCase[] {
  const edgeCaseDescriptions = pattern.edgeCasePatterns || ["Empty input"];
  const count =
    difficulty === "beginner" ? 2 : difficulty === "intermediate" ? 3 : 4;

  return edgeCaseDescriptions.slice(0, count).map((desc, i) => ({
    description: desc,
    input: `edge_case_${i + 1}`,
    expectedOutput: `expected_${i + 1}`,
  }));
}

/**
 * Generates constraints based on difficulty
 */
function generateConstraints(
  difficulty: Difficulty,
  pattern: Partial<TemplatePattern>
): string[] {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const [, maxSize] = config.inputSizeRange;

  const constraints = (pattern.constraintPatterns || []).map((c) =>
    c.replace("{maxSize}", String(maxSize))
  );

  // Add time complexity constraint for harder difficulties
  if (difficulty === "intermediate") {
    constraints.push("Expected time complexity: O(n log n) or better");
  } else if (difficulty === "advanced") {
    constraints.push("Expected time complexity: O(n) or O(n log n)");
    constraints.push("Expected space complexity: O(1) or O(n)");
  }

  return constraints;
}

/**
 * Generates hints based on difficulty
 */
function generateHints(
  difficulty: Difficulty,
  pattern: Partial<TemplatePattern>
): string[] {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const hints = pattern.hintPatterns || [];
  return hints.slice(0, config.hintsCount);
}

/**
 * Generates test cases with proper IDs and descriptions
 */
function generateTestCases(
  difficulty: Difficulty,
  sampleInputs: string[],
  sampleOutputs: string[]
): TestCaseTemplate[] {
  const testCases: TestCaseTemplate[] = [];

  // Ensure we have at least 3 visible test cases
  const visibleInputs = sampleInputs.slice(0, 3);
  const visibleOutputs = sampleOutputs.slice(0, 3);

  // Pad with placeholder if needed
  while (visibleInputs.length < 3) {
    visibleInputs.push(sampleInputs[0] || "input = []");
    visibleOutputs.push(sampleOutputs[0] || "expected");
  }

  // Test case descriptions based on position
  const descriptions = ["Basic case", "Edge case", "Tricky case"];

  // Visible test cases from samples
  visibleInputs.forEach((input, i) => {
    testCases.push({
      input,
      expectedOutput: visibleOutputs[i] || "expected",
      isHidden: false,
      description: descriptions[i] || `Test case ${i + 1}`,
    });
  });

  // Hidden test cases based on difficulty
  const hiddenCount =
    difficulty === "beginner" ? 2 : difficulty === "intermediate" ? 4 : 6;
  for (let i = 0; i < hiddenCount; i++) {
    testCases.push({
      input: `hidden_input_${i + 1}`,
      expectedOutput: `hidden_expected_${i + 1}`,
      isHidden: true,
      description: `Hidden test case ${i + 1}`,
    });
  }

  return testCases;
}

/**
 * Generates a unique template ID
 */
function generateTemplateId(
  problemTypeId: string,
  difficulty: Difficulty
): string {
  return `${problemTypeId}-${difficulty}-${Date.now().toString(36)}`;
}

/**
 * Generates a title for the question
 */
function generateTitle(
  problemType: ProblemType,
  difficulty: Difficulty
): string {
  const difficultyPrefix =
    difficulty === "beginner"
      ? "Easy"
      : difficulty === "intermediate"
      ? "Medium"
      : "Hard";

  // Use problem type name as base
  const title = problemType.name;

  // Add difficulty indicator
  return `[${difficultyPrefix}] ${title}`;
}

/**
 * Generates the prompt template
 */
function generatePromptTemplate(
  problemType: ProblemType,
  difficulty: Difficulty,
  pattern: Partial<TemplatePattern>
): string {
  const description =
    problemType.description || `Implement ${problemType.name}`;
  const basePrompt =
    pattern.promptPattern || CATEGORY_PATTERNS["default"].promptPattern!;

  return basePrompt
    .replace("{action}", problemType.name.toLowerCase())
    .replace("{description}", description)
    .replace("{target}", problemType.name)
    .replace("{input_description}", "an input")
    .replace("{technique}", "the appropriate technique")
    .replace("{representation}", "an adjacency list")
    .replace("{problemName}", problemType.name);
}

/**
 * Generates starter code
 */
function generateStarterCode(
  problemType: ProblemType,
  pattern: Partial<TemplatePattern>
): string {
  const starterCode =
    pattern.starterCodePattern ||
    CATEGORY_PATTERNS["default"].starterCodePattern!;
  const docstring = `Solve: ${problemType.name}`;

  return starterCode.replace("{docstring}", docstring);
}

// ============================================================================
// Main Generator Function
// ============================================================================

/**
 * Generates a question template from a problem type ID and difficulty.
 * This is deterministic local logic - no LLM calls.
 *
 * @param problemTypeId - The ID of the problem type from topics.json
 * @param difficulty - The difficulty level (beginner, intermediate, advanced)
 * @returns QuestionTemplate or undefined if problem type not found
 */
export function generateTemplate(
  problemTypeId: string,
  difficulty: Difficulty
): QuestionTemplate | undefined {
  // Get problem type with context
  const context = getProblemTypeWithContext(problemTypeId);
  if (!context) {
    console.warn(`Problem type not found: ${problemTypeId}`);
    return undefined;
  }

  const { problemType, subtopic, module: mod } = context;

  // Get appropriate pattern
  const pattern = getCategoryPattern(problemType, subtopic, mod);

  // Generate all components
  const sampleInputs = generateSampleInputs(difficulty, pattern);
  const sampleOutputs = generateSampleOutputs(difficulty, pattern);
  const title = generateTitle(problemType, difficulty);
  const promptTemplate = generatePromptTemplate(
    problemType,
    difficulty,
    pattern
  );
  const constraints = generateConstraints(difficulty, pattern);

  // Minimal prompt for LLM
  const compactPrompt = `Task: Create a Python practice problem.
Type: ${problemType.name}
Difficulty: ${difficulty}
Constraints: ${constraints.join(", ")}
Context: ${promptTemplate}`;

  const template: QuestionTemplate = {
    id: generateTemplateId(problemTypeId, difficulty),
    problemTypeId: problemType.id,
    problemTypeName: problemType.name,
    moduleId: mod.id,
    moduleName: mod.name,
    subtopicId: subtopic.id,
    subtopicName: subtopic.name,
    difficulty,
    title,
    promptTemplate,
    compactPrompt,
    sampleInputs,
    sampleOutputs,
    edgeCases: generateEdgeCases(difficulty, pattern),
    constraints,
    hints: generateHints(difficulty, pattern),
    tags: [...(pattern.tags || []), mod.id, subtopic.id, difficulty],
    estimatedMinutes: DIFFICULTY_CONFIGS[difficulty].estimatedMinutes,
    starterCode: generateStarterCode(problemType, pattern),
    testCases: generateTestCases(difficulty, sampleInputs, sampleOutputs),
  };

  return template;
}

/**
 * Generates templates for all difficulties of a problem type
 */
export function generateAllDifficultyTemplates(
  problemTypeId: string
): QuestionTemplate[] {
  const difficulties: Difficulty[] = ["beginner", "intermediate", "advanced"];
  const templates: QuestionTemplate[] = [];

  for (const difficulty of difficulties) {
    const template = generateTemplate(problemTypeId, difficulty);
    if (template) {
      templates.push(template);
    }
  }

  return templates;
}

/**
 * Gets a list of all available problem type IDs that can be used for generation
 */
export function getAvailableProblemTypeIds(): string[] {
  // Import at top-level to avoid require()
  const modules = getAllModulesInternal();
  const ids: string[] = [];

  for (const mod of modules) {
    for (const subtopic of mod.subtopics) {
      for (const pt of subtopic.problemTypes) {
        ids.push(pt.id);
      }
    }
  }

  return ids;
}

// Helper to get all modules without circular import issues
function getAllModulesInternal(): Module[] {
  // Use statically imported topicsData
  return (topicsData as { modules: Module[] }).modules;
}

// Re-export types for convenience
export type {
  QuestionTemplate,
  Difficulty,
  EdgeCase,
  TestCaseTemplate,
} from "@/types/question";
