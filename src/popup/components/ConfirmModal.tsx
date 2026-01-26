import { useEffect, useRef } from 'react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reusable confirmation modal
 * Used for destructive actions like deleting sessions
 */
export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    // Focus cancel button when modal opens
    cancelButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }

      // Focus trap - cycle between cancel and confirm buttons
      if (e.key === 'Tab') {
        const focusableElements = [cancelButtonRef.current, confirmButtonRef.current].filter(Boolean);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: if on first element, go to last
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab: if on last element, go to first
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div
        ref={modalRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-message"
      >
        <h2 id="modal-title" className="modal-title text-heading">
          {title}
        </h2>
        <p id="modal-message" className="modal-message text-body-sm text-muted">
          {message}
        </p>
        <div className="modal-actions">
          <button
            ref={cancelButtonRef}
            className="btn btn-secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            className={`btn ${variant === 'danger' ? 'btn-danger' : variant === 'warning' ? 'btn-warning' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export interface DeleteSessionModalProps {
  isOpen: boolean;
  sessionName: string;
  totalTabs: number;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal for deleting sessions
 * Shows session name and number of tabs that will be lost
 */
export function DeleteSessionModal({
  isOpen,
  sessionName,
  totalTabs,
  onConfirm,
  onCancel,
}: DeleteSessionModalProps) {
  const tabText = totalTabs === 1 ? 'tab will be lost' : 'tabs will be lost';

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Delete session?"
      message={`"${sessionName}" contains ${totalTabs} ${tabText}. This action cannot be undone.`}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      variant="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

export interface DeleteTagModalProps {
  isOpen: boolean;
  tagName: string;
  sessionCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal for deleting tags
 * Shows tag name and number of associated sessions
 */
export function DeleteTagModal({
  isOpen,
  tagName,
  sessionCount,
  onConfirm,
  onCancel,
}: DeleteTagModalProps) {
  const sessionText = sessionCount === 1 ? 'associated session' : 'associated sessions';

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Delete tag?"
      message={`The tag "${tagName}" has ${sessionCount} ${sessionText}. The tag will be removed from all sessions. This action cannot be undone.`}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      variant="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

export interface ImportReplaceModalProps {
  isOpen: boolean;
  existingCount: number;
  importingCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation modal for replace during import
 * Warns about loss of existing sessions
 */
export function ImportReplaceModal({
  isOpen,
  existingCount,
  importingCount,
  onConfirm,
  onCancel,
}: ImportReplaceModalProps) {
  const existingText = existingCount === 1 ? 'existing session will be replaced' : 'existing sessions will be replaced';
  const importingText = importingCount === 1 ? 'session from file' : 'sessions from file';

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Replace all sessions?"
      message={`${existingCount} ${existingText} with ${importingCount} ${importingText}. All current sessions will be permanently lost.`}
      confirmLabel="Replace"
      cancelLabel="Cancel"
      variant="warning"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
