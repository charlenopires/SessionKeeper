import { describe, it, expect, beforeEach, mock } from 'bun:test';
import {
  detectDuplicates,
  detectDuplicatesWithUrls,
  getOpenUrls,
  filterByStrategy,
} from './duplicate-detection';
import { isOk, isErr } from '../storage/result';
import type { StoredWindowSnapshot } from './types';

// Mock chrome APIs
const mockTabsQuery = mock(() => Promise.resolve([]));

// @ts-ignore - Mock chrome global
globalThis.chrome = {
  tabs: {
    query: mockTabsQuery,
  },
};

describe('getOpenUrls', () => {
  beforeEach(() => {
    mockTabsQuery.mockClear();
  });

  it('should return empty set when no tabs are open', async () => {
    mockTabsQuery.mockImplementation(() => Promise.resolve([]));

    const result = await getOpenUrls();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.size).toBe(0);
    }
  });

  it('should return set of open URLs', async () => {
    mockTabsQuery.mockImplementation(() =>
      Promise.resolve([
        { url: 'https://example.com' },
        { url: 'https://test.com' },
        { url: 'https://example.com' }, // Duplicate
      ])
    );

    const result = await getOpenUrls();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.size).toBe(2);
      expect(result.value.has('https://example.com')).toBe(true);
      expect(result.value.has('https://test.com')).toBe(true);
    }
  });

  it('should ignore tabs without URL', async () => {
    mockTabsQuery.mockImplementation(() =>
      Promise.resolve([
        { url: 'https://example.com' },
        { url: undefined },
        { title: 'No URL tab' },
      ])
    );

    const result = await getOpenUrls();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.size).toBe(1);
    }
  });

  it('should return error on chrome API failure', async () => {
    mockTabsQuery.mockImplementation(() => Promise.reject(new Error('Chrome error')));

    const result = await getOpenUrls();

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.name).toBe('DuplicateDetectionError');
    }
  });
});

describe('detectDuplicatesWithUrls', () => {
  const sampleWindows: StoredWindowSnapshot[] = [
    {
      windowId: 1,
      tabs: [
        { url: 'https://example.com', title: 'Example', index: 0, pinned: false, favIconUrl: undefined },
        { url: 'https://test.com', title: 'Test', index: 1, pinned: false, favIconUrl: undefined },
        { url: 'https://unique.com', title: 'Unique', index: 2, pinned: false, favIconUrl: undefined },
      ],
    },
  ];

  it('should detect no duplicates when no URLs match', () => {
    const openUrls = new Set(['https://other.com']);

    const result = detectDuplicatesWithUrls(sampleWindows, openUrls);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.duplicateCount).toBe(0);
      expect(result.value.totalCount).toBe(3);
      expect(result.value.tabs.every(t => !t.isDuplicate)).toBe(true);
    }
  });

  it('should detect duplicates by exact URL match', () => {
    const openUrls = new Set(['https://example.com', 'https://test.com']);

    const result = detectDuplicatesWithUrls(sampleWindows, openUrls);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.duplicateCount).toBe(2);
      expect(result.value.totalCount).toBe(3);
      expect(result.value.duplicateUrls.has('https://example.com')).toBe(true);
      expect(result.value.duplicateUrls.has('https://test.com')).toBe(true);
    }
  });

  it('should mark individual tabs as duplicate or not', () => {
    const openUrls = new Set(['https://example.com']);

    const result = detectDuplicatesWithUrls(sampleWindows, openUrls);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      const exampleTab = result.value.tabs.find(t => t.tab.url === 'https://example.com');
      const uniqueTab = result.value.tabs.find(t => t.tab.url === 'https://unique.com');

      expect(exampleTab?.isDuplicate).toBe(true);
      expect(uniqueTab?.isDuplicate).toBe(false);
    }
  });

  it('should include windowId in tab status', () => {
    const openUrls = new Set<string>();

    const result = detectDuplicatesWithUrls(sampleWindows, openUrls);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.tabs.every(t => t.windowId === 1)).toBe(true);
    }
  });

  it('should handle multiple windows', () => {
    const multipleWindows: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [{ url: 'https://a.com', title: 'A', index: 0, pinned: false, favIconUrl: undefined }],
      },
      {
        windowId: 2,
        tabs: [{ url: 'https://b.com', title: 'B', index: 0, pinned: false, favIconUrl: undefined }],
      },
    ];

    const openUrls = new Set(['https://a.com']);

    const result = detectDuplicatesWithUrls(multipleWindows, openUrls);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.duplicateCount).toBe(1);
      expect(result.value.totalCount).toBe(2);

      const tabA = result.value.tabs.find(t => t.tab.url === 'https://a.com');
      const tabB = result.value.tabs.find(t => t.tab.url === 'https://b.com');

      expect(tabA?.isDuplicate).toBe(true);
      expect(tabA?.windowId).toBe(1);
      expect(tabB?.isDuplicate).toBe(false);
      expect(tabB?.windowId).toBe(2);
    }
  });

  it('should match URLs with query params exactly', () => {
    const windowsWithParams: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [
          { url: 'https://example.com?page=1', title: 'Page 1', index: 0, pinned: false, favIconUrl: undefined },
          { url: 'https://example.com?page=2', title: 'Page 2', index: 1, pinned: false, favIconUrl: undefined },
        ],
      },
    ];

    const openUrls = new Set(['https://example.com?page=1']);

    const result = detectDuplicatesWithUrls(windowsWithParams, openUrls);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.duplicateCount).toBe(1);

      const page1 = result.value.tabs.find(t => t.tab.url === 'https://example.com?page=1');
      const page2 = result.value.tabs.find(t => t.tab.url === 'https://example.com?page=2');

      expect(page1?.isDuplicate).toBe(true);
      expect(page2?.isDuplicate).toBe(false);
    }
  });
});

describe('detectDuplicates', () => {
  beforeEach(() => {
    mockTabsQuery.mockClear();
  });

  it('should detect duplicates using chrome.tabs.query', async () => {
    mockTabsQuery.mockImplementation(() =>
      Promise.resolve([{ url: 'https://example.com' }])
    );

    const windows: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [
          { url: 'https://example.com', title: 'Example', index: 0, pinned: false, favIconUrl: undefined },
          { url: 'https://unique.com', title: 'Unique', index: 1, pinned: false, favIconUrl: undefined },
        ],
      },
    ];

    const result = await detectDuplicates(windows);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.duplicateCount).toBe(1);
      expect(result.value.totalCount).toBe(2);
    }
  });
});

describe('filterByStrategy', () => {
  const sampleWindows: StoredWindowSnapshot[] = [
    {
      windowId: 1,
      tabs: [
        { url: 'https://example.com', title: 'Example', index: 0, pinned: false, favIconUrl: undefined },
        { url: 'https://unique.com', title: 'Unique', index: 1, pinned: false, favIconUrl: undefined },
      ],
    },
    {
      windowId: 2,
      tabs: [
        { url: 'https://test.com', title: 'Test', index: 0, pinned: false, favIconUrl: undefined },
      ],
    },
  ];

  const duplicateUrls = new Set(['https://example.com', 'https://test.com']);

  it('should return all tabs when strategy is allow', () => {
    const filtered = filterByStrategy(sampleWindows, duplicateUrls, 'allow');

    expect(filtered.length).toBe(2);
    expect(filtered[0].tabs.length).toBe(2);
    expect(filtered[1].tabs.length).toBe(1);
  });

  it('should filter out duplicates when strategy is skip', () => {
    const filtered = filterByStrategy(sampleWindows, duplicateUrls, 'skip');

    expect(filtered.length).toBe(1);
    expect(filtered[0].windowId).toBe(1);
    expect(filtered[0].tabs.length).toBe(1);
    expect(filtered[0].tabs[0].url).toBe('https://unique.com');
  });

  it('should remove empty windows after filtering', () => {
    const windowsAllDuplicates: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [{ url: 'https://example.com', title: 'Example', index: 0, pinned: false, favIconUrl: undefined }],
      },
    ];

    const filtered = filterByStrategy(windowsAllDuplicates, duplicateUrls, 'skip');

    expect(filtered.length).toBe(0);
  });

  it('should handle empty duplicate set', () => {
    const emptyDuplicates = new Set<string>();
    const filtered = filterByStrategy(sampleWindows, emptyDuplicates, 'skip');

    expect(filtered.length).toBe(2);
    expect(filtered[0].tabs.length).toBe(2);
    expect(filtered[1].tabs.length).toBe(1);
  });
});
