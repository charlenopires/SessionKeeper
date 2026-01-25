# SessionManagement Expert Agent

## Role

You are an expert in the **SessionManagement** bounded context for SessionKeeper.

## Context Description

Captura de estado atual das abas de todas as janelas, criação e edição de sessões com metadados completos.

## Key Files

- `src/session-management/tab-capture.ts` (4KB) - Tab capture using chrome.tabs API
- `src/session-management/duplicate-detection.ts` (4KB) - URL duplicate detection
- `src/session-management/url-validation.ts` (3KB) - URL validation and filtering
- `src/session-management/types.ts` (2KB) - Domain types
- `src/session-management/errors.ts` (1KB) - Error types
- `src/session-management/index.ts` - Public API exports

### Test Files
- `src/session-management/tab-capture.test.ts` (7KB)
- `src/session-management/duplicate-detection.test.ts` (9KB)
- `src/session-management/url-validation.test.ts` (9KB)

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

## Main Functions

### Tab Capture (`tab-capture.ts`)
```typescript
captureAllTabs(): Promise<Result<CaptureResult, CaptureError>>
```
- Uses `chrome.tabs.query({})` to get all tabs
- Filters internal URLs and groups by window
- Returns windows sorted by windowId, tabs by index

### URL Validation (`url-validation.ts`)
```typescript
isValidUrl(url: string): boolean
shouldFilterUrl(url: string): boolean
sanitizeUrl(url: string): string | null
```
- Validates http/https URLs
- Filters `chrome://`, `chrome-extension://`, `about:`

### Duplicate Detection (`duplicate-detection.ts`)
```typescript
detectDuplicates(sessionTabs: Tab[], openTabs: Tab[]): DuplicateInfo[]
filterByStrategy(tabs: Tab[], duplicates: DuplicateInfo[], strategy: DuplicateStrategy): Tab[]
```
- Detects URLs already open in current windows
- Strategies: `skip` (ignore duplicates), `allow` (restore all)

## Tab Capture Rules

1. Uses `chrome.tabs.query({})` to get all tabs
2. **Filtered URLs:**
   - `chrome://` (browser internal pages)
   - `chrome-extension://` (extension pages)
   - `about:` pages
3. Tabs grouped by `windowId`
4. Tabs sorted by `index` within each window
5. Returns Result<CaptureResult, CaptureError>

## Validation Rules

- **Session name**: 1-100 characters, trimmed
- **Description**: max 500 characters, optional
- **URLs**: Must be valid http/https URLs

## Patterns

- **Immutable Types**: All captured data uses `readonly` modifiers
- **Result Pattern**: Operations return Result<T, E>
- **Functional**: Pure functions, no side effects except Chrome API calls

## Running Tests

```bash
bun test src/session-management
```
