import {
  BookOpen,
  RocketLaunch,
  Lightning,
  Keyboard,
  Warning,
  ShieldCheck,
  Question,
  Cpu,
  ChartBar,
  Note,
  IconProps,
} from "@phosphor-icons/react";
import { ReactNode, ForwardRefExoticComponent, RefAttributes } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Kbd } from "@/components/ui/kbd";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle,
  Info,
  ArrowRight,
  Bug,
  TerminalWindow,
  Database,
  Target,
  GitBranch,
  SpinnerGap,
} from "@phosphor-icons/react";

// ============================================
// TYPE DEFINITIONS
// ============================================

export type HelpSectionId =
  | "about"
  | "getting-started"
  | "core-features"
  | "api-llm"
  | "limits"
  | "stats"
  | "shortcuts"
  | "privacy"
  | "known-issues"
  | "faq";

export interface HelpSection {
  id: HelpSectionId;
  title: string;
  icon: ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;
  description: string;
}

export interface ShortcutItem {
  action: string;
  keys: string[];
  description?: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

// ============================================
// SECTION METADATA
// ============================================

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: "about",
    title: "About Pytrix",
    icon: BookOpen,
    description:
      "What Pytrix is, why it exists, and how it helps you practice Python with real code execution and AI support.",
  },
  {
    id: "getting-started",
    title: "Getting Started",
    icon: RocketLaunch,
    description:
      "Step-by-step setup: configure your API key, understand the dashboard, and solve your first problem.",
  },
  {
    id: "core-features",
    title: "Core Features",
    icon: Lightning,
    description:
      "Deep dive into Manual Practice, Auto Mode, difficulty levels, optimal AI solutions, and the Python runtime.",
  },
  {
    id: "api-llm",
    title: "API & LLM Usage",
    icon: Cpu,
    description:
      "How Pytrix talks to the Gemini API, what is sent, what is received, and how your key is used at runtime.",
  },
  {
    id: "limits",
    title: "Free Tier & Limits",
    icon: Warning,
    description:
      "How free tiers, quotas, and rate limits work, and how Pytrix helps you stay within your usage budget.",
  },
  {
    id: "stats",
    title: "Stats & History",
    icon: ChartBar,
    description:
      "What each metric means (attempts, mastery, API usage) and how to review your past questions and runs.",
  },
  {
    id: "shortcuts",
    title: "Keyboard Shortcuts",
    icon: Keyboard,
    description:
      "All the hotkeys that make navigation, running code, and switching views faster and smoother.",
  },
  {
    id: "privacy",
    title: "Privacy & Security",
    icon: ShieldCheck,
    description:
      "Where your data lives, how your API key is stored, and what Pytrix does—and does not—send to external APIs.",
  },
  {
    id: "known-issues",
    title: "Known Limitations",
    icon: Note,
    description:
      "Current browser-based constraints, occasional AI quirks, and areas for future improvement.",
  },
  {
    id: "faq",
    title: "FAQ & Troubleshooting",
    icon: Question,
    description:
      "Common questions, error explanations, and quick fixes for problems with keys, limits, or question generation.",
  },
];

// ============================================
// SHORTCUTS DATA
// ============================================

export const SHORTCUTS_DATA: Record<string, ShortcutItem[]> = {
  general: [
    {
      action: "Open Command Palette",
      keys: ["⌘", "K"],
      description: "Quick access to all commands and navigation",
    },
    {
      action: "Toggle Sidebar",
      keys: ["⌘", "B"],
      description: "Show/hide the main navigation sidebar",
    },
  ],
  editor: [
    {
      action: "Run & Check Code",
      keys: ["⌘", "Enter"],
      description: "Execute code with Pyodide and AI validation",
    },
    {
      action: "Save Code",
      keys: ["⌘", "S"],
      description: "Save current code to history",
    },
  ],
  navigation: [
    {
      action: "Go to Dashboard",
      keys: ["⌘", "K", "→", "Home"],
      description: "Navigate to main dashboard",
    },
    {
      action: "Go to Manual Practice",
      keys: ["⌘", "K", "→", "Manual"],
      description: "Start topic-specific practice",
    },
    {
      action: "Go to Auto Mode",
      keys: ["⌘", "K", "→", "Auto"],
      description: "Start adaptive practice session",
    },
    {
      action: "Go to History",
      keys: ["⌘", "K", "→", "History"],
      description: "View past questions and attempts",
    },
  ],
  practice: [
    {
      action: "Reset Topic Stats",
      keys: ["Right-click", "Topic Card"],
      description: "Clear progress for a specific topic",
    },
  ],
};

// ============================================
// FAQ DATA
// ============================================

export const FAQ_DATA: FAQItem[] = [
  {
    q: "Why do I need my own API key?",
    a: "Pytrix runs entirely in your browser and connects directly to Google's Gemini API. To keep your data private and your usage under your control, requests are made with your own API key instead of a shared server key. This also means the app can remain free and serverless.",
  },
  {
    q: "How is my API key stored?",
    a: "Your key is stored locally in your browser's localStorage. It is never sent to a Pytrix backend server or any third party except Google Gemini. You can remove it at any time from Settings → API & Keys.",
  },
  {
    q: "What happens if I hit rate limits or free-tier quotas?",
    a: "The Gemini API may return errors like 'Resource Exhausted' or HTTP 429. This means you've made too many requests or used up your free quota for a short period. Wait a few minutes, reduce rapid question regeneration, or avoid repeatedly calling 'Check with AI'.",
  },
  {
    q: "Can I use Pytrix offline?",
    a: "Once loaded, the Python runtime (Pyodide) can execute your code offline. However, generating new questions, hints, or AI-optimized solutions always requires an internet connection and available API quota.",
  },
  {
    q: "How does Auto Mode pick topics and difficulties?",
    a: "Auto Mode looks at your per-topic stats—attempts, correctness, and inferred mastery. It prefers topics where you've practiced less or solved fewer problems, and can adjust difficulty based on your recent performance to keep you in a productive challenge zone.",
  },
  {
    q: "What exactly is tracked in Stats & History?",
    a: "For each attempt, Pytrix tracks the topic, difficulty, mode (Manual or Auto), whether you passed, your code snapshot, and timestamp. Aggregated stats like 'Problems Solved', mastery percentage, and per-difficulty counts are computed from this history in your browser.",
  },
  {
    q: "Are the AI questions and solutions always correct?",
    a: "LLMs are powerful but not perfect. Most of the time questions and solutions are solid, but occasionally you may see edge cases or sub-optimal code. Treat them like a smart assistant, not a ground-truth judge—if something looks suspicious, investigate and learn from it.",
  },
  {
    q: "How do I reset my progress?",
    a: "From the Dashboard, use the 'Reset Stats' button to clear your stored stats and mastery. You can also clear individual topics via their context menu (right-click), or wipe everything (including your key) by clearing Pytrix data from your browser's storage.",
  },
  {
    q: "Why does the first question take a while to load?",
    a: "Pyodide (the in-browser Python runtime) loads on first use, which can take 5-10 seconds depending on your connection. After that, all Python execution is instant. The initial Gemini API call also needs to connect, but subsequent questions are typically faster due to buffering.",
  },
  {
    q: "What Python libraries are available in Pyodide?",
    a: "Pyodide includes the Python standard library plus many popular packages like numpy, pandas (basic), and more. However, some packages with C extensions or system dependencies may not work. Most DSA and beginner Python code will run fine.",
  },
  {
    q: "Can I contribute questions or improve the AI prompts?",
    a: "Yes! Pytrix is open source. You can suggest improvements, report bugs, or contribute code via GitHub. Check the Bug Report page for links to the repository.",
  },
];

// ============================================
// HELPER COMPONENTS
// ============================================

interface StepCardProps {
  step: number;
  title: string;
  description: string;
  action?: ReactNode;
}

function StepCard({ step, title, description, action }: StepCardProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0 border border-primary/20">
          {step}
        </div>
        <div className="w-px h-full bg-border my-2" />
      </div>
      <div className="pb-8 space-y-2 flex-1">
        <h3 className="font-semibold text-base">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
        {action && <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  details: string[];
}

function FeatureCard({ title, description, icon, details }: FeatureCardProps) {
  return (
    <Card className="h-full hover:border-primary/40 transition-colors">
      <CardHeader>
        <div className="mb-2 text-primary">{icon}</div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
        <ul className="space-y-1.5">
          {details.map((detail, i) => (
            <li
              key={i}
              className="flex gap-2 items-start text-xs text-muted-foreground"
            >
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ============================================
// SECTION COMPONENT MAPPING (export placeholder)
// ============================================

export const HELP_SECTION_COMPONENTS: Record<HelpSectionId, React.FC> =
  {} as Record<HelpSectionId, React.FC>;

// ============================================
// SECTION CONTENT COMPONENTS
// ============================================

// --- About Section ---
export function AboutSection() {
  return (
    <>
      <Card className="bg-linear-to-br from-primary/5 to-transparent border-primary/20 mb-6">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-primary border-primary/30">
              Welcome to Pytrix
            </Badge>
          </div>
          <CardTitle className="text-3xl md:text-4xl">
            Master Python with AI-Powered Practice
          </CardTitle>
          <CardDescription className="text-base mt-2 max-w-2xl">
            A privacy-first, verified practice environment designed for students
            and developers who want to sharpen their Python skills with
            intelligent, adaptive feedback—all running in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 mt-4">
          <div className="flex gap-3">
            <Lightning
              weight="duotone"
              className="w-6 h-6 text-yellow-500 shrink-0"
            />
            <div>
              <h4 className="font-semibold text-sm">Adaptive Learning</h4>
              <p className="text-sm text-muted-foreground">
                Auto Mode adapts to your skill level in real-time, targeting
                your weakest topics.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <ShieldCheck
              weight="duotone"
              className="w-6 h-6 text-green-500 shrink-0"
            />
            <div>
              <h4 className="font-semibold text-sm">Privacy First</h4>
              <p className="text-sm text-muted-foreground">
                Your code runs in your browser. All stats stay local. You own
                your data.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <TerminalWindow
              weight="duotone"
              className="w-6 h-6 text-blue-500 shrink-0"
            />
            <div>
              <h4 className="font-semibold text-sm">Real Python Runtime</h4>
              <p className="text-sm text-muted-foreground">
                Powered by Pyodide (WebAssembly), not fake simulations.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Cpu
              weight="duotone"
              className="w-6 h-6 text-purple-500 shrink-0"
            />
            <div>
              <h4 className="font-semibold text-sm">Infinite Questions</h4>
              <p className="text-sm text-muted-foreground">
                Google Gemini generates fresh problems tailored to your needs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Core Philosophy</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Pytrix is built on the idea that <strong>doing</strong> is better
            than reading. Instead of static tutorials, we give you a live Python
            environment and an &quot;Infinite Problem Generator&quot; powered by
            Google Gemini. You bring the API key, you own the practice, and you
            control the pace.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Who is this for?</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>
              <strong>Students</strong> preparing for exams or building
              foundational skills
            </li>
            <li>
              <strong>Job seekers</strong> practicing DSA and Python interview
              questions
            </li>
            <li>
              <strong>Developers</strong> sharpening their problem-solving speed
              and syntax fluency
            </li>
            <li>
              <strong>Educators</strong> looking for a self-guided practice tool
              for students
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">
            What makes it different?
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-sm mb-1">
                  No Server, No Tracking
                </h4>
                <p className="text-xs text-muted-foreground">
                  All data lives in your browser. Your API key never leaves your
                  device.
                </p>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-sm mb-1">
                  Real Python Execution
                </h4>
                <p className="text-xs text-muted-foreground">
                  Pyodide runs actual Python 3.11+ in WebAssembly, not a sandbox
                  simulation.
                </p>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-sm mb-1">
                  AI That Learns You
                </h4>
                <p className="text-xs text-muted-foreground">
                  Auto Mode adapts based on your weak spots, not random
                  shuffling.
                </p>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-sm mb-1">Free & Open</h4>
                <p className="text-xs text-muted-foreground">
                  Open source. Free tier friendly. No subscription required.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Getting Started Section ---
export function GettingStartedSection() {
  return (
    <div className="space-y-8">
      <Alert className="border-blue-500/20 bg-blue-500/5">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertTitle>First Time Here?</AlertTitle>
        <AlertDescription>
          Follow these steps to set up Pytrix and start solving Python problems
          in minutes.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <StepCard
          step={1}
          title="Get Your Free Gemini API Key"
          description="Visit Google AI Studio and generate a free API key. This powers all question generation and AI feedback."
          action={
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get API Key
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          }
        />

        <StepCard
          step={2}
          title="Configure Your API Key"
          description="Paste your API key in the Settings page. It will be stored securely in your browser's local storage."
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/support/settings#api-keys">
                Open API Settings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />

        <StepCard
          step={3}
          title="Explore the Dashboard"
          description="Your central hub. See your progress stats, browse 12 Python topics, and choose where to start."
        />

        <StepCard
          step={4}
          title="Try Manual Practice"
          description="Pick a specific topic (e.g., Lists or Dictionaries) and a difficulty level (Beginner/Intermediate/Advanced). Perfect for targeted learning."
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/practice/manual">
                Start Manual Practice
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />

        <StepCard
          step={5}
          title="Experience Auto Mode"
          description="The ultimate flow state. Auto Mode intelligently selects questions based on your weakest topics and prefetches the next problem while you work."
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/practice/auto">
                Launch Auto Mode
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />

        <StepCard
          step={6}
          title="Review Your Progress"
          description="Check your stats, mastery percentage, and API usage. Revisit past questions from the History page."
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/insights/stats">
                View Stats
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}

// --- Core Features Section ---
export function CoreFeaturesSection() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <FeatureCard
          title="Manual Practice"
          icon={<Target weight="duotone" className="w-6 h-6" />}
          description="Select from 12 Python topics (Strings, Lists, Tuples, Sets, Dictionaries, Functions, Errors, OOP, Classes, Modules, Files, Pandas) and 3 difficulty levels. Perfect for focused, topic-specific drilling."
          details={[
            "Choose topic + difficulty combination",
            "Generate unlimited questions with 'Get New Question'",
            "Run code locally with Pyodide",
            "Check correctness with AI validation",
            "Request hints or reveal optimal solutions",
          ]}
        />

        <FeatureCard
          title="Auto Mode"
          icon={<Lightning weight="duotone" className="w-6 h-6" />}
          description="An adaptive practice session that keeps you in the flow zone. Auto Mode analyzes your stats and queues up questions from your weakest topics, automatically."
          details={[
            "Creates topic queue based on your weak spots",
            "Buffers next question while you solve current one",
            "Automatically advances after successful submission",
            "Saves progress in named sessions",
            "Export/import runs for backup",
          ]}
        />

        <FeatureCard
          title="In-Browser Python Runtime"
          icon={<TerminalWindow weight="duotone" className="w-6 h-6" />}
          description="Powered by Pyodide, a full Python interpreter compiled to WebAssembly. Your code runs locally, instantly, with no server roundtrip."
          details={[
            "Python 3.11+ with standard library",
            "Common packages: numpy, pandas basics",
            "Stdout/stderr capture for debugging",
            "Timeout protection against infinite loops",
            "No network latency for execution",
          ]}
        />

        <FeatureCard
          title="AI Feedback & Hints"
          icon={<Cpu weight="duotone" className="w-6 h-6" />}
          description="When you're stuck or get an error, Pytrix's AI analyzes your specific code and provides contextual hints, error explanations, or optimal solutions."
          details={[
            "Run & Check: validates against AI expectations",
            "Get Hint: progressive nudges without spoilers",
            "Reveal Solution: see optimal, commented code",
            "Optimize Solution: AI refactors your working code",
            "Model fallback: flash-lite → flash → pro",
          ]}
        />
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">
          Question Generation & Buffering
        </h3>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <SpinnerGap
                  weight="duotone"
                  className="w-5 h-5 text-primary shrink-0 mt-0.5"
                />
                <div>
                  <h4 className="font-semibold text-sm mb-1">
                    Smart Buffering
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    In Auto Mode, Pytrix prefetches the next question while
                    you&apos;re working on the current one. This eliminates
                    waiting time and keeps you in flow state.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <GitBranch
                  weight="duotone"
                  className="w-5 h-5 text-primary shrink-0 mt-0.5"
                />
                <div>
                  <h4 className="font-semibold text-sm mb-1">
                    Adaptive Difficulty
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Questions are generated with AI-driven constraints matching
                    your selected difficulty. Beginner = simple syntax, Advanced
                    = multi-step algorithms.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- API & LLM Section ---
export function ApiLlmSection() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Pytrix uses a <strong>Bring Your Own Key (BYOK)</strong> architecture.
        The application code runs entirely in your browser and communicates
        directly with Google&apos;s Gemini API using your personal API key.
      </p>

      <Card className="bg-muted/50 border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Data Flow</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-4 text-sm font-medium">
          <div className="bg-background p-3 rounded-md border shadow-sm">
            You (Browser)
          </div>
          <ArrowRight className="hidden md:block text-muted-foreground" />
          <div className="bg-background p-3 rounded-md border shadow-sm">
            Next.js API Route (Proxy)
          </div>
          <ArrowRight className="hidden md:block text-muted-foreground" />
          <div className="bg-background p-3 rounded-md border shadow-sm">
            Google Gemini API
          </div>
          <ArrowRight className="hidden md:block text-muted-foreground" />
          <div className="bg-background p-3 rounded-md border shadow-sm">
            Pytrix Display
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What is sent?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Topic selection & difficulty constraints</li>
              <li>Your code (only when you request checking/help)</li>
              <li>System prompts defining AI behavior</li>
              <li>Your API key via X-API-Key header (to proxy only)</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What is NOT sent?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Your personal stats or history database</li>
              <li>Your browser data or cookies</li>
              <li>Other users&apos; data (app is fully client-side)</li>
              <li>API key is never stored server-side</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Model Router & Fallback</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pytrix uses a cost-aware model router to balance quality and quota
          usage:
        </p>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <Badge variant="secondary" className="mt-0.5">
              1st
            </Badge>
            <div>
              <p className="font-semibold text-sm">gemini-2.5-flash-lite</p>
              <p className="text-xs text-muted-foreground">
                Fast, lightweight, perfect for question generation and hints
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="secondary" className="mt-0.5">
              2nd
            </Badge>
            <div>
              <p className="font-semibold text-sm">gemini-2.5-flash</p>
              <p className="text-xs text-muted-foreground">
                More capable, used for complex evaluations if lite fails
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="secondary" className="mt-0.5">
              3rd
            </Badge>
            <div>
              <p className="font-semibold text-sm">gemini-2.5-pro</p>
              <p className="text-xs text-muted-foreground">
                Highest quality, fallback for edge cases or premium operations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Limits Section ---
export function LimitsSection() {
  return (
    <div className="space-y-6">
      <Alert variant="default" className="border-yellow-500/20 bg-yellow-500/5">
        <Warning className="h-4 w-4 text-yellow-500" />
        <AlertTitle>Using the Free Tier</AlertTitle>
        <AlertDescription>
          Google AI Studio provides a generous free tier, but it has rate limits
          (Requests Per Minute) and daily quotas. Pytrix helps you stay within
          them.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">Free Tier Quotas</h3>
        <div className="grid gap-3">
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">gemini-2.5-flash-lite</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ~1500 calls/day, ~1M tokens/day
                  </p>
                </div>
                <Badge variant="outline">Most Used</Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">gemini-2.5-flash</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ~500 calls/day, ~500K tokens/day
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">gemini-2.5-pro</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ~50 calls/day, ~100K tokens/day
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">Tips to Avoid Rate Limits</h3>
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">Buffer questions:</strong> In
              Auto Mode, Pytrix prefetches the next question while you&apos;re
              solving the current one. This smooths out request spikes.
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">
                Use &quot;Run&quot; first:
              </strong>{" "}
              The internal &quot;Run Code&quot; button uses the local browser
              Python runtime. It&apos;s free and instant. Only use &quot;Check
              with AI&quot; if you need validation.
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">
                Don&apos;t spam Regenerate:
              </strong>{" "}
              Hitting the regenerate button repeatedly will quickly exhaust your
              RPM quota.
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">Monitor usage:</strong> Check
              the API Usage page to see your daily consumption and model
              distribution.
            </div>
          </div>
        </div>
      </div>

      <Alert className="border-red-500/20 bg-red-500/5">
        <Warning className="h-4 w-4 text-red-500" />
        <AlertTitle>Common Error: HTTP 429</AlertTitle>
        <AlertDescription>
          If you see &quot;Too Many Requests&quot; or &quot;Resource
          Exhausted,&quot; you&apos;ve hit Google&apos;s rate limit. Wait 60
          seconds and try again. Consider slowing down question generation.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// --- Stats Section ---
export function StatsSection() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Pytrix tracks every attempt locally in your browser. These stats power
        the adaptive Auto Mode and help you visualize your progress.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mastery %</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              A weighted score of how many topics you&apos;ve attempted and your
              verified success rate. Formula: (solved / attempts) × 100.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Topics Touched</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The number of unique Python concepts (out of 12) you&apos;ve
              practiced at least once. Higher = broader coverage.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Problems Solved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Total count of questions marked correct by AI validation. Includes
              Manual and Auto Mode.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Every time you click &quot;Run &amp; Check&quot; counts as an
              attempt, whether correct or not.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Per-Difficulty Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Separate tracking for Beginner, Intermediate, and Advanced
              problems. Helps identify where you excel.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              A chronological log of every question, your code snapshot, and the
              result. Stored in your browser, revisit anytime.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-semibold">How Auto Mode Uses Stats</h3>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex gap-3">
                <Database
                  weight="duotone"
                  className="w-5 h-5 text-primary shrink-0 mt-0.5"
                />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Weakest Topics</h4>
                  <p className="text-sm text-muted-foreground">
                    Auto Mode calls{" "}
                    <code className="text-xs">getWeakestTopics()</code> to
                    identify topics with fewer attempts or lower success rates,
                    prioritizing them in the queue.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Lightning
                  weight="duotone"
                  className="w-5 h-5 text-primary shrink-0 mt-0.5"
                />
                <div>
                  <h4 className="font-semibold text-sm mb-1">
                    Adaptive Rotation
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    After 3 questions from a topic, Auto Mode rotates to the
                    next in queue. This prevents grinding and ensures balanced
                    exposure.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-semibold">API Usage Tracking</h3>
        <p className="text-sm text-muted-foreground">
          Every AI call is logged with model name, input/output tokens, and
          timestamp. View detailed breakdowns in the{" "}
          <Link
            href="/insights/api-usage"
            className="text-primary hover:underline"
          >
            API Usage
          </Link>{" "}
          page.
        </p>
        <Card>
          <CardContent className="pt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Calls:</span>
              <span className="font-semibold">Tracked per model</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Input Tokens:</span>
              <span className="font-semibold">Summed daily</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Output Tokens:</span>
              <span className="font-semibold">Summed daily</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate Limit Hits:</span>
              <span className="font-semibold">Auto-tracked for alerts</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Shortcuts Section ---
export function ShortcutsSection() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {Object.entries(SHORTCUTS_DATA).map(([category, shortcuts]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-base capitalize">{category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {shortcuts.map((s) => (
              <div key={s.action} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {s.action}
                  </span>
                  <div className="flex gap-1">
                    {s.keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </div>
                </div>
                {s.description && (
                  <p className="text-xs text-muted-foreground/80">
                    {s.description}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// --- Privacy Section ---
export function PrivacySection() {
  return (
    <div className="space-y-6">
      <Alert className="border-green-500/20 bg-green-500/5">
        <ShieldCheck className="h-4 w-4 text-green-500" />
        <AlertTitle>Local First</AlertTitle>
        <AlertDescription>
          We do not control where your data lives. It lives on your device, in
          your browser, under your control.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-base mb-2">Where is my data?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Everything—your API key, your stats, your history logs—is stored in
            your browser&apos;s{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
              localStorage
            </code>
            . If you clear your browser data, you lose your Pytrix data. No
            remote server has a copy.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-base mb-2">
            How is my API key handled?
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your key is stored in{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
              apiKeyStore.ts
            </code>{" "}
            and passed to Next.js API routes via the{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
              X-API-Key
            </code>{" "}
            header. The API route uses it to call Gemini, then discards it. The
            key is never logged, never stored server-side, never sent to anyone
            but Google.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-base mb-2">
            Why do I need to bring my own key?
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This architecture ensures we don&apos;t need a backend database to
            store keys or user accounts. It keeps the app free, private, and
            fast. You control your quota, you pay nothing (on free tier), and
            you can revoke access anytime.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-base">What data does Google see?</h3>
        <Card>
          <CardContent className="pt-6">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                <span>
                  Google sees your API requests (prompts, code submissions) to
                  generate responses.
                </span>
              </li>
              <li className="flex gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                <span>
                  Google logs usage for billing/quotas but does NOT use free
                  tier data to train models (per their terms).
                </span>
              </li>
              <li className="flex gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                <span>
                  Google does NOT see your stats, history, or other Pytrix
                  metadata.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Alert className="border-yellow-500/20 bg-yellow-500/5">
        <Warning className="h-4 w-4 text-yellow-500" />
        <AlertTitle>Browser Storage Limits</AlertTitle>
        <AlertDescription>
          localStorage typically has a 5-10MB limit per domain. If you solve
          hundreds of problems, history may grow large. Consider exporting your
          data periodically.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// --- Known Issues Section ---
export function KnownIssuesSection() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Pytrix is a browser-based app with some inherent limitations. Here are
        known issues and areas for future improvement:
      </p>

      <div className="space-y-4">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">
              AI-Generated Questions May Be Imperfect
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              LLMs are powerful but not infallible. Occasionally, a generated
              question may have unclear wording, incorrect test cases, or
              suboptimal solutions. Use the &quot;Get New Question&quot; button
              to regenerate if needed.
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">
              Pyodide Takes Time to Load
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The first Python execution in a session can take 5-10 seconds as
              Pyodide downloads (~30MB). After that, all execution is instant.
              This is a one-time cost per page load.
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">
              Browser Storage is Ephemeral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If you clear your browser cache or use Incognito mode, all stats
              and history are lost. Consider exporting your data regularly or
              using a persistent browser profile.
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">
              Limited Python Package Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pyodide supports many packages, but not all. Packages with C
              extensions or system dependencies may fail. Most standard library
              and pure-Python packages work fine.
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">No Multi-Device Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Because data is stored locally, your progress doesn&apos;t sync
              across devices. Future versions may add optional cloud backup.
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">
              Rate Limits Can Be Hit Quickly
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Free tier rate limits are generous but finite. Rapid question
              generation or repeated AI checks can exhaust your quota. Be
              mindful of usage.
            </p>
          </CardContent>
        </Card>
      </div>

      <Alert className="border-blue-500/20 bg-blue-500/5">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertTitle>Help Us Improve</AlertTitle>
        <AlertDescription>
          Found a bug or have a feature request? Open an issue on GitHub or use
          the Bug Report form.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// --- FAQ Section ---
export function FaqSection() {
  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible className="w-full">
        {FAQ_DATA.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left text-base">
              {item.q}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.a}
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-8 pt-8 border-t text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Still have questions? Need help with an error?
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/support/bug-report">
              <Bug weight="duotone" className="mr-2 h-4 w-4" />
              Report a Bug
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/support/settings#api-keys">
              <ShieldCheck weight="duotone" className="mr-2 h-4 w-4" />
              Configure API Key
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Update HELP_SECTION_COMPONENTS mapping
HELP_SECTION_COMPONENTS.about = AboutSection;
HELP_SECTION_COMPONENTS["getting-started"] = GettingStartedSection;
HELP_SECTION_COMPONENTS["core-features"] = CoreFeaturesSection;
HELP_SECTION_COMPONENTS["api-llm"] = ApiLlmSection;
HELP_SECTION_COMPONENTS.limits = LimitsSection;
HELP_SECTION_COMPONENTS.stats = StatsSection;
HELP_SECTION_COMPONENTS.shortcuts = ShortcutsSection;
HELP_SECTION_COMPONENTS.privacy = PrivacySection;
HELP_SECTION_COMPONENTS["known-issues"] = KnownIssuesSection;
HELP_SECTION_COMPONENTS.faq = FaqSection;
