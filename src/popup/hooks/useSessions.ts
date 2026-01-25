import { useState, useEffect, useCallback } from 'react';
import { getAllSessions, initializeDatabase, isOk, type Session } from '../../storage';

interface UseSessionsResult {
  readonly sessions: readonly Session[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly refresh: () => Promise<void>;
}

/**
 * Hook to load and manage sessions
 */
export function useSessions(): UseSessionsResult {
  const [sessions, setSessions] = useState<readonly Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await initializeDatabase();
      const result = await getAllSessions();

      if (isOk(result)) {
        // Sort by createdAt descending (newest first)
        const sorted = [...result.value].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
        setSessions(sorted);
      } else {
        setError(result.error.getUserMessage());
      }
    } catch (err) {
      setError('Erro ao carregar sessões');
      console.error('Failed to load sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    isLoading,
    error,
    refresh: loadSessions,
  };
}
