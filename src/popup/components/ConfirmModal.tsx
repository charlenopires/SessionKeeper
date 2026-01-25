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
 * Modal de confirmação reutilizável
 * Usado para ações destrutivas como exclusão de sessões
 */
export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
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
 * Modal específico para exclusão de sessões
 * Mostra nome da sessão e quantidade de abas que serão perdidas
 */
export function DeleteSessionModal({
  isOpen,
  sessionName,
  totalTabs,
  onConfirm,
  onCancel,
}: DeleteSessionModalProps) {
  const tabText = totalTabs === 1 ? 'aba será perdida' : 'abas serão perdidas';

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Excluir sessão?"
      message={`"${sessionName}" contém ${totalTabs} ${tabText}. Esta ação não pode ser desfeita.`}
      confirmLabel="Excluir"
      cancelLabel="Cancelar"
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
 * Modal específico para exclusão de tags
 * Mostra nome da tag e quantidade de sessões associadas
 */
export function DeleteTagModal({
  isOpen,
  tagName,
  sessionCount,
  onConfirm,
  onCancel,
}: DeleteTagModalProps) {
  const sessionText = sessionCount === 1 ? 'sessão associada' : 'sessões associadas';

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Excluir tag?"
      message={`A tag "${tagName}" possui ${sessionCount} ${sessionText}. A tag será removida de todas as sessões. Esta ação não pode ser desfeita.`}
      confirmLabel="Excluir"
      cancelLabel="Cancelar"
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
 * Modal de confirmação para substituição durante importação
 * Alerta sobre perda de sessões existentes
 */
export function ImportReplaceModal({
  isOpen,
  existingCount,
  importingCount,
  onConfirm,
  onCancel,
}: ImportReplaceModalProps) {
  const existingText = existingCount === 1 ? 'sessão existente será substituída' : 'sessões existentes serão substituídas';
  const importingText = importingCount === 1 ? 'sessão do arquivo' : 'sessões do arquivo';

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Substituir todas as sessões?"
      message={`${existingCount} ${existingText} por ${importingCount} ${importingText}. Todas as sessões atuais serão permanentemente perdidas.`}
      confirmLabel="Substituir"
      cancelLabel="Cancelar"
      variant="warning"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
