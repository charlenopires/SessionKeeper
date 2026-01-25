import { getDatabase } from './db';
import type { Tag } from './db';
import { Result, Ok, Err } from './result';
import {
  DatabaseError,
  DatabaseNotInitializedError,
  QuotaExceededError,
  isQuotaExceededError,
} from './errors';
import type { Transaction } from 'dexie';

export type StorageError = DatabaseError;

export interface CreateTagInput {
  name: string;
  color?: string;
}

export interface UpdateTagInput {
  id: number;
  name?: string;
  color?: string;
}

/**
 * Creates a new tag with id, name and color
 * Prevents duplicate names (case-insensitive)
 */
export async function createTag(
  input: CreateTagInput
): Promise<Result<Tag, StorageError>> {
  try {
    const db = getDatabase();

    // Check for duplicate name (case-insensitive)
    const normalizedName = input.name.toLowerCase();
    const existingTag = await db.tags
      .filter(tag => tag.name.toLowerCase() === normalizedName)
      .first();

    if (existingTag) {
      return Err(
        new DatabaseError(
          `Tag with name '${input.name}' already exists`,
          undefined,
          `A tag with name "${input.name}" already exists. Please choose a different name.`
        )
      );
    }

    const tag: Tag = {
      name: input.name,
      color: input.color,
      createdAt: new Date(),
    };

    const id = await db.tags.add(tag);

    const createdTag = await db.tags.get(id);

    if (!createdTag) {
      return Err(new DatabaseError('Failed to retrieve created tag'));
    }

    return Ok(createdTag);
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    if (isQuotaExceededError(error)) {
      return Err(new QuotaExceededError(error));
    }

    return Err(
      new DatabaseError(
        'Failed to create tag',
        error,
        'Could not save tag. Please try again.'
      )
    );
  }
}

/**
 * Retrieves a tag by ID
 * Returns undefined if tag does not exist
 */
export async function getTag(
  id: number
): Promise<Result<Tag | undefined, StorageError>> {
  try {
    const db = getDatabase();
    const tag = await db.tags.get(id);
    return Ok(tag);
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    return Err(
      new DatabaseError(
        'Failed to get tag',
        error,
        'Could not retrieve tag. Please try again.'
      )
    );
  }
}

/**
 * Retrieves all tags ordered by name ascending
 */
export async function getAllTags(): Promise<Result<Tag[], StorageError>> {
  try {
    const db = getDatabase();
    const tags = await db.tags
      .orderBy('name')
      .toArray();

    return Ok(tags);
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    return Err(
      new DatabaseError(
        'Failed to get all tags',
        error,
        'Could not retrieve tags. Please try again.'
      )
    );
  }
}

/**
 * Updates name and/or color of an existing tag
 * Prevents duplicate names (case-insensitive)
 */
export async function updateTag(
  input: UpdateTagInput
): Promise<Result<Tag, StorageError>> {
  try {
    const db = getDatabase();

    const existing = await db.tags.get(input.id);
    if (!existing) {
      return Err(
        new DatabaseError(
          `Tag with id ${input.id} not found`,
          undefined,
          'Tag not found.'
        )
      );
    }

    // Check for duplicate name if name is being changed
    if (input.name !== undefined && input.name.toLowerCase() !== existing.name.toLowerCase()) {
      const normalizedName = input.name.toLowerCase();
      const duplicateTag = await db.tags
        .filter(tag => tag.name.toLowerCase() === normalizedName && tag.id !== input.id)
        .first();

      if (duplicateTag) {
        return Err(
          new DatabaseError(
            `Tag with name '${input.name}' already exists`,
            undefined,
            `A tag with name "${input.name}" already exists. Please choose a different name.`
          )
        );
      }
    }

    const updated: Tag = {
      ...existing,
      ...(input.name !== undefined && { name: input.name }),
      ...(input.color !== undefined && { color: input.color }),
    };

    await db.tags.put(updated);

    const updatedTag = await db.tags.get(input.id);

    if (!updatedTag) {
      return Err(new DatabaseError('Failed to retrieve updated tag'));
    }

    return Ok(updatedTag);
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    if (isQuotaExceededError(error)) {
      return Err(new QuotaExceededError(error));
    }

    return Err(
      new DatabaseError(
        'Failed to update tag',
        error,
        'Could not update tag. Please try again.'
      )
    );
  }
}

/**
 * Deletes a tag by ID and removes references from all associated sessions
 * Returns true if tag was deleted, false if it didn't exist
 */
export async function deleteTag(
  id: number
): Promise<Result<boolean, StorageError>> {
  try {
    const db = getDatabase();

    return await db.transaction('rw', db.tags, db.sessions, async () => {
      const existing = await db.tags.get(id);
      if (!existing) {
        return Ok(false);
      }

      // Get tag name for removal from sessions
      const tagName = existing.name;

      // Remove tag references from all sessions
      const sessionsWithTag = await db.sessions
        .filter(session => session.tags.includes(tagName))
        .toArray();

      for (const session of sessionsWithTag) {
        session.tags = session.tags.filter(tag => tag !== tagName);
        session.updatedAt = new Date();
        await db.sessions.put(session);
      }

      // Delete the tag
      await db.tags.delete(id);

      return Ok(true);
    });
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    return Err(
      new DatabaseError(
        'Failed to delete tag',
        error,
        'Could not delete tag. Please try again.'
      )
    );
  }
}

/**
 * Bulk creates multiple tags atomically
 * Validates all names for duplicates before creating any
 */
export async function bulkCreateTags(
  inputs: CreateTagInput[]
): Promise<Result<Tag[], StorageError>> {
  try {
    const db = getDatabase();

    return await db.transaction('rw', db.tags, async () => {
      const now = new Date();

      // Get all existing tag names
      const existingTags = await db.tags.toArray();
      const existingNames = new Set(
        existingTags.map(tag => tag.name.toLowerCase())
      );

      // Check for duplicates in input and existing
      const inputNames = new Set<string>();
      for (const input of inputs) {
        const normalizedName = input.name.toLowerCase();

        if (existingNames.has(normalizedName) || inputNames.has(normalizedName)) {
          throw new DatabaseError(
            `Duplicate tag name: ${input.name}`,
            undefined,
            `Tag "${input.name}" already exists or is duplicated in the input.`
          );
        }

        inputNames.add(normalizedName);
      }

      // Create all tags
      const tags: Tag[] = inputs.map(input => ({
        name: input.name,
        color: input.color,
        createdAt: now,
      }));

      const ids = await db.tags.bulkAdd(tags, { allKeys: true });
      const createdTags = await db.tags.bulkGet(ids);

      return Ok(createdTags.filter((t): t is Tag => t !== undefined));
    });
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    if (error instanceof DatabaseError) {
      return Err(error);
    }

    if (isQuotaExceededError(error)) {
      return Err(new QuotaExceededError(error));
    }

    return Err(
      new DatabaseError(
        'Failed to bulk create tags',
        error,
        'Could not create tags. Please try again.'
      )
    );
  }
}

/**
 * Bulk deletes multiple tags and removes their references from sessions
 */
export async function bulkDeleteTags(
  ids: number[]
): Promise<Result<number, StorageError>> {
  try {
    const db = getDatabase();

    return await db.transaction('rw', db.tags, db.sessions, async () => {
      // Get tag names before deleting
      const tags = await db.tags.bulkGet(ids);
      const tagNames = tags
        .filter((t): t is Tag => t !== undefined)
        .map(t => t.name);

      if (tagNames.length === 0) {
        return Ok(0);
      }

      // Remove tag references from all sessions
      const sessions = await db.sessions.toArray();

      for (const session of sessions) {
        const originalLength = session.tags.length;
        session.tags = session.tags.filter(tag => !tagNames.includes(tag));

        if (session.tags.length !== originalLength) {
          session.updatedAt = new Date();
          await db.sessions.put(session);
        }
      }

      // Delete all tags
      await db.tags.bulkDelete(ids);

      return Ok(tagNames.length);
    });
  } catch (error) {
    if (error instanceof DatabaseNotInitializedError) {
      return Err(error);
    }

    return Err(
      new DatabaseError(
        'Failed to bulk delete tags',
        error,
        'Could not delete tags. Please try again.'
      )
    );
  }
}
