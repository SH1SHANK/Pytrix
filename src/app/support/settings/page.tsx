"use client";

/**
 * Settings Page - Comprehensive Control Center
 *
 * Multi-section layout with sidebar navigation.
 * Sections: General, Appearance, Editor, Practice, Key Bindings, API & Keys, Privacy, Advanced
 */

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Gear,
  Sun,
  Code,
  GraduationCap,
  Keyboard,
  Key,
  ShieldCheck,
  GearSix,
  CaretDoubleUp,
  IconProps,
} from "@phosphor-icons/react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

import {
  GeneralSection,
  AppearanceSection,
  EditorSection,
  PracticeSection,
  KeyBindingsSection,
  ApiKeysSection,
  PrivacySection,
  AdvancedSection,
} from "./sections";

// ============================================
// TYPES & DATA
// ============================================

type SettingsSectionId =
  | "general"
  | "appearance"
  | "editor"
  | "practice"
  | "keybindings"
  | "api-keys"
  | "privacy"
  | "advanced";

interface SettingsSection {
  id: SettingsSectionId;
  title: string;
  icon: ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;
  description: string;
  component: React.FC;
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "general",
    title: "General",
    icon: Gear,
    description: "Language, landing page, and confirmation preferences.",
    component: GeneralSection,
  },
  {
    id: "appearance",
    title: "Appearance",
    icon: Sun,
    description: "Theme, accent color, fonts, and visual options.",
    component: AppearanceSection,
  },
  {
    id: "editor",
    title: "Editor",
    icon: Code,
    description: "Code editor behavior, theme, and shortcuts.",
    component: EditorSection,
  },
  {
    id: "practice",
    title: "Practice & Defaults",
    icon: GraduationCap,
    description: "Session defaults, Auto Mode, and stats behavior.",
    component: PracticeSection,
  },
  {
    id: "keybindings",
    title: "Key Bindings",
    icon: Keyboard,
    description: "Keyboard shortcuts reference.",
    component: KeyBindingsSection,
  },
  {
    id: "api-keys",
    title: "API & Keys",
    icon: Key,
    description: "Configure your AI provider API keys.",
    component: ApiKeysSection,
  },
  {
    id: "privacy",
    title: "Privacy & Data",
    icon: ShieldCheck,
    description: "Data storage, privacy options, and clear data.",
    component: PrivacySection,
  },
  {
    id: "advanced",
    title: "Advanced",
    icon: GearSix,
    description: "Safety limits, debug options, and reset settings.",
    component: AdvancedSection,
  },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function SettingsPage() {
  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>("general");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for active section
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id as SettingsSectionId;
          setActiveSection(sectionId);
        }
      });
    };

    SETTINGS_SECTIONS.forEach((section) => {
      const element = sectionRefs.current[section.id];
      if (element) {
        const observer = new IntersectionObserver(
          observerCallback,
          observerOptions
        );
        observer.observe(element);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  // Handle hash fragment on initial load
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && SETTINGS_SECTIONS.some((s) => s.id === hash)) {
      // Small delay to ensure refs are populated
      setTimeout(() => {
        const element = sectionRefs.current[hash];
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          setActiveSection(hash as SettingsSectionId);
        }
      }, 100);
    }
  }, []);

  // Show/hide back to top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = scrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        setShowBackToTop(scrollContainer.scrollTop > 500);
      }
    };

    const scrollContainer = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    scrollContainer?.addEventListener("scroll", handleScroll);

    return () => scrollContainer?.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: SettingsSectionId) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToTop = () => {
    const scrollContainer = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    scrollContainer?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Header */}
      <header className="border-b bg-gradient-to-br from-primary/5 to-transparent">
        <div className="container max-w-7xl px-4 py-8 md:py-10">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Gear weight="duotone" className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                Settings
              </h1>
              <p className="text-muted-foreground text-base max-w-2xl">
                Configure your API keys, editor, appearance, and preferences.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Section Selector */}
      <div className="md:hidden border-b px-4 py-3 bg-card">
        <Select
          value={activeSection}
          onValueChange={(value) => {
            scrollToSection(value as SettingsSectionId);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose section" />
          </SelectTrigger>
          <SelectContent>
            {SETTINGS_SECTIONS.map((section) => (
              <SelectItem key={section.id} value={section.id}>
                <div className="flex items-center gap-2">
                  <section.icon weight="duotone" className="w-4 h-4" />
                  {section.title}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full container max-w-7xl px-4 py-6">
          <div className="grid md:grid-cols-[240px_1fr] gap-6 h-full">
            {/* Sidebar Navigation (Desktop) */}
            <aside className="hidden md:block">
              <div className="md:sticky md:top-6">
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  <nav className="space-y-1 pr-4">
                    {SETTINGS_SECTIONS.map((section) => {
                      const IconComponent = section.icon;
                      const isActive = activeSection === section.id;
                      return (
                        <button
                          key={section.id}
                          onClick={() => scrollToSection(section.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                            isActive
                              ? "bg-primary/10 text-primary font-medium border border-primary/20"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <IconComponent
                            weight="duotone"
                            className="w-5 h-5 shrink-0"
                          />
                          <span className="truncate">{section.title}</span>
                        </button>
                      );
                    })}
                  </nav>
                </ScrollArea>
              </div>
            </aside>

            {/* Content Area */}
            <ScrollArea
              ref={scrollAreaRef}
              className="h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)]"
            >
              <div className="pr-4 pb-12 space-y-16">
                {SETTINGS_SECTIONS.map((section) => {
                  const SectionComponent = section.component;
                  return (
                    <section
                      key={section.id}
                      id={section.id}
                      ref={(el) => {
                        sectionRefs.current[section.id] = el;
                      }}
                      className="scroll-mt-4"
                    >
                      <div className="mb-6">
                        <div className="flex items-center gap-3 mb-3">
                          <section.icon
                            weight="duotone"
                            className="w-6 h-6 text-primary"
                          />
                          <h2 className="text-2xl font-semibold tracking-tight">
                            {section.title}
                          </h2>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {section.description}
                        </p>
                        <Separator className="mt-4" />
                      </div>
                      <SectionComponent />
                    </section>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-6 right-6 rounded-full shadow-lg z-50"
          aria-label="Back to top"
        >
          <CaretDoubleUp weight="bold" className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}
