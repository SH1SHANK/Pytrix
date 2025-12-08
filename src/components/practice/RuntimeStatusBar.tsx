"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  CircleNotch,
  CheckCircle,
  Warning,
  Play,
  CloudArrowDown,
} from "@phosphor-icons/react";
import {
  subscribeToRuntimeStatus,
  RuntimeInfo,
  initPyodide,
} from "@/lib/pythonRuntime";

interface RuntimeStatusBarProps {
  onReady?: () => void;
}

export function RuntimeStatusBar({ onReady }: RuntimeStatusBarProps) {
  const [info, setInfo] = useState<RuntimeInfo>({
    status: "unloaded",
    version: null,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = subscribeToRuntimeStatus((newInfo) => {
      setInfo(newInfo);
      if (newInfo.status === "ready" && onReady) {
        onReady();
      }
    });

    // Start loading immediately
    initPyodide();

    return unsubscribe;
  }, [onReady]);

  const getStatusDisplay = () => {
    switch (info.status) {
      case "unloaded":
        return {
          icon: <CloudArrowDown weight="duotone" className="h-3 w-3" />,
          text: "Not loaded",
          color: "text-muted-foreground",
        };
      case "loading":
        return {
          icon: <CircleNotch weight="bold" className="h-3 w-3 animate-spin" />,
          text: "Initializing...",
          color: "text-yellow-500",
        };
      case "ready":
        return {
          icon: <CheckCircle weight="fill" className="h-3 w-3" />,
          text: "Ready",
          color: "text-green-500",
        };
      case "running":
        return {
          icon: <Play weight="fill" className="h-3 w-3 animate-pulse" />,
          text: "Running...",
          color: "text-blue-500",
        };
      case "error":
        return {
          icon: <Warning weight="fill" className="h-3 w-3" />,
          text: "Error",
          color: "text-red-500",
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-t bg-muted/30 text-xs font-mono">
      {/* Python Version */}
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Python</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {info.version || "—"}
        </Badge>
      </div>

      {/* Separator */}
      <span className="text-muted-foreground/50">·</span>

      {/* Runtime Type */}
      <span className="text-muted-foreground">Pyodide</span>

      {/* Separator */}
      <span className="text-muted-foreground/50">·</span>

      {/* Status */}
      <div className={`flex items-center gap-1 ${status.color}`}>
        {status.icon}
        <span>{status.text}</span>
      </div>

      {/* Error message if any */}
      {info.error && (
        <span
          className="text-red-400 truncate max-w-[200px]"
          title={info.error}
        >
          {info.error}
        </span>
      )}
    </div>
  );
}
