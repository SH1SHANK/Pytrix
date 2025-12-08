"use client";

/**
 * Onboarding Overlay
 *
 * Full-screen overlay shown when no API key is configured.
 * Blurs the background and presents onboarding steps.
 */

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Key, Book, ArrowRight, Sparkle } from "@phosphor-icons/react";

interface OnboardingOverlayProps {
  /** If true, the overlay is visible */
  isVisible: boolean;
}

export function OnboardingOverlay({ isVisible }: OnboardingOverlayProps) {
  const router = useRouter();

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Centered Card */}
      <Card className="relative z-10 w-full max-w-lg mx-4 shadow-2xl border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 w-fit">
            <Sparkle weight="duotone" className="h-10 w-10 text-primary" />
          </div>
          <CardTitle id="onboarding-title" className="text-2xl">
            Get Your Own API Key to Start
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Explanation */}
          <p className="text-center text-muted-foreground">
            Pytrix uses AI to generate Python questions and provide instant
            feedback. For privacy and cost control, you bring your own API key.
          </p>

          {/* Quick Steps */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary text-sm font-bold shrink-0">
                1
              </div>
              <p className="text-sm">
                Create a free Gemini API key from{" "}
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  Google AI Studio
                </a>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary text-sm font-bold shrink-0">
                2
              </div>
              <p className="text-sm">
                Paste your key into Pytrix settings — it stays in your browser
                only
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary text-sm font-bold shrink-0">
                3
              </div>
              <p className="text-sm">
                Start practicing with AI-generated questions instantly!
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1"
              size="lg"
              onClick={() => router.push("/support/settings")}
            >
              <Key weight="duotone" className="mr-2 h-5 w-5" />
              Add API Key
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => router.push("/support/help#getting-started")}
            >
              <Book weight="duotone" className="mr-2 h-5 w-5" />
              Read Setup Guide
            </Button>
          </div>

          {/* Security Note */}
          <p className="text-xs text-center text-muted-foreground">
            🔒 Your key is stored locally in your browser and never sent to our
            servers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
