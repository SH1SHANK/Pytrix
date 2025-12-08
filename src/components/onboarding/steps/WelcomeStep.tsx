"use client";

/**
 * WelcomeStep - First step of onboarding
 * Shows Pytrix branding and welcome message
 */

import { motion, useReducedMotion } from "motion/react";
import { Code, Sparkle } from "@phosphor-icons/react";

export function WelcomeStep() {
  const prefersReducedMotion = useReducedMotion();

  const fadeUp = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 12 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="text-center space-y-6">
      {/* Logo */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex justify-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20">
          <Code weight="duotone" className="w-10 h-10 text-primary" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        <h3 className="text-3xl md:text-4xl font-bold tracking-tight">
          Welcome to <span className="text-primary">Pytrix</span>
        </h3>
      </motion.div>

      {/* Tagline */}
      <motion.p
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-lg text-muted-foreground max-w-md mx-auto"
      >
        Supercharge your Python learning with AI-powered practice and instant
        feedback.
      </motion.p>

      {/* Features preview */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.25, duration: 0.3 }}
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground flex-wrap"
      >
        <Sparkle weight="duotone" className="w-4 h-4 text-yellow-500" />
        <span>AI-Generated Questions</span>
        <span className="text-muted-foreground/40">•</span>
        <span>Local Execution</span>
        <span className="text-muted-foreground/40">•</span>
        <span>Privacy-First</span>
      </motion.div>

      {/* CTA - centered below content */}
      <motion.p
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3, duration: 0.3 }}
        className="text-sm text-muted-foreground pt-4"
      >
        Click <strong>Next</strong> to begin setup, or press{" "}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
          →
        </kbd>{" "}
        on your keyboard
      </motion.p>
    </div>
  );
}
