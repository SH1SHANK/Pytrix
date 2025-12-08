/**
 * API Usage Store
 *
 * Tracks API usage per model with localStorage persistence.
 * Auto-resets daily stats at midnight.
 */

// ============================================
// TYPES
// ============================================

export interface ModelUsage {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  rateLimitHits: number;
  lastUsedAt: number | null;
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  models: Record<string, ModelUsage>;
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}

// ============================================
// QUOTA CONFIGURATION
// ============================================

/**
 * Soft daily quotas per model.
 * These are advisory limits, not hard blocks.
 */
export const MODEL_QUOTAS: Record<
  string,
  { maxCalls: number; maxTokens: number }
> = {
  "gemini-2.5-flash-lite": { maxCalls: 1500, maxTokens: 1_000_000 },
  "gemini-2.5-flash": { maxCalls: 500, maxTokens: 500_000 },
  "gemini-2.5-pro": { maxCalls: 50, maxTokens: 100_000 },
};

// Warning threshold (percentage)
export const QUOTA_WARNING_THRESHOLD = 0.8; // 80%

// ============================================
// STORAGE
// ============================================

const STORAGE_KEY = "pypractice-api-usage";

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function createEmptyUsage(): DailyUsage {
  return {
    date: getTodayDateString(),
    models: {},
    totalCalls: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
  };
}

function createEmptyModelUsage(): ModelUsage {
  return {
    calls: 0,
    inputTokens: 0,
    outputTokens: 0,
    rateLimitHits: 0,
    lastUsedAt: null,
  };
}

// ============================================
// API
// ============================================

/**
 * Get current daily usage stats.
 * Auto-resets if date has changed (new day).
 */
export function getApiUsage(): DailyUsage {
  if (typeof window === "undefined") {
    return createEmptyUsage();
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const empty = createEmptyUsage();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
    return empty;
  }

  try {
    const parsed = JSON.parse(stored) as DailyUsage;

    // Auto-reset if new day
    if (parsed.date !== getTodayDateString()) {
      const fresh = createEmptyUsage();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }

    return parsed;
  } catch {
    const empty = createEmptyUsage();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
    return empty;
  }
}

/**
 * Record API usage for a model call.
 */
export function recordApiUsage(
  modelName: string,
  inputTokens: number = 0,
  outputTokens: number = 0
): DailyUsage {
  if (typeof window === "undefined") {
    return createEmptyUsage();
  }

  const usage = getApiUsage();

  // Initialize model if not exists
  if (!usage.models[modelName]) {
    usage.models[modelName] = createEmptyModelUsage();
  }

  // Update model stats
  usage.models[modelName].calls += 1;
  usage.models[modelName].inputTokens += inputTokens;
  usage.models[modelName].outputTokens += outputTokens;
  usage.models[modelName].lastUsedAt = Date.now();

  // Update totals
  usage.totalCalls += 1;
  usage.totalInputTokens += inputTokens;
  usage.totalOutputTokens += outputTokens;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  return usage;
}

/**
 * Record a rate limit hit for a model.
 */
export function recordRateLimitHit(modelName: string): DailyUsage {
  if (typeof window === "undefined") {
    return createEmptyUsage();
  }

  const usage = getApiUsage();

  if (!usage.models[modelName]) {
    usage.models[modelName] = createEmptyModelUsage();
  }

  usage.models[modelName].rateLimitHits += 1;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  return usage;
}

/**
 * Reset all usage stats.
 */
export function resetApiUsage(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(createEmptyUsage()));
}

// ============================================
// QUOTA HELPERS
// ============================================

export interface QuotaStatus {
  model: string;
  calls: number;
  maxCalls: number;
  callsPercent: number;
  tokens: number;
  maxTokens: number;
  tokensPercent: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
  rateLimitHits: number;
}

/**
 * Get quota status for all tracked models.
 */
export function getQuotaStatus(): QuotaStatus[] {
  const usage = getApiUsage();
  const statuses: QuotaStatus[] = [];

  // Include all models that have quotas defined
  for (const [model, quota] of Object.entries(MODEL_QUOTAS)) {
    const modelUsage = usage.models[model] || createEmptyModelUsage();
    const totalTokens = modelUsage.inputTokens + modelUsage.outputTokens;

    const callsPercent = Math.min(
      100,
      Math.round((modelUsage.calls / quota.maxCalls) * 100)
    );
    const tokensPercent = Math.min(
      100,
      Math.round((totalTokens / quota.maxTokens) * 100)
    );

    statuses.push({
      model,
      calls: modelUsage.calls,
      maxCalls: quota.maxCalls,
      callsPercent,
      tokens: totalTokens,
      maxTokens: quota.maxTokens,
      tokensPercent,
      isNearLimit:
        callsPercent >= QUOTA_WARNING_THRESHOLD * 100 ||
        tokensPercent >= QUOTA_WARNING_THRESHOLD * 100,
      isAtLimit: callsPercent >= 100 || tokensPercent >= 100,
      rateLimitHits: modelUsage.rateLimitHits,
    });
  }

  return statuses;
}

/**
 * Check if any model is near or at quota limit.
 */
export function hasQuotaWarning(): boolean {
  return getQuotaStatus().some((s) => s.isNearLimit);
}

/**
 * Check if any model has hit rate limits today.
 */
export function hasRateLimitHits(): boolean {
  return getQuotaStatus().some((s) => s.rateLimitHits > 0);
}
