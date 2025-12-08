"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BookOpen, List, X, CaretDoubleUp } from "@phosphor-icons/react";
import { useApiKey } from "@/app/ApiKeyContext";
import {
  HELP_SECTIONS,
  HelpSectionId,
  HELP_SECTION_COMPONENTS,
} from "./content";

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState<HelpSectionId>("about");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { hasApiKey } = useApiKey();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for active section detection
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
          const sectionId = entry.target.id as HelpSectionId;
          setActiveSection(sectionId);
        }
      });
    };

    HELP_SECTIONS.forEach((section) => {
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
    if (hash && HELP_SECTIONS.some((s) => s.id === hash)) {
      setTimeout(() => {
        const element = sectionRefs.current[hash];
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          setActiveSection(hash as HelpSectionId);
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

  const scrollToSection = (sectionId: HelpSectionId) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileMenuOpen(false);
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
      <header className="border-b bg-linear-to-br from-primary/5 to-transparent">
        <div className="container max-w-7xl px-4 py-8 md:py-12">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <BookOpen weight="duotone" className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                Help & Documentation
              </h1>
              <p className="text-muted-foreground text-base max-w-2xl">
                Everything you need to master Python with Pytrix. Learn about
                features, shortcuts, AI integration, and best practices.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <Badge
                  variant={hasApiKey ? "default" : "secondary"}
                  className="gap-1.5"
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      hasApiKey ? "bg-green-500" : "bg-red-500"
                    )}
                  />
                  {hasApiKey ? "API Connected" : "No API Key"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Toggle */}
      <div className="md:hidden border-b px-4 py-3 bg-card">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full justify-start gap-2"
        >
          {mobileMenuOpen ? (
            <X weight="bold" className="w-4 h-4" />
          ) : (
            <List weight="bold" className="w-4 h-4" />
          )}
          {mobileMenuOpen ? "Close Menu" : "Browse Sections"}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full container max-w-7xl px-4 py-6">
          <div className="grid md:grid-cols-[240px_1fr] gap-6 h-full">
            {/* Sidebar Navigation */}
            <aside
              className={cn("md:block", mobileMenuOpen ? "block" : "hidden")}
            >
              <div className="md:sticky md:top-6">
                <ScrollArea className="h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)]">
                  <nav className="space-y-1 pr-4">
                    {HELP_SECTIONS.map((section) => {
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
                {HELP_SECTIONS.map((section) => {
                  const SectionComponent = HELP_SECTION_COMPONENTS[section.id];
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
