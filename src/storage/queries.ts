import { getDatabase } from './db';
import type { Session } from './db';
import { Result, Ok, Err } from './result';
import {
  DatabaseError,
  DatabaseNotInitializedError,
} from './errors';

export type StorageError = DatabaseError;

export interface StorageStats {
  totalSessions: number;
  totalTags: number;
  totalTabs: number;
  oldestSession?: Date;
  newestSession?: Date;
  mostUsedTags: { name: string; count: number }[];
}

/**
 * Searches sessions by name (case-insensitive partial match)
 * Uses optimized filtering for performance
 */
export async function searchSessionsByName(
  searchText: string
): Promise<Result<Session[], StorageError>> {
  try {
    const db = getDatabase();
    const normalizedSearch = searchText.toLowerCase();

    // Use filter for case-insensitive search
    const sessions = await db.sessions
      .filter(session => session.name.toLowerCase().includes(normalizedSearch))
      .toArray();

    return Ok(sessions);
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    return Err(
      new DatabaseError(
        'Failed to search sessions by name',
        error,
        'Could not search sessions. Please try again.'
      )
    );
  }
}

/**
 * Filters sessions by tags (OR logic)
 * Returns sessions that have ANY of the specified tags
 * Uses multi-entry index for optimal performance
 */
export async function filterSessionsByTags(
  tags: string[]
): Promise<Result<Session[], StorageError>> {
  try {
    const db = getDatabase();

    if (tags.length === 0) {
      return Ok([]);
    }

    // Use the multi-entry index on tags for efficient querying
    // anyOf performs an OR query using the index
    const sessions = await db.sessions
      .where('tags')
      .anyOf(tags)
      .toArray();

    // Remove duplicates (a session might match multiple tags)
    const uniqueSessions = Array.from(
      new Map(sessions.map(s => [s.id, s])).values()
    );

    return Ok(uniqueSessions);
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    return Err(
      new DatabaseError(
        'Failed to filter sessions by tags',
        error,
        'Could not filter sessions. Please try again.'
      )
    );
  }
}

/**
 * Gets sessions created within a date range
 * Uses createdAt index for efficient range queries
 */
export async function getSessionsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<Result<Session[], StorageError>> {
  try {
    const db = getDatabase();

    // Use between query with createdAt index
    const sessions = await db.sessions
      .where('createdAt')
      .between(startDate, endDate, true, true)
      .toArray();

    return Ok(sessions);
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    return Err(
      new DatabaseError(
        'Failed to get sessions by date range',
        error,
        'Could not retrieve sessions. Please try again.'
      )
    );
  }
}

/**
 * Returns the total count of sessions stored
 * Efficient count query
 */
export async function countSessions(): Promise<Result<number, StorageError>> {
  try {
    const db = getDatabase();
    const count = await db.sessions.count();
    return Ok(count);
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    return Err(
      new DatabaseError(
        'Failed to count sessions',
        error,
        'Could not count sessions. Please try again.'
      )
    );
  }
}

/**
 * Returns detailed storage usage statistics
 * Aggregates data about sessions, tags, and tabs
 */
export async function getStorageStats(): Promise<Result<StorageStats, StorageError>> {
  try {
    const db = getDatabase();

    // Get all data in parallel
    const [sessions, tags] = await Promise.all([
      db.sessions.toArray(),
      db.tags.toArray(),
    ]);

    // Calculate total tabs
    const totalTabs = sessions.reduce((sum, session) => sum + session.totalTabs, 0);

    // Find oldest and newest sessions
    const sortedByDate = [...sessions].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
    const oldestSession = sortedByDate[0]?.createdAt;
    const newestSession = sortedByDate[sortedByDate.length - 1]?.createdAt;

    // Calculate most used tags
    const tagCounts = new Map<string, number>();
    for (const session of sessions) {
      for (const tag of session.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    const mostUsedTags = Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 most used tags

    const stats: StorageStats = {
      totalSessions: sessions.length,
      totalTags: tags.length,
      totalTabs,
      oldestSession,
      newestSession,
      mostUsedTags,
    };

    return Ok(stats);
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    return Err(
      new DatabaseError(
        'Failed to get storage stats',
        error,
        'Could not retrieve storage statistics. Please try again.'
      )
    );
  }
}

/**
 * Advanced query: Find sessions by multiple criteria
 * Combines name search, tags filter, and date range
 */
export async function advancedSearch(params: {
  name?: string;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<Result<Session[], StorageError>> {
  try {
    const db = getDatabase();
    let query = db.sessions.toCollection();

    // Apply filters
    let sessions = await query.toArray();

    // Filter by name (case-insensitive)
    if (params.name) {
      const normalizedName = params.name.toLowerCase();
      sessions = sessions.filter(s => s.name.toLowerCase().includes(normalizedName));
    }

    // Filter by tags (OR logic)
    if (params.tags && params.tags.length > 0) {
      sessions = sessions.filter(s =>
        s.tags.some(tag => params.tags!.includes(tag))
      );
    }

    // Filter by date range
    if (params.startDate && params.endDate) {
      sessions = sessions.filter(s =>
        s.createdAt >= params.startDate! && s.createdAt <= params.endDate!
      );
    }

    // Apply limit
    if (params.limit) {
      sessions = sessions.slice(0, params.limit);
    }

    return Ok(sessions);
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    return Err(
      new DatabaseError(
        'Failed to perform advanced search',
        error,
        'Could not search sessions. Please try again.'
      )
    );
  }
}

/**
 * Gets recently updated sessions
 * Uses updatedAt index for efficient sorting
 */
export async function getRecentlyUpdatedSessions(
  limit: number = 10
): Promise<Result<Session[], StorageError>> {
  try {
    const db = getDatabase();

    const sessions = await db.sessions
      .orderBy('updatedAt')
      .reverse()
      .limit(limit)
      .toArray();

    return Ok(sessions);
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    return Err(
      new DatabaseError(
        'Failed to get recently updated sessions',
        error,
        'Could not retrieve sessions. Please try again.'
      )
    );
  }
}
