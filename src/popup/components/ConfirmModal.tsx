import { useEffect, useRef } from 'react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
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

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    // Focus cancel button when modal opens
    cancelButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
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
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
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
