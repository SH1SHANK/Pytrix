# Fast Manual Practice Design

## Goal

Reduce the repeated setup work for returning users who start a manual practice
session. Keep first-time setup explicit and let users change every choice.

## User flow

1. A first-time visitor opens **Manual Practice** and sees the existing empty
   configurator with beginner difficulty selected.
2. The user chooses a module, subtopic, optional problem type, and difficulty,
   then starts a question.
3. The app saves those choices in the existing persisted settings store.
4. The next visit to **Manual Practice** restores those choices, so the user can
   start immediately or change any selection.
5. Explicit URL parameters continue to override remembered choices. This
   preserves dashboard and curriculum deep links.

## State and precedence

Store the last successful manual setup as `{ moduleId, subtopicId,
problemTypeId, difficulty }` in the existing Zustand settings store, persisted
to localStorage. Do not add another storage mechanism, dependency, API call, or
settings screen.

Resolve each initial choice in this order: explicit URL parameter, valid
remembered value, existing default. A remembered module and subtopic must still
exist in the current curriculum. Clear an unavailable problem type and fall
back to beginner for an invalid difficulty. Preserve the current optional
problem-type behavior, which chooses a type when the user starts without one.

## Boundaries and failure handling

- Save only after a question has been prepared successfully; a failed start
  must not replace the last working setup.
- Keep the current route and session-generation behavior unchanged.
- Changing a module clears dependent subtopic and problem-type selections as it
  does today.
- Keep all values local to the browser. No account or cross-device sync is
  introduced.

## Success criteria

- Returning users see their last successful manual setup preselected.
- A fresh user sees the current first-use defaults.
- Explicit deep-link parameters win over stored preferences.
- Stale stored curriculum values do not crash the configurator or block a new
  selection.
- Users can edit restored choices before starting.

## Verification

- Add store coverage for saving and restoring the setup.
- Add configurator coverage for URL-over-storage precedence and stale values.
- Run the unit suite, lint, production build, and manual-practice browser flow.

## Scope exclusions

This change does not add automatic topic recommendations, alter onboarding,
redesign the dashboard, change AI question generation, or optimize bundles.
