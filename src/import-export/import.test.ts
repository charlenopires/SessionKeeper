import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import Dexie from 'dexie';
import {
  validateExportData,
  parseAndValidateJson,
  importFromData,
} from './import';
import { EXPORT_VERSION, type ExportData } from './types';
import { isOk, isErr } from '../storage';
import { initializeDatabase, closeDatabase, createSession, getAllSessions, createTag, getAllTags } from '../storage';

describe('validateExportData', () => {
  it('should validate a correct export data structure', () => {
    const validData: ExportData = {
      version: '1.0.0',
      exportedAt: '2024-03-15T10:00:00.000Z',
      sessions: [
        {
          id: 'test-id',
          name: 'Test Session',
          windows: [
            {
              windowId: 1,
              tabs: [
                { url: 'https://example.com', title: 'Example', index: 0, pinned: false },
              ],
            },
          ],
          tags: [],
          totalTabs: 1,
          totalWindows: 1,
          createdAt: '2024-03-15T10:00:00.000Z',
          updatedAt: '2024-03-15T10:00:00.000Z',
        },
      ],
      tags: [
        { name: 'work', createdAt: '2024-03-15T10:00:00.000Z' },
      ],
    };

    const result = validateExportData(validData);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject non-object data', () => {
    const result = validateExportData('not an object');

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('objeto JSON válido');
  });

  it('should reject missing version', () => {
    const data = {
      exportedAt: '2024-03-15T10:00:00.000Z',
      sessions: [],
      tags: [],
    };

    const result = validateExportData(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('version'))).toBe(true);
  });

  it('should reject invalid session structure', () => {
    const data = {
      version: '1.0.0',
      exportedAt: '2024-03-15T10:00:00.000Z',
      sessions: [
        { name: 'Missing id and windows' },
      ],
      tags: [],
    };

    const result = validateExportData(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes("'id'"))).toBe(true);
    expect(result.errors.some(e => e.includes("'windows'"))).toBe(true);
  });

  it('should reject invalid tab in session', () => {
    const data = {
      version: '1.0.0',
      exportedAt: '2024-03-15T10:00:00.000Z',
      sessions: [
        {
          id: 'test',
          name: 'Test',
          windows: [
            {
              windowId: 1,
              tabs: [{ title: 'Missing URL' }],
            },
          ],
          tags: [],
          createdAt: '2024-03-15T10:00:00.000Z',
          updatedAt: '2024-03-15T10:00:00.000Z',
        },
      ],
      tags: [],
    };

    const result = validateExportData(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes("'url'"))).toBe(true);
  });

  it('should reject invalid tag structure', () => {
    const data = {
      version: '1.0.0',
      exportedAt: '2024-03-15T10:00:00.000Z',
      sessions: [],
      tags: [{ color: '#fff' }], // Missing name
    };

    const result = validateExportData(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes("'name'"))).toBe(true);
  });

  it('should reject sessions with non-existent tag references', () => {
    const data = {
      version: '1.0.0',
      exportedAt: '2024-03-15T10:00:00.000Z',
      sessions: [
        {
          id: 'test',
          name: 'Test',
          windows: [{ windowId: 1, tabs: [{ url: 'https://a.com', title: 'A', index: 0, pinned: false }] }],
          tags: ['nonexistent-tag'],
          totalTabs: 1,
          totalWindows: 1,
          createdAt: '2024-03-15T10:00:00.000Z',
          updatedAt: '2024-03-15T10:00:00.000Z',
        },
      ],
      tags: [{ name: 'existing-tag', createdAt: '2024-03-15T10:00:00.000Z' }],
    };

    const result = validateExportData(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('nonexistent-tag'))).toBe(true);
  });

  it('should accept sessions with valid tag references', () => {
    const data = {
      version: '1.0.0',
      exportedAt: '2024-03-15T10:00:00.000Z',
      sessions: [
        {
          id: 'test',
          name: 'Test',
          windows: [{ windowId: 1, tabs: [{ url: 'https://a.com', title: 'A', index: 0, pinned: false }] }],
          tags: ['work'],
          totalTabs: 1,
          totalWindows: 1,
          createdAt: '2024-03-15T10:00:00.000Z',
          updatedAt: '2024-03-15T10:00:00.000Z',
        },
      ],
      tags: [{ name: 'work', createdAt: '2024-03-15T10:00:00.000Z' }],
    };

    const result = validateExportData(data);

    expect(result.isValid).toBe(true);
  });
});

describe('parseAndValidateJson', () => {
  it('should parse and validate valid JSON', () => {
    const validJson = JSON.stringify({
      version: '1.0.0',
      exportedAt: '2024-03-15T10:00:00.000Z',
      sessions: [],
      tags: [],
    });

    const result = parseAndValidateJson(validJson);

    expect(isOk(result)).toBe(true);
  });

  it('should reject invalid JSON syntax', () => {
    const result = parseAndValidateJson('not valid json {');

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.getUserMessage()).toContain('JSON válido');
    }
  });

  it('should reject valid JSON with invalid structure', () => {
    const result = parseAndValidateJson('{"foo": "bar"}');

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.getUserMessage()).toContain('inválida');
    }
  });
});

describe('importFromData - merge strategy', () => {
  beforeEach(async () => {
    await closeDatabase();
    await Dexie.delete('session-keeper-db');
    await initializeDatabase();
  });

  afterEach(async () => {
    await closeDatabase();
    await Dexie.delete('session-keeper-db');
  });

  it('should import sessions without removing existing ones', async () => {
    // Create existing session
    await createSession({
      name: 'Existing Session',
      windows: [{ windowId: 1, tabs: [{ url: 'https://existing.com', title: 'Existing', index: 0, pinned: false }] }],
    });

    const importData: ExportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      sessions: [
        {
          id: 'imported-id',
          name: 'Imported Session',
          windows: [{ windowId: 1, tabs: [{ url: 'https://imported.com', title: 'Imported', index: 0, pinned: false }] }],
          tags: [],
          totalTabs: 1,
          totalWindows: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      tags: [],
    };

    const result = await importFromData(importData, 'merge');

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.sessionsImported).toBe(1);
    }

    const allSessions = await getAllSessions();
    expect(isOk(allSessions)).toBe(true);
    if (isOk(allSessions)) {
      expect(allSessions.value).toHaveLength(2);
    }
  });

  it('should generate new UUID for conflicting session IDs', async () => {
    // Create existing session with known ID
    const existingResult = await createSession({
      name: 'Existing',
      windows: [{ windowId: 1, tabs: [{ url: 'https://a.com', title: 'A', index: 0, pinned: false }] }],
    });

    let existingId = '';
    if (isOk(existingResult)) {
      existingId = existingResult.value.id;
    }

    const importData: ExportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      sessions: [
        {
          id: existingId, // Same ID as existing
          name: 'Imported with same ID',
          windows: [{ windowId: 1, tabs: [{ url: 'https://b.com', title: 'B', index: 0, pinned: false }] }],
          tags: [],
          totalTabs: 1,
          totalWindows: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      tags: [],
    };

    const result = await importFromData(importData, 'merge');

    expect(isOk(result)).toBe(true);

    const allSessions = await getAllSessions();
    expect(isOk(allSessions)).toBe(true);
    if (isOk(allSessions)) {
      expect(allSessions.value).toHaveLength(2);
      // Both sessions should have different IDs
      const ids = allSessions.value.map(s => s.id);
      expect(new Set(ids).size).toBe(2);
    }
  });

  it('should import only new tags', async () => {
    await createTag({ name: 'existing-tag' });

    const importData: ExportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      sessions: [],
      tags: [
        { name: 'existing-tag', createdAt: new Date().toISOString() },
        { name: 'new-tag', createdAt: new Date().toISOString() },
      ],
    };

    const result = await importFromData(importData, 'merge');

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.tagsImported).toBe(1); // Only new-tag
    }

    const allTags = await getAllTags();
    expect(isOk(allTags)).toBe(true);
    if (isOk(allTags)) {
      expect(allTags.value).toHaveLength(2);
    }
  });
});

describe('importFromData - replace strategy', () => {
  beforeEach(async () => {
    await closeDatabase();
    await Dexie.delete('session-keeper-db');
    await initializeDatabase();
  });

  afterEach(async () => {
    await closeDatabase();
    await Dexie.delete('session-keeper-db');
  });

  it('should remove all existing sessions before importing', async () => {
    // Create existing sessions
    await createSession({
      name: 'Existing 1',
      windows: [{ windowId: 1, tabs: [{ url: 'https://a.com', title: 'A', index: 0, pinned: false }] }],
    });
    await createSession({
      name: 'Existing 2',
      windows: [{ windowId: 1, tabs: [{ url: 'https://b.com', title: 'B', index: 0, pinned: false }] }],
    });

    const importData: ExportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      sessions: [
        {
          id: 'new-id',
          name: 'New Session',
          windows: [{ windowId: 1, tabs: [{ url: 'https://new.com', title: 'New', index: 0, pinned: false }] }],
          tags: [],
          totalTabs: 1,
          totalWindows: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      tags: [],
    };

    const result = await importFromData(importData, 'replace');

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.sessionsImported).toBe(1);
    }

    const allSessions = await getAllSessions();
    expect(isOk(allSessions)).toBe(true);
    if (isOk(allSessions)) {
      expect(allSessions.value).toHaveLength(1);
      expect(allSessions.value[0].name).toBe('New Session');
    }
  });

  it('should preserve existing tags and add new ones', async () => {
    await createTag({ name: 'existing-tag' });

    const importData: ExportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      sessions: [],
      tags: [
        { name: 'new-tag', createdAt: new Date().toISOString() },
      ],
    };

    const result = await importFromData(importData, 'replace');

    expect(isOk(result)).toBe(true);

    const allTags = await getAllTags();
    expect(isOk(allTags)).toBe(true);
    if (isOk(allTags)) {
      expect(allTags.value).toHaveLength(2);
    }
  });

  it('should return import statistics', async () => {
    const importData: ExportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      sessions: [
        {
          id: '1',
          name: 'Session 1',
          windows: [{ windowId: 1, tabs: [
            { url: 'https://a.com', title: 'A', index: 0, pinned: false },
            { url: 'https://b.com', title: 'B', index: 1, pinned: false },
          ]}],
          tags: [],
          totalTabs: 2,
          totalWindows: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Session 2',
          windows: [{ windowId: 1, tabs: [{ url: 'https://c.com', title: 'C', index: 0, pinned: false }] }],
          tags: [],
          totalTabs: 1,
          totalWindows: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      tags: [
        { name: 'tag1', createdAt: new Date().toISOString() },
      ],
    };

    const result = await importFromData(importData, 'replace');

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.sessionsImported).toBe(2);
      expect(result.value.tagsImported).toBe(1);
      expect(result.value.totalTabs).toBe(3);
      expect(result.value.errors).toHaveLength(0);
    }
  });
});
