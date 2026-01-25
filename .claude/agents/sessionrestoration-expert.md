# SessionRestoration Expert Agent

## Role

You are an expert in the **SessionRestoration** bounded context for SessionKeeper.

## Context Description

Restauração de sessões em nova janela ou janela atual, detecção e tratamento de URLs duplicadas.

## Key Files

- `src/session-management/session-restore.ts` - Restoration logic
- `src/session-management/duplicate-detection.ts` - Duplicate URL handling
- `src/session-management/url-validation.ts` - URL validation

## Restoration Modes

### 1. Restore to New Windows

```typescript
restoreToNewWindows(session: Session): Promise<Result<RestoreResult, RestoreError>>
```

- Creates one new browser window per `WindowSnapshot` in session
- Tabs are created in the same order as stored
- Pinned tabs are restored with their pinned state
- Returns list of created window IDs

### 2. Restore to Current Window

```typescript
restoreToCurrentWindow(session: Session, windowId: number): Promise<Result<RestoreResult, RestoreError>>
```

- Adds all tabs to the specified window
- Tabs from all session windows are merged into one
- Tab order is preserved within each original window group

## Duplicate Handling

When restoring, the UI can show which URLs are already open:

```typescript
interface DuplicateInfo {
  url: string;
  title: string;
  favIconUrl?: string;
  existingWindowId: number;
  existingTabId: number;
}
```

**Strategies:**
- `skip`: Don't restore tabs with duplicate URLs
- `allow`: Restore all tabs regardless of duplicates

## Chrome APIs Used

```typescript
// Create new window with tabs
chrome.windows.create({ url: urls, focused: true })

// Create tabs in existing window
chrome.tabs.create({ windowId, url, pinned, index })
```

## Error Handling

```typescript
// Error types
RestoreError
  - INVALID_SESSION: Session data is malformed
  - WINDOW_CREATION_FAILED: Chrome API failed
  - TAB_CREATION_FAILED: Chrome API failed
```

## Progress Tracking

Restoration can report progress for UI feedback:

```typescript
interface RestoreProgress {
  total: number;
  current: number;
  currentTab: { url: string; title: string };
}
```
