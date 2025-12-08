import { Question, DifficultyLevel } from "./types";

// Base topic type without per-difficulty stats (stats are derived at runtime)
export interface BaseTopic {
  id: string;
  name: string;
  problemsSolved: number;
}

export const TOPICS: BaseTopic[] = [
  { id: "strings", name: "Strings", problemsSolved: 0 },
  { id: "lists", name: "Lists", problemsSolved: 0 },
  { id: "tuples", name: "Tuples", problemsSolved: 0 },
  { id: "sets", name: "Sets", problemsSolved: 0 },
  { id: "dictionaries", name: "Dictionaries", problemsSolved: 0 },
  { id: "functions", name: "Functions", problemsSolved: 0 },
  { id: "errors", name: "Errors & Exceptions", problemsSolved: 0 },
  { id: "oop", name: "OOP", problemsSolved: 0 },
  { id: "classes", name: "Classes & Objects", problemsSolved: 0 },
  { id: "modules", name: "Modules & Imports", problemsSolved: 0 },
  { id: "files", name: "File Handling", problemsSolved: 0 },
  { id: "pandas", name: "Pandas (Intro)", problemsSolved: 0 },
];

export const MOCK_QUESTIONS: Question[] = [
  // --- STRINGS ---
  {
    id: "str-1",
    topicId: "strings",
    topicName: "Strings",
    topic: "Strings",
    difficulty: "beginner",
    title: "Reverse a String",
    description:
      "Write a function that takes a string `s` and returns it reversed.",
    inputDescription: "A single string s.",
    outputDescription: "The reversed string.",
    constraints: ["1 <= len(s) <= 1000"],
    sampleInput: "hello",
    sampleOutput: "olleh",
    starterCode: "def solve(s):\n    # Write your code here\n    pass",
    referenceSolution: "def solve(s):\n    return s[::-1]",
    testCases: [
      { input: "'hello'", expectedOutput: "'olleh'" },
      { input: "'Python'", expectedOutput: "'nohtyP'" },
    ],
  },
  {
    id: "str-2",
    topicId: "strings",
    topicName: "Strings",
    topic: "Strings",
    difficulty: "beginner",
    title: "Check Palindrome",
    description:
      "Check if the given string is a palindrome (reads same forwards and backwards).",
    inputDescription: "A single string s.",
    outputDescription: "True if palindrome, False otherwise.",
    constraints: ["Case sensitive"],
    sampleInput: "racecar",
    sampleOutput: "True",
    starterCode: "def solve(s):\n    pass",
    referenceSolution: "def solve(s):\n    return s == s[::-1]",
    testCases: [
      { input: "'racecar'", expectedOutput: "True" },
      { input: "'hello'", expectedOutput: "False" },
    ],
  },
  // --- LISTS ---
  {
    id: "lst-1",
    topicId: "lists",
    topicName: "Lists",
    topic: "Lists",
    difficulty: "beginner",
    title: "Sum of Elements",
    description: "Given a list of numbers, return their sum.",
    inputDescription: "A list of integers.",
    outputDescription: "An integer representing the sum.",
    constraints: ["List length <= 1000"],
    sampleInput: "[1, 2, 3]",
    sampleOutput: "6",
    starterCode: "def solve(nums):\n    pass",
    referenceSolution: "def solve(nums):\n    return sum(nums)",
    testCases: [
      { input: "[1, 2, 3]", expectedOutput: "6" },
      { input: "[10, -5, 5]", expectedOutput: "10" },
    ],
  },
  {
    id: "lst-2",
    topicId: "lists",
    topicName: "Lists",
    topic: "Lists",
    difficulty: "intermediate",
    title: "Filter Evens",
    description:
      "Return a new list containing only the even numbers from the original list.",
    inputDescription: "A list of integers.",
    outputDescription: "A list of even integers.",
    constraints: [],
    sampleInput: "[1, 2, 3, 4]",
    sampleOutput: "[2, 4]",
    starterCode: "def solve(nums):\n    pass",
    referenceSolution:
      "def solve(nums):\n    return [x for x in nums if x % 2 == 0]",
    testCases: [
      { input: "[1, 2, 3, 4]", expectedOutput: "[2, 4]" },
      { input: "[1, 3, 5]", expectedOutput: "[]" },
    ],
  },
  // --- DICTIONARIES ---
  {
    id: "dict-1",
    topicId: "dictionaries",
    topicName: "Dictionaries",
    topic: "Dictionaries",
    difficulty: "beginner",
    title: "Word Frequency",
    description: "Count the frequency of each word in a list.",
    inputDescription: "A list of strings.",
    outputDescription:
      "A dictionary where keys are words and values are counts.",
    constraints: ["Words are case-sensitive"],
    sampleInput: "['apple', 'banana', 'apple']",
    sampleOutput: "{'apple': 2, 'banana': 1}",
    starterCode: "def solve(words):\n    pass",
    referenceSolution:
      "def solve(words):\n    d = {}\n    for w in words:\n        d[w] = d.get(w, 0) + 1\n    return d",
    testCases: [
      { input: "['a', 'b', 'a']", expectedOutput: "{'a': 2, 'b': 1}" },
    ],
  },
  // --- OOP ---
  {
    id: "oop-1",
    topicId: "oop",
    topicName: "OOP",
    topic: "OOP",
    difficulty: "intermediate",
    title: "Car Class",
    description:
      "Create a class `Car` with a method `drive` that returns 'Vroom'.",
    inputDescription: "Class usage.",
    outputDescription: "Return string 'Vroom' when drive() is called.",
    constraints: [],
    sampleInput: "c = Car(); c.drive()",
    sampleOutput: "Vroom",
    starterCode: "class Car:\n    pass",
    referenceSolution:
      "class Car:\n    def drive(self):\n        return 'Vroom'",
    testCases: [{ input: "Car().drive()", expectedOutput: "'Vroom'" }],
  },
  // --- PANDAS ---
  {
    id: "pandas-1",
    topicId: "pandas",
    topicName: "Pandas",
    topic: "Pandas",
    difficulty: "beginner",
    title: "Create Series",
    description: "Create a pandas Series from a list `[10, 20, 30]`.",
    inputDescription: "None",
    outputDescription: "A pandas Series.",
    constraints: [],
    sampleInput: "No input",
    sampleOutput: "0    10\n1    20\n2    30\ndtype: int64",
    starterCode: "import pandas as pd\n\ndef solve():\n    pass",
    referenceSolution:
      "import pandas as pd\ndef solve():\n    return pd.Series([10, 20, 30])",
    testCases: [],
  },
];
