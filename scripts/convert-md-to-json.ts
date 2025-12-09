/**
 * Markdown to JSON Converter for Topics
 *
 * Parses src/data/topics.md and generates src/data/topics.json
 * following the Module → Subtopic → ProblemType hierarchy.
 *
 * Usage: npx tsx scripts/convert-md-to-json.ts
 */

import * as fs from "fs";
import * as path from "path";

// Types (inline to avoid import issues during script execution)
interface ProblemType {
  id: string;
  name: string;
  description?: string;
}

interface Subtopic {
  id: string;
  name: string;
  sectionNumber?: string;
  concepts?: string[];
  problemTypes: ProblemType[];
}

interface Module {
  id: string;
  name: string;
  order: number;
  overview?: string;
  subtopics: Subtopic[];
  problemArchetypes: string[];
  pythonConsiderations?: string[];
}

interface TopicsData {
  version: string;
  generatedAt: string;
  modules: Module[];
}

/**
 * Converts a display name to kebab-case ID
 */
function toKebabCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/[&]/g, "and")
    .replace(/[()\\*]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Extracts text content from markdown formatting
 */
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, "") // Remove bold
    .replace(/`[^`]+`/g, (match) => match.slice(1, -1)) // Remove inline code but keep content
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Extract link text
    .trim();
}

/**
 * Parses a bullet point line and extracts the main item and description
 */
function parseBulletItem(line: string): { name: string; description?: string } {
  const content = line.replace(/^[-*]\s*/, "").trim();
  const colonIndex = content.indexOf(":");
  if (colonIndex > 0 && colonIndex < 60) {
    const name = cleanMarkdown(content.slice(0, colonIndex));
    const description = cleanMarkdown(content.slice(colonIndex + 1));
    return { name, description: description || undefined };
  }
  return { name: cleanMarkdown(content) };
}

/**
 * Main parser for topics.md
 */
function parseTopicsMarkdown(content: string): TopicsData {
  const lines = content.split("\n");
  const modules: Module[] = [];

  let currentModule: Module | null = null;
  let currentSubtopic: Subtopic | null = null;
  let inProblemArchetypes = false;
  let inPythonConsiderations = false;
  let inOverview = false;
  let overviewLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Module header: ## 1. String Manipulation
    const moduleMatch = trimmed.match(/^##\s+(\d+)\.\s+(.+)$/);
    if (moduleMatch) {
      // Save previous module
      if (currentModule) {
        if (currentSubtopic) {
          currentModule.subtopics.push(currentSubtopic);
          currentSubtopic = null;
        }
        modules.push(currentModule);
      }

      const order = parseInt(moduleMatch[1], 10);
      const name = cleanMarkdown(moduleMatch[2]);

      currentModule = {
        id: toKebabCase(name),
        name,
        order,
        subtopics: [],
        problemArchetypes: [],
      };
      inProblemArchetypes = false;
      inPythonConsiderations = false;
      inOverview = false;
      overviewLines = [];
      continue;
    }

    // Skip if no current module
    if (!currentModule) continue;

    // Section headers
    if (trimmed.startsWith("### ")) {
      // Save current subtopic to module
      if (currentSubtopic) {
        currentModule.subtopics.push(currentSubtopic);
        currentSubtopic = null;
      }

      const sectionName = trimmed.slice(4).trim();

      if (sectionName === "Overview") {
        inOverview = true;
        inProblemArchetypes = false;
        inPythonConsiderations = false;
      } else if (sectionName === "Problem Archetypes") {
        inProblemArchetypes = true;
        inPythonConsiderations = false;
        inOverview = false;
        if (overviewLines.length > 0) {
          currentModule.overview = overviewLines.join(" ").trim();
          overviewLines = [];
        }
      } else if (
        sectionName === "Python-Specific Considerations" ||
        sectionName.includes("Python")
      ) {
        inPythonConsiderations = true;
        inProblemArchetypes = false;
        inOverview = false;
        currentModule.pythonConsiderations = [];
      } else if (sectionName === "Sub-topics") {
        inOverview = false;
        inProblemArchetypes = false;
        inPythonConsiderations = false;
        if (overviewLines.length > 0) {
          currentModule.overview = overviewLines.join(" ").trim();
          overviewLines = [];
        }
      }
      continue;
    }

    // Overview content (paragraph after ### Overview)
    if (inOverview && trimmed && !trimmed.startsWith("#")) {
      overviewLines.push(trimmed);
      continue;
    }

    // Subtopic header: #### 1.1 Basic String Operations
    const subtopicMatch = trimmed.match(/^####\s+(\d+\.\d+)\s+(.+)$/);
    if (subtopicMatch) {
      // Save previous subtopic
      if (currentSubtopic) {
        currentModule.subtopics.push(currentSubtopic);
      }

      const sectionNumber = subtopicMatch[1];
      const name = cleanMarkdown(subtopicMatch[2]);

      currentSubtopic = {
        id: toKebabCase(name),
        name,
        sectionNumber,
        problemTypes: [],
      };
      inProblemArchetypes = false;
      inPythonConsiderations = false;
      inOverview = false;
      continue;
    }

    // Problem archetypes list
    if (inProblemArchetypes && trimmed.startsWith("-")) {
      const items = trimmed
        .slice(1)
        .split(",")
        .map((s) => cleanMarkdown(s.trim()))
        .filter((s) => s.length > 0);
      currentModule.problemArchetypes.push(...items);
      continue;
    }

    // Python considerations list
    if (inPythonConsiderations && trimmed.startsWith("-")) {
      const consideration = cleanMarkdown(trimmed.slice(1).trim());
      if (consideration && currentModule.pythonConsiderations) {
        currentModule.pythonConsiderations.push(consideration);
      }
      continue;
    }

    // Problem types within subtopic (bullet points)
    if (
      currentSubtopic &&
      !inProblemArchetypes &&
      !inPythonConsiderations &&
      trimmed.startsWith("-")
    ) {
      const { name, description } = parseBulletItem(trimmed);
      if (name) {
        currentSubtopic.problemTypes.push({
          id: toKebabCase(name),
          name,
          description,
        });
      }
      continue;
    }
  }

  // Save last module and subtopic
  if (currentModule) {
    if (currentSubtopic) {
      currentModule.subtopics.push(currentSubtopic);
    }
    modules.push(currentModule);
  }

  return {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    modules,
  };
}

/**
 * Validates the generated data
 */
function validateTopicsData(data: TopicsData): string[] {
  const errors: string[] = [];

  if (data.modules.length === 0) {
    errors.push("No modules found");
  }

  const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  for (const module of data.modules) {
    if (!kebabCaseRegex.test(module.id)) {
      errors.push(`Module ID not kebab-case: "${module.id}"`);
    }
    if (!module.name) {
      errors.push(`Module ${module.id} has no name`);
    }

    for (const subtopic of module.subtopics) {
      if (!kebabCaseRegex.test(subtopic.id)) {
        errors.push(
          `Subtopic ID not kebab-case: "${subtopic.id}" in ${module.id}`
        );
      }

      for (const pt of subtopic.problemTypes) {
        if (!kebabCaseRegex.test(pt.id)) {
          errors.push(
            `ProblemType ID not kebab-case: "${pt.id}" in ${subtopic.id}`
          );
        }
      }
    }
  }

  return errors;
}

/**
 * Main execution
 */
function main() {
  const projectRoot = path.resolve(__dirname, "..");
  const inputPath = path.join(projectRoot, "src/data/topics.md");
  const outputPath = path.join(projectRoot, "src/data/topics.json");

  console.log("🔄 Converting topics.md to topics.json...\n");

  // Read input
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const markdown = fs.readFileSync(inputPath, "utf-8");
  console.log(`📖 Read ${markdown.length} bytes from topics.md`);

  // Parse
  const data = parseTopicsMarkdown(markdown);

  // Validate
  const errors = validateTopicsData(data);
  if (errors.length > 0) {
    console.warn("\n⚠️  Validation warnings:");
    errors.forEach((e) => console.warn(`   - ${e}`));
  }

  // Stats
  const totalSubtopics = data.modules.reduce(
    (acc, m) => acc + m.subtopics.length,
    0
  );
  const totalProblemTypes = data.modules.reduce(
    (acc, m) =>
      acc + m.subtopics.reduce((a, s) => a + s.problemTypes.length, 0),
    0
  );
  const totalArchetypes = data.modules.reduce(
    (acc, m) => acc + m.problemArchetypes.length,
    0
  );

  console.log(`\n📊 Statistics:`);
  console.log(`   Modules:         ${data.modules.length}`);
  console.log(`   Subtopics:       ${totalSubtopics}`);
  console.log(`   Problem Types:   ${totalProblemTypes}`);
  console.log(`   Archetypes:      ${totalArchetypes}`);

  // Write output
  const jsonOutput = JSON.stringify(data, null, 2);
  fs.writeFileSync(outputPath, jsonOutput, "utf-8");

  console.log(`\n✅ Written ${jsonOutput.length} bytes to topics.json`);
  console.log(`   Path: ${outputPath}`);
}

main();
