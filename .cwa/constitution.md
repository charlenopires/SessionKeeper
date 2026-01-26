# sessionkeeper Constitution

## Purpose

Chrome Extension for saving and restoring browser sessions with multi-window support. Allows capturing the current state of all open tabs, organizing them with tags, and restoring them later in new windows or the current window.

## Core Values

1. **Clarity** - Self-documenting functional code with discriminated TypeScript types
2. **Simplicity** - Pure functions, immutability, composition over inheritance
3. **Testability** - All features must have unit tests with Bun test
4. **Accessibility** - Keyboard-accessible interface with ARIA labels and focus trap

## Technical Constraints

- **Language**: TypeScript strict mode with discriminated types (Result<T, E>)
- **Framework**: React 18 with functional hooks (no classes)
- **Database**: Dexie.js (wrapper for IndexedDB)
- **Runtime**: Bun (never npm/yarn/pnpm)
- **Build**: Vite + @crxjs/vite-plugin
- **Platform**: Chrome Extension Manifest V3 (Service Worker)
- **Minimum Test Coverage**: 80%

## Quality Standards

- All code must pass linting without warnings
- No hardcoded secrets or credentials
- Result pattern for error handling (never throw)
- UUID v4 for identifiers (avoids conflicts on merge)
- Functional paradigm: pure functions, immutability, pipe/flow for transformations
- CSS with design tokens defined in `.claude/design-system.md`

## Workflow Rules

- Only one task in progress at a time (WIP limit: 1)
- Specs must have acceptance criteria before implementation
- All architectural decisions must be recorded as ADRs
- Code review required before merging

## Bounded Contexts (DDD)

1. **Storage** - Persistence in IndexedDB with Dexie.js
2. **SessionManagement** - Tab capture via chrome.tabs API
3. **SessionRestoration** - Restoration in new window or current window
4. **ImportExport** - Export/Import JSON with schema validation
5. **UI** - React popup interface (400x600px)

## Out of Scope

- Cloud/server synchronization (local storage only)
- Support for other browsers (Firefox, Safari, Edge)
- Auto-save (manual only via button)
- Session version history

---
_Last updated: 2026-01-26_
