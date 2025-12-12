# Pytrix

**Master Python with AI-Powered Practice**

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini-orange)](https://deepmind.google/technologies/gemini/)

---

## What is Pytrix?

**Pytrix** is a modern, privacy-focused platform designed to help you master Python through adaptive, AI-generated challenges. Unlike traditional coding platforms with static problem sets, Pytrix uses Google's Gemini AI to generate infinite, unique exercises tailored to your skill level.

Think of it as having a personal Python tutor that never runs out of problems, never judges you for asking for hints, and runs entirely in your browser.

**No accounts. No data collection. Just you and Python.**

---

## Why Pytrix?

| Traditional Platforms                          | Pytrix                                  |
| ---------------------------------------------- | --------------------------------------- |
| Static problem sets you eventually memorize    | Infinite AI-generated problems          |
| Server-side execution (slow, privacy concerns) | Local execution in your browser         |
| Account required, data stored on their servers | No account, all data stays local        |
| Same difficulty regardless of skill            | Adaptive difficulty that grows with you |
| Generic feedback                               | AI-powered hints and code analysis      |

---

## Features

### Auto Mode

A rapid-fire practice loop where problems are generated instantly. Solve, get feedback, move on. No friction, just flow. Features streak-based difficulty progression that adapts to your performance in real-time.

### Manual Practice

Create custom practice sessions based on specific topics and difficulty levels. Want to drill "Two-Pointer Techniques" at advanced difficulty? Go for it.

### Local Python Runtime

Your code runs directly in your browser using **Pyodide** (Python compiled to WebAssembly). No network round-trips. No server queues. Execution in milliseconds.

### Adaptive Difficulty

The AI tracks your performance per-topic and adjusts complexity automatically. Crushing beginner problems? You'll be promoted to intermediate. Struggling? You'll get remediation questions to build confidence.

### Stats & Insights

Track your progress with detailed visualization of accuracy, speed, and topic mastery. See your weak points and crush them.

### Privacy First

Your API key stays in your browser. Your code never touches our servers. We don't even have a database to store your data if we wanted to.

---

## Tech Stack

Built with modern, battle-tested technologies:

| Layer              | Technology                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **Framework**      | [Next.js 16](https://nextjs.org/) with App Router                                                                      |
| **Language**       | [TypeScript 5](https://www.typescriptlang.org/)                                                                        |
| **UI**             | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) + [Tailwind CSS](https://tailwindcss.com/) |
| **Python Runtime** | [Pyodide 0.29](https://pyodide.org/) (WebAssembly)                                                                     |
| **AI**             | [Google Gemini](https://deepmind.google/technologies/gemini/)                                                          |
| **State**          | [Zustand](https://zustand-demo.pmnd.rs/)                                                                               |
| **Editor**         | [Monaco Editor](https://microsoft.github.io/monaco-editor/)                                                            |
| **Testing**        | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)                                                  |

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/SH1SHANK/Pytrix.git
cd Pytrix
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start practicing.

You'll need a Gemini API key for AI features — grab one free from [Google AI Studio](https://aistudio.google.com/).

---

## Bring Your Own Key (BYOK)

Pytrix uses a **Bring Your Own Key** model. Here's why:

1. **Privacy**: Your key never leaves your browser
2. **Control**: You manage your own usage and costs
3. **Transparency**: No hidden proxies or middlemen
4. **Trust**: We literally can't access your key even if we wanted to

### Setup

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/)
2. Open Pytrix → Settings → API Keys
3. Paste your key
4. Done. It's stored in `localStorage` and never transmitted to us.

See [Security & Privacy](./docs/security-and-privacy.md) for the full security model.

---

## How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Generate   │────▶│    Code     │────▶│   Execute   │────▶│  Evaluate   │
│  Question   │     │  (Editor)   │     │  (Pyodide)  │     │  (Gemini)   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                                                            │
       └────────────────────────────────────────────────────────────┘
                              Next Question
```

1. **Generate**: Gemini creates a unique problem based on your topic and difficulty
2. **Code**: Write your solution in the Monaco Editor (the same editor VS Code uses)
3. **Execute**: Your code runs locally in Pyodide — no server involved
4. **Evaluate**: Gemini analyzes your solution and provides feedback
5. **Repeat**: Move to the next challenge, forever

The whole loop runs in under 2 seconds on average.

---

## Documentation

Everything you need to know is in [`/docs`](./docs):

| Document                                             | What It Covers                              |
| ---------------------------------------------------- | ------------------------------------------- |
| [Overview](./docs/overview.md)                       | Project introduction and design philosophy  |
| [Getting Started](./docs/getting-started.md)         | Installation, setup, first practice session |
| [Architecture](./docs/architecture.md)               | System design, data flow, core services     |
| [Modules Reference](./docs/modules.md)               | Detailed documentation for each core module |
| [API Reference](./docs/api-reference.md)             | Complete API documentation                  |
| [Security & Privacy](./docs/security-and-privacy.md) | Security model and data handling            |
| [Contributing](./docs/contribution-guide.md)         | How to contribute                           |
| [FAQ](./docs/faq.md)                                 | Common questions and troubleshooting        |

---

## Deployment

Pytrix is designed for [Vercel](https://vercel.com/):

- Push to `main` → Auto-deploy to production
- Open a PR → Get a preview URL
- CI checks lint and build before merge

See [DEPLOYMENT.md](./DEPLOYMENT.md) for details.

---

## Testing

```bash
npm run test          # All tests
npm run test:unit     # Unit tests only
npm run test:e2e      # Browser tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

We use Vitest for unit tests, Testing Library for components, and Playwright for E2E.

See [tests/README.md](./tests/README.md) for the full testing guide.

---

## Contributing

We'd love your help. Here's the quick version:

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Make changes
4. Run `npm run lint && npm run build && npm run test`
5. Open a PR

See [Contributing Guide](./docs/contribution-guide.md) for code standards, architecture guidelines, and the full PR process.

---

## License

MIT License — do whatever you want with it. See [LICENSE](./LICENSE).

---

## Acknowledgments

Built on the shoulders of giants:

- [Next.js](https://nextjs.org/) for the framework
- [Pyodide](https://pyodide.org/) for bringing Python to the browser
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Google Gemini](https://deepmind.google/technologies/gemini/) for the AI

---

**Ready to level up your Python skills?** Clone the repo and start practicing.
