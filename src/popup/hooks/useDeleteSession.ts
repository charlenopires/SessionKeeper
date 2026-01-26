import { useState, useCallback } from 'react';
import { deleteSession } from '../../storage';
import { isOk } from '../../storage/result';
import type { Session } from '../../storage';

export interface UseDeleteSessionOptions {
  onDeleted?: (sessionId: string) => void;
  onError?: (error: Error) => void;
}

export interface UseDeleteSessionResult {
  isModalOpen: boolean;
  sessionToDelete: Session | null;
  isDeleting: boolean;
  openDeleteModal: (session: Session) => void;
  closeDeleteModal: () => void;
  confirmDelete: () => Promise<void>;
}

/**
 * Hook to manage the session deletion flow
 * Controls modal state and executes deletion
 */
export function useDeleteSession(
  options: UseDeleteSessionOptions = {}
): UseDeleteSessionResult {
  const { onDeleted, onError } = options;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteModal = useCallback((session: Session) => {
    setSessionToDelete(session);
    setIsModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setIsModalOpen(false);
    setSessionToDelete(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!sessionToDelete) return;

    setIsDeleting(true);

    try {
      const result = await deleteSession(sessionToDelete.id);

      if (isOk(result)) {
        if (result.value) {
          onDeleted?.(sessionToDelete.id);
        }
      } else {
        onError?.(new Error(result.error.getUserMessage()));
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  }, [sessionToDelete, onDeleted, onError, closeDeleteModal]);

  return {
    isModalOpen,
    sessionToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
  };
}
