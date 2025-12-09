"use client";

/**
 * Topic Picker - Hierarchical Module → Subtopic → ProblemType selection
 *
 * Provides a three-level cascading selection using the new topics hierarchy.
 */

import { useState, useMemo } from "react";
import { getAllModules } from "@/lib/topicsStore";
import { type Difficulty } from "@/lib/types";
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
  Sparkle,
  CaretRight,
  Lightning,
  Brain,
  Rocket,
} from "@phosphor-icons/react";

export interface TopicSelection {
  moduleId: string;
  moduleName: string;
  subtopicId: string;
  subtopicName: string;
  problemTypeId: string;
  problemTypeName: string;
}

interface TopicPickerProps {
  onGenerate: (selection: TopicSelection, difficulty: Difficulty) => void;
  isLoading?: boolean;
}

export function TopicPicker({ onGenerate, isLoading }: TopicPickerProps) {
  const modules = useMemo(() => getAllModules(), []);

  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string>("");
  const [selectedProblemTypeId, setSelectedProblemTypeId] =
    useState<string>("");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");

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

  const handleGenerate = () => {
    if (!selectedModule || !selectedSubtopic || !selectedProblemType) {
      return;
    }

    onGenerate(
      {
        moduleId: selectedModule.id,
        moduleName: selectedModule.name,
        subtopicId: selectedSubtopic.id,
        subtopicName: selectedSubtopic.name,
        problemTypeId: selectedProblemType.id,
        problemTypeName: selectedProblemType.name,
      },
      difficulty
    );
  };

  const canGenerate =
    selectedModuleId &&
    selectedSubtopicId &&
    selectedProblemTypeId &&
    !isLoading;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Sparkle weight="duotone" className="h-5 w-5 text-primary" />
          Generate Practice Question
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Module Selection */}
        <div className="space-y-2">
          <Label htmlFor="module-select">Module</Label>
          <Select value={selectedModuleId} onValueChange={handleModuleChange}>
            <SelectTrigger id="module-select">
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
          <Label htmlFor="subtopic-select">Subtopic</Label>
          <Select
            value={selectedSubtopicId}
            onValueChange={handleSubtopicChange}
            disabled={!selectedModule}
          >
            <SelectTrigger id="subtopic-select">
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
          <Label htmlFor="problem-type-select">Problem Type</Label>
          <Select
            value={selectedProblemTypeId}
            onValueChange={setSelectedProblemTypeId}
            disabled={!selectedSubtopic}
          >
            <SelectTrigger id="problem-type-select">
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
          <Label>Difficulty</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={difficulty === "beginner" ? "default" : "outline"}
              size="sm"
              onClick={() => setDifficulty("beginner")}
              className="flex-1"
            >
              <Lightning weight="duotone" className="h-4 w-4 mr-1" />
              Beginner
            </Button>
            <Button
              type="button"
              variant={difficulty === "intermediate" ? "default" : "outline"}
              size="sm"
              onClick={() => setDifficulty("intermediate")}
              className="flex-1"
            >
              <Brain weight="duotone" className="h-4 w-4 mr-1" />
              Intermediate
            </Button>
            <Button
              type="button"
              variant={difficulty === "advanced" ? "default" : "outline"}
              size="sm"
              onClick={() => setDifficulty("advanced")}
              className="flex-1"
            >
              <Rocket weight="duotone" className="h-4 w-4 mr-1" />
              Advanced
            </Button>
          </div>
        </div>

        {/* Breadcrumb Preview */}
        {selectedProblemType && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
            <span className="truncate">{selectedModule?.name}</span>
            <CaretRight className="h-3 w-3 shrink-0" />
            <span className="truncate">{selectedSubtopic?.name}</span>
            <CaretRight className="h-3 w-3 shrink-0" />
            <span className="font-medium text-foreground truncate">
              {selectedProblemType.name}
            </span>
          </div>
        )}

        {/* Generate Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleGenerate}
          disabled={!canGenerate}
        >
          {isLoading ? (
            <>Generating...</>
          ) : (
            <>
              Generate Question
              <CaretRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
