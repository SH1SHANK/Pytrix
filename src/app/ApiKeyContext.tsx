"use client";

/**
 * API Key Context
 *
 * Provides reactive state for API key configuration across the app.
 * Enables real-time updates when key is added/removed without page reload.
 *
 * ## SECURITY NOTES
 * - Keys stored in localStorage only, never sent to Pytrix servers
 * - Verification state tracks if key was successfully tested
 * - Error state helps display appropriate messages to users
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  isApiKeyConfigured,
  saveUserApiConfig,
  clearUserApiConfig,
  createApiConfig,
  loadUserApiConfig,
} from "@/lib/stores/apiKeyStore";

// ============================================
// TYPES
// ============================================

export type ApiKeyErrorType =
  | "INVALID_KEY"
  | "RATE_LIMIT"
  | "NETWORK"
  | "UNKNOWN"
  | null;

interface ApiKeyState {
  apiKey: string | null;
  hasApiKey: boolean;
  isVerified: boolean;
  lastVerifiedAt: number | null;
  lastError: ApiKeyErrorType;
}

interface ApiKeyContextType extends ApiKeyState {
  isLoading: boolean;
  refreshKeyState: () => void;
  setApiKey: (key: string) => void;
  removeApiKey: () => void;
  markVerified: () => void;
  setError: (error: ApiKeyErrorType) => void;
  clearError: () => void;
}

// ============================================
// STORAGE KEYS
// ============================================

const VERIFICATION_KEY = "pytrix_api_key_verification";

interface VerificationData {
  isVerified: boolean;
  lastVerifiedAt: number | null;
  lastError: ApiKeyErrorType;
}

function loadVerificationData(): VerificationData {
  if (typeof window === "undefined") {
    return { isVerified: false, lastVerifiedAt: null, lastError: null };
  }

  try {
    const stored = localStorage.getItem(VERIFICATION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }

  return { isVerified: false, lastVerifiedAt: null, lastError: null };
}

function saveVerificationData(data: VerificationData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VERIFICATION_KEY, JSON.stringify(data));
}

function clearVerificationData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(VERIFICATION_KEY);
}

// ============================================
// CONTEXT
// ============================================

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ApiKeyState>({
    apiKey: null,
    hasApiKey: false,
    isVerified: false,
    lastVerifiedAt: null,
    lastError: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshKeyState = useCallback(() => {
    const config = loadUserApiConfig();
    const verification = loadVerificationData();

    setState({
      apiKey: config?.apiKey ?? null,
      hasApiKey: config !== null && config.apiKey.length > 0,
      isVerified: verification.isVerified,
      lastVerifiedAt: verification.lastVerifiedAt,
      lastError: verification.lastError,
    });
  }, []);

  const setApiKey = useCallback((key: string) => {
    // Trim and validate
    const trimmedKey = key.trim();
    if (trimmedKey.length < 10) {
      console.warn("[ApiKeyContext] Key too short, ignoring");
      return;
    }

    saveUserApiConfig(createApiConfig("gemini", trimmedKey));
    // Reset verification state when key changes
    saveVerificationData({
      isVerified: false,
      lastVerifiedAt: null,
      lastError: null,
    });

    setState((prev) => ({
      ...prev,
      apiKey: trimmedKey,
      hasApiKey: true,
      isVerified: false,
      lastVerifiedAt: null,
      lastError: null,
    }));
  }, []);

  const removeApiKey = useCallback(() => {
    clearUserApiConfig();
    clearVerificationData();

    setState({
      apiKey: null,
      hasApiKey: false,
      isVerified: false,
      lastVerifiedAt: null,
      lastError: null,
    });
  }, []);

  const markVerified = useCallback(() => {
    const now = Date.now();
    saveVerificationData({
      isVerified: true,
      lastVerifiedAt: now,
      lastError: null,
    });

    setState((prev) => ({
      ...prev,
      isVerified: true,
      lastVerifiedAt: now,
      lastError: null,
    }));
  }, []);

  const setError = useCallback(
    (error: ApiKeyErrorType) => {
      // Only clear verification for invalid key errors
      const isVerified = error === "INVALID_KEY" ? false : state.isVerified;

      saveVerificationData({
        isVerified,
        lastVerifiedAt: state.lastVerifiedAt,
        lastError: error,
      });

      setState((prev) => ({
        ...prev,
        isVerified,
        lastError: error,
      }));
    },
    [state.isVerified, state.lastVerifiedAt]
  );

  const clearError = useCallback(() => {
    saveVerificationData({
      isVerified: state.isVerified,
      lastVerifiedAt: state.lastVerifiedAt,
      lastError: null,
    });

    setState((prev) => ({
      ...prev,
      lastError: null,
    }));
  }, [state.isVerified, state.lastVerifiedAt]);

  useEffect(() => {
    // Initial check - defer to next tick to avoid synchronous setState warning
    setTimeout(() => {
      refreshKeyState();
      setIsLoading(false);
    }, 0);

    // Listen for storage changes (works across tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pypractice_api_config_v1" || e.key === VERIFICATION_KEY) {
        refreshKeyState();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshKeyState]);

  const value: ApiKeyContextType = {
    ...state,
    isLoading,
    refreshKeyState,
    setApiKey,
    removeApiKey,
    markVerified,
    setError,
    clearError,
  };

  return (
    <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error("useApiKey must be used within an ApiKeyProvider");
  }
  return context;
}

// ============================================
// NON-HOOK ACCESS (for use in non-React code)
// ============================================

/**
 * Get the current API key without using a hook.
 * For use in services/utilities that can't use hooks.
 */
export function getApiKeyDirect(): string | null {
  const config = loadUserApiConfig();
  return config?.apiKey ?? null;
}

/**
 * Check if API key is configured without using a hook.
 */
export function hasApiKeyDirect(): boolean {
  return isApiKeyConfigured();
}
