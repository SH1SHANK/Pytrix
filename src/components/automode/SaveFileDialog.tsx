"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Trash2,
  Play,
  Plus,
  Clock,
  Download,
  Upload,
  FileDown,
} from "lucide-react";
import {
  getSaveFiles,
  createSaveFile,
  deleteSaveFile,
  getSaveFileSummary,
  AutoModeSaveFile,
  exportRun,
  exportAllRuns,
  importRuns,
} from "@/lib/autoModeService";
import { toast } from "sonner";

interface SaveFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveFileDialog({ open, onOpenChange }: SaveFileDialogProps) {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newRunName, setNewRunName] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute save files synchronously when dialog opens (or after a delete)
  const saveFiles = useMemo<AutoModeSaveFile[]>(() => {
    if (!open) return [];
    return getSaveFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, refreshKey]);

  // Determine if we should show create new based on files
  const shouldShowCreateNew = showCreateNew || saveFiles.length === 0;

  // Trigger a refresh of save files
  const refreshFiles = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleContinue = () => {
    if (selectedId) {
      router.push(`/practice?mode=auto&saveId=${selectedId}`);
      onOpenChange(false);
    }
  };

  const handleCreateNew = () => {
    const saveFile = createSaveFile(newRunName);
    router.push(`/practice?mode=auto&saveId=${saveFile.id}`);
    onOpenChange(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSaveFile(id);
    refreshFiles();
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  // Download a JSON file
  const downloadJson = (data: object, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export single run
  const handleExportRun = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const data = exportRun(id);
    if (data) {
      const safeName = name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      downloadJson(data, `pypractice-run-${safeName}.json`);
      toast.success("Run exported");
    }
  };

  // Export all runs
  const handleExportAll = () => {
    const data = exportAllRuns();
    if (data.runs.length === 0) {
      toast.error("No runs to export");
      return;
    }
    const date = new Date().toISOString().split("T")[0];
    downloadJson(data, `pypractice-all-runs-${date}.json`);
    toast.success(`Exported ${data.runs.length} runs`);
  };

  // Import runs from file
  const handleImportRuns = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const result = importRuns(data);

        if (result.errors.length > 0) {
          toast.error(result.errors[0]);
        } else if (result.imported === 0) {
          toast.info("No new runs imported (all skipped as duplicates)");
        } else {
          toast.success(
            `Imported ${result.imported} run${result.imported > 1 ? "s" : ""}${
              result.skipped > 0 ? `, ${result.skipped} skipped` : ""
            }`
          );
          refreshFiles();
          setShowCreateNew(false);
        }
      } catch {
        toast.error("Failed to parse import file");
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Auto Mode</DialogTitle>
          <DialogDescription>
            {saveFiles.length > 0
              ? "Continue a previous run or start fresh."
              : "Start a new Auto Mode run to practice adaptively."}
          </DialogDescription>
        </DialogHeader>

        {/* Hidden file input for import */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleImportRuns}
          className="hidden"
        />

        {!shouldShowCreateNew ? (
          <>
            <ScrollArea className="max-h-[300px] pr-4">
              <div className="space-y-2">
                {saveFiles.map((file) => (
                  <Card
                    key={file.id}
                    className={`p-3 cursor-pointer transition-colors hover:border-primary/50 ${
                      selectedId === file.id
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => setSelectedId(file.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">{file.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(file.lastUpdatedAt)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getSaveFileSummary(file)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary">
                          {file.completedQuestions} done
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) =>
                            handleExportRun(file.id, file.name, e)
                          }
                          title="Export run"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => handleDelete(file.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleExportAll}
                  title="Export all runs"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  title="Import runs"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setShowCreateNew(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Run
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={handleContinue}
                disabled={!selectedId}
              >
                <Play className="h-4 w-4 mr-2" />
                Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label
                  htmlFor="run-name"
                  className="text-sm font-medium leading-none"
                >
                  Run Name (optional)
                </label>
                <Input
                  id="run-name"
                  placeholder="e.g., Morning Practice"
                  value={newRunName}
                  onChange={(e) => setNewRunName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateNew()}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Auto Mode will adapt questions based on your performance,
                focusing on your weakest topics first.
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                title="Import runs"
              >
                <Upload className="h-4 w-4" />
              </Button>
              {saveFiles.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setShowCreateNew(false)}
                >
                  Back to Runs
                </Button>
              )}
              <Button className="w-full sm:w-auto" onClick={handleCreateNew}>
                <Play className="h-4 w-4 mr-2" />
                Start Run
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
