"use client";

/**
 * Practice By Problem Type View
 *
 * The compact dropdown-based problem type selector (legacy view).
 * Wrapped as a toggleable component for the manual practice page.
 */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getAllModules } from "@/lib/topicsStore";
import { getTemplateQuestion } from "@/lib/questionService";
import type { Difficulty } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Sparkle,
  CaretRight,
  Lightning,
  Brain,
  Rocket,
} from "@phosphor-icons/react";
import { toast } from "sonner";

interface PracticeByProblemTypeViewProps {
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
}

export function PracticeByProblemTypeView({
  difficulty,
  onDifficultyChange,
}: PracticeByProblemTypeViewProps) {
  const router = useRouter();
  const modules = useMemo(() => getAllModules(), []);

  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string>("");
  const [selectedProblemTypeId, setSelectedProblemTypeId] =
    useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Get current selections
  const selectedModule = useMemo(
    () => modules.find((m) => m.id === selectedModuleId),
    [modules, selectedModuleId]
  );

  const selectedSubtopic = useMemo(
    () => selectedModule?.subtopics.find((st) => st.id === selectedSubtopicId),
    [selectedModule, selectedSubtopicId]
  );

  const selectedProblemType = useMemo(
    () =>
      selectedSubtopic?.problemTypes.find(
        (pt) => pt.id === selectedProblemTypeId
      ),
    [selectedSubtopic, selectedProblemTypeId]
  );

  // Reset dependent selections when parent changes
  const handleModuleChange = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setSelectedSubtopicId("");
    setSelectedProblemTypeId("");
  };

  const handleSubtopicChange = (subtopicId: string) => {
    setSelectedSubtopicId(subtopicId);
    setSelectedProblemTypeId("");
  };

  const handleGenerate = async () => {
    if (!selectedModule || !selectedSubtopic || !selectedProblemType) {
      return;
    }

    setIsGenerating(true);

    try {
      const question = getTemplateQuestion(selectedProblemTypeId, difficulty);

      if (!question) {
        toast.error("Failed to generate question for this problem type.");
        setIsGenerating(false);
        return;
      }

      // Store generated question in sessionStorage for the practice page
      sessionStorage.setItem("pendingQuestion", JSON.stringify({ question }));

      // Navigate to practice page
      router.push(
        `/practice?mode=manual&module=${encodeURIComponent(
          selectedModuleId
        )}&subtopic=${encodeURIComponent(
          selectedSubtopicId
        )}&problemType=${encodeURIComponent(
          selectedProblemTypeId
        )}&difficulty=${difficulty}`
      );
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("Failed to generate question.");
      setIsGenerating(false);
    }
  };

  const canGenerate =
    selectedModuleId &&
    selectedSubtopicId &&
    selectedProblemTypeId &&
    !isGenerating;

  return (
    <div className="flex items-start justify-center min-h-[60vh] pt-8">
      <Card className="w-full max-w-xl border-2 shadow-lg">
        <CardHeader className="pb-2 text-center border-b bg-muted/30">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Sparkle weight="duotone" className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">Generate Practice Question</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Select a specific problem type to practice
          </p>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          {/* Module Selection */}
          <div className="space-y-2">
            <Label htmlFor="module-select" className="text-sm font-medium">
              1. Choose Module
            </Label>
            <Select value={selectedModuleId} onValueChange={handleModuleChange}>
              <SelectTrigger id="module-select" className="h-11">
                <SelectValue placeholder="Select a module..." />
              </SelectTrigger>
              <SelectContent>
                {modules.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        {module.order.toString().padStart(2, "0")}
                      </span>
                      {module.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subtopic Selection */}
          <div className="space-y-2">
            <Label htmlFor="subtopic-select" className="text-sm font-medium">
              2. Choose Subtopic
            </Label>
            <Select
              value={selectedSubtopicId}
              onValueChange={handleSubtopicChange}
              disabled={!selectedModule}
            >
              <SelectTrigger id="subtopic-select" className="h-11">
                <SelectValue
                  placeholder={
                    selectedModule
                      ? "Select a subtopic..."
                      : "Select a module first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {selectedModule?.subtopics.map((subtopic) => (
                  <SelectItem key={subtopic.id} value={subtopic.id}>
                    <span className="flex items-center gap-2">
                      {subtopic.sectionNumber && (
                        <span className="text-xs text-muted-foreground">
                          {subtopic.sectionNumber}
                        </span>
                      )}
                      {subtopic.name}
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {subtopic.problemTypes.length}
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Problem Type Selection */}
          <div className="space-y-2">
            <Label
              htmlFor="problem-type-select"
              className="text-sm font-medium"
            >
              3. Choose Problem Type
            </Label>
            <Select
              value={selectedProblemTypeId}
              onValueChange={setSelectedProblemTypeId}
              disabled={!selectedSubtopic}
            >
              <SelectTrigger id="problem-type-select" className="h-11">
                <SelectValue
                  placeholder={
                    selectedSubtopic
                      ? "Select a problem type..."
                      : "Select a subtopic first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {selectedSubtopic?.problemTypes.map((pt) => (
                  <SelectItem key={pt.id} value={pt.id}>
                    {pt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">4. Select Difficulty</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={difficulty === "beginner" ? "default" : "outline"}
                size="sm"
                onClick={() => onDifficultyChange("beginner")}
                className="h-10"
              >
                <Lightning weight="duotone" className="h-4 w-4 mr-1.5" />
                Beginner
              </Button>
              <Button
                type="button"
                variant={difficulty === "intermediate" ? "default" : "outline"}
                size="sm"
                onClick={() => onDifficultyChange("intermediate")}
                className="h-10"
              >
                <Brain weight="duotone" className="h-4 w-4 mr-1.5" />
                Intermediate
              </Button>
              <Button
                type="button"
                variant={difficulty === "advanced" ? "default" : "outline"}
                size="sm"
                onClick={() => onDifficultyChange("advanced")}
                className="h-10"
              >
                <Rocket weight="duotone" className="h-4 w-4 mr-1.5" />
                Advanced
              </Button>
            </div>
          </div>

          {/* Breadcrumb Preview */}
          {selectedProblemType && (
            <div className="bg-muted/50 p-3 rounded-lg border">
              <p className="text-xs text-muted-foreground mb-2">
                Your selection:
              </p>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <span className="text-sm text-muted-foreground truncate">
                      {selectedModule?.name}
                    </span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span className="text-sm text-muted-foreground truncate">
                      {selectedSubtopic?.name}
                    </span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-sm font-medium">
                      {selectedProblemType.name}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          )}

          {/* Generate Button */}
          <Button
            className="w-full h-12 text-base font-medium"
            size="lg"
            onClick={handleGenerate}
            disabled={!canGenerate}
          >
            {isGenerating ? (
              <>Generating...</>
            ) : (
              <>
                Generate Question
                <CaretRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
