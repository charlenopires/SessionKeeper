/**
 * Practical examples of transaction usage in SessionKeeper
 */

import {
  withTransaction,
  bulkCreateSessions,
  bulkDeleteSessions,
  getDatabase,
  type CreateSessionInput,
  type Result,
  type StorageError,
} from './index';

/**
 * Example 1: Import sessions with rollback on failure
 *
 * If any session fails to import, none are imported
 */
export async function importSessionsAtomic(
  sessions: CreateSessionInput[]
): Promise<Result<number, StorageError>> {
  return bulkCreateSessions(sessions).then(result => {
    if (result.ok) {
      return { ok: true, value: result.value.length };
    }
    return result;
  });
}

/**
 * Example 2: Swap sessions between two windows
 *
 * Atomically replaces sessions ensuring consistency
 */
export async function swapSessions(
  sessionId1: number,
  sessionId2: number
): Promise<Result<void, StorageError>> {
  return withTransaction(async () => {
    const db = getDatabase();

    const [session1, session2] = await Promise.all([
      db.sessions.get(sessionId1),
      db.sessions.get(sessionId2),
    ]);

    if (!session1 || !session2) {
      throw new Error('One or both sessions not found');
    }

    // Swap names and tabs
    const temp = { name: session1.name, tabs: session1.tabs };
    session1.name = session2.name;
    session1.tabs = session2.tabs;
    session2.name = temp.name;
    session2.tabs = temp.tabs;

    session1.updatedAt = new Date();
    session2.updatedAt = new Date();

    await Promise.all([
      db.sessions.put(session1),
      db.sessions.put(session2),
    ]);
  });
}

/**
 * Example 3: Archive old sessions
 *
 * Move sessions older than N days to archived state atomically
 */
export async function archiveOldSessions(
  daysOld: number
): Promise<Result<number, StorageError>> {
  return withTransaction(async () => {
    const db = getDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldSessions = await db.sessions
      .where('updatedAt')
      .below(cutoffDate)
      .toArray();

    if (oldSessions.length === 0) {
      return 0;
    }

    // Update all old sessions to archived
    for (const session of oldSessions) {
      session.tags = [...session.tags, 'archived'];
      session.updatedAt = new Date();
      await db.sessions.put(session);
    }

    return oldSessions.length;
  });
}

/**
 * Example 4: Cleanup and reorganize
 *
 * Delete archived sessions and update remaining ones atomically
 */
export async function cleanupArchivedSessions(): Promise<Result<{
  deleted: number;
  updated: number;
}, StorageError>> {
  return withTransaction(async () => {
    const db = getDatabase();

    // Find all archived sessions
    const archivedSessions = await db.sessions
      .filter(session => session.tags.includes('archived'))
      .toArray();

    const archivedIds = archivedSessions.map(s => s.id!);

    // Delete archived
    await db.sessions.bulkDelete(archivedIds);

    // Update remaining sessions' positions
    const remainingSessions = await db.sessions.toArray();
    let updated = 0;

    for (const session of remainingSessions) {
      // Example: remove any 'temp' tags
      if (session.tags.includes('temp')) {
        session.tags = session.tags.filter(tag => tag !== 'temp');
        session.updatedAt = new Date();
        await db.sessions.put(session);
        updated++;
      }
    }

    return {
      deleted: archivedIds.length,
      updated,
    };
  });
}

/**
 * Example 5: Duplicate session with modifications
 *
 * Create a copy of a session with modifications atomically
 */
export async function duplicateSession(
  sessionId: number,
  modifications: Partial<CreateSessionInput>
): Promise<Result<number, StorageError>> {
  return withTransaction(async () => {
    const db = getDatabase();

    const original = await db.sessions.get(sessionId);
    if (!original) {
      throw new Error('Session not found');
    }

    const now = new Date();
    const duplicate = {
      name: modifications.name || `${original.name} (Copy)`,
      description: modifications.description || original.description,
      tabs: modifications.tabs || [...original.tabs],
      tags: modifications.tags || [...original.tags],
      createdAt: now,
      updatedAt: now,
    };

    const newId = await db.sessions.add(duplicate);
    return newId;
  });
}

/**
 * Example 6: Batch tag assignment
 *
 * Add a tag to multiple sessions atomically
 */
export async function addTagToSessions(
  sessionIds: number[],
  tag: string
): Promise<Result<number, StorageError>> {
  return withTransaction(async () => {
    const db = getDatabase();
    let updated = 0;

    for (const id of sessionIds) {
      const session = await db.sessions.get(id);
      if (session && !session.tags.includes(tag)) {
        session.tags.push(tag);
        session.updatedAt = new Date();
        await db.sessions.put(session);
        updated++;
      }
    }

    return updated;
  });
}

/**
 * Example 7: Conditional bulk delete
 *
 * Delete sessions matching criteria atomically
 */
export async function deleteSessionsByTag(
  tag: string
): Promise<Result<number, StorageError>> {
  return withTransaction(async () => {
    const db = getDatabase();

    const sessionsWithTag = await db.sessions
      .filter(session => session.tags.includes(tag))
      .toArray();

    const idsToDelete = sessionsWithTag.map(s => s.id!);

    await db.sessions.bulkDelete(idsToDelete);

    return idsToDelete.length;
  });
}
