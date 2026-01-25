import type { Session, Tag, StoredWindowSnapshot } from '../storage';

/**
 * Current export format version
 */
export const EXPORT_VERSION = '1.0.0';

/**
 * Exported session data (serializable)
 */
export interface ExportedSession {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly windows: ReadonlyArray<{
    readonly windowId: number;
    readonly tabs: ReadonlyArray<{
      readonly url: string;
      readonly title: string;
      readonly favIconUrl?: string;
      readonly index: number;
      readonly pinned: boolean;
    }>;
  }>;
  readonly tags: readonly string[];
  readonly totalTabs: number;
  readonly totalWindows: number;
  readonly createdAt: string; // ISO string
  readonly updatedAt: string; // ISO string
}

/**
 * Exported tag data (serializable)
 */
export interface ExportedTag {
  readonly id?: number;
  readonly name: string;
  readonly color?: string;
  readonly createdAt: string; // ISO string
}

/**
 * Complete export data structure
 */
export interface ExportData {
  readonly version: string;
  readonly exportedAt: string; // ISO string
  readonly sessions: readonly ExportedSession[];
  readonly tags: readonly ExportedTag[];
}

/**
 * Export result with statistics
 */
export interface ExportResult {
  readonly data: ExportData;
  readonly sessionCount: number;
  readonly tagCount: number;
  readonly totalTabs: number;
}

/**
 * Converts a Session to ExportedSession (serializable format)
 */
export function sessionToExported(session: Session): ExportedSession {
  return {
    id: session.id,
    name: session.name,
    description: session.description,
    windows: session.windows.map(w => ({
      windowId: w.windowId,
      tabs: w.tabs.map(t => ({
        url: t.url,
        title: t.title,
        favIconUrl: t.favIconUrl,
        index: t.index,
        pinned: t.pinned,
      })),
    })),
    tags: [...session.tags],
    totalTabs: session.totalTabs,
    totalWindows: session.totalWindows,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

/**
 * Converts a Tag to ExportedTag (serializable format)
 */
export function tagToExported(tag: Tag): ExportedTag {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    createdAt: tag.createdAt.toISOString(),
  };
}

/**
 * Import strategy
 */
export type ImportStrategy = 'merge' | 'replace';

/**
 * Import result with statistics
 */
export interface ImportResult {
  readonly sessionsImported: number;
  readonly tagsImported: number;
  readonly totalTabs: number;
  readonly errors: readonly ImportError[];
}

/**
 * Individual import error
 */
export interface ImportError {
  readonly type: 'session' | 'tag' | 'validation';
  readonly message: string;
  readonly details?: string;
}

/**
 * Converts ExportedSession back to Session format for storage
 */
export function exportedToSession(exported: ExportedSession, newId?: string): Omit<Session, 'id'> & { id: string } {
  return {
    id: newId || exported.id,
    name: exported.name,
    description: exported.description,
    windows: exported.windows.map(w => ({
      windowId: w.windowId,
      tabs: w.tabs.map(t => ({
        url: t.url,
        title: t.title,
        favIconUrl: t.favIconUrl,
        index: t.index,
        pinned: t.pinned,
      })),
    })) as StoredWindowSnapshot[],
    tags: [...exported.tags],
    totalTabs: exported.totalTabs,
    totalWindows: exported.totalWindows,
    createdAt: new Date(exported.createdAt),
    updatedAt: new Date(exported.updatedAt),
  };
}

/**
 * Converts ExportedTag back to Tag format for storage
 */
export function exportedToTag(exported: ExportedTag): Omit<Tag, 'id'> {
  return {
    name: exported.name,
    color: exported.color,
    createdAt: new Date(exported.createdAt),
  };
}
