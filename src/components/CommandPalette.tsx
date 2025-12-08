"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  House,
  Target,
  Lightning,
  FloppyDisk,
  Gauge,
  Question,
  Bug,
  Play,
  ArrowRight,
  ArrowClockwise,
  Trash,
  Export,
  UploadSimple,
  Keyboard,
  Code,
  ListBullets,
  Book,
  CirclesThree,
  Function as FunctionIcon,
  Database,
  Tree,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { resetStats } from "@/lib/statsStore";
import { getSaveFiles, exportAllRuns, importRuns } from "@/lib/autoModeService";

interface CommandPaletteProps {
  // Optional: external control of open state
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({
  open: controlledOpen,
  onOpenChange,
}: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  // Global Cmd/Ctrl+K listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    [setOpen]
  );

  // Get last save file for "Continue Last Run"
  const saveFiles = typeof window !== "undefined" ? getSaveFiles() : [];
  const lastRun =
    saveFiles.length > 0
      ? saveFiles.sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt)[0]
      : null;

  // Import runs handler
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          const result = importRuns(data);
          if (result.imported > 0) {
            toast.success(`Imported ${result.imported} runs`);
          } else {
            toast.info("No new runs imported");
          }
        } catch {
          toast.error("Failed to import");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Export runs handler
  const handleExport = () => {
    const data = exportAllRuns();
    if (data.runs.length === 0) {
      toast.error("No runs to export");
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pypractice-runs-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${data.runs.length} runs`);
  };

  const isPracticePage = pathname === "/practice";

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* ==================== NAVIGATION ==================== */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
            <House weight="duotone" className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/practice?topic=Strings"))
            }
          >
            <Target weight="duotone" className="mr-2 h-4 w-4" />
            <span>Manual Practice</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                // Open Auto Mode dialog - navigate to dashboard
                router.push("/");
                toast.info("Click 'Start Auto Mode' on dashboard");
              })
            }
          >
            <Lightning weight="duotone" className="mr-2 h-4 w-4" />
            <span>Auto Mode</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                router.push("/");
                toast.info("Click 'Start Auto Mode' to view saved runs");
              })
            }
          >
            <FloppyDisk weight="duotone" className="mr-2 h-4 w-4" />
            <span>Saved Runs</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                router.push("/");
                // Focus on API Usage card
              })
            }
          >
            <Gauge weight="duotone" className="mr-2 h-4 w-4" />
            <span>API Usage</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                // Trigger help sheet - it's on dashboard
                router.push("/");
                toast.info("Click Help icon (?) in top-right");
              })
            }
          >
            <Question weight="duotone" className="mr-2 h-4 w-4" />
            <span>Help & Docs</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                window.open("https://github.com/issues", "_blank");
              })
            }
          >
            <Bug weight="duotone" className="mr-2 h-4 w-4" />
            <span>Report a Bug</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* ==================== AUTO MODE ACTIONS ==================== */}
        <CommandGroup heading="Auto Mode">
          {lastRun && (
            <CommandItem
              onSelect={() =>
                runCommand(() => {
                  router.push(`/practice?mode=auto&saveId=${lastRun.id}`);
                })
              }
            >
              <Play weight="duotone" className="mr-2 h-4 w-4 text-green-500" />
              <span>Continue Last Run</span>
              <CommandShortcut>{lastRun.name}</CommandShortcut>
            </CommandItem>
          )}
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                router.push("/");
                toast.info("Click 'Start Auto Mode' then 'New Run'");
              })
            }
          >
            <Lightning weight="duotone" className="mr-2 h-4 w-4 text-primary" />
            <span>Start New Run</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* ==================== JUMP TO TOPIC ==================== */}
        <CommandGroup heading="Jump to Topic">
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/practice?topic=Strings"))
            }
          >
            <Code weight="duotone" className="mr-2 h-4 w-4" />
            <span>Strings</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/practice?topic=Lists"))
            }
          >
            <ListBullets weight="duotone" className="mr-2 h-4 w-4" />
            <span>Lists</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/practice?topic=Dictionaries"))
            }
          >
            <Database weight="duotone" className="mr-2 h-4 w-4" />
            <span>Dictionaries</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/practice?topic=Sets"))
            }
          >
            <CirclesThree weight="duotone" className="mr-2 h-4 w-4" />
            <span>Sets</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/practice?topic=Functions"))
            }
          >
            <FunctionIcon weight="duotone" className="mr-2 h-4 w-4" />
            <span>Functions</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/practice?topic=OOP"))
            }
          >
            <Tree weight="duotone" className="mr-2 h-4 w-4" />
            <span>OOP</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/practice?topic=Pandas"))
            }
          >
            <Book weight="duotone" className="mr-2 h-4 w-4" />
            <span>Pandas</span>
          </CommandItem>
        </CommandGroup>

        {isPracticePage && (
          <>
            <CommandSeparator />

            {/* ==================== PRACTICE COMMANDS ==================== */}
            <CommandGroup heading="Practice">
              <CommandItem
                onSelect={() =>
                  runCommand(() => {
                    // Simulate Ctrl+Enter
                    document.dispatchEvent(
                      new KeyboardEvent("keydown", {
                        key: "Enter",
                        ctrlKey: true,
                        bubbles: true,
                      })
                    );
                  })
                }
              >
                <Play weight="duotone" className="mr-2 h-4 w-4" />
                <span>Run & Check</span>
                <CommandShortcut>⌘↵</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(() => {
                    toast.info("Click 'Next' button after solving");
                  })
                }
              >
                <ArrowRight weight="duotone" className="mr-2 h-4 w-4" />
                <span>Next Question</span>
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(() => {
                    toast.info("Click 'New' button to regenerate");
                  })
                }
              >
                <ArrowClockwise weight="duotone" className="mr-2 h-4 w-4" />
                <span>Regenerate Question</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        {/* ==================== APP CONTROLS ==================== */}
        <CommandGroup heading="Controls">
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                resetStats();
                toast.success("All stats reset");
                if (pathname === "/") {
                  window.location.reload();
                }
              })
            }
          >
            <Trash weight="duotone" className="mr-2 h-4 w-4 text-red-500" />
            <span>Reset All Stats</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(handleImport)}>
            <UploadSimple weight="duotone" className="mr-2 h-4 w-4" />
            <span>Import Save Files</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(handleExport)}>
            <Export weight="duotone" className="mr-2 h-4 w-4" />
            <span>Export Runs</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                toast(
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Keyboard Shortcuts:</strong>
                    </p>
                    <p>
                      <kbd className="font-mono bg-muted px-1 rounded">⌘K</kbd>{" "}
                      Command Palette
                    </p>
                    <p>
                      <kbd className="font-mono bg-muted px-1 rounded">⌘↵</kbd>{" "}
                      Run & Check
                    </p>
                    <p>
                      <kbd className="font-mono bg-muted px-1 rounded">⌘⇧H</kbd>{" "}
                      Get Hint
                    </p>
                  </div>,
                  { duration: 5000 }
                );
              })
            }
          >
            <Keyboard weight="duotone" className="mr-2 h-4 w-4" />
            <span>Keyboard Shortcuts</span>
            <CommandShortcut>⌘K</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
