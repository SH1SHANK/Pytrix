# Security Notes

This document describes the security model for API key handling in Pytrix.

## Bring Your Own Key (BYOK) Design

Pytrix uses a **client-only** API key model:

- **Keys are stored in `localStorage` only** - never sent to Pytrix servers
- **Keys are sent directly to Google's Gemini API** via HTTPS
- **No server-side storage** of user API keys

## Single Source of Truth

All code paths MUST use the centralized API key system:

| Module              | Purpose                               |
| ------------------- | ------------------------------------- |
| `apiKeyStore.ts`    | Low-level localStorage operations     |
| `ApiKeyContext.tsx` | React context with verification state |
| `aiClient.ts`       | API calls with safety checks          |

### Adding New LLM Calls

1. Import from `aiClient.ts` only - never create separate API clients
2. Use `checkAndRecordCall()` before making the call
3. Handle `ClientLimitError` appropriately in UI
4. Never log or expose the API key in errors

## Error Handling

All errors are normalized to `ApiErrorType`:

| Type                   | Cause                  | Action               |
| ---------------------- | ---------------------- | -------------------- |
| `NO_API_KEY`           | Key not configured     | Show onboarding      |
| `INVALID_KEY`          | 401/403 from Gemini    | Prompt to check key  |
| `RATE_LIMIT`           | 429 from Gemini        | Wait and retry       |
| `QUOTA_EXCEEDED`       | Daily limit reached    | Check Google console |
| `NETWORK_ERROR`        | 5xx or network failure | Retry                |
| `CLIENT_LIMIT_REACHED` | Session safety cap     | Refresh page         |

## Safety Caps

Client-side limits prevent accidental overuse:

| Feature           | Default Limit |
| ----------------- | ------------- |
| Total calls       | 200/session   |
| Questions         | 80/session    |
| Hints             | 50/session    |
| Optimal solutions | 30/session    |
| Code evaluations  | 100/session   |

These reset on page refresh and can be adjusted in Settings → Advanced.

## Testing Error Flows

### Test Invalid Key

1. Enter a malformed key (e.g., "invalid-key-123")
2. Observe "Invalid API key" error
3. Verify key is NOT cleared for rate limit errors

### Test Rate Limit

1. Make many rapid requests
2. Observe "Rate limit reached" warning
3. Verify key remains verified

### Test Safety Caps

1. Set `maxQuestionCallsPerSession: 3` in Advanced settings
2. Generate 4 questions
3. Observe "Session limit reached" message
