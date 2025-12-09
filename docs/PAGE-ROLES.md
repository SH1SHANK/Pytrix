# Page Roles & Responsibilities

This document defines the distinct identities, interaction models, and content hierarchies for the core pages of the PyPractice MVP.

## 1. Dashboard (`/dashboard`)

**"Overview & Progress Hub"**

### Purpose

Answers: _"How am I doing overall, and where should I go next?"_

### Key Responsibilities

- **High-Level Status**: Global stats (mastery, streaks, problems solved).
- **Navigation Hub**: Suggestions on what to do next (e.g., "Resume Auto Run", "Practice Weakest Topic").
- **Activity Feed**: Quick history of recent sessions.

### Anti-Patterns (What NOT to do)

- Do not show the full curriculum tree (that belongs in Modules).
- Do not include detailed configuration controls for new questions (that belongs in Manual Practice).

---

## 2. Modules (`/modules`)

**"Curriculum Browser"**

### Purpose

Answers: _"What content exists and how is it structured?"_

### Key Responsibilities

- **Content Discovery**: Full browseable tree of Modules -> Subtopics -> Problem Types.
- **Learning Roadmap**: Linear or exploratory view of the curriculum.
- **Deep Linking**: Entry points to start practice on specific topics.

### Anti-Patterns

- Do not clutter with global user stats or streaks.
- Do not autoplay practice sessions directly without context.

---

## 3. Manual Practice (`/practice/manual`)

**"Focused Practice Configurator"**

### Purpose

Answers: _"Exactly what type of question do you want to solve right now?"_

### Key Responsibilities

- **Precise Setup**: Form-like controls to select Module, Subtopic, Difficulty, and Constraints.
- **Quick Launch**: Strong "Generate Question" action.
- **Preview**: Brief summary of what will be generated.

### Anti-Patterns

- Do not show the full module browsing grid.
- Do not show unrelated global stats.

---

## 4. Practice Workspace (`/practice`)

**"The IDE"**

### Purpose

Answers: _"How do I solve this specific problem?"_

### Key Responsibilities

- **Execution Environment**: Code editor, question panel, output terminal.
- **Feedback Loop**: Run, check, hints, solution reveal.
- **Focus**: Minimal distractions, centered on the current problem.
