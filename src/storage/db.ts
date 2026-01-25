import Dexie, { Table } from 'dexie';
import { DatabaseInitializationError, DatabaseNotInitializedError, QuotaExceededError, isQuotaExceededError } from './errors';

/**
 * Tab data stored in the database
 */
export interface StoredTab {
  url: string;
  title: string;
  favIconUrl?: string;
  index: number;
  pinned: boolean;
}

/**
 * Window snapshot stored in the database
 */
export interface StoredWindowSnapshot {
  windowId: number;
  tabs: StoredTab[];
}

/**
 * Session entity stored in the database
 */
export interface Session {
  id: string;
  name: string;
  description?: string;
  windows: StoredWindowSnapshot[];
  tags: string[];
  totalTabs: number;
  totalWindows: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id?: number;
  name: string;
  color?: string;
  createdAt: Date;
}

export interface Settings {
  id?: number;
  key: string;
  value: string | number | boolean;
  updatedAt: Date;
}

export class SessionKeeperDB extends Dexie {
  sessions!: Table<Session, string>;
  tags!: Table<Tag, number>;
  settings!: Table<Settings, number>;

  constructor() {
    super('session-keeper-db');

    // Version 1: Initial schema (legacy)
    this.version(1).stores({
      sessions: '++id, name, createdAt, updatedAt, *tags',
      tags: '++id, &name, createdAt',
      settings: '++id, &key, updatedAt',
    });

    // Version 2: Multi-window session support with UUID
    this.version(2).stores({
      sessions: 'id, name, createdAt, updatedAt, *tags',
      tags: '++id, &name, createdAt',
      settings: '++id, &key, updatedAt',
    }).upgrade(async (tx) => {
      // Migrate existing sessions to new format
      await tx.table('sessions').toCollection().modify((session: Record<string, unknown>) => {
        // Generate UUID if missing
        if (typeof session.id === 'number' || !session.id) {
          session.id = crypto.randomUUID();
        }

        // Convert flat tabs array to windows array
        if (Array.isArray(session.tabs) && !session.windows) {
          const tabs = session.tabs as Array<{ url: string; title: string; favIconUrl?: string }>;
          session.windows = [{
            windowId: 1,
            tabs: tabs.map((tab, index) => ({
              url: tab.url,
              title: tab.title,
              favIconUrl: tab.favIconUrl,
              index,
              pinned: false,
            })),
          }];
          session.totalTabs = tabs.length;
          session.totalWindows = 1;
          delete session.tabs;
        }

        // Ensure counters exist
        if (typeof session.totalTabs !== 'number') {
          const windows = session.windows as StoredWindowSnapshot[] || [];
          session.totalTabs = windows.reduce((sum, w) => sum + w.tabs.length, 0);
        }
        if (typeof session.totalWindows !== 'number') {
          const windows = session.windows as StoredWindowSnapshot[] || [];
          session.totalWindows = windows.length;
        }
      });
    });
  }
}

let dbInstance: SessionKeeperDB | null = null;

export async function initializeDatabase(): Promise<SessionKeeperDB> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = new SessionKeeperDB();

    await dbInstance.open();

    const dbVersion = dbInstance.verno;
    console.log('Database initialized successfully:', {
      name: dbInstance.name,
      version: dbVersion,
      tables: dbInstance.tables.map(t => t.name),
    });

    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize database:', error);

    if (isQuotaExceededError(error)) {
      throw new QuotaExceededError(error);
    }

    throw new DatabaseInitializationError(error);
  }
}

export function getDatabase(): SessionKeeperDB {
  if (!dbInstance) {
    throw new DatabaseNotInitializedError();
  }
  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}
