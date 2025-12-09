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
  Command,
  Gear,
  ListBullets,
  TreeStructure,
  Target,
  TerminalWindow,
  Database,
  GitBranch,
  SpinnerGap,
  CheckCircle,
  Info,
  ArrowRight,
  Bug,
  Sun,
  Moon,
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

// ============================================
// TYPE DEFINITIONS
// ============================================

export type HelpSectionId =
  | "about"
  | "getting-started"
  | "curriculum"
  | "practice-modes"
  | "command-center"
  | "stats"
  | "api-llm"
  | "limits"
  | "settings"
  | "privacy"
  | "shortcuts"
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
      "Step-by-step setup: get your API key, configure the app, and start your first practice session.",
  },
  {
    id: "curriculum",
    title: "Curriculum & Modules",
    icon: ListBullets,
    description:
      "Understanding the Module → Subtopic → Archetype hierarchy and how to navigate the content library.",
  },
  {
    id: "practice-modes",
    title: "Practice Modes",
    icon: Lightning,
    description:
      "Deep dive into Manual Practice for precision and Auto Mode for adaptive, flow-state learning.",
  },
  {
    id: "command-center",
    title: "Command Center",
    icon: Command,
    description:
      "Master the global command palette (⌘K) for fast navigation, search, and power actions.",
  },
  {
    id: "stats",
    title: "Stats & Progress",
    icon: ChartBar,
    description:
      "How we measure your mastery, track your history, and help you visualize your improvement over time.",
  },
  {
    id: "api-llm",
    title: "API & LLM Usage",
    icon: Cpu,
    description:
      "How the BYOK (Bring Your Own Key) model works, data privacy, and understanding token usage.",
  },
  {
    id: "limits",
    title: "Free Tier & Limits",
    icon: Warning,
    description:
      "Managing quotas, avoiding rate limits, and dealing with 'Resource Exhausted' errors.",
  },
  {
    id: "settings",
    title: "Settings & Customization",
    icon: Gear,
    description:
      "Configuring themes, editor fonts, difficulty defaults, and managing your API key.",
  },
  {
    id: "privacy",
    title: "Privacy & Security",
    icon: ShieldCheck,
    description:
      "Where your data lives (spoiler: on your device) and what is sent to Google.",
  },
  {
    id: "shortcuts",
    title: "Keyboard Shortcuts",
    icon: Keyboard,
    description:
      "All the hotkeys to navigate Pytrix like a pro without lifting your hands from the keyboard.",
  },
  {
    id: "known-issues",
    title: "Known Limitations",
    icon: Note,
    description:
      "Current constraints of browser-based Python and occasional AI quirks.",
  },
  {
    id: "faq",
    title: "FAQ & Troubleshooting",
    icon: Question,
    description:
      "Quick answers to common questions about keys, code execution, and bug reporting.",
  },
];

// ============================================
// SHORTCUTS DATA
// ============================================

export const SHORTCUTS_DATA: Record<string, ShortcutItem[]> = {
  general: [
    {
      action: "Open Command Center",
      keys: ["⌘", "K"],
      description: "Search modules, navigate, or run commands",
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
      description: "Execute code and validate with AI",
    },
    {
      action: "Save Code",
      keys: ["⌘", "S"],
      description: "Save snapshot to history (auto-saved on run)",
    },
  ],
  navigation: [
    {
      action: "Go to Dashboard",
      keys: ["⌘", "K", "→", "Home"],
      description: "Via Command Center",
    },
    {
      action: "Quick Practice",
      keys: ["⌘", "K", "→", "Auto/Manual"],
      description: "Start a session instantly",
    },
  ],
};

// ============================================
// FAQ DATA
// ============================================

export const FAQ_DATA: FAQItem[] = [
  {
    q: "Why do I need my own API key?",
    a: "Pytrix is a client-side application with no backend server costs. By bringing your own (free) Google Gemini key, you get unlimited learning without a subscription, and you maintain full control over your data.",
  },
  {
    q: "Is my API key safe?",
    a: "Yes. It is stored only in your browser's Local Storage. It is never sent to any Pytrix server. It is only sent directly to Google's API for the sole purpose of generating questions and feedback.",
  },
  {
    q: "What happens if I hit the rate limit?",
    a: "You might see a '429 Resource Exhausted' error. This is normal on the free tier if you generate many questions quickly. Just wait a minute and try again. Pytrix's Auto Mode buffers questions to help prevent this.",
  },
  {
    q: "Does Pytrix work offline?",
    a: "Partially. The Python runtime (Pyodide) works offline once loaded, so you can run your code. However, generating *new* questions or getting AI feedback requires an active internet connection to reach Google Gemini.",
  },
  {
    q: "Can I customize the Auto Mode difficulty?",
    a: "Auto Mode manages difficulty automatically, but you can set a 'Preferred Starting Difficulty' in Settings to bias the initial questions towards Beginner, Intermediate, or Advanced.",
  },
  {
    q: "How do I clear my data?",
    a: "Go to Settings -> Danger Zone to clear specific data (like history or stats) or perform a full reset to wipe everything including your API key.",
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
// SECTION COMPONENTS
// ============================================

// --- About Section ---
export function AboutSection() {
  return (
    <>
      <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20 mb-6">
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
            Pytrix is a browser-based, privacy-first practice platform that uses
            AI to generate infinite coding problems tailored to your skill
            level. It runs Python locally and adapts to your progress.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 mt-4">
          <div className="flex gap-3">
            <Lightning
              weight="duotone"
              className="w-6 h-6 text-yellow-500 shrink-0"
            />
            <div>
              <h4 className="font-semibold text-sm">Adaptive Auto Mode</h4>
              <p className="text-sm text-muted-foreground">
                Automatically identifies your weak spots and builds a
                personalized practice queue.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <TerminalWindow
              weight="duotone"
              className="w-6 h-6 text-blue-500 shrink-0"
            />
            <div>
              <h4 className="font-semibold text-sm">Local Python Runtime</h4>
              <p className="text-sm text-muted-foreground">
                Executes code instantly in your browser using Pyodide
                (WebAssembly).
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <ShieldCheck
              weight="duotone"
              className="w-6 h-6 text-green-500 shrink-0"
            />
            <div>
              <h4 className="font-semibold text-sm">Privacy by Design</h4>
              <p className="text-sm text-muted-foreground">
                Your API key and history never leave your device.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Cpu
              weight="duotone"
              className="w-6 h-6 text-purple-500 shrink-0"
            />
            <div>
              <h4 className="font-semibold text-sm">Uncapped Potential</h4>
              <p className="text-sm text-muted-foreground">
                No fixed curriculum. Infinite variations of any problem type.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">What Pytrix is NOT</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
          <li>
            It is <strong>not</strong> a hosted competitive programming platform
            (like LeetCode's server).
          </li>
          <li>
            It is <strong>not</strong> a static tutorial site; you learn by
            doing.
          </li>
          <li>
            It is <strong>not</strong> storing your data on a cloud database.
          </li>
        </ul>
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
        <AlertTitle>Initial Setup</AlertTitle>
        <AlertDescription>
          Pytrix requires a valid Google Gemini API key to function. The
          dashboard will remain blurred/locked until a key is configured.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <StepCard
          step={1}
          title="Get Your Free Gemini API Key"
          description="Visit Google AI Studio to generate a free API key. This empowers Pytrix to create questions and provide feedback."
          action={
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Key from Google
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          }
        />

        <StepCard
          step={2}
          title="Configure Pytrix"
          description="Enter your API key in the Pytrix settings. It is validated and stored locally in your browser."
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/support/settings?tab=api">
                Enter API Key
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />

        <StepCard
          step={3}
          title="Choose Your Path"
          description="Start with 'Manual Practice' to drill specific topics, or launch 'Auto Mode' for a guided, adaptive session."
        />
      </div>
    </div>
  );
}

// --- Curriculum Section (NEW) ---
export function CurriculumSection() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Pytrix organizes Python concepts into a structured but flexible
        hierarchy.
      </p>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              1. Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              High-level categories like "Strings", "Lists", or "OOP". Pytrix
              includes a core set of modules covering standard Python topics.
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ListBullets className="w-4 h-4 text-primary" />
              2. Subtopics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Specific concepts within a module. E.g., inside "Strings", you
              find "Slicing", "Formatting", and "Methods".
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              3. Archetypes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Concrete problem patterns. E.g., "Reverse a string" or "Find max
              in list". You can practice a specific pattern endlessly.
            </p>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Info className="w-4 h-4" />
        <AlertTitle>Smart Search</AlertTitle>
        <AlertDescription>
          Use the <strong>Command Center (⌘K)</strong> to instantly find any
          Module, Subtopic, or Archetype. Pytrix's search is granular—you can
          jump straight to "List Comprehensions" without navigating menus.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// --- Practice Modes Section (Refactored) ---
export function PracticeModesSection() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <FeatureCard
          title="Manual Practice"
          icon={<Target weight="duotone" className="w-6 h-6" />}
          description="Complete control. Select exactly what you want to practice."
          details={[
            "Drill specific Modules, Subtopics, or Archetypes",
            "Force a Difficulty (Beginner/Intermediate/Advanced)",
            "Deep linking support—share a specific problem setup",
            "Great for: Homework, targeted revision, debugging specific skills",
          ]}
        />

        <FeatureCard
          title="Auto Mode"
          icon={<Lightning weight="duotone" className="w-6 h-6" />}
          description="Flow state. Let Pytrix decide what you need."
          details={[
            "Analyzes which topics you are weakest in",
            "Builds a dynamic queue of mixed topics",
            "Increases difficulty after streaks of correct answers",
            "Smart Buffering: Loads the next question while you code",
            "Great for: Daily practice, general fluency, warming up",
          ]}
        />
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Adaptive Intelligence</h3>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-3">
              <GitBranch className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">
                  Streak-Based Progression
                </h4>
                <p className="text-sm text-muted-foreground">
                  In Auto Mode, answering 2-3 questions correctly in a row
                  triggers a difficulty increase. Struggling with a concept will
                  lower the difficulty or offer remediation.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Database className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Session Resume</h4>
                <p className="text-sm text-muted-foreground">
                  Auto Mode sessions are saved automatically. You can close the
                  tab and resume your "Run" later from where you left off.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Command Center Section (NEW) ---
export function CommandCenterSection() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        The <strong>Command Center</strong> is the power-user's heart of Pytrix.
        Access it anywhere with <Kbd>⌘</Kbd>
        <Kbd>K</Kbd> (Mac) or <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd> (Windows).
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Features</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>
              • <strong>Navigation:</strong> Jump to Dashboard, Stats, or
              Settings.
            </p>
            <p>
              • <strong>Deep Search:</strong> Type "List" to see the Module
              "Lists", Subtopics like "List Slicing", and Archetypes like
              "Filter a List".
            </p>
            <p>
              • <strong>Quick Actions:</strong> Toggle Theme, clear history, or
              reset state.
            </p>
            <p>
              • <strong>Smart Suggestions:</strong> Shows "Practice Weakest
              Subtopic" based on your actual stats.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50 flex items-center justify-center p-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center gap-1">
              <Kbd className="text-lg px-3 py-1.5">⌘</Kbd>
              <Kbd className="text-lg px-3 py-1.5">K</Kbd>
            </div>
            <p className="text-xs text-muted-foreground">Try it now!</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// --- Stats Section ---
export function StatsSection() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Pytrix tracks metrics locally to visualize your growth.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mastery %</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              A composite score derived from your success rate and difficulty
              level across all topics.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weakest Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Identifies modules where you have high failure rates or low
              attempt counts. Auto Mode targets these.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">History Log</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Every code execution is logged. You can review past solutions and
              AI feedback from the History page.
            </p>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Database className="w-4 h-4" />
        <AlertTitle>Aggregation</AlertTitle>
        <AlertDescription>
          Stats are aggregated from the bottom up. Solving "List Slicing"
          improves your stats for the "Lists" module and your overall global
          mastery.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// --- API & LLM Section ---
export function ApiLlmSection() {
  return (
    <div className="space-y-6">
      <div className="prose prose-sm text-muted-foreground">
        <p>
          Pytrix acts as a <strong>Local Client</strong> for the Gemini API.
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong>You</strong> provide the key.
          </li>
          <li>
            <strong>Google</strong> provides the intelligence.
          </li>
          <li>
            <strong>Pytrix</strong> provides the interface and runtime.
          </li>
        </ul>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What is sent?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Topic constraints (e.g., "Create a list problem")</li>
              <li>User Code (only when you click "Check with AI")</li>
              <li>Your API Key (in transit only, for authentication)</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What is NOT sent?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Your dashboard stats or history</li>
              <li>Personal identity information</li>
              <li>Browser cookies or local files</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Limits Section ---
export function LimitsSection() {
  return (
    <div className="space-y-4">
      <Alert variant="destructive" className="border-red-500/20 bg-red-500/5">
        <Warning className="h-4 w-4 text-red-500" />
        <AlertTitle>Rate Limits</AlertTitle>
        <AlertDescription>
          Google's free tier has a Request Per Minute (RPM) limit. If you click
          "Get Question" too fast, you may see a 429 error. Pytrix tries to
          handle this gracefully, but if it happens, just wait 60 seconds.
        </AlertDescription>
      </Alert>

      <h3 className="text-base font-semibold mt-4">
        Tips for smooth practice:
      </h3>
      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
        <li>
          Use <strong>Run Code</strong> (⌘+Enter) frequently. It uses the local
          runtime and costs 0 API tokens.
        </li>
        <li>
          Only use <strong>Check with AI</strong> when you are ready to submit
          or stuck.
        </li>
        <li>
          Auto Mode creates a buffer to mask network latency and API limits.
        </li>
      </ul>
    </div>
  );
}

// --- Settings Section (NEW) ---
export function SettingsSection() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Customize your experience in{" "}
        <Link href="/support/settings" className="text-primary underline">
          Settings
        </Link>
        .
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4" /> / <Moon className="w-4 h-4" />
              <span>Switch between Light and Dark mode.</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Editor</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Change font size, enabling ligatures, or editor wrapping
            preferences.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">API Key</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Update or remove your stored Google Gemini API key.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Reset all stats, clear history, or wipe application state
            completely.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Privacy Section ---
export function PrivacySection() {
  return (
    <div className="space-y-6">
      <Alert className="border-green-500/20 bg-green-500/5">
        <ShieldCheck className="h-4 w-4 text-green-500" />
        <AlertTitle>Local Storage Only</AlertTitle>
        <AlertDescription>
          Pytrix has no backend database. If you clear your browser
          cookies/data, your Pytrix progress is wiped.
        </AlertDescription>
      </Alert>

      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          We designed Pytrix to be privacy-preserving by default. We do not
          track you. We do not use analytics cookies.
        </p>
        <p>
          The only external connection is to{" "}
          <strong>generativelanguage.googleapis.com</strong> (Google Gemini) to
          generate questions.
        </p>
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

// --- Known Issues Section ---
export function KnownIssuesSection() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pyodide Load Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The first time you run code, the Python runtime must download
              (~10-20MB). This can take a few seconds. Subsequent runs are
              instant.
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">AI Hallucinations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Rarely, the AI might generate a question with a subtly incorrect
              solution. If a question seems impossible or wrong, you can skip it
              or regenerate.
            </p>
          </CardContent>
        </Card>
      </div>
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
        <p className="text-sm text-muted-foreground">Still have questions?</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/support/bug-report">
              <Bug weight="duotone" className="mr-2 h-4 w-4" />
              Report a Bug
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/support/settings?tab=api">
              <ShieldCheck weight="duotone" className="mr-2 h-4 w-4" />
              Check API Settings
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENT MAPPING
// ============================================

export const HELP_SECTION_COMPONENTS: Record<HelpSectionId, React.FC> = {
  about: AboutSection,
  "getting-started": GettingStartedSection,
  curriculum: CurriculumSection,
  "practice-modes": PracticeModesSection,
  "command-center": CommandCenterSection,
  stats: StatsSection,
  "api-llm": ApiLlmSection,
  limits: LimitsSection,
  settings: SettingsSection,
  privacy: PrivacySection,
  shortcuts: ShortcutsSection,
  "known-issues": KnownIssuesSection,
  faq: FaqSection,
};
