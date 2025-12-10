"use client";

/**
 * CodeEditorPanel - Monaco-based Python code editor
 *
 * Reads settings from useSettingsStore.editor:
 * - tabSize, minimap, lineNumbers, wordWrap, highlightActiveLine
 */

import { Card } from "@/components/ui/card";
import Editor, { loader } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { useSettingsStore } from "@/lib/stores/settingsStore";

interface CodeEditorPanelProps {
  code: string;
  onChange: (value: string | undefined) => void;
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

export function CodeEditorPanel({ code, onChange }: CodeEditorPanelProps) {
  const { theme } = useTheme();

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

  // Register GitHub Dark theme when Monaco loads
  useEffect(() => {
    loader.init().then((monaco) => {
      monaco.editor.defineTheme("github-dark", githubDarkTheme);
    });
  }, []);

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
          theme={theme === "dark" ? "github-dark" : "light"}
          value={code}
          onChange={onChange}
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
          }}
        />
      </div>
    </Card>
  );
}
