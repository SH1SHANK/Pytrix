# Pytrix Architecture

A Python programming practice platform built with Next.js, TypeScript, and Google Gemini AI.

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          Next.js App                            │
├─────────────────┬─────────────────┬─────────────────────────────┤
│    Dashboard    │   Curriculum    │      Practice Workspace     │
│                 │    Browser      │  (Manual + Auto Mode)       │
├─────────────────┴─────────────────┴─────────────────────────────┤
│                      Core Services (lib/)                       │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │Question │ │Stats    │ │AutoMode  │ │Python    │ │AI Client ││
│  │Service  │ │Store    │ │Service   │ │Runtime   │ │(Gemini)  ││
│  └─────────┘ └─────────┘ └──────────┘ └──────────┘ └──────────┘│
├─────────────────────────────────────────────────────────────────┤
│                       Data Layer                                │
│        topics.json    localStorage    Gemini API                │
└─────────────────────────────────────────────────────────────────┘
```

## Core Features

| Feature                | Route                 | Description                                       |
| ---------------------- | --------------------- | ------------------------------------------------- |
| **Dashboard**          | `/`                   | Module stats, recent activity, quick navigation   |
| **Curriculum**         | `/modules`            | Browse modules, subtopics, and problem archetypes |
| **Manual Practice**    | `/practice/manual`    | Configure specific topic/difficulty               |
| **Auto Mode**          | `/practice/auto`      | Adaptive rapid-fire practice                      |
| **Practice Workspace** | `/practice`           | Code editor, runner, test cases                   |
| **History**            | `/history`            | Past practice sessions                            |
| **API Usage**          | `/insights/api-usage` | Token usage tracking                              |
| **Settings**           | `/support/settings`   | BYOK, preferences                                 |
| **Help**               | `/support/help`       | Documentation                                     |

## Core Services

### Question System (`lib/questionService.ts`)

- Two-layer generation: templates + LLM enhancement
- Topic-aware question selection
- Diversity constraints to avoid repetition

### Stats System (`lib/statsStore.ts`)

- Tracks attempts, streaks, mastery per topic
- Module and subtopic level aggregation
- Persistent via localStorage

### Auto Mode Service (`lib/autoModeService.ts`)

- Adaptive difficulty progression
- Mini-curriculum generation starting with basics
- Streak-based promotion/demotion
- Import/export of runs

### Python Runtime (`lib/pythonRuntime.ts`)

- Pyodide-based in-browser Python execution
- Lazy loading for performance
- Test case evaluation

### AI Client (`lib/aiClient.ts`)

- Google Gemini integration
- BYOK (Bring Your Own Key) support
- Rate limiting and usage tracking

## Data

### Topics (`src/data/topics.json`)

Comprehensive Python curriculum with:

- 9 modules (Fundamentals → Advanced)
- 40+ subtopics
- 150+ problem archetypes

To add new topics: Edit `topics.json` and add entries following the existing schema.

## BYOK (Bring Your Own Key)

Users can provide their own Gemini API key for:

- Question enhancement
- Code evaluation
- Hints and solutions

Keys stored in localStorage, never sent to server.
