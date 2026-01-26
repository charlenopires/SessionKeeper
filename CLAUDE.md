# sessionkeeper

Chrome Extension for saving and restoring browser sessions with multi-window support.

## Tooling

- **Runtime**: Bun (always use `bun` instead of npm/yarn/pnpm)
- **Build**: Vite + @crxjs/vite-plugin (hot reload and automatic manifest)
- **UI**: React 18 + functional hooks
- **Styling**: Custom CSS with design tokens
- **Database**: Dexie.js (IndexedDB wrapper)
- **Testing**: Bun test + happy-dom for React

## Technology Decisions

- **Manifest V3**: Required Service Worker for new Chrome extensions
- **UUID v4**: Session identifiers (avoids conflicts in import merges)
- **Result Pattern**: `Result<T, E>` for functional error handling
- **Functional Paradigm**: Pure functions, immutability, composition

## Domain Model

### Storage
Data persistence in IndexedDB using Dexie.js.

**Entities:**
- `Session`: id (UUID), name, description, windows[], tags[], totalTabs, totalWindows, createdAt, updatedAt
- `Tag`: id, name, color, createdAt
- `Settings`: key, value, updatedAt

**Main files:**
- `src/storage/db.ts` - Dexie schema and migrations
- `src/storage/session-operations.ts` - Session CRUD
- `src/storage/tag-operations.ts` - Tag CRUD
- `src/storage/errors.ts` - Typed error types

### SessionManagement
Capture current state of tabs from all windows.

**Types:**
- `CapturedTab`: url, title, favIconUrl, index, pinned, windowId, createdAt
- `WindowSnapshot`: windowId, tabs[]
- `CaptureResult`: windows[], totalTabs, capturedAt

**Rules:**
- chrome:// and chrome-extension:// URLs are filtered
- Tabs grouped by windowId and sorted by index
- Validation: name 1-100 chars, description max 500 chars

**Main files:**
- `src/session-management/tab-capture.ts` - Capture via chrome.tabs API
- `src/session-management/duplicate-detection.ts` - Duplicate detection

### SessionRestoration
Session restoration to new window or current window.

**Features:**
- Restore to new window (creates window for each WindowSnapshot)
- Restore to current window (adds tabs to active window)
- Duplicate detection (already open URLs)
- Strategies: skip duplicates or allow

**Main files:**
- `src/session-management/session-restore.ts` - Restoration logic
- `src/session-management/url-validation.ts` - URL validation

### ImportExport
Data export and import in JSON format.

**Format:**
- Version: "1.0.0"
- Dates serialized as ISO strings
- Sessions and tags exported together

**Import strategies:**
- `merge`: Combine with existing data
- `replace`: Replace all data

**Main files:**
- `src/import-export/export.ts` - JSON generation
- `src/import-export/import.ts` - Parsing and validation
- `src/import-export/types.ts` - Export schema

### UI
React interface for the extension popup (400x600px).

**Components:**
- `App.tsx` - Main layout (header, content, footer)
- `SessionList.tsx` / `SessionCard.tsx` - Session list
- `QuickActionsBar.tsx` - Save current session
- `SaveSessionModal.tsx` / `EditSessionModal.tsx` - Forms
- `RestoreOptionsModal.tsx` - Restore options
- `SearchFilterBar.tsx` - Search and tag filters
- `TagManagementPanel.tsx` - Tag management
- `Toast.tsx` - Notifications (success, error, warning, info)
- `ConfirmModal.tsx` - Destructive action confirmations

**Hooks:**
- `useSessions` - Session list
- `useDeleteSession` - Deletion with confirmation
- `useRestoreSession` - Restoration with progress
- `useDuplicateDetection` - Open URL detection
- `useToast` - Notification system

**Accessibility:**
- Tab/Enter/Space navigation
- Focus visible on all interactive elements
- aria-labels on buttons and icons
- Focus trap in modals
- Escape closes modals

## Design System

Design tokens reference: `.claude/design-system.md`

All UI implementation must follow the design system tokens defined above.

## Running Tests

```bash
bun test              # All tests
bun test --watch      # Watch mode
bun test src/storage  # Tests for a domain
```

## Project Structure

```
src/
├── background/       # Service worker
├── storage/          # IndexedDB layer (Dexie)
├── session-management/ # Tab capture and restore
├── import-export/    # JSON export/import
└── popup/            # React UI
    ├── components/   # React components
    ├── hooks/        # Custom hooks
    └── utils/        # Utilities
```
