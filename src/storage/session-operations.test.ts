import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import Dexie from 'dexie';
import { initializeDatabase, closeDatabase } from './db';
import {
  createSession,
  getSession,
  getAllSessions,
  updateSession,
  deleteSession,
  removeTab,
  updateTab,
  ValidationError,
} from './session-operations';
import { isOk, isErr } from './result';

describe('Session CRUD Operations', () => {
  beforeEach(async () => {
    await closeDatabase();
    await Dexie.delete('session-keeper-db');
    await initializeDatabase();
  });

  afterEach(async () => {
    await closeDatabase();
    await Dexie.delete('session-keeper-db');
  });

  describe('createSession', () => {
    it('should create session with all required fields', async () => {
      const result = await createSession({
        name: 'Work Session',
        description: 'My work tabs',
        windows: [
          {
            windowId: 1,
            tabs: [
              { url: 'https://example.com', title: 'Example', index: 0, pinned: false },
              { url: 'https://github.com', title: 'GitHub', index: 1, pinned: true },
            ],
          },
        ],
        tags: ['work', 'important'],
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.name).toBe('Work Session');
        expect(result.value.description).toBe('My work tabs');
        expect(result.value.windows).toHaveLength(1);
        expect(result.value.windows[0].tabs).toHaveLength(2);
        expect(result.value.tags).toEqual(['work', 'important']);
        expect(result.value.totalTabs).toBe(2);
        expect(result.value.totalWindows).toBe(1);
        expect(result.value.createdAt).toBeInstanceOf(Date);
        expect(result.value.updatedAt).toBeInstanceOf(Date);
        expect(result.value.id).toMatch(/^[0-9a-f-]{36}$/);
      }
    });

    it('should create session with minimal fields', async () => {
      const result = await createSession({
        name: 'Simple Session',
        windows: [],
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.name).toBe('Simple Session');
        expect(result.value.description).toBeUndefined();
        expect(result.value.tags).toEqual([]);
        expect(result.value.totalTabs).toBe(0);
        expect(result.value.totalWindows).toBe(0);
      }
    });

    it('should trim whitespace from name', async () => {
      const result = await createSession({
        name: '  Trimmed Name  ',
        windows: [],
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.name).toBe('Trimmed Name');
      }
    });

    it('should reject empty name', async () => {
      const result = await createSession({
        name: '',
        windows: [],
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('required');
      }
    });

    it('should reject whitespace-only name', async () => {
      const result = await createSession({
        name: '   ',
        windows: [],
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });

    it('should reject name over 100 characters', async () => {
      const result = await createSession({
        name: 'a'.repeat(101),
        windows: [],
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('100');
      }
    });

    it('should accept name with exactly 100 characters', async () => {
      const result = await createSession({
        name: 'a'.repeat(100),
        windows: [],
      });

      expect(isOk(result)).toBe(true);
    });

    it('should reject description over 500 characters', async () => {
      const result = await createSession({
        name: 'Test',
        description: 'a'.repeat(501),
        windows: [],
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('500');
      }
    });

    it('should accept description with exactly 500 characters', async () => {
      const result = await createSession({
        name: 'Test',
        description: 'a'.repeat(500),
        windows: [],
      });

      expect(isOk(result)).toBe(true);
    });

    it('should calculate totalTabs across multiple windows', async () => {
      const result = await createSession({
        name: 'Multi-window',
        windows: [
          {
            windowId: 1,
            tabs: [
              { url: 'https://a.com', title: 'A', index: 0, pinned: false },
              { url: 'https://b.com', title: 'B', index: 1, pinned: false },
            ],
          },
          {
            windowId: 2,
            tabs: [
              { url: 'https://c.com', title: 'C', index: 0, pinned: false },
            ],
          },
        ],
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.totalTabs).toBe(3);
        expect(result.value.totalWindows).toBe(2);
      }
    });
  });

  describe('getSession', () => {
    it('should return session by ID', async () => {
      const createResult = await createSession({
        name: 'Test Session',
        windows: [
          {
            windowId: 1,
            tabs: [{ url: 'https://test.com', title: 'Test', index: 0, pinned: false }],
          },
        ],
      });

      expect(isOk(createResult)).toBe(true);
      if (!isOk(createResult)) return;

      const getResult = await getSession(createResult.value.id);

      expect(isOk(getResult)).toBe(true);
      if (isOk(getResult)) {
        expect(getResult.value?.name).toBe('Test Session');
      }
    });

    it('should return undefined for non-existent session', async () => {
      const result = await getSession('non-existent-uuid');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBeUndefined();
      }
    });
  });

  describe('getAllSessions', () => {
    it('should return all sessions ordered by updatedAt desc', async () => {
      await createSession({
        name: 'Session 1',
        windows: [],
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await createSession({
        name: 'Session 2',
        windows: [],
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await createSession({
        name: 'Session 3',
        windows: [],
      });

      const result = await getAllSessions();

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toHaveLength(3);
        expect(result.value[0].name).toBe('Session 3');
        expect(result.value[1].name).toBe('Session 2');
        expect(result.value[2].name).toBe('Session 1');
      }
    });

    it('should return empty array when no sessions exist', async () => {
      const result = await getAllSessions();

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe('updateSession', () => {
    it('should update specific fields maintaining timestamps', async () => {
      const createResult = await createSession({
        name: 'Original Name',
        description: 'Original Description',
        windows: [
          {
            windowId: 1,
            tabs: [{ url: 'https://example.com', title: 'Example', index: 0, pinned: false }],
          },
        ],
        tags: ['old'],
      });

      expect(isOk(createResult)).toBe(true);
      if (!isOk(createResult)) return;

      const originalCreatedAt = createResult.value.createdAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      const updateResult = await updateSession({
        id: createResult.value.id,
        name: 'Updated Name',
        tags: ['new', 'updated'],
      });

      expect(isOk(updateResult)).toBe(true);
      if (isOk(updateResult)) {
        expect(updateResult.value.name).toBe('Updated Name');
        expect(updateResult.value.description).toBe('Original Description');
        expect(updateResult.value.tags).toEqual(['new', 'updated']);
        expect(updateResult.value.createdAt).toEqual(originalCreatedAt);
        expect(updateResult.value.updatedAt.getTime()).toBeGreaterThan(
          originalCreatedAt.getTime()
        );
      }
    });

    it('should return error for non-existent session', async () => {
      const result = await updateSession({
        id: 'non-existent-uuid',
        name: 'Updated',
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain('not found');
      }
    });

    it('should validate name on update', async () => {
      const createResult = await createSession({
        name: 'Original',
        windows: [],
      });

      expect(isOk(createResult)).toBe(true);
      if (!isOk(createResult)) return;

      const result = await updateSession({
        id: createResult.value.id,
        name: 'a'.repeat(101),
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe('deleteSession', () => {
    it('should delete existing session and return true', async () => {
      const createResult = await createSession({
        name: 'To Delete',
        windows: [],
      });

      expect(isOk(createResult)).toBe(true);
      if (!isOk(createResult)) return;

      const deleteResult = await deleteSession(createResult.value.id);

      expect(isOk(deleteResult)).toBe(true);
      if (isOk(deleteResult)) {
        expect(deleteResult.value).toBe(true);
      }

      const getResult = await getSession(createResult.value.id);
      if (isOk(getResult)) {
        expect(getResult.value).toBeUndefined();
      }
    });

    it('should return false for non-existent session', async () => {
      const result = await deleteSession('non-existent-uuid');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(false);
      }
    });
  });

  describe('Result pattern', () => {
    it('should return Result type for all operations', async () => {
      const createResult = await createSession({
        name: 'Test',
        windows: [],
      });

      expect(createResult).toHaveProperty('ok');
      expect(typeof createResult.ok).toBe('boolean');

      if (isOk(createResult)) {
        expect(createResult).toHaveProperty('value');
      }
    });
  });

  describe('removeTab', () => {
    it('should remove a tab and recalculate totalTabs', async () => {
      const createResult = await createSession({
        name: 'Test Session',
        windows: [
          {
            windowId: 1,
            tabs: [
              { url: 'https://a.com', title: 'A', index: 0, pinned: false },
              { url: 'https://b.com', title: 'B', index: 1, pinned: false },
              { url: 'https://c.com', title: 'C', index: 2, pinned: false },
            ],
          },
        ],
      });

      expect(isOk(createResult)).toBe(true);
      if (!isOk(createResult)) return;

      expect(createResult.value.totalTabs).toBe(3);

      const removeResult = await removeTab({
        sessionId: createResult.value.id,
        windowId: 1,
        tabIndex: 1,
      });

      expect(isOk(removeResult)).toBe(true);
      if (!isOk(removeResult)) return;

      expect(removeResult.value.totalTabs).toBe(2);
      expect(removeResult.value.windows[0].tabs).toHaveLength(2);
      expect(removeResult.value.windows[0].tabs[0].url).toBe('https://a.com');
      expect(removeResult.value.windows[0].tabs[1].url).toBe('https://c.com');
    });

    it('should reindex tabs after removal', async () => {
      const createResult = await createSession({
        name: 'Test Session',
        windows: [
          {
            windowId: 1,
            tabs: [
              { url: 'https://a.com', title: 'A', index: 0, pinned: false },
              { url: 'https://b.com', title: 'B', index: 1, pinned: false },
            ],
          },
        ],
      });

      expect(isOk(createResult)).toBe(true);
      if (!isOk(createResult)) return;

      const removeResult = await removeTab({
        sessionId: createResult.value.id,
        windowId: 1,
        tabIndex: 0,
      });

      expect(isOk(removeResult)).toBe(true);
      if (!isOk(removeResult)) return;

      expect(removeResult.value.windows[0].tabs[0].index).toBe(0);
      expect(removeResult.value.windows[0].tabs[0].url).toBe('https://b.com');
    });

    it('should remove empty window after removing last tab', async () => {
      const createResult = await createSession({
        name: 'Test Session',
        windows: [
          {
            windowId: 1,
            tabs: [{ url: 'https://a.com', title: 'A', index: 0, pinned: false }],
          },
          {
            windowId: 2,
            tabs: [{ url: 'https://b.com', title: 'B', index: 0, pinned: false }],
          },
        ],
      });

      expect(isOk(createResult)).toBe(true);
      if (!isOk(createResult)) return;

      expect(createResult.value.totalWindows).toBe(2);

      const removeResult = await removeTab({
        sessionId: createResult.value.id,
        windowId: 1,
        tabIndex: 0,
      });

      expect(isOk(removeResult)).toBe(true);
      if (!isOk(removeResult)) return;

      expect(removeResult.value.totalWindows).toBe(1);
      expect(removeResult.value.totalTabs).toBe(1);
      expect(removeResult.value.windows[0].windowId).toBe(2);
    });

    it('should update updatedAt timestamp', async () => {
      const createResult = await createSession({
        name: 'Test Session',
        windows: [
          {
            windowId: 1,
            tabs: [
              { url: 'https://a.com', title: 'A', index: 0, pinned: false },
              { url: 'https://b.com', title: 'B', index: 1, pinned: false },
            ],
          },
        ],
      });

      expect(isOk(createResult)).toBe(true);
      if (!isOk(createResult)) return;

      const originalUpdatedAt = createResult.value.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      const removeResult = await removeTab({
        sessionId: createResult.value.id,
        windowId: 1,
        tabIndex: 0,
      });

      expect(isOk(removeResult)).toBe(true);
      if (!isOk(removeResult)) return;

      expect(removeResult.value.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });

    it('should return error for non-existent session', async () => {
      const result = await removeTab({
        sessionId: 'non-existent',
        windowId: 1,
        tabIndex: 0,
      });

      expect(isErr(result)).toBe(true);
    });

    it('should return error for non-existent window', async () => {
      const createResult = await createSession({
        name: 'Test',
        windows: [
          {
            windowId: 1,
            tabs: [{ url: 'https://a.com', title: 'A', index: 0, pinned: false }],
          },
        ],
      });

      expect(isOk(createResult)).toBe(true);
      if (!isOk(createResult)) return;

      const result = await removeTab({
        sessionId: createResult.value.id,
        windowId: 999,
        tabIndex: 0,
      });

      expect(isErr(result)).toBe(true);
    });

    it('should return error for non-existent tab', async () => {
      const createResult = await createSession({
        name: 'Test',
        windows: [
          {
            windowId: 1,
            tabs: [{ url: 'https://a.com', title: 'A', index: 0, pinned: false }],
          },
        ],
      });

      expect(isOk(createResult)).toBe(true);
      if (!isOk(createResult)) return;

      const result = await removeTab({
        sessionId: createResult.value.id,
        windowId: 1,
        tabIndex: 999,
      });

      expect(isErr(result)).toBe(true);
    });
  });

  describe('updateTab', () => {
    it('should update tab URL', async () => {
      const createResult = await createSession({
        name: 'Test Session',
        windows: [
          {
            windowId: 1,
            tabs: [{ url: 'https://old.com', title: 'Old', index: 0, pinned: false }],
          },
        ],
      });

      expect(isOk(createResult)).toBe(true);
      if (!isOk(createResult)) return;

      const updateResult = await updateTab({
        sessionId: createResult.value.id,
        windowId: 1,
        tabIndex: 0,
        url: 'https://new.com',
      });

      expect(isOk(updateResult)).toBe(true);
      if (!isOk(updateResult)) return;

      expect(updateResult.value.windows[0].tabs[0].url).toBe('https://new.com');
      expect(updateResult.value.windows[0].tabs[0].title).toBe('Old');
    });

    it('should update tab title', async () => {
      const createResult = await createSession({
        name: 'Test Session',
        windows: [
          {
            windowId: 1,
            tabs: [{ url: 'https://example.com', title: 'Old Title', index: 0, pinned: false }],
          },
        ],
      });

      expect(isOk(createResult)).toBe(true);
      if (!isOk(createResult)) return;

      const updateResult = await updateTab({
        sessionId: createResult.value.id,
        windowId: 1,
        tabIndex: 0,
        title: 'New Title',
      });

      expect(isOk(updateResult)).toBe(true);
      if (!isOk(updateResult)) return;

      expect(updateResult.value.windows[0].tabs[0].title).toBe('New Title');
      expect(updateResult.value.windows[0].tabs[0].url).toBe('https://example.com');
    });

    it('should update both URL and title', async () => {
      const createResult = await createSession({
        name: 'Test Session',
        windows: [
          {
            windowId: 1,
            tabs: [{ url: 'https://old.com', title: 'Old', index: 0, pinned: false }],
          },
        ],
      });

      expect(isOk(createResult)).toBe(true);
      if (!isOk(createResult)) return;

      const updateResult = await updateTab({
        sessionId: createResult.value.id,
        windowId: 1,
        tabIndex: 0,
        url: 'https://new.com',
        title: 'New Title',
      });

      expect(isOk(updateResult)).toBe(true);
      if (!isOk(updateResult)) return;

      expect(updateResult.value.windows[0].tabs[0].url).toBe('https://new.com');
      expect(updateResult.value.windows[0].tabs[0].title).toBe('New Title');
    });

    it('should update updatedAt timestamp', async () => {
      const createResult = await createSession({
        name: 'Test Session',
        windows: [
          {
            windowId: 1,
            tabs: [{ url: 'https://example.com', title: 'Test', index: 0, pinned: false }],
          },
        ],
      });

      expect(isOk(createResult)).toBe(true);
      if (!isOk(createResult)) return;

      const originalUpdatedAt = createResult.value.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      const updateResult = await updateTab({
        sessionId: createResult.value.id,
        windowId: 1,
        tabIndex: 0,
        title: 'Updated',
      });

      expect(isOk(updateResult)).toBe(true);
      if (!isOk(updateResult)) return;

      expect(updateResult.value.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });

    it('should return error when neither url nor title provided', async () => {
      const createResult = await createSession({
        name: 'Test',
        windows: [
          {
            windowId: 1,
            tabs: [{ url: 'https://example.com', title: 'Test', index: 0, pinned: false }],
          },
        ],
      });

      expect(isOk(createResult)).toBe(true);
      if (!isOk(createResult)) return;

      const result = await updateTab({
        sessionId: createResult.value.id,
        windowId: 1,
        tabIndex: 0,
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });

    it('should return error for empty URL', async () => {
      const createResult = await createSession({
        name: 'Test',
        windows: [
          {
            windowId: 1,
            tabs: [{ url: 'https://example.com', title: 'Test', index: 0, pinned: false }],
          },
        ],
      });

      expect(isOk(createResult)).toBe(true);
      if (!isOk(createResult)) return;

      const result = await updateTab({
        sessionId: createResult.value.id,
        windowId: 1,
        tabIndex: 0,
        url: '   ',
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });

    it('should return error for non-existent session', async () => {
      const result = await updateTab({
        sessionId: 'non-existent',
        windowId: 1,
        tabIndex: 0,
        title: 'New',
      });

      expect(isErr(result)).toBe(true);
    });

    it('should return error for non-existent window', async () => {
      const createResult = await createSession({
        name: 'Test',
        windows: [
          {
            windowId: 1,
            tabs: [{ url: 'https://example.com', title: 'Test', index: 0, pinned: false }],
          },
        ],
      });

      expect(isOk(createResult)).toBe(true);
      if (!isOk(createResult)) return;

      const result = await updateTab({
        sessionId: createResult.value.id,
        windowId: 999,
        tabIndex: 0,
        title: 'New',
      });

      expect(isErr(result)).toBe(true);
    });

    it('should return error for non-existent tab', async () => {
      const createResult = await createSession({
        name: 'Test',
        windows: [
          {
            windowId: 1,
            tabs: [{ url: 'https://example.com', title: 'Test', index: 0, pinned: false }],
          },
        ],
      });

      expect(isOk(createResult)).toBe(true);
      if (!isOk(createResult)) return;

      const result = await updateTab({
        sessionId: createResult.value.id,
        windowId: 1,
        tabIndex: 999,
        title: 'New',
      });

      expect(isErr(result)).toBe(true);
    });
  });
});
