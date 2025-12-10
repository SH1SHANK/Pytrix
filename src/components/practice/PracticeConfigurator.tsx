"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllModules } from "@/lib/stores/topicsStore";
import { getTemplateQuestion } from "@/lib/question/questionService";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  CaretRight,
  Lightning,
  Brain,
  Rocket,
  Faders,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PracticeConfigurator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modules = useMemo(() => getAllModules(), []);

  // Read URL params
  const urlModuleId = searchParams.get("module") || "";
  const urlSubtopicName = searchParams.get("subtopic") || "";
  const urlDifficulty =
    (searchParams.get("difficulty") as Difficulty) || "beginner";

  // Helper to find subtopic ID from name
  const findSubtopicId = (modId: string, subName: string) => {
    if (!modId || !subName) return "";
    const mod = modules.find((m) => m.id === modId);
    return mod?.subtopics.find((s) => s.name === subName)?.id || "";
  };

  // Initialize state from URL params
  const [selectedModuleId, setSelectedModuleId] = useState<string>(urlModuleId);
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string>(() =>
    findSubtopicId(urlModuleId, urlSubtopicName)
  );
  const [selectedProblemTypeId, setSelectedProblemTypeId] =
    useState<string>("");
  const [difficulty, setDifficulty] = useState<Difficulty>(urlDifficulty);
  const [isGenerating, setIsGenerating] = useState(false);

  // Find module object
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
  // Suppress unused warning
  void selectedProblemType;

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
    // If no specific problem type selected, try to pick one randomly from subtopic?
    // Requirements say "By Module/Subtopic/Problem Type".
    // Let's enforce Problem Type selection for Manual Practice to be "Precise".
    // Or we could auto-pick if user only selects Subtopic.

    let targetProblemTypeId = selectedProblemTypeId;

    if (!targetProblemTypeId && selectedSubtopic) {
      // Auto-pick a problem type if only subtopic is selected
      const types = selectedSubtopic.problemTypes;
      if (types.length > 0) {
        targetProblemTypeId =
          types[Math.floor(Math.random() * types.length)].id;
      }
    }

    if (!selectedModule || !selectedSubtopic || !targetProblemTypeId) {
      toast.error("Please select a module and subtopic.");
      return;
    }

    setIsGenerating(true);

    try {
      const question = getTemplateQuestion(targetProblemTypeId, difficulty);

      if (!question) {
        toast.error("Failed to generate question for this problem type.");
        setIsGenerating(false);
        return;
      }

      // Store generated question in sessionStorage
      sessionStorage.setItem("pendingQuestion", JSON.stringify({ question }));

      // Navigate to practice page
      router.push(
        `/practice?mode=manual&module=${encodeURIComponent(
          selectedModuleId
        )}&subtopic=${encodeURIComponent(
          selectedSubtopicId
        )}&problemType=${encodeURIComponent(
          targetProblemTypeId
        )}&difficulty=${difficulty}`
      );
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("Failed to generate question.");
      setIsGenerating(false);
    }
  };

  const canGenerate = selectedModuleId && selectedSubtopicId && !isGenerating;

  return (
    <Card className="w-full max-w-2xl border-2 shadow-xl bg-card">
      <CardHeader className="text-center pb-2 border-b bg-muted/20">
        <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit mb-2">
          <Faders weight="duotone" className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Configure Practice Session</CardTitle>
        <CardDescription>
          Customize your practice needs. Select a topic and difficulty to begin.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8 pt-8 p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* LEFT COL: Topic Selection */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
              <Badge
                variant="outline"
                className="h-5 w-5 rounded-full p-0 flex items-center justify-center"
              >
                1
              </Badge>
              Topics
            </h3>

            {/* Module Selection */}
            <div className="space-y-1.5">
              <Label
                htmlFor="module-select"
                className="text-xs font-semibold text-muted-foreground"
              >
                Module
              </Label>
              <Select
                value={selectedModuleId}
                onValueChange={handleModuleChange}
              >
                <SelectTrigger id="module-select" className="h-10">
                  <SelectValue placeholder="Select Module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subtopic Selection */}
            <div className="space-y-1.5">
              <Label
                htmlFor="subtopic-select"
                className="text-xs font-semibold text-muted-foreground"
              >
                Subtopic
              </Label>
              <Select
                value={selectedSubtopicId}
                onValueChange={handleSubtopicChange}
                disabled={!selectedModule}
              >
                <SelectTrigger id="subtopic-select" className="h-10">
                  <SelectValue placeholder="Select Subtopic" />
                </SelectTrigger>
                <SelectContent>
                  {selectedModule?.subtopics.map((subtopic) => (
                    <SelectItem key={subtopic.id} value={subtopic.id}>
                      {subtopic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Problem Type Selection */}
            <div className="space-y-1.5">
              <Label
                htmlFor="type-select"
                className="text-xs font-semibold text-muted-foreground"
              >
                Problem Type (Optional)
              </Label>
              <Select
                value={selectedProblemTypeId}
                onValueChange={setSelectedProblemTypeId}
                disabled={!selectedSubtopic}
              >
                <SelectTrigger id="type-select" className="h-10">
                  <SelectValue placeholder="Any Type" />
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
          </div>

          {/* RIGHT COL: Difficulty & Preview */}
          <div className="space-y-6 flex flex-col">
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                <Badge
                  variant="outline"
                  className="h-5 w-5 rounded-full p-0 flex items-center justify-center"
                >
                  2
                </Badge>
                Difficulty
              </h3>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setDifficulty("beginner")}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md border text-left transition-all hover:bg-muted",
                    difficulty === "beginner"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border"
                  )}
                >
                  <Lightning
                    weight="duotone"
                    className="h-5 w-5 text-green-500 shrink-0"
                  />
                  <div>
                    <div className="font-medium text-sm">Beginner</div>
                    <div className="text-[10px] text-muted-foreground">
                      Fundamentals & basic syntax
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDifficulty("intermediate")}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md border text-left transition-all hover:bg-muted",
                    difficulty === "intermediate"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border"
                  )}
                >
                  <Brain
                    weight="duotone"
                    className="h-5 w-5 text-yellow-500 shrink-0"
                  />
                  <div>
                    <div className="font-medium text-sm">Intermediate</div>
                    <div className="text-[10px] text-muted-foreground">
                      Logic & common patterns
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDifficulty("advanced")}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md border text-left transition-all hover:bg-muted",
                    difficulty === "advanced"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border"
                  )}
                >
                  <Rocket
                    weight="duotone"
                    className="h-5 w-5 text-red-500 shrink-0"
                  />
                  <div>
                    <div className="font-medium text-sm">Advanced</div>
                    <div className="text-[10px] text-muted-foreground">
                      Complex optimization
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex-1"></div>

            {/* Preview Box */}
            {selectedSubtopic && (
              <div className="bg-muted/40 rounded-lg p-3 border text-xs">
                <div className="font-medium mb-1 text-muted-foreground">
                  Ready to generate:
                </div>
                <div className="font-semibold text-foreground flex flex-wrap gap-1 items-center">
                  {selectedSubtopic.name}
                  <span className="text-muted-foreground">•</span>
                  <span
                    className={cn(
                      difficulty === "beginner"
                        ? "text-green-600"
                        : difficulty === "intermediate"
                        ? "text-yellow-600"
                        : "text-red-600"
                    )}
                  >
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <Button
          className="w-full h-12 text-base font-medium shadow-md mt-4"
          size="lg"
          onClick={handleGenerate}
          disabled={!canGenerate}
        >
          {isGenerating ? (
            <>Generating...</>
          ) : (
            <>
              Start Practice Session
              <CaretRight weight="bold" className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
