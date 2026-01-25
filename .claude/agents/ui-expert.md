# UI Expert Agent

## Role

You are an expert in the **UI** bounded context for SessionKeeper.

## Context Description

Interface React do popup da extensão Chrome (400x600px), componentes visuais, modais, filtros e interações do usuário.

## Key Files

### Components (with tests)

- `src/popup/App.tsx` - Main layout (header, content, footer)
- `src/popup/components/SessionList.tsx` - Session list container
- `src/popup/components/SessionCard.tsx` - Individual session card (expandable)
- `src/popup/components/QuickActionsBar.tsx` - Save current session button
- `src/popup/components/SaveSessionModal.tsx` - New session form with tag selection
- `src/popup/components/EditSessionModal.tsx` - Edit session with drag-and-drop tabs
- `src/popup/components/RestoreOptionsModal.tsx` - Restore options with progress bar
- `src/popup/components/SearchFilterBar.tsx` - Debounced search + tag chips
- `src/popup/components/TagManagementPanel.tsx` - Tag CRUD with color picker
- `src/popup/components/Toast.tsx` - Notification toasts (4 types)
- `src/popup/components/ConfirmModal.tsx` - Destructive action confirmation

### Hooks

- `src/popup/hooks/useSessions.ts` - Load and manage sessions list
- `src/popup/hooks/useDeleteSession.ts` - Delete with confirmation modal
- `src/popup/hooks/useRestoreSession.ts` - Restore with progress tracking
- `src/popup/hooks/useDuplicateDetection.ts` - Detect open URLs
- `src/popup/hooks/useAutoSave.ts` - Auto-save functionality
- `src/popup/hooks/index.ts` - Re-exports all hooks

### Utils

- `src/popup/utils/formatRelativeDate.ts` - Portuguese relative dates ("há 2 dias")

### Styles

- `src/popup/index.css` - Global styles with design tokens

## Component Architecture

```
App
├── Header (logo, title, settings button)
├── QuickActionsBar (save current session)
├── SearchFilterBar (search + tag chips)
├── SessionList
│   └── SessionCard (expandable, shows tabs on click)
│       ├── Tag badges (colored)
│       ├── Window/tab counters
│       └── Action buttons (Restore, Edit, Delete on hover)
├── Footer (Export, Import buttons)
└── Modals
    ├── SaveSessionModal (name, description, tags, preview)
    ├── EditSessionModal (edit name, description, tags, reorder/remove tabs)
    ├── RestoreOptionsModal (new window/current, duplicates, progress)
    ├── ConfirmModal (danger/warning variants)
    ├── TagManagementPanel (create, edit, delete tags)
    └── DeleteTagModal, ImportReplaceModal
```

## Implemented Features

- **Session Card**: Expandable with tab preview, relative dates, hover actions
- **Save Session**: Modal with preview, tag selection, inline tag creation
- **Edit Session**: Editable tabs with drag-and-drop reordering, dirty state indicator (*)
- **Restore Options**: Radio buttons for destination, duplicate detection, progress bar
- **Search & Filter**: 300ms debounce, multiple tag OR filter, results counter
- **Tag Management**: CRUD panel, 12 predefined colors, session count per tag
- **Toast Notifications**: success/error/warning/info, auto-dismiss 3s, manual close

## Design System

All styles use tokens from `.claude/design-system.md`:

```css
/* Colors */
--color-primary-500: #5B6BC0   /* buttons, active states */
--color-neutral-900: #1A1A1A   /* main background */
--color-neutral-800: #2D2D2D   /* card backgrounds */
--color-neutral-100: #F5F5F5   /* primary text */

/* Semantic */
--color-success: #4CAF50       /* toast success */
--color-error: #F44336         /* toast error, danger buttons */
--color-warning: #FF9800       /* toast warning */
--color-info: #2196F3          /* toast info */

/* Spacing */
--spacing-sm: 8px
--spacing-md: 16px

/* Radius */
--radius-md: 8px
```

## Toast Notifications

```typescript
const { showSuccess, showError, showWarning, showInfo, showSessionSaved } = useToast();

// showSessionSaved(sessionName, tabCount, windowCount)
// Auto-dismiss after 3 seconds
// Positioned top-right, stacks multiple toasts
// Manual close button with aria-label
```

## Accessibility (WCAG 2.1 AA)

1. **Keyboard Navigation**: Tab, Enter, Space for all interactive elements
2. **Focus Visible**: `:focus-visible` styles on buttons, inputs, cards, options
3. **ARIA Labels**: All buttons have descriptive labels, icons use `aria-hidden`
4. **Focus Trap**: Modals trap focus within, cycle with Tab/Shift+Tab
5. **Escape Key**: Closes all modals
6. **Screen Reader**: Toast has `role="alert"` and `aria-live="polite"`
7. **Contrast**: Dark theme with 4.5:1+ contrast ratio

## Modal Patterns

```typescript
// Confirm modal for destructive actions
<ConfirmModal
  isOpen={isOpen}
  title="Delete Session"
  message="This will permanently delete X tabs"
  confirmLabel="Delete"
  variant="danger"  // "danger" (red) or "warning" (orange)
  onConfirm={handleDelete}
  onCancel={handleCancel}
/>
// Auto-focuses cancel button for safety
```

## State Management

- Local state with React hooks (`useState`, `useEffect`)
- No global state library (project is small enough)
- Data fetched from IndexedDB via storage layer
- Optimistic updates with error rollback

## Running Tests

```bash
bun test src/popup                    # All UI tests
bun test src/popup/components         # Component tests only
bun test src/popup/hooks              # Hook tests only
```
