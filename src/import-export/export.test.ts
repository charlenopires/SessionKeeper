import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import Dexie from 'dexie';
import {
  generateExportData,
  formatExportJson,
  generateExportFilename,
  downloadFile,
  exportSessions,
} from './export';
import { EXPORT_VERSION } from './types';
import { isOk, isErr } from '../storage';
import { initializeDatabase, closeDatabase, createSession, createTag } from '../storage';

describe('generateExportFilename', () => {
  it('should generate filename with current date', () => {
    const date = new Date('2024-03-15');
    const filename = generateExportFilename(date);
    expect(filename).toBe('session-keeper-export-2024-03-15.json');
  });

  it('should pad single-digit month and day', () => {
    const date = new Date('2024-01-05');
    const filename = generateExportFilename(date);
    expect(filename).toBe('session-keeper-export-2024-01-05.json');
  });

  it('should use current date when no date provided', () => {
    const filename = generateExportFilename();
    expect(filename).toMatch(/^session-keeper-export-\d{4}-\d{2}-\d{2}\.json$/);
  });
});

describe('formatExportJson', () => {
  it('should format with 2-space indentation', () => {
    const data = {
      version: '1.0.0',
      exportedAt: '2024-03-15T10:00:00.000Z',
      sessions: [],
      tags: [],
    };

    const json = formatExportJson(data);

    expect(json).toContain('  "version"');
    expect(json).toContain('  "sessions"');
  });

  it('should produce valid JSON', () => {
    const data = {
      version: '1.0.0',
      exportedAt: '2024-03-15T10:00:00.000Z',
      sessions: [{ id: '1', name: 'Test' }],
      tags: [{ name: 'work' }],
    };

    const json = formatExportJson(data);
    const parsed = JSON.parse(json);

    expect(parsed.version).toBe('1.0.0');
    expect(parsed.sessions).toHaveLength(1);
  });
});

describe('downloadFile', () => {
  let originalCreateElement: typeof document.createElement;
  let originalAppendChild: typeof document.body.appendChild;
  let originalRemoveChild: typeof document.body.removeChild;
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;

  beforeEach(() => {
    originalCreateElement = document.createElement.bind(document);
    originalAppendChild = document.body.appendChild.bind(document.body);
    originalRemoveChild = document.body.removeChild.bind(document.body);
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
  });

  afterEach(() => {
    document.createElement = originalCreateElement;
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('should create and click a download link', () => {
    // Mock DOM methods
    const mockClick = mock(() => {});
    const mockAppendChild = mock(() => {});
    const mockRemoveChild = mock(() => {});

    const mockLink = {
      href: '',
      download: '',
      style: { display: '' },
      click: mockClick,
    };

    document.createElement = mock((tag: string) => {
      if (tag === 'a') return mockLink as unknown as HTMLAnchorElement;
      return originalCreateElement(tag);
    }) as typeof document.createElement;

    document.body.appendChild = mockAppendChild as unknown as typeof document.body.appendChild;
    document.body.removeChild = mockRemoveChild as unknown as typeof document.body.removeChild;

    const mockCreateObjectURL = mock(() => 'blob:test-url');
    const mockRevokeObjectURL = mock(() => {});
    URL.createObjectURL = mockCreateObjectURL;
    URL.revokeObjectURL = mockRevokeObjectURL;

    downloadFile('{"test": true}', 'test.json');

    expect(mockClick).toHaveBeenCalled();
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
    expect(mockLink.download).toBe('test.json');
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });
});

describe('generateExportData', () => {
  beforeEach(async () => {
    await closeDatabase();
    await Dexie.delete('session-keeper-db');
    await initializeDatabase();
  });

  afterEach(async () => {
    await closeDatabase();
    await Dexie.delete('session-keeper-db');
  });

  it('should return export data with version and timestamp', async () => {
    const result = await generateExportData();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.data.version).toBe(EXPORT_VERSION);
      expect(result.value.data.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it('should include all sessions', async () => {
    await createSession({
      name: 'Session 1',
      windows: [{ windowId: 1, tabs: [{ url: 'https://a.com', title: 'A', index: 0, pinned: false }] }],
    });
    await createSession({
      name: 'Session 2',
      windows: [{ windowId: 1, tabs: [{ url: 'https://b.com', title: 'B', index: 0, pinned: false }] }],
    });

    const result = await generateExportData();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.data.sessions).toHaveLength(2);
      expect(result.value.sessionCount).toBe(2);
    }
  });

  it('should include all tags', async () => {
    await createTag({ name: 'work' });
    await createTag({ name: 'personal' });

    const result = await generateExportData();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.data.tags).toHaveLength(2);
      expect(result.value.tagCount).toBe(2);
    }
  });

  it('should calculate total tabs', async () => {
    await createSession({
      name: 'Session 1',
      windows: [
        { windowId: 1, tabs: [
          { url: 'https://a.com', title: 'A', index: 0, pinned: false },
          { url: 'https://b.com', title: 'B', index: 1, pinned: false },
        ]},
      ],
    });
    await createSession({
      name: 'Session 2',
      windows: [
        { windowId: 1, tabs: [{ url: 'https://c.com', title: 'C', index: 0, pinned: false }] },
      ],
    });

    const result = await generateExportData();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.totalTabs).toBe(3);
    }
  });

  it('should convert dates to ISO strings', async () => {
    await createSession({
      name: 'Test Session',
      windows: [{ windowId: 1, tabs: [{ url: 'https://a.com', title: 'A', index: 0, pinned: false }] }],
    });

    const result = await generateExportData();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      const session = result.value.data.sessions[0];
      expect(typeof session.createdAt).toBe('string');
      expect(typeof session.updatedAt).toBe('string');
      expect(session.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it('should return empty arrays when no data exists', async () => {
    const result = await generateExportData();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.data.sessions).toEqual([]);
      expect(result.value.data.tags).toEqual([]);
      expect(result.value.sessionCount).toBe(0);
      expect(result.value.tagCount).toBe(0);
      expect(result.value.totalTabs).toBe(0);
    }
  });
});

describe('exportSessions', () => {
  let originalCreateElement: typeof document.createElement;
  let originalAppendChild: typeof document.body.appendChild;
  let originalRemoveChild: typeof document.body.removeChild;
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;

  beforeEach(async () => {
    // Save original functions
    originalCreateElement = document.createElement.bind(document);
    originalAppendChild = document.body.appendChild.bind(document.body);
    originalRemoveChild = document.body.removeChild.bind(document.body);
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;

    await closeDatabase();
    await Dexie.delete('session-keeper-db');
    await initializeDatabase();

    // Mock download
    const mockClick = mock(() => {});
    document.createElement = mock((tag: string) => {
      if (tag === 'a') {
        return { href: '', download: '', style: { display: '' }, click: mockClick } as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tag);
    }) as typeof document.createElement;
    document.body.appendChild = mock(() => {}) as unknown as typeof document.body.appendChild;
    document.body.removeChild = mock(() => {}) as unknown as typeof document.body.removeChild;
    URL.createObjectURL = mock(() => 'blob:url');
    URL.revokeObjectURL = mock(() => {});
  });

  afterEach(async () => {
    // Restore original functions
    document.createElement = originalCreateElement;
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;

    await closeDatabase();
    await Dexie.delete('session-keeper-db');
  });

  it('should export and trigger download', async () => {
    await createSession({
      name: 'Test',
      windows: [{ windowId: 1, tabs: [{ url: 'https://a.com', title: 'A', index: 0, pinned: false }] }],
    });

    const result = await exportSessions();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.sessionCount).toBe(1);
    }
  });
});
