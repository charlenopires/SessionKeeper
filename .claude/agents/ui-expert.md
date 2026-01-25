# UI Expert Agent

## Role

You are an expert in the **UI** bounded context for SessionKeeper.

## Context Description

Interface React do popup da extensão Chrome (400x600px), componentes visuais, modais, filtros e interações do usuário.

## Key Files

### Components
- `src/popup/App.tsx` - Main layout (header, content, footer)
- `src/popup/components/SessionList.tsx` - Session list container
- `src/popup/components/SessionCard.tsx` - Individual session card
- `src/popup/components/QuickActionsBar.tsx` - Save current session button
- `src/popup/components/SaveSessionModal.tsx` - New session form
- `src/popup/components/EditSessionModal.tsx` - Edit session form
- `src/popup/components/RestoreOptionsModal.tsx` - Restore options with duplicate handling
- `src/popup/components/SearchFilterBar.tsx` - Search input and tag filters
- `src/popup/components/TagManagementPanel.tsx` - Tag CRUD panel
- `src/popup/components/Toast.tsx` - Notification toasts
- `src/popup/components/ConfirmModal.tsx` - Destructive action confirmation

### Hooks
- `src/popup/hooks/useSessions.ts` - Load and manage sessions list
- `src/popup/hooks/useDeleteSession.ts` - Delete with confirmation
- `src/popup/hooks/useRestoreSession.ts` - Restore with progress
- `src/popup/hooks/useDuplicateDetection.ts` - Detect open URLs
- `src/popup/hooks/useAutoSave.ts` - Auto-save functionality

### Utils
- `src/popup/utils/formatRelativeDate.ts` - Portuguese relative dates

## Component Architecture

```
App
├── Header (logo, title, settings button)
├── QuickActionsBar (save current session)
├── SearchFilterBar (search + tag chips)
├── SessionList
│   └── SessionCard (expandable, shows tabs on click)
│       ├── Tag badges
│       ├── Window/tab counters
│       └── Action buttons (Restore, Edit, Delete)
├── Footer (Export, Import buttons)
└── Modals (SaveSession, EditSession, RestoreOptions, Confirm, TagManagement)
```

## Design System

All styles use tokens from `.claude/design-system.md`:

```css
/* Colors */
--color-primary-500: #5B6BC0   /* buttons, active states */
--color-neutral-900: #1A1A1A   /* main background */
--color-neutral-800: #2D2D2D   /* card backgrounds */
--color-neutral-100: #F5F5F5   /* primary text */

/* Spacing */
--spacing-sm: 8px
--spacing-md: 16px

/* Radius */
--radius-md: 8px
```

## Toast Notifications

```typescript
const { showSuccess, showError, showWarning, showInfo, showSessionSaved } = useToast();

// Types: success (green), error (red), warning (yellow), info (blue)
// Auto-dismiss after 3 seconds
// Positioned top-right, stacks multiple toasts
```

## Accessibility

1. **Keyboard Navigation**: Tab, Enter, Space for all interactive elements
2. **Focus Visible**: `:focus-visible` styles on buttons, inputs, cards
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
  variant="danger"  // or "warning"
  onConfirm={handleDelete}
  onCancel={handleCancel}
/>
```

## State Management

- Local state with React hooks (`useState`, `useEffect`)
- No global state library (project is small enough)
- Data fetched from IndexedDB via storage layer
- Optimistic updates with error rollback
