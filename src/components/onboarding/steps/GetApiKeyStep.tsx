"use client";

/**
 * GetApiKeyStep - Third step of onboarding
 * Guides user to get a Gemini API key from Google AI Studio
 */

import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowSquareOut,
  Key,
  ShieldCheck,
  CheckCircle,
} from "@phosphor-icons/react";

const steps = [
  { number: 1, text: "Visit Google AI Studio" },
  { number: 2, text: "Sign in with your Google account" },
  { number: 3, text: 'Click "Create API Key"' },
  { number: 4, text: "Copy your new API key" },
];

export function GetApiKeyStep() {
  const prefersReducedMotion = useReducedMotion();

  const fadeUp = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 8 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1, duration: 0.25 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 mb-4">
          <Key weight="duotone" className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
          Get Your Gemini API Key
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Pytrix uses Google&apos;s Gemini AI. You&apos;ll need a free API key
          to generate questions.
        </p>
      </motion.div>

      {/* Steps */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.15, duration: 0.25 }}
        className="bg-muted/50 rounded-lg p-5 border border-border/50"
      >
        <div className="space-y-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 + index * 0.05, duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-bold shrink-0">
                {step.number}
              </div>
              <span className="text-sm">{step.text}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.35, duration: 0.25 }}
        className="text-center"
      >
        <Button asChild size="lg" className="gap-2">
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Google AI Studio
            <ArrowSquareOut className="w-4 h-4" />
          </a>
        </Button>
      </motion.div>

      {/* Info alerts */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4, duration: 0.25 }}
        className="space-y-2"
      >
        <Alert className="border-green-500/20 bg-green-500/5 py-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-sm">
            <strong>Free tier:</strong> Gemini offers generous free usage.
          </AlertDescription>
        </Alert>

        <Alert className="border-blue-500/20 bg-blue-500/5 py-2">
          <ShieldCheck className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm">
            <strong>Privacy:</strong> Your key stays in your browser only.
          </AlertDescription>
        </Alert>
      </motion.div>
    </div>
  );
}
