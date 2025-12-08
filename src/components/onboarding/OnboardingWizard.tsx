"use client";

/**
 * OnboardingWizard - Multi-step onboarding flow for first-time users
 *
 * 5 steps: Welcome → How It Works → Get API Key → Enter API Key → Complete
 * Features:
 * - Stable centered container layout
 * - Focus trap for accessibility
 * - Reduced motion support
 * - Proper overlay click handling
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { useSettingsStore } from "@/lib/settingsStore";
import { useApiKey } from "@/app/ApiKeyContext";
import { ArrowLeft, ArrowRight, Check } from "@phosphor-icons/react";

// Step components
import { WelcomeStep } from "./steps/WelcomeStep";
import { HowItWorksStep } from "./steps/HowItWorksStep";
import { GetApiKeyStep } from "./steps/GetApiKeyStep";
import { EnterApiKeyStep } from "./steps/EnterApiKeyStep";
import { CompleteStep } from "./steps/CompleteStep";

const TOTAL_STEPS = 5;

interface OnboardingWizardProps {
  isVisible: boolean;
}

export function OnboardingWizard({ isVisible }: OnboardingWizardProps) {
  const router = useRouter();
  const { onboardingStep, setOnboardingStep, completeOnboarding } =
    useSettingsStore();
  const { hasApiKey } = useApiKey();
  const [currentStep, setCurrentStep] = useState(onboardingStep);
  const [direction, setDirection] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  // Refs for focus management
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Focus trap and management
  useEffect(() => {
    if (isVisible) {
      // Save currently focused element
      previousActiveElement.current = document.activeElement;

      // Focus the title after mount
      const timer = setTimeout(() => {
        titleRef.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    } else {
      // Restore focus when closing
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    }
  }, [isVisible]);

  // Focus trap - keep focus within the dialog
  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = containerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleTabKey);
    return () => window.removeEventListener("keydown", handleTabKey);
  }, [isVisible]);

  // Step 4 requires API key to proceed
  const canProceed = useCallback(() => {
    if (currentStep === 4 && !hasApiKey) {
      return false;
    }
    return true;
  }, [currentStep, hasApiKey]);

  const goToNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS && canProceed()) {
      setDirection(1);
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setOnboardingStep(nextStep);
    }
  }, [currentStep, canProceed, setOnboardingStep]);

  const goToPrev = useCallback(() => {
    if (currentStep > 1) {
      setDirection(-1);
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setOnboardingStep(prevStep);
    }
  }, [currentStep, setOnboardingStep]);

  const handleComplete = useCallback(() => {
    const landingPage = useSettingsStore.getState().general.defaultLandingPage;
    completeOnboarding();

    // Route based on settings
    switch (landingPage) {
      case "manual-practice":
        router.push("/practice/manual");
        break;
      case "auto-mode":
        router.push("/practice/auto");
        break;
      default:
        router.push("/");
    }
  }, [completeOnboarding, router]);

  const handleStartPracticing = useCallback(() => {
    completeOnboarding();
    router.push("/practice/manual");
  }, [completeOnboarding, router]);

  // Keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && currentStep < TOTAL_STEPS && canProceed()) {
        goToNext();
      } else if (e.key === "ArrowLeft" && currentStep > 1) {
        goToPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, currentStep, goToNext, goToPrev, canProceed]);

  if (!isVisible) {
    return null;
  }

  const progress = (currentStep / TOTAL_STEPS) * 100;

  // Animation variants with reduced motion support
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.96,
      y: prefersReducedMotion ? 0 : 8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
    },
  };

  const stepVariants = {
    enter: (dir: number) => ({
      x: prefersReducedMotion ? 0 : dir > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: prefersReducedMotion ? 0 : dir < 0 ? 40 : -40,
      opacity: 0,
    }),
  };

  const transitionConfig = {
    duration: prefersReducedMotion ? 0.1 : 0.2,
    ease: "easeOut" as const,
  };

  return (
    <motion.div
      className="fixed inset-0 z-100 flex items-center justify-center"
      initial="hidden"
      animate="visible"
      exit="hidden"
      ref={containerRef}
    >
      {/* Backdrop - blocks clicks */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        variants={overlayVariants}
        transition={transitionConfig}
        aria-hidden="true"
      />

      {/* Content Card */}
      <motion.div
        className="relative z-10 w-full max-w-2xl mx-4"
        variants={cardVariants}
        transition={transitionConfig}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <Card className="border-border/50 bg-background/95 backdrop-blur-md shadow-2xl overflow-hidden">
          <CardContent className="p-0">
            {/* Header with progress */}
            <div className="px-6 pt-6 pb-4 border-b border-border/50 bg-muted/30">
              <h2
                ref={titleRef}
                id="onboarding-title"
                tabIndex={-1}
                className="sr-only"
              >
                Pytrix Setup - Step {currentStep} of {TOTAL_STEPS}
              </h2>
              <Progress value={progress} className="h-1.5 mb-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="font-medium">
                  Step {currentStep} of {TOTAL_STEPS}
                </span>
                <span>{Math.round(progress)}% complete</span>
              </div>
            </div>

            {/* Step content - fixed height container */}
            <div className="relative min-h-[420px] overflow-hidden">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={transitionConfig}
                  className="p-6"
                >
                  {currentStep === 1 && <WelcomeStep />}
                  {currentStep === 2 && <HowItWorksStep />}
                  {currentStep === 3 && <GetApiKeyStep />}
                  {currentStep === 4 && <EnterApiKeyStep />}
                  {currentStep === 5 && (
                    <CompleteStep
                      onDashboard={handleComplete}
                      onPractice={handleStartPracticing}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer with navigation */}
            <div className="px-6 py-4 border-t border-border/50 bg-muted/20">
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  onClick={goToPrev}
                  disabled={currentStep === 1}
                  className={cn(
                    "gap-2 transition-opacity",
                    currentStep === 1 && "opacity-0 pointer-events-none"
                  )}
                  aria-label="Go to previous step"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                <div className="flex items-center gap-2">
                  {/* Skip button for non-critical steps */}
                  {(currentStep === 2 || currentStep === 3) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToNext}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Skip
                    </Button>
                  )}

                  {/* Next/Continue button */}
                  {currentStep < TOTAL_STEPS && (
                    <Button
                      onClick={goToNext}
                      disabled={!canProceed()}
                      className="gap-2 min-w-[100px]"
                      aria-label={
                        currentStep === 4
                          ? "Continue to next step"
                          : "Go to next step"
                      }
                    >
                      {currentStep === 4 ? (
                        <>
                          <Check className="h-4 w-4" />
                          Continue
                        </>
                      ) : (
                        <>
                          Next
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
