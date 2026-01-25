import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const toastStyles: Record<ToastType, React.CSSProperties> = {
  success: {
    backgroundColor: 'var(--color-success)',
  },
  error: {
    backgroundColor: 'var(--color-error)',
  },
  info: {
    backgroundColor: 'var(--color-info)',
  },
  warning: {
    backgroundColor: 'var(--color-warning)',
  },
};

const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));

    // Auto dismiss
    const duration = toast.duration ?? 3000;
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className="toast"
      role="alert"
      aria-live="polite"
      style={{
        ...toastStyles[toast.type],
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-md)',
        color: 'white',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--spacing-sm)',
        boxShadow: 'var(--shadow-lg)',
        transform: isVisible && !isLeaving ? 'translateY(0)' : 'translateY(-20px)',
        opacity: isVisible && !isLeaving ? 1 : 0,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
      }}
    >
      <span style={{ fontSize: '18px', lineHeight: 1 }}>{icons[toast.type]}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, marginBottom: toast.message ? '4px' : 0 }}>
          {toast.title}
        </div>
        {toast.message && (
          <div style={{ fontSize: '13px', opacity: 0.9 }}>{toast.message}</div>
        )}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Fechar notificação"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '2px',
          fontSize: '16px',
          lineHeight: 1,
          opacity: 0.8,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8'; }}
      >
        ✕
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      className="toast-container"
      style={{
        position: 'fixed',
        top: 'var(--spacing-md)',
        right: 'var(--spacing-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)',
        zIndex: 1000,
        pointerEvents: 'none',
        maxWidth: '320px',
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showSuccess = (title: string, message?: string) => {
    return addToast({ type: 'success', title, message });
  };

  const showError = (title: string, message?: string) => {
    return addToast({ type: 'error', title, message });
  };

  const showInfo = (title: string, message?: string) => {
    return addToast({ type: 'info', title, message });
  };

  const showWarning = (title: string, message?: string) => {
    return addToast({ type: 'warning', title, message });
  };

  /**
   * Shows session saved feedback with name and counters
   */
  const showSessionSaved = (sessionName: string, totalTabs: number, totalWindows: number) => {
    const windowText = totalWindows === 1 ? 'janela' : 'janelas';
    const tabText = totalTabs === 1 ? 'aba' : 'abas';
    return showSuccess(
      `"${sessionName}" salva`,
      `${totalTabs} ${tabText} em ${totalWindows} ${windowText}`
    );
  };

  return {
    toasts,
    addToast,
    dismissToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showSessionSaved,
  };
}
