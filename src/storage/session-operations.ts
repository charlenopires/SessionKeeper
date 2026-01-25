import { getDatabase } from './db';
import type { Session, StoredWindowSnapshot } from './db';
import { Result, Ok, Err } from './result';
import {
  DatabaseError,
  DatabaseNotInitializedError,
  QuotaExceededError,
  isQuotaExceededError,
} from './errors';
import type { Transaction } from 'dexie';

export type StorageError = DatabaseError;

type TransactionCallback<T> = (tx: Transaction) => Promise<T>;

/**
 * Validation constants
 */
const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;

/**
 * Validation error for session input
 */
export class ValidationError extends DatabaseError {
  constructor(message: string) {
    super(message, undefined, message);
    this.name = 'ValidationError';
  }
}

export interface CreateSessionInput {
  name: string;
  description?: string;
  windows: StoredWindowSnapshot[];
  tags?: string[];
}

export interface UpdateSessionInput {
  id: string;
  name?: string;
  description?: string;
  tags?: string[];
}

/**
 * Validates session name
 */
function validateName(name: string): Result<string, ValidationError> {
  const trimmed = name.trim();
  if (trimmed.length < NAME_MIN_LENGTH) {
    return Err(new ValidationError(`Session name is required (minimum ${NAME_MIN_LENGTH} character)`));
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return Err(new ValidationError(`Session name must be at most ${NAME_MAX_LENGTH} characters`));
  }
  return Ok(trimmed);
}

/**
 * Validates session description
 */
function validateDescription(description: string | undefined): Result<string | undefined, ValidationError> {
  if (description === undefined) {
    return Ok(undefined);
  }
  const trimmed = description.trim();
  if (trimmed.length === 0) {
    return Ok(undefined);
  }
  if (trimmed.length > DESCRIPTION_MAX_LENGTH) {
    return Err(new ValidationError(`Session description must be at most ${DESCRIPTION_MAX_LENGTH} characters`));
  }
  return Ok(trimmed);
}

/**
 * Calculates total tabs from windows array
 */
function calculateTotalTabs(windows: StoredWindowSnapshot[]): number {
  return windows.reduce((sum, window) => sum + window.tabs.length, 0);
}

/**
 * Creates a new session with all required fields
 * Validates input and generates UUID
 */
export async function createSession(
  input: CreateSessionInput
): Promise<Result<Session, StorageError>> {
  // Validate name
  const nameResult = validateName(input.name);
  if (!nameResult.ok) {
    return Err(nameResult.error);
  }

  // Validate description
  const descriptionResult = validateDescription(input.description);
  if (!descriptionResult.ok) {
    return Err(descriptionResult.error);
  }

  try {
    const db = getDatabase();
    const now = new Date();
    const id = crypto.randomUUID();

    const session: Session = {
      id,
      name: nameResult.value,
      description: descriptionResult.value,
      windows: input.windows,
      tags: input.tags || [],
      totalTabs: calculateTotalTabs(input.windows),
      totalWindows: input.windows.length,
      createdAt: now,
      updatedAt: now,
    };

    await db.sessions.add(session);

    const createdSession = await db.sessions.get(id);

    if (!createdSession) {
      return Err(new DatabaseError('Failed to retrieve created session'));
    }

    return Ok(createdSession);
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    if (isQuotaExceededError(error)) {
      return Err(new QuotaExceededError(error));
    }

    return Err(
      new DatabaseError(
        'Failed to create session',
        error,
        'Could not save session. Please try again.'
      )
    );
  }
}

/**
 * Retrieves a session by ID
 * Returns undefined if session does not exist
 */
export async function getSession(
  id: string
): Promise<Result<Session | undefined, StorageError>> {
  try {
    const db = getDatabase();
    const session = await db.sessions.get(id);
    return Ok(session);
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    return Err(
      new DatabaseError(
        'Failed to get session',
        error,
        'Could not retrieve session. Please try again.'
      )
    );
  }
}

/**
 * Retrieves all sessions ordered by updatedAt descending
 * Most recently updated sessions first
 */
export async function getAllSessions(): Promise<Result<Session[], StorageError>> {
  try {
    const db = getDatabase();
    const sessions = await db.sessions
      .orderBy('updatedAt')
      .reverse()
      .toArray();

    return Ok(sessions);
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    return Err(
      new DatabaseError(
        'Failed to get all sessions',
        error,
        'Could not retrieve sessions. Please try again.'
      )
    );
  }
}

/**
 * Updates specific fields of a session
 * Maintains correct timestamps (updates updatedAt, preserves createdAt)
 */
export async function updateSession(
  input: UpdateSessionInput
): Promise<Result<Session, StorageError>> {
  // Validate name if provided
  if (input.name !== undefined) {
    const nameResult = validateName(input.name);
    if (!nameResult.ok) {
      return Err(nameResult.error);
    }
    input = { ...input, name: nameResult.value };
  }

  // Validate description if provided
  if (input.description !== undefined) {
    const descriptionResult = validateDescription(input.description);
    if (!descriptionResult.ok) {
      return Err(descriptionResult.error);
    }
    input = { ...input, description: descriptionResult.value };
  }

  try {
    const db = getDatabase();

    const existing = await db.sessions.get(input.id);
    if (!existing) {
      return Err(
        new DatabaseError(
          `Session with id ${input.id} not found`,
          undefined,
          'Session not found.'
        )
      );
    }

    const updated: Session = {
      ...existing,
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.tags !== undefined && { tags: input.tags }),
      updatedAt: new Date(),
    };

    await db.sessions.put(updated);

    const updatedSession = await db.sessions.get(input.id);

    if (!updatedSession) {
      return Err(new DatabaseError('Failed to retrieve updated session'));
    }

    return Ok(updatedSession);
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    if (isQuotaExceededError(error)) {
      return Err(new QuotaExceededError(error));
    }

    return Err(
      new DatabaseError(
        'Failed to update session',
        error,
        'Could not update session. Please try again.'
      )
    );
  }
}

/**
 * Deletes a session by ID
 * Returns true if session was deleted, false if it didn't exist
 */
export async function deleteSession(
  id: string
): Promise<Result<boolean, StorageError>> {
  try {
    const db = getDatabase();

    const existing = await db.sessions.get(id);
    if (!existing) {
      return Ok(false);
    }

    await db.sessions.delete(id);
    return Ok(true);
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    return Err(
      new DatabaseError(
        'Failed to delete session',
        error,
        'Could not delete session. Please try again.'
      )
    );
  }
}

/**
 * Executes a function within a transaction
 * Guarantees atomicity - all operations succeed or all fail
 */
export async function withTransaction<T>(
  callback: TransactionCallback<T>
): Promise<Result<T, StorageError>> {
  try {
    const db = getDatabase();

    const result = await db.transaction('rw', db.sessions, db.tags, db.settings, async (tx) => {
      return await callback(tx);
    });

    return Ok(result);
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    if (isQuotaExceededError(error)) {
      return Err(new QuotaExceededError(error));
    }

    return Err(
      new DatabaseError(
        'Transaction failed',
        error,
        'Could not complete operation. Please try again.'
      )
    );
  }
}

/**
 * Bulk creates multiple sessions atomically
 * Either all sessions are created or none are
 */
export async function bulkCreateSessions(
  inputs: CreateSessionInput[]
): Promise<Result<Session[], StorageError>> {
  // Validate all inputs first
  for (const input of inputs) {
    const nameResult = validateName(input.name);
    if (!nameResult.ok) {
      return Err(nameResult.error);
    }
    const descriptionResult = validateDescription(input.description);
    if (!descriptionResult.ok) {
      return Err(descriptionResult.error);
    }
  }

  return withTransaction(async () => {
    const db = getDatabase();
    const now = new Date();

    const sessions: Session[] = inputs.map(input => ({
      id: crypto.randomUUID(),
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      windows: input.windows,
      tags: input.tags || [],
      totalTabs: calculateTotalTabs(input.windows),
      totalWindows: input.windows.length,
      createdAt: now,
      updatedAt: now,
    }));

    await db.sessions.bulkAdd(sessions);

    const ids = sessions.map(s => s.id);
    const createdSessions = await db.sessions.bulkGet(ids);

    return createdSessions.filter((s): s is Session => s !== undefined);
  });
}

/**
 * Bulk deletes multiple sessions atomically
 * Either all sessions are deleted or none are
 */
export async function bulkDeleteSessions(
  ids: string[]
): Promise<Result<number, StorageError>> {
  return withTransaction(async () => {
    const db = getDatabase();
    await db.sessions.bulkDelete(ids);
    return ids.length;
  });
}

/**
 * Bulk updates multiple sessions atomically
 * Either all updates succeed or none do
 */
export async function bulkUpdateSessions(
  updates: UpdateSessionInput[]
): Promise<Result<Session[], StorageError>> {
  // Validate all inputs first
  for (const input of updates) {
    if (input.name !== undefined) {
      const nameResult = validateName(input.name);
      if (!nameResult.ok) {
        return Err(nameResult.error);
      }
    }
    if (input.description !== undefined) {
      const descriptionResult = validateDescription(input.description);
      if (!descriptionResult.ok) {
        return Err(descriptionResult.error);
      }
    }
  }

  return withTransaction(async () => {
    const db = getDatabase();
    const now = new Date();

    const updatedSessions: Session[] = [];

    for (const input of updates) {
      const existing = await db.sessions.get(input.id);
      if (!existing) {
        throw new DatabaseError(`Session with id ${input.id} not found`);
      }

      const updated: Session = {
        ...existing,
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.description !== undefined && { description: input.description?.trim() || undefined }),
        ...(input.tags !== undefined && { tags: input.tags }),
        updatedAt: now,
      };

      await db.sessions.put(updated);
      updatedSessions.push(updated);
    }

    return updatedSessions;
  });
}

/**
 * Input for removing a tab from a session
 */
export interface RemoveTabInput {
  sessionId: string;
  windowId: number;
  tabIndex: number;
}

/**
 * Removes a single tab from a session
 * Recalculates totalTabs and removes empty windows
 * Updates updatedAt timestamp
 */
export async function removeTab(
  input: RemoveTabInput
): Promise<Result<Session, StorageError>> {
  try {
    const db = getDatabase();

    const existing = await db.sessions.get(input.sessionId);
    if (!existing) {
      return Err(
        new DatabaseError(
          `Session with id ${input.sessionId} not found`,
          undefined,
          'Session not found.'
        )
      );
    }

    // Find the window
    const windowIndex = existing.windows.findIndex(w => w.windowId === input.windowId);
    if (windowIndex === -1) {
      return Err(
        new DatabaseError(
          `Window with id ${input.windowId} not found in session`,
          undefined,
          'Window not found.'
        )
      );
    }

    const window = existing.windows[windowIndex];

    // Find the tab
    const tabToRemove = window.tabs.find(t => t.index === input.tabIndex);
    if (!tabToRemove) {
      return Err(
        new DatabaseError(
          `Tab with index ${input.tabIndex} not found in window`,
          undefined,
          'Tab not found.'
        )
      );
    }

    // Remove the tab and reindex remaining tabs
    const updatedTabs = window.tabs
      .filter(t => t.index !== input.tabIndex)
      .map((t, i) => ({ ...t, index: i }));

    // Update windows array (remove window if empty)
    let updatedWindows: StoredWindowSnapshot[];
    if (updatedTabs.length === 0) {
      updatedWindows = existing.windows.filter((_, i) => i !== windowIndex);
    } else {
      updatedWindows = existing.windows.map((w, i) =>
        i === windowIndex ? { ...w, tabs: updatedTabs } : w
      );
    }

    const updated: Session = {
      ...existing,
      windows: updatedWindows,
      totalTabs: calculateTotalTabs(updatedWindows),
      totalWindows: updatedWindows.length,
      updatedAt: new Date(),
    };

    await db.sessions.put(updated);

    const updatedSession = await db.sessions.get(input.sessionId);
    if (!updatedSession) {
      return Err(new DatabaseError('Failed to retrieve updated session'));
    }

    return Ok(updatedSession);
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    return Err(
      new DatabaseError(
        'Failed to remove tab',
        error,
        'Could not remove tab. Please try again.'
      )
    );
  }
}

/**
 * Input for updating a tab in a session
 */
export interface UpdateTabInput {
  sessionId: string;
  windowId: number;
  tabIndex: number;
  url?: string;
  title?: string;
}

/**
 * Updates a single tab's URL and/or title
 * Updates updatedAt timestamp
 */
export async function updateTab(
  input: UpdateTabInput
): Promise<Result<Session, StorageError>> {
  // Validate that at least one field is being updated
  if (input.url === undefined && input.title === undefined) {
    return Err(
      new ValidationError('At least one of url or title must be provided')
    );
  }

  // Validate URL if provided
  if (input.url !== undefined && input.url.trim().length === 0) {
    return Err(new ValidationError('URL cannot be empty'));
  }

  try {
    const db = getDatabase();

    const existing = await db.sessions.get(input.sessionId);
    if (!existing) {
      return Err(
        new DatabaseError(
          `Session with id ${input.sessionId} not found`,
          undefined,
          'Session not found.'
        )
      );
    }

    // Find the window
    const windowIndex = existing.windows.findIndex(w => w.windowId === input.windowId);
    if (windowIndex === -1) {
      return Err(
        new DatabaseError(
          `Window with id ${input.windowId} not found in session`,
          undefined,
          'Window not found.'
        )
      );
    }

    const window = existing.windows[windowIndex];

    // Find the tab
    const tabIndex = window.tabs.findIndex(t => t.index === input.tabIndex);
    if (tabIndex === -1) {
      return Err(
        new DatabaseError(
          `Tab with index ${input.tabIndex} not found in window`,
          undefined,
          'Tab not found.'
        )
      );
    }

    // Update the tab
    const updatedTabs = window.tabs.map((t, i) =>
      i === tabIndex
        ? {
            ...t,
            ...(input.url !== undefined && { url: input.url.trim() }),
            ...(input.title !== undefined && { title: input.title }),
          }
        : t
    );

    // Update windows array
    const updatedWindows = existing.windows.map((w, i) =>
      i === windowIndex ? { ...w, tabs: updatedTabs } : w
    );

    const updated: Session = {
      ...existing,
      windows: updatedWindows,
      updatedAt: new Date(),
    };

    await db.sessions.put(updated);

    const updatedSession = await db.sessions.get(input.sessionId);
    if (!updatedSession) {
      return Err(new DatabaseError('Failed to retrieve updated session'));
    }

    return Ok(updatedSession);
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    return Err(
      new DatabaseError(
        'Failed to update tab',
        error,
        'Could not update tab. Please try again.'
      )
    );
  }
}
