"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AutoRunV2 } from "@/lib/auto-mode/autoRunTypes";
import {
  deleteAutoRunV2,
  updateRunName,
  exportRunToJSON,
  importRunFromJSON,
  saveRun,
} from "@/lib/auto-mode";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DotsThreeVertical,
  Play,
  PencilSimple,
  DownloadSimple,
  Trash,
  UploadSimple,
  FolderOpen,
} from "@phosphor-icons/react"; // Using available icons
import { toast } from "sonner";

interface RunListPanelProps {
  runs: AutoRunV2[];
  activeRunId: string | null;
  onRunsChanged: () => void;
}

export function RunListPanel({
  runs,
  activeRunId,
  onRunsChanged,
}: RunListPanelProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rename Dialog State
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [runToRename, setRunToRename] = useState<AutoRunV2 | null>(null);
  const [newName, setNewName] = useState("");

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [runToDelete, setRunToDelete] = useState<AutoRunV2 | null>(null);

  const handleOpenRun = (run: AutoRunV2) => {
    // Ensure it's active
    if (run.status !== "active") {
      run.status = "active";
      saveRun(run);
    }
    router.push(`/practice?mode=auto&saveId=${run.id}`);
  };

  const handleRenameClick = (run: AutoRunV2) => {
    setRunToRename(run);
    setNewName(run.name);
    setRenameDialogOpen(true);
  };

  const confirmRename = () => {
    if (runToRename && newName.trim()) {
      updateRunName(runToRename.id, newName);
      toast.success("Run renamed");
      setRenameDialogOpen(false);
      onRunsChanged();
    }
  };

  const handleDeleteClick = (run: AutoRunV2) => {
    setRunToDelete(run);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (runToDelete) {
      deleteAutoRunV2(runToDelete.id);
      toast.success("Run deleted");
      setDeleteDialogOpen(false);
      onRunsChanged();
    }
  };

  const handleExport = (run: AutoRunV2) => {
    const json = exportRunToJSON(run);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pytrix-run-${run.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Run exported");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importRunFromJSON(content);
        if ("error" in result) {
          toast.error(result.error);
        } else {
          toast.success(`Imported run: ${result.name}`);
          onRunsChanged();
        }
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  if (runs.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
        <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="text-sm font-medium">No runs found</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Start a new adaptive run to see it here.
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={handleImportClick}>
            <UploadSimple className="mr-2 h-4 w-4" />
            Import Run
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleFileChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Recent Runs
          <Badge variant="secondary" className="text-xs font-normal">
            {runs.length}
          </Badge>
        </h2>
        <div>
          <Button variant="outline" size="sm" onClick={handleImportClick}>
            <UploadSimple className="mr-2 h-4 w-4" />
            Import Run
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Run Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="text-right">Last Active</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id} className="group">
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-2">
                      {run.name}
                      {activeRunId === run.id && (
                        <Badge
                          variant="default"
                          className="text-[10px] h-4 px-1"
                        >
                          Active
                        </Badge>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ID: {run.id.slice(0, 8)}...
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      run.status === "completed" ? "secondary" : "outline"
                    }
                    className="capitalize font-normal"
                  >
                    {run.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {run.completedQuestions} questions
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg Streak: {run.streak}
                  </div>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {new Date(run.lastUpdatedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <DotsThreeVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenRun(run)}>
                        <Play className="mr-2 h-4 w-4" />
                        Open / Resume
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRenameClick(run)}>
                        <PencilSimple className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport(run)}>
                        <DownloadSimple className="mr-2 h-4 w-4" />
                        Export JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                        onClick={() => handleDeleteClick(run)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Run</DialogTitle>
            <DialogDescription>
              Enter a new name for this practice run.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="My Awesome Run"
              onKeyDown={(e) => e.key === "Enter" && confirmRename()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Run?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {runToDelete?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
