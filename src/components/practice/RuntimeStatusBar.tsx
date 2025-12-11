"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import {
  initPyodide,
  subscribeToRuntimeStatus,
  getRuntimeInfo,
  type RuntimeInfo,
} from "@/lib/runtime/pythonRuntime";
import { RuntimeStatus } from "@/lib/runtime/runtimeConfig";
import {
  CircleNotch,
  CheckCircle,
  Warning,
  Play,
  CloudArrowDown,
  Timer,
  ArrowsClockwise,
  Info,
  CaretDown,
  CaretUp,
  HardDrives,
  Lightning,
} from "@phosphor-icons/react";

// Status configuration with type safety
const STATUS_CONFIG = {
  unloaded: {
    icon: CloudArrowDown,
    text: "Not loaded",
    color: "text-muted-foreground",
    bgColor: "bg-muted-foreground/10",
    animate: "",
  },
  loading: {
    icon: CircleNotch,
    text: "Initializing",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    animate: "animate-spin",
  },
  ready: {
    icon: CheckCircle,
    text: "Ready",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    animate: "",
  },
  running: {
    icon: Play,
    text: "Running",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    animate: "animate-pulse",
  },
  error: {
    icon: Warning,
    text: "Error",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    animate: "",
  },
} as const;

interface RuntimeStatusBarProps {
  onReady?: () => void;
  executionTimeMs?: number | null;
}

/**
 * Format bytes to human-readable size.
 */
function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Format milliseconds intelligently.
 */
function formatTime(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(1);
  return `${minutes}m ${seconds}s`;
}

export function RuntimeStatusBar({
  onReady,
  executionTimeMs,
}: RuntimeStatusBarProps) {
  const [info, setInfo] = useState<RuntimeInfo>(getRuntimeInfo());
  const [showDetails, setShowDetails] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Subscribe to real runtime status changes
  useEffect(() => {
    const unsubscribe = subscribeToRuntimeStatus((newInfo) => {
      setInfo(newInfo);
      if (newInfo.status === RuntimeStatus.READY && onReady) {
        onReady();
      }
    });

    // Initialize Pyodide on mount
    initPyodide();

    return unsubscribe;
  }, [onReady]);

  // Handle retry
  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    await initPyodide();
    setIsRetrying(false);
  }, []);

  // Get display execution time (prefer prop, fallback to lastRunMs)
  const displayExecutionTime = executionTimeMs ?? info.lastRunMs;

  // Get status configuration
  const statusKey = info.status as keyof typeof STATUS_CONFIG;
  const statusDisplay = useMemo(() => {
    const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.unloaded;
    const IconComponent = config.icon;
    return {
      ...config,
      icon: (
        <IconComponent
          weight={statusKey === "loading" ? "bold" : "fill"}
          className={`h-3 w-3 ${config.animate || ""}`}
        />
      ),
    };
  }, [statusKey]);

  return (
    <div className="border-y border-border/50 bg-muted/50 text-xs font-mono">
      {/* Main Status Row */}
      <div
        className="flex items-center gap-3 px-3 py-1.5 transition-colors"
        role="status"
        aria-live="polite"
        aria-label={`Python runtime status: ${statusDisplay.text}`}
      >
        {/* Python Version */}
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground font-sans">Python</span>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 font-mono"
          >
            {info.version || "—"}
          </Badge>
        </div>

        {/* Separator */}
        <span className="text-muted-foreground/40" aria-hidden="true">
          ·
        </span>

        {/* Pyodide Info with Tooltip */}
        <div className="flex items-center gap-1 group relative">
          <span className="text-muted-foreground font-sans">Pyodide</span>
          {info.pyodideVersion && (
            <Badge
              variant="outline"
              className="text-[10px] px-1 py-0 font-mono"
            >
              {info.pyodideVersion}
            </Badge>
          )}
          <Info
            weight="fill"
            className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-help"
          />
          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
            <div className="bg-popover text-popover-foreground text-xs rounded-md shadow-lg p-2 w-48 font-sans">
              Python runtime in the browser via WebAssembly
            </div>
          </div>
        </div>

        {/* Separator */}
        <span className="text-muted-foreground/40" aria-hidden="true">
          ·
        </span>

        {/* Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-all ${statusDisplay.color} ${statusDisplay.bgColor}`}
        >
          {statusDisplay.icon}
          <span className="font-sans">{statusDisplay.text}</span>
        </div>

        {/* Retry Button for Errors */}
        {info.status === RuntimeStatus.ERROR && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Retry initialization"
          >
            <ArrowsClockwise
              weight="bold"
              className={`h-3 w-3 ${isRetrying ? "animate-spin" : ""}`}
            />
            <span className="font-sans">Retry</span>
          </button>
        )}

        {/* Execution Time */}
        {displayExecutionTime !== null && (
          <>
            <span className="text-muted-foreground/40" aria-hidden="true">
              ·
            </span>
            <div
              className="flex items-center gap-1 text-muted-foreground"
              title={`Last execution: ${formatTime(displayExecutionTime)}`}
            >
              <Timer weight="duotone" className="h-3 w-3" />
              <span>{formatTime(displayExecutionTime)}</span>
            </div>
          </>
        )}

        {/* Expand/Collapse Details Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="ml-auto flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-expanded={showDetails}
          aria-label="Toggle runtime details"
        >
          {showDetails ? (
            <CaretUp weight="bold" className="h-3 w-3" />
          ) : (
            <CaretDown weight="bold" className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* Expanded Details Row */}
      {showDetails && (
        <div className="flex items-center gap-4 px-3 py-1.5 border-t border-border/30 bg-muted/30 text-muted-foreground">
          {/* Cold Start Time */}
          {info.initTimeMs !== null && (
            <div
              className="flex items-center gap-1.5"
              title="Cold start initialization time"
            >
              <Lightning weight="duotone" className="h-3 w-3 text-yellow-500" />
              <span className="font-sans text-[10px]">Cold Start:</span>
              <span>{formatTime(info.initTimeMs)}</span>
            </div>
          )}

          {/* Heap Size */}
          {info.heapSize !== null && (
            <div
              className="flex items-center gap-1.5"
              title="WebAssembly heap size"
            >
              <HardDrives weight="duotone" className="h-3 w-3 text-blue-400" />
              <span className="font-sans text-[10px]">Heap:</span>
              <span>{formatBytes(info.heapSize)}</span>
            </div>
          )}

          {/* Worker State */}
          <div
            className="flex items-center gap-1.5"
            title="Worker process state"
          >
            <span className="font-sans text-[10px]">Worker:</span>
            <Badge
              variant={
                info.status === RuntimeStatus.READY ? "secondary" : "outline"
              }
              className="text-[10px] px-1 py-0"
            >
              {info.status}
            </Badge>
          </div>
        </div>
      )}

      {/* Error Details */}
      {info.error && (
        <>
          <button
            onClick={() => setShowErrorDetails(!showErrorDetails)}
            className="w-full flex items-center gap-1 px-3 py-1 text-red-400 hover:text-red-300 border-t border-red-500/20 bg-red-500/5 transition-colors"
            aria-expanded={showErrorDetails}
          >
            <Warning weight="fill" className="h-3 w-3" />
            <span
              className={`truncate ${showErrorDetails ? "" : "max-w-[300px]"}`}
            >
              {info.error}
            </span>
            {showErrorDetails ? (
              <CaretUp weight="bold" className="h-3 w-3 ml-auto" />
            ) : (
              <CaretDown weight="bold" className="h-3 w-3 ml-auto" />
            )}
          </button>
          {showErrorDetails && (
            <div className="px-3 py-2 bg-red-500/5 border-t border-red-500/10 text-xs font-sans text-red-400">
              <div className="font-semibold mb-1">Error Details:</div>
              <div className="overflow-wrap-break-word whitespace-pre-wrap">
                {info.error}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
