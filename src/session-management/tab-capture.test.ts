import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { captureAllTabs, captureCurrentWindowTabs, captureWindowTabs } from './tab-capture';
import { isOk, isErr } from '../storage/result';

// Mock chrome.tabs API
const mockTabs: chrome.tabs.Tab[] = [];
const mockWindows: chrome.windows.Window[] = [];

const createMockTab = (overrides: Partial<chrome.tabs.Tab> = {}): chrome.tabs.Tab => ({
  id: 1,
  index: 0,
  windowId: 1,
  highlighted: false,
  active: true,
  pinned: false,
  incognito: false,
  url: 'https://example.com',
  title: 'Example',
  favIconUrl: 'https://example.com/favicon.ico',
  ...overrides,
});

beforeEach(() => {
  mockTabs.length = 0;
  mockWindows.length = 0;

  // @ts-expect-error - Mocking chrome API
  globalThis.chrome = {
    tabs: {
      query: mock(async (queryInfo: chrome.tabs.QueryInfo) => {
        if (queryInfo.windowId !== undefined) {
          return mockTabs.filter((t) => t.windowId === queryInfo.windowId);
        }
        return mockTabs;
      }),
    },
    windows: {
      getCurrent: mock(async () => mockWindows[0] || { id: 1 }),
    },
  };
});

afterEach(() => {
  // @ts-expect-error - Cleaning up mock
  delete globalThis.chrome;
});

describe('captureAllTabs', () => {
  it('should capture tabs with all required fields', async () => {
    mockTabs.push(
      createMockTab({
        id: 1,
        index: 0,
        windowId: 1,
        url: 'https://example.com',
        title: 'Example',
        favIconUrl: 'https://example.com/favicon.ico',
        pinned: false,
      })
    );

    const result = await captureAllTabs();

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    expect(result.value.totalTabs).toBe(1);
    expect(result.value.windows).toHaveLength(1);

    const tab = result.value.windows[0].tabs[0];
    expect(tab.url).toBe('https://example.com');
    expect(tab.title).toBe('Example');
    expect(tab.favIconUrl).toBe('https://example.com/favicon.ico');
    expect(tab.index).toBe(0);
    expect(tab.pinned).toBe(false);
    expect(tab.windowId).toBe(1);
    expect(tab.createdAt).toBeInstanceOf(Date);
  });

  it('should capture pinned tabs correctly', async () => {
    mockTabs.push(
      createMockTab({
        pinned: true,
      })
    );

    const result = await captureAllTabs();

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    expect(result.value.windows[0].tabs[0].pinned).toBe(true);
  });

  it('should filter out chrome:// URLs', async () => {
    mockTabs.push(
      createMockTab({ url: 'chrome://settings' }),
      createMockTab({ url: 'https://example.com', id: 2 })
    );

    const result = await captureAllTabs();

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    expect(result.value.totalTabs).toBe(1);
    expect(result.value.windows[0].tabs[0].url).toBe('https://example.com');
  });

  it('should filter out chrome-extension:// URLs', async () => {
    mockTabs.push(
      createMockTab({ url: 'chrome-extension://abc123/popup.html' }),
      createMockTab({ url: 'https://example.com', id: 2 })
    );

    const result = await captureAllTabs();

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    expect(result.value.totalTabs).toBe(1);
  });

  it('should group tabs by windowId', async () => {
    mockTabs.push(
      createMockTab({ id: 1, windowId: 1, index: 0 }),
      createMockTab({ id: 2, windowId: 1, index: 1 }),
      createMockTab({ id: 3, windowId: 2, index: 0 })
    );

    const result = await captureAllTabs();

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    expect(result.value.windows).toHaveLength(2);
    expect(result.value.windows[0].windowId).toBe(1);
    expect(result.value.windows[0].tabs).toHaveLength(2);
    expect(result.value.windows[1].windowId).toBe(2);
    expect(result.value.windows[1].tabs).toHaveLength(1);
  });

  it('should preserve tab index order within windows', async () => {
    mockTabs.push(
      createMockTab({ id: 1, windowId: 1, index: 2, url: 'https://third.com' }),
      createMockTab({ id: 2, windowId: 1, index: 0, url: 'https://first.com' }),
      createMockTab({ id: 3, windowId: 1, index: 1, url: 'https://second.com' })
    );

    const result = await captureAllTabs();

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    const tabs = result.value.windows[0].tabs;
    expect(tabs[0].url).toBe('https://first.com');
    expect(tabs[1].url).toBe('https://second.com');
    expect(tabs[2].url).toBe('https://third.com');
  });

  it('should return error when no valid tabs found', async () => {
    mockTabs.push(createMockTab({ url: 'chrome://settings' }));

    const result = await captureAllTabs();

    expect(isErr(result)).toBe(true);
    if (!isErr(result)) return;

    expect(result.error.name).toBe('NoTabsFoundError');
  });

  it('should handle tabs without favIconUrl', async () => {
    mockTabs.push(createMockTab({ favIconUrl: undefined }));

    const result = await captureAllTabs();

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    expect(result.value.windows[0].tabs[0].favIconUrl).toBeUndefined();
  });

  it('should handle tabs without title', async () => {
    mockTabs.push(createMockTab({ title: undefined }));

    const result = await captureAllTabs();

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    expect(result.value.windows[0].tabs[0].title).toBe('');
  });

  it('should record createdAt timestamp at capture time', async () => {
    mockTabs.push(createMockTab());

    const before = new Date();
    const result = await captureAllTabs();
    const after = new Date();

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    expect(result.value.capturedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.value.capturedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

describe('captureCurrentWindowTabs', () => {
  it('should only capture tabs from current window', async () => {
    mockWindows.push({ id: 1 } as chrome.windows.Window);
    mockTabs.push(
      createMockTab({ id: 1, windowId: 1 }),
      createMockTab({ id: 2, windowId: 2 })
    );

    const result = await captureCurrentWindowTabs();

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    expect(result.value.totalTabs).toBe(1);
    expect(result.value.windows[0].windowId).toBe(1);
  });
});

describe('captureWindowTabs', () => {
  it('should capture tabs from specified window', async () => {
    mockTabs.push(
      createMockTab({ id: 1, windowId: 1 }),
      createMockTab({ id: 2, windowId: 2 }),
      createMockTab({ id: 3, windowId: 2 })
    );

    const result = await captureWindowTabs(2);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    expect(result.value.totalTabs).toBe(2);
    expect(result.value.windows[0].windowId).toBe(2);
  });
});
