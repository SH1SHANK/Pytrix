"use client";

/**
 * CompleteStep - Final step of onboarding
 * Celebration with navigation options
 */

import { useEffect, useState, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Confetti,
  House,
  GraduationCap,
  CheckCircle,
  Sparkle,
} from "@phosphor-icons/react";

interface CompleteStepProps {
  onDashboard: () => void;
  onPractice: () => void;
}

// Pre-generate confetti data to avoid Math.random during render
function generateConfettiData(count: number) {
  const colors = ["#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.5,
    left: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
}

interface ConfettiPieceData {
  id: number;
  delay: number;
  left: number;
  color: string;
}

function ConfettiPiece({ data }: { data: ConfettiPieceData }) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{
        y: 400,
        opacity: 0,
        rotate: 360,
      }}
      transition={{
        duration: 2.5,
        delay: data.delay,
        ease: "easeOut",
      }}
      className="absolute w-2 h-2 rounded-sm"
      style={{
        left: `${data.left}%`,
        backgroundColor: data.color,
      }}
    />
  );
}

export function CompleteStep({ onDashboard, onPractice }: CompleteStepProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  // Generate confetti data only once using useMemo
  const confettiData = useMemo(() => generateConfettiData(25), []);

  const fadeUp = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 8 },
    visible: { opacity: 1, y: 0 },
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="text-center space-y-6 relative overflow-hidden">
      {/* Confetti - only if motion is allowed */}
      {showConfetti && !prefersReducedMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {confettiData.map((piece) => (
            <ConfettiPiece key={piece.id} data={piece} />
          ))}
        </div>
      )}

      {/* Success icon */}
      <motion.div
        initial={{ scale: prefersReducedMotion ? 1 : 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex justify-center relative z-10"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30">
          <CheckCircle weight="duotone" className="w-10 h-10 text-green-500" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.15, duration: 0.25 }}
        className="relative z-10"
      >
        <h3 className="text-3xl md:text-4xl font-bold tracking-tight">
          You&apos;re Ready! 🎉
        </h3>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2, duration: 0.25 }}
        className="text-lg text-muted-foreground max-w-md mx-auto relative z-10"
      >
        Your Pytrix setup is complete. Time to start mastering Python!
      </motion.p>

      {/* Features summary */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.25, duration: 0.25 }}
        className="flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap relative z-10"
      >
        <span className="flex items-center gap-1.5">
          <Sparkle weight="fill" className="w-4 h-4 text-yellow-500" />
          AI Ready
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle weight="fill" className="w-4 h-4 text-green-500" />
          Key Verified
        </span>
        <span className="flex items-center gap-1.5">
          <Confetti weight="fill" className="w-4 h-4 text-purple-500" />
          Let&apos;s Go!
        </span>
      </motion.div>

      {/* CTA buttons */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3, duration: 0.25 }}
        className="flex flex-col sm:flex-row gap-3 justify-center pt-2 relative z-10"
      >
        <Button size="lg" onClick={onPractice} className="gap-2">
          <GraduationCap className="w-5 h-5" />
          Start Practicing
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={onDashboard}
          className="gap-2"
        >
          <House className="w-5 h-5" />
          Go to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}
