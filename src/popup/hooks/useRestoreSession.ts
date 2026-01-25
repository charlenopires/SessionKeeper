import { useState, useCallback } from 'react';
import { restoreToNewWindows, restoreToCurrentWindow } from '../../session-management';
import type { RestoreProgress, RestoreResult } from '../../session-management';
import type { Session } from '../../storage';
import { isOk } from '../../storage/result';

export type RestoreMode = 'new-window' | 'current-window';

export interface UseRestoreSessionOptions {
  onRestored?: (result: RestoreResult) => void;
  onError?: (error: Error) => void;
}

export interface UseRestoreSessionResult {
  isRestoring: boolean;
  progress: RestoreProgress | null;
  restore: (session: Session, mode: RestoreMode) => Promise<void>;
}

/**
 * Hook para gerenciar restauração de sessões
 * Fornece estado de progresso e callbacks de resultado
 */
export function useRestoreSession(
  options: UseRestoreSessionOptions = {}
): UseRestoreSessionResult {
  const { onRestored, onError } = options;

  const [isRestoring, setIsRestoring] = useState(false);
  const [progress, setProgress] = useState<RestoreProgress | null>(null);

  const restore = useCallback(
    async (session: Session, mode: RestoreMode) => {
      setIsRestoring(true);
      setProgress(null);

      try {
        const restoreFn = mode === 'new-window' ? restoreToNewWindows : restoreToCurrentWindow;

        const result = await restoreFn(session.windows, {
          onProgress: setProgress,
        });

        if (isOk(result)) {
          onRestored?.(result.value);
        } else {
          onError?.(new Error(result.error.getUserMessage()));
        }
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setIsRestoring(false);
        setProgress(null);
      }
    },
    [onRestored, onError]
  );

  return {
    isRestoring,
    progress,
    restore,
  };
}
