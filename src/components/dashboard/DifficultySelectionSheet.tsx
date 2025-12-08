"use client";

import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DifficultyLevel } from "@/lib/types";
import { Sparkle, Barbell, Trophy } from "@phosphor-icons/react";

interface DifficultySelectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: string;
  topicName: string;
}

interface DifficultyOption {
  level: DifficultyLevel;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    level: "beginner",
    label: "Beginner",
    description:
      "Foundational concepts with simple logic. Great for learning basics.",
    icon: <Sparkle weight="duotone" className="h-5 w-5" />,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30 hover:border-green-500/60",
  },
  {
    level: "intermediate",
    label: "Intermediate",
    description:
      "Combines multiple concepts. Moderate complexity with some edge cases.",
    icon: <Barbell weight="duotone" className="h-5 w-5" />,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30 hover:border-yellow-500/60",
  },
  {
    level: "advanced",
    label: "Advanced",
    description: "Complex algorithms, optimization, and tricky edge cases.",
    icon: <Trophy weight="duotone" className="h-5 w-5" />,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30 hover:border-red-500/60",
  },
];

export function DifficultySelectionSheet({
  open,
  onOpenChange,
  topicId,
  topicName,
}: DifficultySelectionSheetProps) {
  const router = useRouter();

  const handleSelect = (difficulty: DifficultyLevel) => {
    onOpenChange(false);
    router.push(`/practice?topic=${topicId}&difficulty=${difficulty}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[60vh] rounded-t-xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">Select Difficulty</SheetTitle>
          <SheetDescription>
            Choose a difficulty level for{" "}
            <span className="font-semibold">{topicName}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-3 pb-6">
          {DIFFICULTY_OPTIONS.map((option) => (
            <TooltipProvider key={option.level}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full h-auto p-4 justify-start text-left ${option.borderColor} ${option.bgColor} transition-all`}
                    onClick={() => handleSelect(option.level)}
                  >
                    <div className="flex items-start gap-4 w-full">
                      <div className={`mt-0.5 ${option.color}`}>
                        {option.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{option.label}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${option.color} border-current`}
                          >
                            {option.level}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>
                    Start {topicName} at {option.label} level
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
