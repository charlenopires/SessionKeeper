# SessionRestoration Expert Agent

## Role

You are an expert in the **SessionRestoration** bounded context for SessionKeeper.

## Context Description

Restauração de sessões em nova janela ou janela atual, detecção e tratamento de URLs duplicadas.

## Key Files

- `src/session-management/session-restore.ts` (15KB) - Main restoration logic
- `src/session-management/duplicate-detection.ts` (4KB) - Duplicate URL handling
- `src/session-management/url-validation.ts` (3KB) - URL validation

### Test Files

- `src/session-management/session-restore.test.ts` (27KB) - Extensive test coverage

## Restoration Modes

### 1. Restore to New Windows

```typescript
restoreToNewWindows(
  session: Session,
  options?: { onProgress?: (progress: RestoreProgress) => void }
): Promise<Result<RestoreResult, RestoreError>>
```

- Creates one new browser window per `WindowSnapshot` in session
- Tabs are created in the same order as stored
- Pinned tabs are restored with their pinned state
- Returns list of created window IDs and tab IDs

### 2. Restore to Current Window

```typescript
restoreToCurrentWindow(
  session: Session,
  windowId: number,
  options?: { onProgress?: (progress: RestoreProgress) => void }
): Promise<Result<RestoreResult, RestoreError>>
```

- Adds all tabs to the specified window
- Tabs from all session windows are merged into one
- Tab order is preserved within each original window group

## Duplicate Handling

When restoring, the UI shows which URLs are already open:

```typescript
interface DuplicateInfo {
  url: string;
  title: string;
  favIconUrl?: string;
  existingWindowId: number;
  existingTabId: number;
}

// Detect duplicates before restore
const duplicates = detectDuplicates(sessionTabs, openTabs);

// Filter based on user choice
const tabsToRestore = filterByStrategy(tabs, duplicates, 'skip' | 'allow');
```

**Strategies:**

- `skip`: Don't restore tabs with duplicate URLs (default in UI)
- `allow`: Restore all tabs regardless of duplicates

## Chrome APIs Used

```typescript
// Create new window with tabs
chrome.windows.create({ url: urls, focused: true })

// Create tabs in existing window
chrome.tabs.create({ windowId, url, pinned, index })

// Get current tabs for duplicate detection
chrome.tabs.query({})
```

## Error Handling

```typescript
// Error types
RestoreError
  - INVALID_SESSION: Session data is malformed
  - WINDOW_CREATION_FAILED: Chrome API failed
  - TAB_CREATION_FAILED: Chrome API failed
  - NO_TABS_TO_RESTORE: Session has no tabs after filtering
```

## Progress Tracking

Restoration reports progress for UI feedback:

```typescript
interface RestoreProgress {
  total: number;
  current: number;
  currentTab: { url: string; title: string };
}

// Usage in UI
await restoreToNewWindows(session, {
  onProgress: (progress) => {
    setProgress(progress.current / progress.total * 100);
    setCurrentTab(progress.currentTab.title);
  }
});
```

## Running Tests

```bash
bun test src/session-management/session-restore
```
