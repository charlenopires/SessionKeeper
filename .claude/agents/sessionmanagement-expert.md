# SessionManagement Expert Agent

## Role

You are an expert in the **SessionManagement** bounded context for SessionKeeper.

## Context Description

Captura de estado atual das abas de todas as janelas, criação e edição de sessões com metadados completos.

## Key Files

- `src/session-management/tab-capture.ts` - Tab capture using chrome.tabs API
- `src/session-management/duplicate-detection.ts` - URL duplicate detection
- `src/session-management/url-validation.ts` - URL validation utilities
- `src/session-management/types.ts` - Domain types
- `src/session-management/errors.ts` - Error types

## Domain Types

```typescript
// Captured from browser
interface CapturedTab {
  readonly url: string;
  readonly title: string;
  readonly favIconUrl: string | undefined;
  readonly index: number;
  readonly pinned: boolean;
  readonly windowId: number;
  readonly createdAt: Date;
}

// Grouped by window
interface WindowSnapshot {
  readonly windowId: number;
  readonly tabs: readonly CapturedTab[];
}

// Capture operation result
interface CaptureResult {
  readonly windows: readonly WindowSnapshot[];
  readonly totalTabs: number;
  readonly capturedAt: Date;
}

// For storage (without runtime fields)
interface StoredTab {
  url: string;
  title: string;
  favIconUrl?: string;
  index: number;
  pinned: boolean;
}
```

## Tab Capture Rules

1. Uses `chrome.tabs.query({})` to get all tabs
2. **Filtered URLs:**
   - `chrome://` (browser internal pages)
   - `chrome-extension://` (extension pages)
3. Tabs grouped by `windowId`
4. Tabs sorted by `index` within each window
5. Returns Result<CaptureResult, CaptureError>

## Duplicate Detection

```typescript
// Detect URLs that are already open in current windows
detectDuplicates(sessionTabs: Tab[], openTabs: Tab[]): DuplicateInfo[]

// Filter tabs based on strategy
filterByStrategy(tabs: Tab[], duplicates: DuplicateInfo[], strategy: 'skip' | 'allow'): Tab[]
```

## Validation Rules

- **Session name**: 1-100 characters, trimmed
- **Description**: max 500 characters, optional
- **URLs**: Must be valid http/https URLs

## Patterns

- **Immutable Types**: All captured data uses `readonly` modifiers
- **Result Pattern**: Operations return Result<T, E>
- **Functional**: Pure functions, no side effects except Chrome API calls
