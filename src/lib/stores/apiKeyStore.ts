/**
 * API Key Store
 *
 * Client-side storage for user API keys.
 * Keys are stored ONLY in localStorage and never sent to our servers.
 *
 * ## Storage Strategy
 * - Uses localStorage with key 'pypractice_api_config_v1'
 * - To change storage strategy, update STORAGE_KEY and the load/save functions
 *
 * ## Extensibility
 * - The UserApiConfig shape supports a 'provider' field
 * - To add new providers (e.g., OpenAI, DeepSeek):
 *   1. Add the provider to the Provider type
 *   2. Update the Settings UI to allow provider selection
 *   3. Branch logic in modelRouter based on provider
 *
 * ## Security Notes
 * - Keys are stored in browser localStorage only
 * - Never logged or sent to application backend
 * - Keys ARE sent to the respective AI provider's API
 */

// ============================================
// TYPES
// ============================================

export type Provider = "gemini"; // Extend this as we add providers

export interface UserApiConfig {
  provider: Provider;
  apiKey: string;
  createdAt: number;
}

// ============================================
// STORAGE CONFIGURATION
// ============================================

const STORAGE_KEY = "pypractice_api_config_v1";

// ============================================
// CORE API
// ============================================

/**
 * Load the user's API configuration from storage.
 * Returns null if no configuration exists or if running server-side.
 */
export function loadUserApiConfig(): UserApiConfig | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as UserApiConfig;

    // Validate the shape
    if (!parsed.provider || !parsed.apiKey || !parsed.createdAt) {
      console.warn("[apiKeyStore] Invalid config shape, clearing");
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("[apiKeyStore] Failed to load config:", error);
    return null;
  }
}

/**
 * Save the user's API configuration to storage.
 * Overwrites any existing configuration.
 */
export function saveUserApiConfig(config: UserApiConfig): void {
  if (typeof window === "undefined") {
    console.warn("[apiKeyStore] Cannot save config server-side");
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("[apiKeyStore] Failed to save config:", error);
    throw new Error(
      "Failed to save API key. Please check your browser storage settings."
    );
  }
}

/**
 * Clear the user's API configuration from storage.
 */
export function clearUserApiConfig(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if an API key is configured (any provider).
 */
export function isApiKeyConfigured(): boolean {
  const config = loadUserApiConfig();
  return config !== null && config.apiKey.length > 0;
}

/**
 * Get the API key for a specific provider.
 * Returns null if no key is configured for that provider.
 */
export function getApiKeyForProvider(provider: Provider): string | null {
  const config = loadUserApiConfig();
  if (!config || config.provider !== provider) {
    return null;
  }
  return config.apiKey;
}

/**
 * Get the currently configured provider.
 * Returns null if no configuration exists.
 */
export function getConfiguredProvider(): Provider | null {
  const config = loadUserApiConfig();
  return config?.provider ?? null;
}

/**
 * Create a new UserApiConfig object with current timestamp.
 */
export function createApiConfig(
  provider: Provider,
  apiKey: string
): UserApiConfig {
  return {
    provider,
    apiKey,
    createdAt: Date.now(),
  };
}
