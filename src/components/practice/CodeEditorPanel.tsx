"use client";

/**
 * CodeEditorPanel - Enhanced Monaco-based Python code editor
 *
 * Features:
 * - Debounced onChange for better performance
 * - Loading state with skeleton
 * - Editor instance access for programmatic control
 * - Custom keyboard shortcuts
 * - Python-specific features (indentation guides, bracket colorization)
 * - Error marker support
 * - Light and dark GitHub themes
 * - Improved accessibility
 */

import { Card } from "@/components/ui/card";
import Editor, { loader } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useMemo, useCallback } from "react";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { CircleNotch } from "@phosphor-icons/react";
import type * as Monaco from "monaco-editor";

interface CodeEditorPanelProps {
  code: string;
  onChange: (value: string | undefined) => void;
  onRun?: () => void; // Optional callback for running code
  errors?: Array<{
    line: number;
    column: number;
    message: string;
  }>; // Optional error markers
}

// GitHub Dark syntax colors
const githubDarkTheme = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [
    { token: "", foreground: "e6edf3", background: "0d1117" },
    { token: "comment", foreground: "8b949e", fontStyle: "italic" },
    { token: "keyword", foreground: "ff7b72" },
    { token: "string", foreground: "a5d6ff" },
    { token: "number", foreground: "79c0ff" },
    { token: "type", foreground: "ffa657" },
    { token: "class", foreground: "ffa657" },
    { token: "function", foreground: "d2a8ff" },
    { token: "variable", foreground: "ffa657" },
    { token: "constant", foreground: "79c0ff" },
    { token: "operator", foreground: "ff7b72" },
    { token: "delimiter", foreground: "e6edf3" },
    { token: "tag", foreground: "7ee787" },
    { token: "attribute.name", foreground: "79c0ff" },
    { token: "attribute.value", foreground: "a5d6ff" },
  ],
  colors: {
    "editor.background": "#0d1117",
    "editor.foreground": "#e6edf3",
    "editor.lineHighlightBackground": "#161b22",
    "editor.selectionBackground": "#264f78",
    "editorCursor.foreground": "#58a6ff",
    "editorWhitespace.foreground": "#484f58",
    "editorIndentGuide.background": "#21262d",
    "editorIndentGuide.activeBackground": "#30363d",
    "editor.selectionHighlightBackground": "#3fb95033",
    "editorLineNumber.foreground": "#484f58",
    "editorLineNumber.activeForeground": "#e6edf3",
    "editorGutter.background": "#0d1117",
    "scrollbarSlider.background": "#484f5880",
    "scrollbarSlider.hoverBackground": "#6e768180",
  },
};

// GitHub Light syntax colors
const githubLightTheme = {
  base: "vs" as const,
  inherit: true,
  rules: [
    { token: "", foreground: "24292f", background: "ffffff" },
    { token: "comment", foreground: "6e7781", fontStyle: "italic" },
    { token: "keyword", foreground: "cf222e" },
    { token: "string", foreground: "0a3069" },
    { token: "number", foreground: "0550ae" },
    { token: "type", foreground: "953800" },
    { token: "class", foreground: "953800" },
    { token: "function", foreground: "8250df" },
    { token: "variable", foreground: "953800" },
    { token: "constant", foreground: "0550ae" },
    { token: "operator", foreground: "cf222e" },
    { token: "delimiter", foreground: "24292f" },
    { token: "tag", foreground: "116329" },
    { token: "attribute.name", foreground: "0550ae" },
    { token: "attribute.value", foreground: "0a3069" },
  ],
  colors: {
    "editor.background": "#ffffff",
    "editor.foreground": "#24292f",
    "editor.lineHighlightBackground": "#f6f8fa",
    "editor.selectionBackground": "#0969da33",
    "editorCursor.foreground": "#0969da",
    "editorWhitespace.foreground": "#d0d7de",
    "editorIndentGuide.background": "#d0d7de",
    "editorIndentGuide.activeBackground": "#8c959f",
    "editor.selectionHighlightBackground": "#1f883d33",
    "editorLineNumber.foreground": "#8c959f",
    "editorLineNumber.activeForeground": "#24292f",
    "editorGutter.background": "#ffffff",
    "scrollbarSlider.background": "#d0d7de80",
    "scrollbarSlider.hoverBackground": "#8c959f80",
  },
};

// Debounce utility
function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function CodeEditorPanel({
  code,
  onChange,
  onRun,
  errors,
}: CodeEditorPanelProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);

  // Read editor settings from store
  const {
    tabSize,
    showLineNumbers,
    showMinimap,
    wordWrap,
    highlightActiveLine,
  } = useSettingsStore((s) => s.editor);

  // Get code font from appearance settings
  const { codeFont } = useSettingsStore((s) => s.appearance);

  // Debounced onChange to reduce re-renders during rapid typing
  const debouncedOnChange = useMemo(
    () => debounce((value: string | undefined) => onChange(value), 300),
    [onChange]
  );

  // Register GitHub themes when Monaco loads
  useEffect(() => {
    let themesRegistered = false;
    loader.init().then((monaco) => {
      if (!themesRegistered) {
        monaco.editor.defineTheme("github-dark", githubDarkTheme);
        monaco.editor.defineTheme("github-light", githubLightTheme);
        themesRegistered = true;
      }
    });
  }, []);

  // Handle editor mount
  const handleEditorDidMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Add custom keyboard shortcuts
      if (onRun) {
        // Ctrl/Cmd + Enter to run code
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
          onRun();
        });

        // Add custom action for command palette
        editor.addAction({
          id: "run-code",
          label: "Run Python Code",
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
          contextMenuGroupId: "navigation",
          run: () => {
            onRun();
          },
        });
      }

      // Format document shortcut (F8)
      editor.addCommand(monaco.KeyCode.F8, () => {
        editor.getAction("editor.action.formatDocument")?.run();
      });
    },
    [onRun]
  );

  // Update error markers when errors change
  useEffect(() => {
    if (editorRef.current && monacoRef.current && errors) {
      const model = editorRef.current.getModel();
      if (model) {
        const markers = errors.map((error) => ({
          startLineNumber: error.line,
          startColumn: error.column,
          endLineNumber: error.line,
          endColumn: model.getLineMaxColumn(error.line),
          message: error.message,
          severity: monacoRef.current!.MarkerSeverity.Error,
        }));
        monacoRef.current.editor.setModelMarkers(model, "python", markers);
      }
    }
  }, [errors]);

  // Determine font family
  let fontFamily = "'JetBrains Mono', monospace";
  switch (codeFont) {
    case "fira-code":
      fontFamily = "'Fira Code', monospace";
      break;
    case "system-monospace":
      fontFamily = "ui-monospace, monospace";
      break;
  }

  return (
    <Card className="h-full border-none shadow-none rounded-none overflow-hidden flex flex-col">
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="python"
          language="python"
          theme={resolvedTheme === "dark" ? "github-dark" : "github-light"}
          value={code}
          onChange={debouncedOnChange}
          onMount={handleEditorDidMount}
          loading={
            <div className="flex items-center justify-center h-full bg-background">
              <CircleNotch className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          }
          options={{
            minimap: { enabled: showMinimap },
            fontSize: 14,
            fontFamily,
            fontLigatures: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize,
            lineHeight: 1.6,
            padding: { top: 12 },
            renderLineHighlight: highlightActiveLine ? "line" : "none",
            lineNumbers: showLineNumbers ? "on" : "off",
            wordWrap: wordWrap ? "on" : "off",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            // Python-specific features
            bracketPairColorization: { enabled: true },
            guides: {
              indentation: true,
              bracketPairs: true,
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false,
            },
            folding: true,
            foldingStrategy: "indentation", // Good for Python
            // Accessibility
            ariaLabel: "Python code editor",
            accessibilitySupport: "auto",
          }}
        />
      </div>
    </Card>
  );
}
