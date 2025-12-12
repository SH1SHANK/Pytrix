# Pytrix Overview

**Master Python with AI-Powered Practice**

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](./licensing.md)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini-orange)](https://deepmind.google/technologies/gemini/)

---

## What is Pytrix?

**Pytrix** is a modern, privacy-focused platform designed to help developers master Python through adaptive, AI-generated challenges. Unlike traditional coding platforms with static problem sets, Pytrix uses Google's Gemini AI to generate infinite, unique exercises tailored to your skill level.

It combines a real in-browser Python runtime (Pyodide) with an intelligent AI tutor that provides instant feedback, hints, and code analysis—all without your data ever leaving your browser.

---

## Key Features

### ⚡ Auto Mode

A rapid-fire practice loop where problems are generated instantly. Solve, get feedback, and move to the next challenge without friction. Features:

- **Mini-curriculum** starting with String Manipulation fundamentals
- **Streak-based difficulty progression** (3 correct → promote difficulty)
- **Remediation injection** on failures for targeted practice
- **Decay protection** for stale streaks

### 🛠️ Manual Practice

Create custom practice sessions based on specific topics and difficulty levels. Choose from:

- 9 comprehensive modules (Fundamentals → Advanced)
- 40+ subtopics
- 150+ problem archetypes
- Three difficulty levels: Beginner, Intermediate, Advanced

### 🐍 Local Python Runtime

Code runs directly in your browser using **Pyodide** (Python compiled to WebAssembly):

- **No server-side execution** — instant feedback
- **True interruption** via SharedArrayBuffer and Web Workers
- **Complete isolation** — your code runs in a secure sandbox

### 🧠 Adaptive Difficulty

The AI analyzes your performance and adjusts question complexity:

- Per-subtopic difficulty tracking
- Streak-based promotion and demotion
- Weakness-based topic selection after initial curriculum

### 📊 Stats & Insights

Track your progress with detailed visualization:

- Module and subtopic mastery percentages
- Per-difficulty statistics
- Recent activity feed
- API usage dashboard

### 🔐 Privacy-First BYOK Model

**Bring Your Own Key (BYOK)** ensures complete control:

- API keys stored only in your browser's localStorage
- Direct communication with Gemini API (no proxy)
- Configurable safety caps to prevent accidental overuse

### ⚙️ Deep Customization

Full control over your experience:

- Theme selection (GitHub Dark, Light, System)
- Editor preferences (tab size, minimap, word wrap)
- Key bindings
- Advanced settings for power users

### ⌨️ Command Palette

Navigate the entire app with your keyboard (`Cmd/Ctrl+K`):

- Quick navigation to any page
- Jump to specific modules or subtopics
- Access settings and help

---

## Design Philosophy

### 1. Privacy by Default

We believe your code and learning journey are private. Pytrix:

- Never stores your code on our servers
- Never proxies your API key
- Keeps all stats and history in your browser

### 2. Infinite Unique Practice

Static problem sets lead to memorization, not mastery. Every question in Pytrix is generated fresh, ensuring you're solving new problems each time.

### 3. Immediate Feedback Loop

The best learning happens with fast feedback:

- Code execution in milliseconds (local runtime)
- AI evaluation provides instant correctness verification
- Progressive hints guide you without giving away solutions

### 4. Curriculum-Aware Progression

Not just random questions, but a structured learning path:

- Start with fundamentals before advanced topics
- Weakness detection prioritizes struggling areas
- Mastery tracking shows your growth

---

## Technology Stack

| Layer                | Technology                                                                  | Purpose                                |
| -------------------- | --------------------------------------------------------------------------- | -------------------------------------- |
| **Framework**        | [Next.js 16 (App Router)](https://nextjs.org/)                              | React framework with server components |
| **Language**         | [TypeScript 5](https://www.typescriptlang.org/)                             | Type-safe development                  |
| **UI Components**    | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) | Accessible component primitives        |
| **Styling**          | [Tailwind CSS 4](https://tailwindcss.com/)                                  | Utility-first CSS                      |
| **Python Runtime**   | [Pyodide 0.29](https://pyodide.org/)                                        | Python in WebAssembly                  |
| **AI Model**         | [Google Gemini](https://deepmind.google/technologies/gemini/)               | Question generation & evaluation       |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/)                                    | Lightweight React state                |
| **Charts**           | [Recharts](https://recharts.org/)                                           | Data visualization                     |
| **Code Editor**      | [Monaco Editor](https://microsoft.github.io/monaco-editor/)                 | VS Code's editor component             |
| **Testing**          | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)       | Unit and E2E testing                   |

---

## Target Audience

Pytrix is designed for:

- **Python learners** looking to practice coding fundamentals
- **Interview preppers** wanting to drill data structures and algorithms
- **Developers** who want to sharpen their Python skills
- **Privacy-conscious users** who don't want code stored on third-party servers
- **Self-guided learners** who prefer adaptive, personalized practice

---

## Comparison to Alternatives

| Feature                | Pytrix         | LeetCode          | HackerRank  | Exercism       |
| ---------------------- | -------------- | ----------------- | ----------- | -------------- |
| AI-Generated Questions | ✅ Infinite    | ❌ Static         | ❌ Static   | ❌ Static      |
| Local Execution        | ✅ Browser     | ❌ Server         | ❌ Server   | ❌ Server      |
| Privacy (No Account)   | ✅ BYOK        | ❌ Required       | ❌ Required | ❌ Required    |
| Adaptive Difficulty    | ✅ Real-time   | ⚠️ Manual         | ⚠️ Manual   | ⚠️ Track-based |
| AI Hints & Feedback    | ✅ Built-in    | ❌ Solutions only | ❌ Limited  | ✅ Mentorship  |
| Free Tier              | ✅ Unlimited\* | ⚠️ Limited        | ⚠️ Limited  | ✅ Free        |
| Open Source            | ✅ MIT         | ❌ No             | ❌ No       | ✅ Yes         |

\*Requires your own Gemini API key (free tier available from Google)

---

## Quick Links

- [Getting Started](./getting-started.md) — Installation and first run
- [Architecture](./architecture.md) — System design and data flow
- [Modules Reference](./modules.md) — Core module documentation
- [API Reference](./api-reference.md) — Public API documentation
- [Security & Privacy](./security-and-privacy.md) — Security model details
- [Contributing](./contribution-guide.md) — How to contribute
- [FAQ](./faq.md) — Common questions

---

## License

Pytrix is licensed under the **MIT License**. See [Licensing](./licensing.md) for details.
