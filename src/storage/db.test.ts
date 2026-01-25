import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import Dexie from 'dexie';
import { initializeDatabase, closeDatabase, getDatabase } from './db';

describe('Database Initialization', () => {
  beforeEach(async () => {
    // Clean up any existing database before each test
    await closeDatabase();
    await Dexie.delete('session-keeper-db');
  });

  afterEach(async () => {
    await closeDatabase();
    await Dexie.delete('session-keeper-db');
  });

  it('should initialize database with correct name', async () => {
    const db = await initializeDatabase();
    expect(db.name).toBe('session-keeper-db');
  });

  it('should create all required tables', async () => {
    const db = await initializeDatabase();
    const tableNames = db.tables.map(t => t.name);

    expect(tableNames).toContain('sessions');
    expect(tableNames).toContain('tags');
    expect(tableNames).toContain('settings');
  });

  it('should return same instance on multiple calls', async () => {
    const db1 = await initializeDatabase();
    const db2 = await initializeDatabase();

    expect(db1).toBe(db2);
  });

  it('should have correct version', async () => {
    const db = await initializeDatabase();
    expect(db.verno).toBe(2);
  });

  it('should allow CRUD operations on sessions', async () => {
    const db = await initializeDatabase();

    const sessionId = crypto.randomUUID();
    await db.sessions.add({
      id: sessionId,
      name: 'Test Session',
      description: 'Test description',
      windows: [
        {
          windowId: 1,
          tabs: [
            { url: 'https://example.com', title: 'Example', index: 0, pinned: false }
          ],
        }
      ],
      tags: ['work', 'important'],
      totalTabs: 1,
      totalWindows: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const session = await db.sessions.get(sessionId);
    expect(session?.name).toBe('Test Session');
    expect(session?.tags).toEqual(['work', 'important']);
    expect(session?.windows).toHaveLength(1);
    expect(session?.totalTabs).toBe(1);
  });

  it('should enforce unique constraint on tag names', async () => {
    const db = await initializeDatabase();

    await db.tags.add({
      name: 'work',
      createdAt: new Date(),
    });

    await expect(async () => {
      await db.tags.add({
        name: 'work',
        createdAt: new Date(),
      });
    }).toThrow();
  });

  it('should support multi-entry index on tags', async () => {
    const db = await initializeDatabase();

    await db.sessions.add({
      id: crypto.randomUUID(),
      name: 'Session 1',
      windows: [],
      tags: ['work', 'urgent'],
      totalTabs: 0,
      totalWindows: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.sessions.add({
      id: crypto.randomUUID(),
      name: 'Session 2',
      windows: [],
      tags: ['personal'],
      totalTabs: 0,
      totalWindows: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const workSessions = await db.sessions.where('tags').equals('work').toArray();
    expect(workSessions).toHaveLength(1);
    expect(workSessions[0].name).toBe('Session 1');
  });
});
