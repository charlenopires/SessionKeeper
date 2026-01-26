import { useState, useCallback } from 'react';
import {
  detectDuplicates,
  filterByStrategy,
  type DuplicateDetectionResult,
  type DuplicateStrategy,
} from '../../session-management';
import type { Session, StoredWindowSnapshot } from '../../storage';
import { isOk } from '../../storage/result';

export interface UseDuplicateDetectionOptions {
  defaultStrategy?: DuplicateStrategy;
  onError?: (error: Error) => void;
}

export interface UseDuplicateDetectionResult {
  isChecking: boolean;
  result: DuplicateDetectionResult | null;
  strategy: DuplicateStrategy;
  setStrategy: (strategy: DuplicateStrategy) => void;
  checkDuplicates: (session: Session) => Promise<DuplicateDetectionResult | null>;
  getFilteredWindows: () => StoredWindowSnapshot[];
  reset: () => void;
}

/**
 * Hook to manage duplicate detection before restoring
 * Provides checking state, result, and selected strategy
 */
export function useDuplicateDetection(
  options: UseDuplicateDetectionOptions = {}
): UseDuplicateDetectionResult {
  const { defaultStrategy = 'skip', onError } = options;

  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<DuplicateDetectionResult | null>(null);
  const [strategy, setStrategy] = useState<DuplicateStrategy>(defaultStrategy);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  const checkDuplicates = useCallback(
    async (session: Session): Promise<DuplicateDetectionResult | null> => {
      setIsChecking(true);
      setCurrentSession(session);

      try {
        const detectResult = await detectDuplicates(session.windows);

        if (isOk(detectResult)) {
          setResult(detectResult.value);
          return detectResult.value;
        } else {
          onError?.(new Error(detectResult.error.getUserMessage()));
          return null;
        }
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
        return null;
      } finally {
        setIsChecking(false);
      }
    },
    [onError]
  );

  const getFilteredWindows = useCallback((): StoredWindowSnapshot[] => {
    if (!currentSession || !result) {
      return [];
    }

    return filterByStrategy(currentSession.windows, result.duplicateUrls, strategy);
  }, [currentSession, result, strategy]);

  const reset = useCallback(() => {
    setResult(null);
    setCurrentSession(null);
    setStrategy(defaultStrategy);
  }, [defaultStrategy]);

  return {
    isChecking,
    result,
    strategy,
    setStrategy,
    checkDuplicates,
    getFilteredWindows,
    reset,
  };
}
