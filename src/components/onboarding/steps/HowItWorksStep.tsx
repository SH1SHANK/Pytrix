"use client";

/**
 * HowItWorksStep - Second step of onboarding
 * Shows key features of Pytrix
 */

import { motion, useReducedMotion } from "motion/react";
import { Lightning, GraduationCap, Sparkle, Code } from "@phosphor-icons/react";

const features = [
  {
    icon: GraduationCap,
    title: "Manual Practice",
    description: "Choose topics, difficulties, and learn at your own pace",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Lightning,
    title: "Auto Mode",
    description: "Rapid-fire questions with instant prefetching",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    icon: Sparkle,
    title: "AI Feedback",
    description: "Get hints, explanations, and optimal solutions",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: Code,
    title: "Local Execution",
    description: "Run Python in your browser with Pyodide",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
];

export function HowItWorksStep() {
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
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
          How Pytrix Works
        </h3>
        <p className="text-muted-foreground">
          Everything you need to master Python
        </p>
      </motion.div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.15 + index * 0.05, duration: 0.25 }}
            className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border/50"
          >
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${feature.bg}`}
            >
              <feature.icon
                weight="duotone"
                className={`w-5 h-5 ${feature.color}`}
              />
            </div>
            <div>
              <h4 className="font-semibold mb-0.5">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
