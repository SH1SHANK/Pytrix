# Auto Mode v2: Curriculum-Aware Adaptive Pacing

## Overview

Auto Mode v2 provides intelligent, curriculum-aware practice with adaptive difficulty based on user performance.

## How It Works

### 1. Mini-Curriculum

New runs start with a focused 12-question curriculum on **String Manipulation**:

- Basic string operations (indexing, slicing)
- Two-pointer techniques
- Sliding window patterns
- Pattern matching

After completing the mini-curriculum (or demonstrating mastery), the system broadens to weakness-based topic selection.

### 2. Streak-Based Difficulty Progression

| Event              | Action                                              |
| ------------------ | --------------------------------------------------- |
| Correct answer     | `streak++`                                          |
| 3 correct in a row | Promote difficulty (beginner→intermediate→advanced) |
| Incorrect answer   | `streak = 0`, demote difficulty, inject remediation |

**Aggressive mode** (opt-in): Promote after 2 correct instead of 3.

### 3. Difficulty Per Subtopic

Each subtopic tracks its own difficulty level:

```
difficultyPointer: {
  "basic-string-operations": "intermediate",
  "sliding-window-patterns": "beginner",
  "pattern-matching": "advanced"
}
```

### 4. Remediation

When a user answers incorrectly:

1. Difficulty is demoted for that subtopic
2. 2 extra beginner questions from that subtopic are injected into the queue
3. "Slow Down" button available to manually trigger this

### 5. Decay Timer

If inactive for >24 hours, streak is reduced by 50% to prevent stale mastery carryover.

---

## Tuning Parameters

| Parameter                   | Default | Description                           |
| --------------------------- | ------- | ------------------------------------- |
| `streakToPromote`           | 3       | Correct answers to promote difficulty |
| `aggressiveStreakToPromote` | 2       | Same, when Fast Mode enabled          |
| `extraRemediationCount`     | 2       | Questions injected on failure         |
| `miniCurriculumSize`        | 12      | Initial focused curriculum size       |
| `decayHours`                | 24      | Hours before streak decays            |
| `prefetchBufferSize`        | 2       | Questions to prefetch                 |

---

## User Controls

### Stats Bar

- **Breadcrumb**: Current module → subtopic
- **Streak**: 🔥 indicator with animation
- **Difficulty badge**: Current level for subtopic
- **Progress**: Mini-curriculum or ongoing count

### Quick Settings

- **Fast Progression**: Toggle for 2-correct promotion
- **Remediation Mode**: Auto-inject questions on mistakes
- **Slow Down**: Reset streak + add easier questions

---

## Storage

| Key                          | Content                     |
| ---------------------------- | --------------------------- |
| `pytrix_auto_run_v2_{runId}` | Individual run state        |
| `pytrix_auto_analytics`      | Promotion/demotion counters |

---

## Files

- [`src/lib/autoRunTypes.ts`](./src/lib/autoRunTypes.ts) - Type definitions
- [`src/lib/autoModeServiceV2.ts`](./src/lib/autoModeServiceV2.ts) - Core service
- [`src/components/automode/AutoModeStatsBarV2.tsx`](./src/components/automode/AutoModeStatsBarV2.tsx) - Stats bar
- [`src/components/automode/AutoModeControls.tsx`](./src/components/automode/AutoModeControls.tsx) - Settings popover
