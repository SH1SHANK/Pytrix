# Security and Privacy

A comprehensive guide to Pytrix's security model, data handling, and privacy considerations.

---

## Overview

Pytrix is designed with privacy as a core principle. Key security features:

- **No account required** — Use immediately without registration
- **Client-side execution** — Python code runs in your browser
- **BYOK model** — You control your own API key
- **No server storage** — All data persists in your browser only

---

## BYOK (Bring Your Own Key) Security Model

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                          YOUR BROWSER                            │
│                                                                  │
│   ┌──────────────────┐                                          │
│   │   localStorage   │  ← API key stored here only              │
│   │ (encrypted none) │                                          │
│   └────────┬─────────┘                                          │
│            │                                                     │
│            ▼                                                     │
│   ┌──────────────────┐     ┌──────────────────────────────┐    │
│   │    aiClient      │────▶│   Same-origin API routes     │    │
│   │  (JavaScript)    │     │   (/api/ai/*)                │    │
│   └──────────────────┘     └──────────────────────────────┘    │
│                                        │                        │
│                     X-API-Key header   │                        │
└────────────────────────────────────────│────────────────────────┘
                                         │
                                         │ HTTPS
                                         ▼
                              ┌──────────────────────┐
                              │   Google Gemini API  │
                              │   (googleapis.com)   │
                              └──────────────────────┘
```

### Key Storage

| Aspect          | Detail                                                        |
| --------------- | ------------------------------------------------------------- |
| **Location**    | Browser localStorage                                          |
| **Key Name**    | `pypractice_api_config_v1`                                    |
| **Format**      | `{ provider: "gemini", apiKey: "...", createdAt: timestamp }` |
| **Encryption**  | None (standard localStorage)                                  |
| **Persistence** | Until manually cleared or browser data deleted                |

### Key Transmission

| Aspect              | Detail                                   |
| ------------------- | ---------------------------------------- |
| **Method**          | HTTP header (`X-API-Key`)                |
| **Scope**           | Same-origin requests only (`/api/ai/*`)  |
| **Transport**       | HTTPS (TLS encrypted)                    |
| **Server Handling** | Used immediately, never stored or logged |

### Security Guarantees

1. **Key never leaves your browser domain** — Only sent to same-origin API routes
2. **Key never stored server-side** — Used once per request, then discarded
3. **Key never logged** — Server code explicitly avoids logging the key
4. **Key never in URLs** — Always in headers, never query parameters

> [!IMPORTANT]
> In production, always use HTTPS. The key is transmitted in cleartext within TLS, so HTTP would expose it.

---

## Client-Side Safety Caps

Pytrix includes safety mechanisms to prevent accidental API overuse.

### Session Limits

| Feature              | Default Limit | Configurable |
| -------------------- | ------------- | ------------ |
| Total API calls      | 200/session   | Yes          |
| Question generations | 80/session    | Yes          |
| Hints requested      | 50/session    | Yes          |
| Optimal solutions    | 30/session    | Yes          |
| Code evaluations     | 100/session   | Yes          |

### How Safety Caps Work

```typescript
// Before each API call:
const result = checkAndRecordCall(feature);
if (!result.allowed) {
  throw new ClientLimitError(result);
}
```

### Configuring Limits

1. Go to **Settings** → **Advanced**
2. Adjust `maxApiCallsPerSession` and other limits
3. Limits reset on page refresh

> [!TIP]
> If you hit a limit, simply refresh the page to reset the session counters.

---

## Python Execution Security

### Sandboxed WebAssembly Environment

Python code runs in Pyodide, a WebAssembly-based Python interpreter:

```
┌─────────────────────────────────────────────────────────────────┐
│                          Main Thread                             │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                     React Application                     │  │
│   └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                   postMessage (code)                             │
│                              ▼                                   │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                       Web Worker                          │  │
│   │  ┌────────────────────────────────────────────────────┐  │  │
│   │  │                    Pyodide (WASM)                   │  │  │
│   │  │  ┌────────────────────────────────────────────┐    │  │  │
│   │  │  │              Python Runtime                │    │  │  │
│   │  │  │  • No network access                       │    │  │  │
│   │  │  │  • No filesystem access                    │    │  │  │
│   │  │  │  • Isolated memory                         │    │  │  │
│   │  │  │  • Interruptible via SharedArrayBuffer     │    │  │  │
│   │  │  └────────────────────────────────────────────┘    │  │  │
│   │  └────────────────────────────────────────────────────┘  │  │
│   └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Security Properties

| Property                 | Implementation                        |
| ------------------------ | ------------------------------------- |
| **No network access**    | Python code cannot make HTTP requests |
| **No filesystem access** | No access to user's computer files    |
| **Memory isolation**     | Runs in separate Web Worker thread    |
| **CPU protection**       | Interruptible execution with timeout  |
| **No DOM access**        | Cannot manipulate the web page        |

### Execution Timeouts

- Default timeout: 5 seconds per execution
- Infinite loops are automatically terminated
- Users can abort execution manually

### SharedArrayBuffer Requirements

For true execution interruption, Pytrix requires cross-origin isolation:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

These headers are configured in `next.config.ts`.

---

## Data Handling

### What Data is Stored

All data is stored in your browser's localStorage:

| Key                        | Contents              | Sensitive |
| -------------------------- | --------------------- | --------- |
| `pypractice_api_config_v1` | API key configuration | Yes       |
| `pytrix-settings`          | User preferences      | No        |
| `pytrix_stats_v2`          | Practice statistics   | No        |
| `pytrix_history`           | Session history       | No        |
| `pytrix_auto_runs_v2`      | Auto Mode runs        | No        |
| `pypractice_api_usage`     | API usage tracking    | No        |

### What Data is Sent to Google

When using AI features, the following is sent to Google's Gemini API:

| Data             | Purpose              | Can be disabled?      |
| ---------------- | -------------------- | --------------------- |
| Question prompts | Generate questions   | Use template fallback |
| Your code        | Evaluate correctness | Don't use Submit      |
| Execution output | Provide feedback     | Don't use Submit      |
| Hint requests    | Generate hints       | Don't use hints       |

> [!NOTE]
> If you're concerned about sending code to Google, you can:
>
> 1. Use questions without submitting for evaluation
> 2. Configure a lower safety cap to limit API calls
> 3. Rely on local test case execution only

### What Data We (Pytrix) Receive

**Nothing.** Pytrix has no backend that collects user data.

- No analytics by default
- No crash reporting
- No usage telemetry
- No account system

### Data Retention

| Data Type  | Retention                  | How to Clear              |
| ---------- | -------------------------- | ------------------------- |
| API key    | Until you clear it         | Settings → Clear API Key  |
| Statistics | Indefinite in localStorage | Settings → Reset Stats    |
| History    | Indefinite in localStorage | Settings → Clear History  |
| All data   | Indefinite                 | Browser → Clear Site Data |

---

## Privacy Considerations

### Google Gemini API

When you use AI features, your prompts and code are processed by Google's Gemini API:

- **Provider**: Google Cloud
- **Data usage**: Subject to [Google's AI Terms of Service](https://policies.google.com/terms/generative-ai)
- **Data retention**: Per Google's policies (typically not used for training)

> [!CAUTION]
> Do not paste sensitive or proprietary code into Pytrix if you're concerned about it being processed by Google's API.

### Recommendations for Sensitive Environments

If you're using Pytrix in a sensitive environment:

1. **Use template-only mode** — Questions can be generated without AI
2. **Disable AI evaluation** — Use local test cases only
3. **Review Google's terms** — Understand their data handling
4. **Use a test API key** — Separate from production keys

---

## Error Handling Security

### Safe Error Messages

API errors are normalized to user-friendly messages:

| Internal Error     | User Message                        |
| ------------------ | ----------------------------------- |
| API key in request | "Invalid API key" (key not exposed) |
| Rate limit (429)   | "Rate limit reached, please wait"   |
| Server error (5xx) | "Service temporarily unavailable"   |

### What's NOT Logged

The following are explicitly excluded from logs:

- API keys
- User code content
- Execution outputs
- Personal information (there is none)

---

## Threat Model

### In Scope (Protected Against)

| Threat                | Mitigation                                 |
| --------------------- | ------------------------------------------ |
| Key theft via XSS     | Same-origin policy, no third-party scripts |
| Key theft via MITM    | HTTPS required in production               |
| Malicious Python code | Sandboxed WASM execution                   |
| Infinite loops        | Timeout and abort capability               |
| API overuse           | Client-side safety caps                    |

### Out of Scope (User Responsibility)

| Threat                    | Why                     |
| ------------------------- | ----------------------- |
| Malware on user's machine | Outside browser control |
| Shoulder surfing          | Physical security       |
| Weak device passwords     | Device security         |
| Sharing API keys          | User responsibility     |

---

## Security Best Practices

### For Users

1. **Use a dedicated API key** — Create a key specifically for Pytrix
2. **Set usage limits in Google Console** — Additional protection against overuse
3. **Clear data when done** — If using a shared computer
4. **Use HTTPS** — Never use Pytrix over plain HTTP

### For Developers

1. **Never log API keys** — Use structured logging with key exclusion
2. **Validate all inputs** — Server-side validation of request bodies
3. **Use typed responses** — Prevent accidental data exposure
4. **Keep dependencies updated** — Regular security patches

---

## Compliance Notes

### GDPR

Pytrix does not collect or process personal data server-side:

- No user accounts
- No server-side storage
- No analytics/tracking
- All data in user's browser

Users control their own data through browser settings.

### CCPA

Similar to GDPR, no personal information is collected or sold.

### SOC 2 / HIPAA

Pytrix is not intended for regulated data. Do not use for:

- Healthcare data
- Financial records
- PII processing

---

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** open a public GitHub issue
2. Email: [security contact - recommend adding to README]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact

We aim to respond within 48 hours.

---

## Related Documentation

- [SECURITY_NOTES.md](../SECURITY_NOTES.md) — Quick reference for developers
- [Architecture](./architecture.md) — System design details
- [API Reference](./api-reference.md) — API documentation
