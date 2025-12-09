"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AutoModeSaveFile,
  getCurrentTopic,
  getNextTopic,
  getTopicProgress,
} from "@/lib/autoModeService";
import { CaretRight, Target, Lightning } from "@phosphor-icons/react";

interface AutoModeStatsBarProps {
  saveFile: AutoModeSaveFile;
}

export function AutoModeStatsBar({ saveFile }: AutoModeStatsBarProps) {
  const currentTopic = getCurrentTopic(saveFile);
  const nextTopic = getNextTopic(saveFile);
  const progress = getTopicProgress(saveFile);

  return (
    <div className="bg-primary/5 border-b px-4 py-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        {/* Current Topic */}
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Topic:</span>
          <Badge variant="default" className="font-semibold">
            {currentTopic.problemTypeName}
          </Badge>
        </div>

        {/* Questions in Topic */}
        <div className="flex items-center gap-2">
          <Lightning className="h-4 w-4 text-yellow-500" />
          <span className="text-muted-foreground">In Topic:</span>
          <span className="font-medium">
            {progress.current} / {progress.total}
          </span>
        </div>

        {/* Progress to Next Topic */}
        <div className="flex items-center gap-2 flex-1 max-w-[200px]">
          <Progress value={progress.percent} className="h-2" />
        </div>

        {/* Next Topic */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <CaretRight className="h-4 w-4" />
          <span>Next:</span>
          <Badge variant="outline">{nextTopic.problemTypeName}</Badge>
        </div>

        {/* Total Completed */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Total:</span>
          <Badge variant="secondary" className="font-bold">
            {saveFile.completedQuestions}
          </Badge>
        </div>
      </div>
    </div>
  );
}
