/**
 * API Safety Controller
 *
 * Client-side safeguards to prevent accidental overuse of the user's API key.
 * Implements session-based limits that can be configured in Settings → Advanced.
 *
 * ## SECURITY NOTES
 * - These are soft client-side limits, not hard server-side enforcement
 * - The goal is to protect users from accidental quota exhaustion
 * - Limits reset on page refresh (session-based)
 * - Users can adjust limits in Settings → Advanced
 */

import { create } from "zustand";
import { useSettingsStore } from "@/lib/stores/settingsStore";

// ============================================
// TYPES
// ============================================

export interface ApiSafetyConfig {
  maxCallsPerSession: number;
  maxQuestionCallsPerSession: number;
  maxHintCallsPerSession: number;
  maxOptimalSolutionCallsPerSession: number;
  maxEvaluationCallsPerSession: number;
}

export interface SessionUsage {
  totalCalls: number;
  questionCalls: number;
  hintCalls: number;
  optimalSolutionCalls: number;
  evaluationCalls: number;
}

export type CallType =
  | "question"
  | "hint"
  | "optimal-solution"
  | "evaluation"
  | "other";

export interface SafetyCheckResult {
  allowed: boolean;
  reason?: "SESSION_LIMIT" | "FEATURE_LIMIT";
  message?: string;
  currentCount?: number;
  maxCount?: number;
}

export interface ApiSafetyState {
  config: ApiSafetyConfig;
  sessionUsage: SessionUsage;

  // Actions
  checkLimit: (callType: CallType) => SafetyCheckResult;
  recordCall: (callType: CallType) => void;
  resetSession: () => void;
  updateConfig: (config: Partial<ApiSafetyConfig>) => void;
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

const DEFAULT_CONFIG: ApiSafetyConfig = {
  maxCallsPerSession: 500,
  maxQuestionCallsPerSession: 100,
  maxHintCallsPerSession: 50,
  maxOptimalSolutionCallsPerSession: 30,
  maxEvaluationCallsPerSession: 100,
};

const EMPTY_SESSION: SessionUsage = {
  totalCalls: 0,
  questionCalls: 0,
  hintCalls: 0,
  optimalSolutionCalls: 0,
  evaluationCalls: 0,
};

// ============================================
// STORE
// ============================================

export const useApiSafetyStore = create<ApiSafetyState>()((set, get) => ({
  config: DEFAULT_CONFIG,
  sessionUsage: { ...EMPTY_SESSION },

  checkLimit: (callType: CallType): SafetyCheckResult => {
    const { config, sessionUsage } = get();

    // Check total session limit first
    if (sessionUsage.totalCalls >= config.maxCallsPerSession) {
      return {
        allowed: false,
        reason: "SESSION_LIMIT",
        message: `Session limit reached (${config.maxCallsPerSession} calls). Refresh to reset.`,
        currentCount: sessionUsage.totalCalls,
        maxCount: config.maxCallsPerSession,
      };
    }

    // Check feature-specific limits
    switch (callType) {
      case "question":
        if (sessionUsage.questionCalls >= config.maxQuestionCallsPerSession) {
          return {
            allowed: false,
            reason: "FEATURE_LIMIT",
            message: `Question generation limit reached (${config.maxQuestionCallsPerSession}). Refresh to reset.`,
            currentCount: sessionUsage.questionCalls,
            maxCount: config.maxQuestionCallsPerSession,
          };
        }
        break;
      case "hint":
        if (sessionUsage.hintCalls >= config.maxHintCallsPerSession) {
          return {
            allowed: false,
            reason: "FEATURE_LIMIT",
            message: `Hint limit reached (${config.maxHintCallsPerSession}). Refresh to reset.`,
            currentCount: sessionUsage.hintCalls,
            maxCount: config.maxHintCallsPerSession,
          };
        }
        break;
      case "optimal-solution":
        if (
          sessionUsage.optimalSolutionCalls >=
          config.maxOptimalSolutionCallsPerSession
        ) {
          return {
            allowed: false,
            reason: "FEATURE_LIMIT",
            message: `Optimal solution limit reached (${config.maxOptimalSolutionCallsPerSession}). Refresh to reset.`,
            currentCount: sessionUsage.optimalSolutionCalls,
            maxCount: config.maxOptimalSolutionCallsPerSession,
          };
        }
        break;
      case "evaluation":
        if (
          sessionUsage.evaluationCalls >= config.maxEvaluationCallsPerSession
        ) {
          return {
            allowed: false,
            reason: "FEATURE_LIMIT",
            message: `Code evaluation limit reached (${config.maxEvaluationCallsPerSession}). Refresh to reset.`,
            currentCount: sessionUsage.evaluationCalls,
            maxCount: config.maxEvaluationCallsPerSession,
          };
        }
        break;
    }

    return { allowed: true };
  },

  recordCall: (callType: CallType) => {
    set((state) => {
      const newUsage = { ...state.sessionUsage };
      newUsage.totalCalls++;

      switch (callType) {
        case "question":
          newUsage.questionCalls++;
          break;
        case "hint":
          newUsage.hintCalls++;
          break;
        case "optimal-solution":
          newUsage.optimalSolutionCalls++;
          break;
        case "evaluation":
          newUsage.evaluationCalls++;
          break;
      }

      return { sessionUsage: newUsage };
    });
  },

  resetSession: () => {
    set({ sessionUsage: { ...EMPTY_SESSION } });
  },

  updateConfig: (newConfig: Partial<ApiSafetyConfig>) => {
    set((state) => ({
      config: { ...state.config, ...newConfig },
    }));
  },
}));

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Check if a call is allowed and record it if so.
 * Returns the safety check result.
 */
export function checkAndRecordCall(callType: CallType): SafetyCheckResult {
  const store = useApiSafetyStore.getState();
  const result = store.checkLimit(callType);

  if (result.allowed) {
    store.recordCall(callType);
  }

  return result;
}

/**
 * Get current session usage stats.
 */
export function getSessionUsage(): SessionUsage {
  return useApiSafetyStore.getState().sessionUsage;
}

/**
 * Get remaining calls for a specific type.
 */
export function getRemainingCalls(callType: CallType): number {
  const { config, sessionUsage } = useApiSafetyStore.getState();

  switch (callType) {
    case "question":
      return Math.max(
        0,
        config.maxQuestionCallsPerSession - sessionUsage.questionCalls
      );
    case "hint":
      return Math.max(
        0,
        config.maxHintCallsPerSession - sessionUsage.hintCalls
      );
    case "optimal-solution":
      return Math.max(
        0,
        config.maxOptimalSolutionCallsPerSession -
          sessionUsage.optimalSolutionCalls
      );
    case "evaluation":
      return Math.max(
        0,
        config.maxEvaluationCallsPerSession - sessionUsage.evaluationCalls
      );
    default:
      return Math.max(0, config.maxCallsPerSession - sessionUsage.totalCalls);
  }
}

/**
 * Sync safety config with user settings from settingsStore.
 * Call this on app startup or when settings change.
 */
export function syncWithSettings(): void {
  const { advanced } = useSettingsStore.getState();

  useApiSafetyStore.getState().updateConfig({
    maxCallsPerSession: advanced.maxApiCallsPerSession,
    maxOptimalSolutionCallsPerSession:
      advanced.maxOptimalSolutionCallsPerSession,
  });
}

/**
 * Hook to keep safety controller in sync with settings.
 * Use this in a top-level component.
 */
export function useSyncSafetyWithSettings(): void {
  const maxApiCalls = useSettingsStore((s) => s.advanced.maxApiCallsPerSession);
  const maxOptimalCalls = useSettingsStore(
    (s) => s.advanced.maxOptimalSolutionCallsPerSession
  );

  // Update safety config when settings change
  useApiSafetyStore.getState().updateConfig({
    maxCallsPerSession: maxApiCalls,
    maxOptimalSolutionCallsPerSession: maxOptimalCalls,
  });
}
