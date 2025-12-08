/**
 * Centralized Settings Store
 *
 * Manages all application settings with localStorage persistence.
 * Categories: General, Appearance, Editor, Practice, Key Bindings, Advanced
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ========== Types ==========

export type Theme = "github-dark" | "system" | "github-light";
export type AccentColor = "blue" | "green" | "purple" | "orange";
export type SidebarDensity = "compact" | "comfortable";
export type UIFont = "satoshi" | "system";
export type CodeFont = "jetbrains-mono" | "fira-code" | "system-monospace";
export type EditorTheme = "github-dark" | "monokai" | "solarized-dark";
export type LandingPage = "dashboard" | "manual-practice" | "auto-mode";
export type DefaultMode = "manual" | "auto";
export type DefaultDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface KeyBinding {
  action: string;
  key: string;
  displayName: string;
}

export interface GeneralSettings {
  appLanguage: string;
  defaultLandingPage: LandingPage;
  askBeforeResetStats: boolean;
  askBeforeDeleteRuns: boolean;
}

export interface AppearanceSettings {
  theme: Theme;
  accentColor: AccentColor;
  sidebarDensity: SidebarDensity;
  useCardShadows: boolean;
  uiFont: UIFont;
  codeFont: CodeFont;
}

export interface EditorSettings {
  tabSize: 2 | 4;
  autoIndent: boolean;
  showLineNumbers: boolean;
  showMinimap: boolean;
  wordWrap: boolean;
  highlightActiveLine: boolean;
  editorTheme: EditorTheme;
  showPythonVersion: boolean;
  autoRunOnCtrlEnter: boolean;
}

export interface PracticeSettings {
  defaultMode: DefaultMode;
  defaultDifficulty: DefaultDifficulty;
  useAdaptiveDifficulty: boolean;
  maxPrefetchPerTopic: number;
  autoGenerateNextQuestion: boolean;
  includeUnsolvedInMastery: boolean;
  showPerDifficultyStats: boolean;
}

export interface AdvancedSettings {
  maxApiCallsPerSession: number;
  maxOptimalSolutionCallsPerSession: number;
  showDebugInfo: boolean;
  enableExperimentalFeatures: boolean;
}

export interface PrivacySettings {
  trackDetailedHistory: boolean;
  enableAnonymousDiagnostics: boolean;
}

export interface SettingsState {
  // Settings categories
  general: GeneralSettings;
  appearance: AppearanceSettings;
  editor: EditorSettings;
  practice: PracticeSettings;
  keyBindings: KeyBinding[];
  advanced: AdvancedSettings;
  privacy: PrivacySettings;

  // API key timestamp
  apiKeyLastVerified: string | null;

  // Onboarding state
  hasCompletedOnboarding: boolean;
  onboardingStep: number;

  // Actions
  updateGeneral: (settings: Partial<GeneralSettings>) => void;
  updateAppearance: (settings: Partial<AppearanceSettings>) => void;
  updateEditor: (settings: Partial<EditorSettings>) => void;
  updatePractice: (settings: Partial<PracticeSettings>) => void;
  updateKeyBinding: (action: string, newKey: string) => void;
  updateAdvanced: (settings: Partial<AdvancedSettings>) => void;
  updatePrivacy: (settings: Partial<PrivacySettings>) => void;
  setApiKeyVerified: () => void;
  completeOnboarding: () => void;
  setOnboardingStep: (step: number) => void;
  resetOnboarding: () => void;
  resetToDefaults: () => void;
  clearStats: () => void;
  clearHistory: () => void;
  clearAllData: () => void;
}

// ========== Default Values ==========

const defaultGeneral: GeneralSettings = {
  appLanguage: "en",
  defaultLandingPage: "dashboard",
  askBeforeResetStats: true,
  askBeforeDeleteRuns: true,
};

const defaultAppearance: AppearanceSettings = {
  theme: "github-dark",
  accentColor: "blue",
  sidebarDensity: "comfortable",
  useCardShadows: true,
  uiFont: "satoshi",
  codeFont: "jetbrains-mono",
};

const defaultEditor: EditorSettings = {
  tabSize: 4,
  autoIndent: true,
  showLineNumbers: true,
  showMinimap: false,
  wordWrap: true,
  highlightActiveLine: true,
  editorTheme: "github-dark",
  showPythonVersion: true,
  autoRunOnCtrlEnter: true,
};

const defaultPractice: PracticeSettings = {
  defaultMode: "manual",
  defaultDifficulty: "Beginner",
  useAdaptiveDifficulty: false,
  maxPrefetchPerTopic: 2,
  autoGenerateNextQuestion: false,
  includeUnsolvedInMastery: true,
  showPerDifficultyStats: true,
};

const defaultKeyBindings: KeyBinding[] = [
  {
    action: "openCommandPalette",
    key: "Ctrl+K",
    displayName: "Open Command Palette",
  },
  { action: "toggleSidebar", key: "Ctrl+B", displayName: "Toggle Sidebar" },
  { action: "runCode", key: "Ctrl+Enter", displayName: "Run & Check Code" },
  { action: "saveCode", key: "Ctrl+S", displayName: "Save Code" },
  { action: "nextQuestion", key: "Ctrl+N", displayName: "Next Question" },
  {
    action: "regenerateQuestion",
    key: "Ctrl+R",
    displayName: "Regenerate Question",
  },
];

const defaultAdvanced: AdvancedSettings = {
  maxApiCallsPerSession: 50,
  maxOptimalSolutionCallsPerSession: 10,
  showDebugInfo: false,
  enableExperimentalFeatures: false,
};

const defaultPrivacy: PrivacySettings = {
  trackDetailedHistory: true,
  enableAnonymousDiagnostics: false,
};

// ========== Store ==========

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial state
      general: defaultGeneral,
      appearance: defaultAppearance,
      editor: defaultEditor,
      practice: defaultPractice,
      keyBindings: defaultKeyBindings,
      advanced: defaultAdvanced,
      privacy: defaultPrivacy,
      apiKeyLastVerified: null,
      hasCompletedOnboarding: false,
      onboardingStep: 1,

      // Actions
      updateGeneral: (settings) =>
        set((state) => ({
          general: { ...state.general, ...settings },
        })),

      updateAppearance: (settings) =>
        set((state) => ({
          appearance: { ...state.appearance, ...settings },
        })),

      updateEditor: (settings) =>
        set((state) => ({
          editor: { ...state.editor, ...settings },
        })),

      updatePractice: (settings) =>
        set((state) => ({
          practice: { ...state.practice, ...settings },
        })),

      updateKeyBinding: (action, newKey) =>
        set((state) => ({
          keyBindings: state.keyBindings.map((kb) =>
            kb.action === action ? { ...kb, key: newKey } : kb
          ),
        })),

      updateAdvanced: (settings) =>
        set((state) => ({
          advanced: { ...state.advanced, ...settings },
        })),

      updatePrivacy: (settings) =>
        set((state) => ({
          privacy: { ...state.privacy, ...settings },
        })),

      setApiKeyVerified: () =>
        set(() => ({
          apiKeyLastVerified: new Date().toISOString(),
        })),

      completeOnboarding: () =>
        set(() => ({
          hasCompletedOnboarding: true,
          onboardingStep: 5,
        })),

      setOnboardingStep: (step) =>
        set(() => ({
          onboardingStep: step,
        })),

      resetOnboarding: () =>
        set(() => ({
          hasCompletedOnboarding: false,
          onboardingStep: 1,
        })),

      resetToDefaults: () =>
        set(() => ({
          general: defaultGeneral,
          appearance: defaultAppearance,
          editor: defaultEditor,
          practice: defaultPractice,
          keyBindings: defaultKeyBindings,
          advanced: defaultAdvanced,
          privacy: defaultPrivacy,
        })),

      clearStats: () => {
        // Clear stats from statsStore
        if (typeof window !== "undefined") {
          localStorage.removeItem("practice-stats");
        }
      },

      clearHistory: () => {
        // Clear history from historyStore
        if (typeof window !== "undefined") {
          localStorage.removeItem("practice-history");
        }
      },

      clearAllData: () => {
        if (typeof window !== "undefined") {
          // Clear all app data
          localStorage.removeItem("practice-stats");
          localStorage.removeItem("practice-history");
          localStorage.removeItem("user-api-config");
          localStorage.removeItem("auto-mode-runs");
          localStorage.removeItem("question-buffer");
        }
      },
    }),
    {
      name: "pytrix-settings",
      version: 1,
    }
  )
);
