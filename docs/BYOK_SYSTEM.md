# BYOK (Bring Your Own Key) System - Technical Documentation

> **For Developers & LLMs** | Last Updated: December 2024

This document provides a comprehensive guide to the BYOK system implementation in PyPractice. It covers architecture, data flow, file structure, and extension patterns.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [Data Flow](#data-flow)
5. [Key Modules](#key-modules)
6. [API Routes](#api-routes)
7. [Error Handling](#error-handling)
8. [Usage Tracking](#usage-tracking)
9. [Security Model](#security-model)
10. [Extension Guide](#extension-guide)
11. [Common Patterns](#common-patterns)
12. [Troubleshooting](#troubleshooting)

---

## System Overview

### Purpose

The BYOK system allows users to provide their own Gemini API key for LLM-powered features. This approach:

- **No server-side key storage**: Keys exist only in the user's browser
- **User-controlled quota**: Users manage their own API usage limits
- **Privacy-first**: API keys never touch application servers for persistence

### Core Principle

```
User's Browser (localStorage) → API Routes (X-API-Key header) → Gemini API
```

The application's backend acts as a **proxy** that receives the user's key via HTTP header, makes calls to Gemini, and returns results. The key is never stored server-side.

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Browser)                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐   │
│  │ apiKeyStore  │───▶│  aiClient.ts │───▶│ fetch('/api/ai/...')     │   │
│  │ (localStorage)│    │  (wrapper)   │    │ with X-API-Key header   │   │
│  └──────────────┘    └──────────────┘    └──────────────────────────┘   │
│         │                   │                        │                   │
│         │                   ▼                        │                   │
│         │           ┌──────────────┐                 │                   │
│         │           │ usageStore   │◀────────────────┘                   │
│         │           │ (localStorage)│    (records usage on response)     │
│         │           └──────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SERVER (Next.js API Routes)                    │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ /api/ai/*                                                          │ │
│  │                                                                    │ │
│  │  1. Extract X-API-Key from request header                         │ │
│  │  2. Create Gemini client with user's key                          │ │
│  │  3. Call Gemini API                                               │ │
│  │  4. Return result + usage metadata                                │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│         │                                                                │
│         ▼                                                                │
│  ┌──────────────┐    ┌──────────────┐                                   │
│  │ modelRouter  │───▶│ geminiClient │───▶ Google Gemini API             │
│  │ (fallback)   │    │ (SDK wrapper)│                                   │
│  └──────────────┘    └──────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

### Core Files

```
src/
├── lib/
│   ├── apiKeyStore.ts      # Client-side API key storage (localStorage)
│   ├── aiClient.ts         # Client-side API wrapper (main entry point)
│   ├── usageStore.ts       # Usage tracking in localStorage
│   └── ai/
│       ├── geminiClient.ts # Gemini SDK wrapper with key injection
│       ├── modelRouter.ts  # Model fallback and rate limit handling
│       ├── generateQuestion.ts   # [DEPRECATED] Server action
│       ├── evaluateCode.ts       # [DEPRECATED] Server action
│       ├── getHints.ts           # [DEPRECATED] Server action
│       ├── revealSolution.ts     # [DEPRECATED] Server action
│       └── optimizeSolution.ts   # [DEPRECATED] Server action
│
├── app/
│   ├── api/ai/
│   │   ├── generate-question/route.ts
│   │   ├── evaluate-code/route.ts
│   │   ├── get-hints/route.ts
│   │   ├── reveal-solution/route.ts
│   │   ├── optimize-solution/route.ts
│   │   └── test-connection/route.ts
│   └── support/settings/page.tsx  # API key configuration UI
│
└── components/
    ├── dashboard/ApiKeyBanner.tsx     # No-key prompt on dashboard
    └── ApiKeyRequiredDialog.tsx       # No-key error dialog
```

### Deprecation Note

The files in `src/lib/ai/*.ts` (generateQuestion, evaluateCode, etc.) are **deprecated server actions**. They still exist for backwards compatibility but require an `apiKey` parameter. New code should use `aiClient.ts` functions.

---

## Data Flow

### 1. User Configures API Key

```typescript
// User enters key in Settings UI
// Settings page calls:
import { saveUserApiConfig, createApiConfig } from "@/lib/apiKeyStore";

const config = createApiConfig("gemini", userInputKey);
saveUserApiConfig(config);

// Stored in localStorage as:
// key: "pypractice_api_config_v1"
// value: { provider: "gemini", apiKey: "...", createdAt: 1234567890 }
```

### 2. AI Feature Request

```typescript
// Component calls aiClient function:
import { generateQuestion } from "@/lib/aiClient";

const question = await generateQuestion("Strings", "beginner");

// aiClient.ts internally:
// 1. Loads key from apiKeyStore
// 2. Makes fetch() with X-API-Key header
// 3. Records usage from response
// 4. Returns data
```

### 3. Server-Side Processing

```typescript
// /api/ai/generate-question/route.ts:
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("X-API-Key");
  // ... validate ...

  const result = await callGeminiWithFallback(
    apiKey, // First parameter is always apiKey
    "question-generation",
    prompt,
    parseJsonResponse<T>
  );

  return NextResponse.json({
    question: result.data,
    usage: {
      model: result.modelUsed,
      inputTokens: result.usage?.inputTokens,
      outputTokens: result.usage?.outputTokens,
    },
  });
}
```

### 4. Usage Recording

```typescript
// aiClient.ts after receiving response:
import { recordApiUsage } from "./usageStore";

const data = await handleResponse(response);
if (data.usage) {
  recordApiUsage(
    data.usage.model,
    data.usage.inputTokens,
    data.usage.outputTokens
  );
}
```

---

## Key Modules

### apiKeyStore.ts

Manages API key persistence in localStorage.

```typescript
// Types
interface UserApiConfig {
  provider: "gemini";  // Extensible for future providers
  apiKey: string;
  createdAt: number;
}

// Key Functions
loadUserApiConfig(): UserApiConfig | null
saveUserApiConfig(config: UserApiConfig): void
clearUserApiConfig(): void
isApiKeyConfigured(): boolean
getApiKeyForProvider(provider: string): string | null
createApiConfig(provider, apiKey): UserApiConfig
```

**Storage Key**: `pypractice_api_config_v1`

### aiClient.ts

Client-side wrapper for all AI API calls. This is the **primary module** consumers should use.

```typescript
// Exported Functions
generateQuestion(topic, difficulty): Promise<Question>
getHints(question, code, hintsCount): Promise<Hint>
revealSolution(question, failedAttempts): Promise<{referenceSolution: string}>
evaluateCode(question, code, executionContext?): Promise<EvaluationResult>
optimizeSolution(question, userCode): Promise<OptimizedSolution | null>
testApiConnection(): Promise<{valid: boolean, error?: string}>

// Error Classes
ApiKeyNotConfiguredError  // Thrown when no API key in storage
ApiError                  // Thrown on API errors (includes errorType, status)
```

### geminiClient.ts

Low-level Gemini SDK wrapper.

```typescript
// Factory function - creates client with provided key
createGeminiClient(apiKey: string): GoogleGenerativeAI

// Get model with key
getModelWithKey(apiKey: string, modelNameOrAlias: string): GenerativeModel

// Test key validity
testApiKey(apiKey: string): Promise<{valid: boolean, error?: string}>

// Error class
ApiKeyRequiredError  // Thrown when apiKey is empty/missing
```

### modelRouter.ts

Handles model fallback, rate limiting, and error classification.

```typescript
// Main function - REQUIRES apiKey as FIRST parameter
callGeminiWithFallback<T>(
  apiKey: string,
  task: TaskType,
  prompt: string,
  parseResponse?: (text: string) => T
): Promise<AIResult<T>>

// AIResult interface
interface AIResult<T> {
  success: boolean;
  data?: T;
  message?: string;
  modelUsed?: string;
  usage?: { inputTokens: number; outputTokens: number };
  errorType?: "rate_limit" | "config_error" | "ai_unavailable" | "api_key_required";
}
```

---

## API Routes

All routes follow the same pattern:

### Request Format

```http
POST /api/ai/{endpoint}
Content-Type: application/json
X-API-Key: <user's Gemini API key>

{
  // Endpoint-specific body
}
```

### Response Format

```json
{
  "data": {
    /* endpoint-specific response */
  },
  "usage": {
    "model": "gemini-1.5-flash",
    "inputTokens": 150,
    "outputTokens": 500
  },
  "fallback": false // true if using mock data
}
```

### Error Response

```json
{
  "error": "Error message",
  "errorType": "api_key_required" | "config_error" | "rate_limit"
}
```

### Endpoints Reference

| Endpoint                    | Body                                | Response                     |
| --------------------------- | ----------------------------------- | ---------------------------- |
| `/api/ai/generate-question` | `{topic, difficulty}`               | `{question, usage}`          |
| `/api/ai/get-hints`         | `{question, code, hintsCount}`      | `{hint, usage}`              |
| `/api/ai/reveal-solution`   | `{question, failedAttempts}`        | `{referenceSolution, usage}` |
| `/api/ai/evaluate-code`     | `{question, code, output?, error?}` | `{evaluation, usage}`        |
| `/api/ai/optimize-solution` | `{question, userCode}`              | `{optimized, usage}`         |
| `/api/ai/test-connection`   | (none)                              | `{valid, error?}`            |

---

## Error Handling

### Client-Side (aiClient.ts)

```typescript
try {
  const question = await generateQuestion("Strings", "beginner");
} catch (error) {
  if (error instanceof ApiKeyNotConfiguredError) {
    // No API key - redirect to settings or show dialog
    router.push("/support/settings");
  } else if (error instanceof ApiError) {
    if (error.status === 401) {
      // Invalid key
    } else if (error.status === 429) {
      // Rate limited
    }
  }
}
```

### Server-Side (API Routes)

```typescript
// Check for key
const apiKey = request.headers.get("X-API-Key");
if (!apiKey) {
  return NextResponse.json(
    { error: "API key required", errorType: "api_key_required" },
    { status: 401 }
  );
}

// Handle AI errors
if (
  result.errorType === "api_key_required" ||
  result.errorType === "config_error"
) {
  return NextResponse.json(
    { error: result.message, errorType: result.errorType },
    { status: 401 }
  );
}
```

---

## Usage Tracking

### How It Works

1. API routes return `usage` object with model/tokens
2. `aiClient.ts` calls `recordApiUsage()` after each successful call
3. Data stored in localStorage under `pypractice_api_usage`
4. Daily reset mechanism (auto-clears old data)

### Data Structure

```typescript
interface DailyUsage {
  date: string; // "YYYY-MM-DD"
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  models: Record<string, ModelUsage>;
}

interface ModelUsage {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  lastUsedAt: number;
}
```

### UI Components

- **ApiUsageCard** (`/components/dashboard/`) - Dashboard summary
- **ApiUsagePage** (`/insights/api-usage/`) - Detailed breakdown

---

## Security Model

### Key Storage

- **Location**: Browser localStorage only
- **Key Name**: `pypractice_api_config_v1`
- **Encryption**: None (standard localStorage)
- **Persistence**: Until manually cleared or browser data deleted

### Key Transmission

- **Method**: HTTP header `X-API-Key`
- **Scope**: Only sent to same-origin API routes (`/api/ai/*`)
- **Backend Handling**: Key used immediately, never stored/logged

### Important Constraints

1. **Never log API keys** in server-side code
2. **Never persist keys** to databases or files
3. **HTTPS required** in production (keys in cleartext on wire otherwise)
4. **Cross-origin blocked** by same-origin policy

---

## Extension Guide

### Adding a New AI Endpoint

1. **Create API Route**

```typescript
// src/app/api/ai/new-feature/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  callGeminiWithFallback,
  parseJsonResponse,
} from "@/lib/ai/modelRouter";

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("X-API-Key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key required", errorType: "api_key_required" },
      { status: 401 }
    );
  }

  const body = await request.json();
  // ... validate body ...

  const result = await callGeminiWithFallback(
    apiKey,
    "hint", // TaskType for model selection
    prompt,
    parseJsonResponse<YourType>
  );

  return NextResponse.json({
    data: result.data,
    usage: result.usage
      ? {
          model: result.modelUsed,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
        }
      : null,
  });
}
```

2. **Add Client Function in aiClient.ts**

```typescript
export async function newFeature(params: Params): Promise<Result> {
  const apiKey = getApiKey(); // Throws if not configured

  const response = await fetch("/api/ai/new-feature", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify(params),
  });

  const data = await handleResponse<{
    data: Result;
    usage: UsageData | null;
  }>(response);

  recordUsageIfPresent(data.usage);
  return data.data;
}
```

3. **Use in Components**

```typescript
import { newFeature } from "@/lib/aiClient";

const result = await newFeature({ ... });
```

### Adding a New Provider (e.g., OpenAI)

1. **Extend UserApiConfig**

```typescript
// apiKeyStore.ts
interface UserApiConfig {
  provider: "gemini" | "openai"; // Add new provider
  apiKey: string;
  createdAt: number;
}
```

2. **Create Provider Client**

```typescript
// src/lib/ai/openaiClient.ts
export function createOpenAIClient(apiKey: string): OpenAI { ... }
```

3. **Update modelRouter**

```typescript
// Add provider selection logic
if (provider === "openai") {
  return callOpenAIWithFallback(apiKey, task, prompt, parseResponse);
}
```

4. **Update Settings UI**

Add provider selector dropdown in `/support/settings/page.tsx`.

---

## Common Patterns

### Pattern: Graceful Degradation

```typescript
// For non-critical features, return null instead of throwing
export async function optimizeSolution(question, code) {
  try {
    const apiKey = getApiKey();
    // ... API call ...
  } catch (error) {
    if (error instanceof ApiKeyNotConfiguredError) {
      return null; // Feature unavailable but not fatal
    }
    throw error;
  }
}
```

### Pattern: Prefetching

```typescript
// questionBufferService.ts uses aiClient for background prefetch
// This works because aiClient handles key loading automatically
import { generateQuestion } from "@/lib/aiClient";

async function prefetchQuestions() {
  const question = await generateQuestion(topic, difficulty);
  buffer.push(question);
}
```

### Pattern: Checking Key State

```typescript
import { isApiKeyConfigured } from "@/lib/apiKeyStore";

// Conditional UI rendering
{
  isApiKeyConfigured() ? <PracticeButton /> : <ConfigureKeyButton />;
}
```

---

## Troubleshooting

### "API key required" Error

- **Cause**: No key in localStorage or key is empty
- **Check**: `localStorage.getItem("pypractice_api_config_v1")`
- **Fix**: Navigate to Settings and save a valid key

### "Invalid API key" Error

- **Cause**: Key is malformed or revoked
- **Check**: Test key at [AI Studio](https://aistudio.google.com/)
- **Fix**: Generate new key and reconfigure

### Usage Not Recording

- **Cause**: API route not returning `usage` object
- **Check**: Inspect network response in DevTools
- **Fix**: Ensure route returns `{ ..., usage: { model, inputTokens, outputTokens } }`

### Rate Limiting

- **Cause**: Gemini API quota exceeded
- **Symptom**: 429 errors, `errorType: "rate_limit"`
- **Fix**: Wait for quota reset or upgrade API tier

---

## Quick Reference

### Key Files to Modify

| Task                  | Files                                      |
| --------------------- | ------------------------------------------ |
| Add new AI feature    | `aiClient.ts`, new `/api/ai/` route        |
| Change key storage    | `apiKeyStore.ts`                           |
| Modify model behavior | `modelRouter.ts`, `geminiClient.ts`        |
| Update Settings UI    | `/support/settings/page.tsx`               |
| Change usage display  | `ApiUsageCard.tsx`, `/insights/api-usage/` |

### Function Signatures (Always apiKey First)

```typescript
// modelRouter
callGeminiWithFallback(apiKey, task, prompt, parser?)

// geminiClient
createGeminiClient(apiKey)
getModelWithKey(apiKey, modelName)
testApiKey(apiKey)

// Legacy server actions (deprecated)
generateQuestion(apiKey, topic, difficulty)
evaluateCode(apiKey, question, code, context?)
getHints(apiKey, question, code, hintsCount)
revealSolution(apiKey, question, failedAttempts)
```

---

_This documentation should be kept updated as the BYOK system evolves._
