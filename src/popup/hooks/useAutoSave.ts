import { useCallback, useRef, useEffect, useState } from 'react';

const DEFAULT_DEBOUNCE_MS = 500;

export interface AutoSaveOptions {
  debounceMs?: number;
  onSaving?: () => void;
  onSaved?: () => void;
  onError?: (error: Error) => void;
}

export interface AutoSaveState {
  isSaving: boolean;
  lastSavedAt: Date | null;
  error: Error | null;
}

export interface UseAutoSaveResult<T> {
  save: (data: T) => void;
  saveImmediately: (data: T) => Promise<void>;
  cancel: () => void;
  isPending: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  error: Error | null;
}

/**
 * Hook for auto-saving with debounce
 * Automatically debounces save calls and handles loading/error states
 */
export function useAutoSave<T>(
  saveFn: (data: T) => Promise<void>,
  options: AutoSaveOptions = {}
): UseAutoSaveResult<T> {
  const {
    debounceMs = DEFAULT_DEBOUNCE_MS,
    onSaving,
    onSaved,
    onError,
  } = options;

  const [isPending, setIsPending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const executeSave = useCallback(
    async (data: T) => {
      if (!mountedRef.current) return;

      setIsSaving(true);
      setIsPending(false);
      setError(null);
      onSaving?.();

      try {
        await saveFn(data);
        if (mountedRef.current) {
          setLastSavedAt(new Date());
          onSaved?.();
        }
      } catch (err) {
        if (mountedRef.current) {
          const saveError = err instanceof Error ? err : new Error(String(err));
          setError(saveError);
          onError?.(saveError);
        }
      } finally {
        if (mountedRef.current) {
          setIsSaving(false);
        }
      }
    },
    [saveFn, onSaving, onSaved, onError]
  );

  const save = useCallback(
    (data: T) => {
      // Cancel any pending save
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setIsPending(true);
      setError(null);

      // Schedule new save
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        executeSave(data);
      }, debounceMs);
    },
    [debounceMs, executeSave]
  );

  const saveImmediately = useCallback(
    async (data: T) => {
      // Cancel any pending save
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      await executeSave(data);
    },
    [executeSave]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setIsPending(false);
    }
  }, []);

  return {
    save,
    saveImmediately,
    cancel,
    isPending,
    isSaving,
    lastSavedAt,
    error,
  };
}
