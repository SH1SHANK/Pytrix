/**
 * AI Prompt Constants
 *
 * Centralized prompts for all AI interactions.
 * Makes it easier to iterate on prompts without touching logic.
 */

// ============================================
// QUESTION GENERATION
// ============================================

export function getQuestionGenerationPrompt(
  topic: string,
  difficulty: string
): string {
  return `
You are an expert Python programming tutor.
Generate a distinct, unique coding practice question for the topic "${topic}" at "${difficulty}" difficulty.

Return ONLY a raw JSON object with this exact schema (no markdown formatting):
{
  "id": "gen-${Date.now()}", 
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "title": "Short descriptive title",
  "description": "Clear problem statement. Use markdown for code formatting.",
  "inputDescription": "Description of input format",
  "outputDescription": "Description of output format",
  "constraints": ["Constraint 1", "Constraint 2"],
  "sampleInput": "Example input",
  "sampleOutput": "Example output",
  "starterCode": "def solve(input_data):\\n    pass",
  "referenceSolution": "Efficient Python solution code"
}

Ensure the question is solvable and the reference solution is correct.
`;
}

// ============================================
// CODE EVALUATION
// ============================================

export function getCodeEvaluationPrompt(
  title: string,
  description: string,
  constraints: string[],
  sampleInput: string,
  sampleOutput: string,
  code: string
): string {
  return `
You are a Python Code Evaluator.

Problem: ${title}
Description: ${description}
Constraints: ${constraints.join(", ")}
Sample Input: ${sampleInput}
Sample Output: ${sampleOutput}

User Code:
\`\`\`python
${code}
\`\`\`

Task:
1. Analyze the user's code logic.
2. Verify if it correctly solves the problem described.
3. Check for edge cases and constraints.
4. Simulate running the code against the Sample Input.

Return ONLY a raw JSON object with this schema:
{
  "status": "correct" | "incorrect" | "error",
  "explanation": "Concise feedback on what works or why it fails.",
  "expectedBehavior": "What the code should have done (if incorrect).",
  "nextHint": "A small nudge if incorrect (optional, null if correct)."
}
`;
}

// ============================================
// HINT GENERATION
// ============================================

export function getHintPrompt(
  title: string,
  description: string,
  code: string,
  level: number
): string {
  return `
You are a Python Tutor providing hints.
Problem: ${title}
Description: ${description}
User Code:
\`\`\`python
${code}
\`\`\`

The user is stuck. Provide a Hint Level ${level} (1 = gentle nudge, 2 = more specific but don't give the answer).

Return ONLY a raw JSON object:
{
  "hint": "The actual hint string.",
  "level": ${level}
}
`;
}

// ============================================
// SOLUTION REVEAL
// ============================================

export function getSolutionRevealPrompt(
  title: string,
  description: string
): string {
  return `
You are an expert Python coder.
Problem: ${title}
Description: ${description}

Provide the OPTIMAL Python reference solution.
Return ONLY the raw Python code (no markdown, no explanation).
`;
}
