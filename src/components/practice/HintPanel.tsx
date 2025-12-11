"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Lock, Lightbulb, SpinnerGap } from "@phosphor-icons/react";

interface HintPanelProps {
  hint1: string | null;
  hint2: string | null;
  onRequestHint: (hintNumber: 1 | 2) => Promise<void>;
  isGenerating: boolean;
  isLoading?: boolean;
}

export function HintPanel({
  hint1,
  hint2,
  onRequestHint,
  isGenerating,
  isLoading = false,
}: HintPanelProps) {
  const [activeTab, setActiveTab] = useState<1 | 2>(1);

  const isHint1Unlocked = hint1 !== null;
  const isHint2Unlocked = hint2 !== null;
  const currentHintContent = activeTab === 1 ? hint1 : hint2;
  const isCurrentTabUnlocked =
    activeTab === 1 ? isHint1Unlocked : isHint2Unlocked;

  const handleShowHint = async () => {
    await onRequestHint(activeTab);
  };

  if (isLoading) {
    return (
      <div className="border-t bg-muted/30 p-3 space-y-2 animate-pulse">
        <div className="flex gap-2">
          <div className="h-7 w-16 bg-muted rounded" />
          <div className="h-7 w-16 bg-muted rounded" />
        </div>
        <div className="h-16 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="border-t bg-muted/30 shrink-0">
      {/* Tab header */}
      <div className="flex items-center border-b px-2 pt-2 gap-1">
        {/* Hint 1 Tab */}
        <button
          onClick={() => setActiveTab(1)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors",
            activeTab === 1
              ? "bg-background border border-b-0 text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {isHint1Unlocked ? (
            <Lightbulb weight="fill" className="h-3.5 w-3.5 text-yellow-500" />
          ) : (
            <Lock weight="fill" className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span>Hint 1</span>
        </button>

        {/* Hint 2 Tab */}
        <button
          onClick={() => setActiveTab(2)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors",
            activeTab === 2
              ? "bg-background border border-b-0 text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {isHint2Unlocked ? (
            <Lightbulb weight="fill" className="h-3.5 w-3.5 text-yellow-500" />
          ) : (
            <Lock weight="fill" className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span>Hint 2</span>
        </button>
      </div>

      {/* Tab content */}
      <div className="p-3 min-h-[80px]">
        {isCurrentTabUnlocked ? (
          <div className="text-sm text-foreground leading-relaxed">
            {currentHintContent}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-2">
            <p className="text-xs text-muted-foreground text-center">
              {activeTab === 1
                ? "Need a nudge in the right direction?"
                : "Still stuck? Get another hint."}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleShowHint}
              disabled={isGenerating || (activeTab === 2 && !isHint1Unlocked)}
              className="gap-1.5"
            >
              {isGenerating ? (
                <>
                  <SpinnerGap className="h-3.5 w-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Lightbulb weight="duotone" className="h-3.5 w-3.5" />
                  Show Hint {activeTab}
                </>
              )}
            </Button>
            {activeTab === 2 && !isHint1Unlocked && (
              <p className="text-xs text-muted-foreground/60">
                Unlock Hint 1 first
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
