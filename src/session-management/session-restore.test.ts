import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { restoreToNewWindows, restoreToCurrentWindow } from './session-restore';
import { isOk, isErr } from '../storage/result';
import type { StoredWindowSnapshot } from './types';

// Mock chrome APIs
const mockWindowsCreate = mock(() => Promise.resolve({ id: 1, tabs: [{ id: 101 }] }));
const mockTabsCreate = mock(() => Promise.resolve({ id: 102 }));
const mockTabsUpdate = mock(() => Promise.resolve({}));
const mockWindowsGetCurrent = mock(() => Promise.resolve({ id: 1 }));

// @ts-ignore - Mock chrome global
globalThis.chrome = {
  windows: {
    create: mockWindowsCreate,
    getCurrent: mockWindowsGetCurrent,
  },
  tabs: {
    create: mockTabsCreate,
    update: mockTabsUpdate,
  },
};

describe('restoreToNewWindows', () => {
  const sampleWindows: StoredWindowSnapshot[] = [
    {
      windowId: 1,
      tabs: [
        { url: 'https://example.com', title: 'Example', index: 0, pinned: false, favIconUrl: undefined },
        { url: 'https://test.com', title: 'Test', index: 1, pinned: true, favIconUrl: undefined },
      ],
    },
  ];

  beforeEach(() => {
    mockWindowsCreate.mockClear();
    mockTabsCreate.mockClear();
    mockTabsUpdate.mockClear();
    mockWindowsCreate.mockImplementation(() => Promise.resolve({ id: 1, tabs: [{ id: 101 }] }));
    mockTabsCreate.mockImplementation(() => Promise.resolve({ id: 102 }));
    mockTabsUpdate.mockImplementation(() => Promise.resolve({}));
  });

  it('should return error for empty windows array', async () => {
    const result = await restoreToNewWindows([]);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe('No windows to restore');
    }
  });

  it('should return error for windows with no tabs', async () => {
    const result = await restoreToNewWindows([{ windowId: 1, tabs: [] }]);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe('No tabs to restore');
    }
  });

  it('should create new window with first tab', async () => {
    const result = await restoreToNewWindows(sampleWindows);

    expect(isOk(result)).toBe(true);
    expect(mockWindowsCreate).toHaveBeenCalledTimes(1);
    expect(mockWindowsCreate).toHaveBeenCalledWith({
      url: 'https://example.com',
      focused: true,
    });
  });

  it('should create remaining tabs in order', async () => {
    await restoreToNewWindows(sampleWindows);

    expect(mockTabsCreate).toHaveBeenCalledTimes(1);
    expect(mockTabsCreate).toHaveBeenCalledWith({
      windowId: 1,
      url: 'https://test.com',
      index: 1,
      pinned: true,
      active: false,
    });
  });

  it('should return correct restore result', async () => {
    const result = await restoreToNewWindows(sampleWindows);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.windowIds).toEqual([1]);
      expect(result.value.tabsRestored).toBe(2);
      expect(result.value.windowsRestored).toBe(1);
    }
  });

  it('should call progress callback', async () => {
    const onProgress = mock(() => {});

    await restoreToNewWindows(sampleWindows, { onProgress });

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenNthCalledWith(1, {
      currentTab: 1,
      totalTabs: 2,
      currentWindow: 1,
      totalWindows: 1,
      percent: 50,
    });
    expect(onProgress).toHaveBeenNthCalledWith(2, {
      currentTab: 2,
      totalTabs: 2,
      currentWindow: 1,
      totalWindows: 1,
      percent: 100,
    });
  });

  it('should create multiple windows', async () => {
    let windowIdCounter = 1;
    mockWindowsCreate.mockImplementation(() =>
      Promise.resolve({ id: windowIdCounter++, tabs: [{ id: 100 + windowIdCounter }] })
    );

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

    const result = await restoreToNewWindows(multipleWindows);

    expect(isOk(result)).toBe(true);
    expect(mockWindowsCreate).toHaveBeenCalledTimes(2);
    if (isOk(result)) {
      expect(result.value.windowIds).toHaveLength(2);
      expect(result.value.windowsRestored).toBe(2);
    }
  });

  it('should focus only the first window', async () => {
    let windowIdCounter = 1;
    mockWindowsCreate.mockImplementation(() =>
      Promise.resolve({ id: windowIdCounter++, tabs: [{ id: 100 }] })
    );

    const multipleWindows: StoredWindowSnapshot[] = [
      { windowId: 1, tabs: [{ url: 'https://a.com', title: 'A', index: 0, pinned: false, favIconUrl: undefined }] },
      { windowId: 2, tabs: [{ url: 'https://b.com', title: 'B', index: 0, pinned: false, favIconUrl: undefined }] },
    ];

    await restoreToNewWindows(multipleWindows);

    expect(mockWindowsCreate).toHaveBeenNthCalledWith(1, { url: 'https://a.com', focused: true });
    expect(mockWindowsCreate).toHaveBeenNthCalledWith(2, { url: 'https://b.com', focused: false });
  });

  it('should update first tab pinned state if needed', async () => {
    const pinnedFirstTab: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [{ url: 'https://pinned.com', title: 'Pinned', index: 0, pinned: true, favIconUrl: undefined }],
      },
    ];

    await restoreToNewWindows(pinnedFirstTab);

    expect(mockTabsUpdate).toHaveBeenCalledWith(101, { pinned: true });
  });

  it('should handle chrome API error', async () => {
    mockWindowsCreate.mockImplementation(() => Promise.reject(new Error('Chrome error')));

    const result = await restoreToNewWindows(sampleWindows);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.name).toBe('SessionRestoreError');
    }
  });
});

describe('restoreToCurrentWindow', () => {
  const sampleWindows: StoredWindowSnapshot[] = [
    {
      windowId: 1,
      tabs: [
        { url: 'https://example.com', title: 'Example', index: 0, pinned: false, favIconUrl: undefined },
        { url: 'https://test.com', title: 'Test', index: 1, pinned: true, favIconUrl: undefined },
      ],
    },
  ];

  beforeEach(() => {
    mockWindowsGetCurrent.mockClear();
    mockWindowsCreate.mockClear();
    mockTabsCreate.mockClear();
    mockTabsUpdate.mockClear();
    mockWindowsGetCurrent.mockImplementation(() => Promise.resolve({ id: 1 }));
    mockWindowsCreate.mockImplementation(() => Promise.resolve({ id: 2, tabs: [{ id: 201 }] }));
    mockTabsCreate.mockImplementation(() => Promise.resolve({ id: 102 }));
  });

  it('should return error for empty windows array', async () => {
    const result = await restoreToCurrentWindow([]);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe('No windows to restore');
    }
  });

  it('should return error for empty tabs', async () => {
    const result = await restoreToCurrentWindow([{ windowId: 1, tabs: [] }]);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe('No tabs to restore');
    }
  });

  it('should get current window', async () => {
    await restoreToCurrentWindow(sampleWindows);

    expect(mockWindowsGetCurrent).toHaveBeenCalledTimes(1);
  });

  it('should create tabs in current window for first WindowSnapshot', async () => {
    await restoreToCurrentWindow(sampleWindows);

    expect(mockTabsCreate).toHaveBeenCalledTimes(2);
    expect(mockTabsCreate).toHaveBeenCalledWith({
      windowId: 1,
      url: 'https://example.com',
      pinned: false,
      active: false,
    });
    expect(mockTabsCreate).toHaveBeenCalledWith({
      windowId: 1,
      url: 'https://test.com',
      pinned: true,
      active: false,
    });
  });

  it('should return correct restore result for single window', async () => {
    const result = await restoreToCurrentWindow(sampleWindows);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.windowIds).toEqual([1]);
      expect(result.value.tabsRestored).toBe(2);
      expect(result.value.windowsRestored).toBe(1);
    }
  });

  it('should call progress callback', async () => {
    const onProgress = mock(() => {});

    await restoreToCurrentWindow(sampleWindows, { onProgress });

    expect(onProgress).toHaveBeenCalledTimes(2);
  });

  it('should open first WindowSnapshot in current window and rest in new windows', async () => {
    const multipleWindows: StoredWindowSnapshot[] = [
      { windowId: 1, tabs: [{ url: 'https://a.com', title: 'A', index: 0, pinned: false, favIconUrl: undefined }] },
      { windowId: 2, tabs: [{ url: 'https://b.com', title: 'B', index: 0, pinned: false, favIconUrl: undefined }] },
    ];

    const result = await restoreToCurrentWindow(multipleWindows);

    // First window's tab should be created in current window
    expect(mockTabsCreate).toHaveBeenCalledWith({
      windowId: 1,
      url: 'https://a.com',
      pinned: false,
      active: false,
    });

    // Second window should be created as new window
    expect(mockWindowsCreate).toHaveBeenCalledWith({
      url: 'https://b.com',
      focused: false,
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.windowIds).toEqual([1, 2]);
      expect(result.value.tabsRestored).toBe(2);
      expect(result.value.windowsRestored).toBe(2);
    }
  });

  it('should preserve pinned state for tabs in new windows', async () => {
    const multipleWindows: StoredWindowSnapshot[] = [
      { windowId: 1, tabs: [{ url: 'https://a.com', title: 'A', index: 0, pinned: false, favIconUrl: undefined }] },
      { windowId: 2, tabs: [{ url: 'https://b.com', title: 'B', index: 0, pinned: true, favIconUrl: undefined }] },
    ];

    await restoreToCurrentWindow(multipleWindows);

    // First tab of new window should have pinned state updated
    expect(mockTabsUpdate).toHaveBeenCalledWith(201, { pinned: true });
  });

  it('should report correct progress for multiple windows', async () => {
    const multipleWindows: StoredWindowSnapshot[] = [
      { windowId: 1, tabs: [{ url: 'https://a.com', title: 'A', index: 0, pinned: false, favIconUrl: undefined }] },
      { windowId: 2, tabs: [{ url: 'https://b.com', title: 'B', index: 0, pinned: false, favIconUrl: undefined }] },
    ];

    const onProgress = mock(() => {});
    await restoreToCurrentWindow(multipleWindows, { onProgress });

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenNthCalledWith(1, {
      currentTab: 1,
      totalTabs: 2,
      currentWindow: 1,
      totalWindows: 2,
      percent: 50,
    });
    expect(onProgress).toHaveBeenNthCalledWith(2, {
      currentTab: 2,
      totalTabs: 2,
      currentWindow: 2,
      totalWindows: 2,
      percent: 100,
    });
  });
});

describe('restoreToNewWindows - URL validation', () => {
  beforeEach(() => {
    mockWindowsCreate.mockClear();
    mockTabsCreate.mockClear();
    mockTabsUpdate.mockClear();
    mockWindowsCreate.mockImplementation(() => Promise.resolve({ id: 1, tabs: [{ id: 101 }] }));
    mockTabsCreate.mockImplementation(() => Promise.resolve({ id: 102 }));
  });

  it('should skip invalid URLs and include them in skippedTabs', async () => {
    const windowsWithInvalidUrls: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [
          { url: 'https://valid.com', title: 'Valid', index: 0, pinned: false, favIconUrl: undefined },
          { url: 'chrome://settings', title: 'Settings', index: 1, pinned: false, favIconUrl: undefined },
        ],
      },
    ];

    const result = await restoreToNewWindows(windowsWithInvalidUrls);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.tabsRestored).toBe(1);
      expect(result.value.skippedTabs).toHaveLength(1);
      expect(result.value.skippedTabs[0].tab.url).toBe('chrome://settings');
      expect(result.value.skippedTabs[0].reason).toContain('chrome://');
    }
  });

  it('should skip first tab if invalid and use second as window opener', async () => {
    const windowsWithInvalidFirst: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [
          { url: 'chrome://settings', title: 'Settings', index: 0, pinned: false, favIconUrl: undefined },
          { url: 'https://valid.com', title: 'Valid', index: 1, pinned: false, favIconUrl: undefined },
        ],
      },
    ];

    const result = await restoreToNewWindows(windowsWithInvalidFirst);

    expect(isOk(result)).toBe(true);
    expect(mockWindowsCreate).toHaveBeenCalledWith({
      url: 'https://valid.com',
      focused: true,
    });
    if (isOk(result)) {
      expect(result.value.tabsRestored).toBe(1);
      expect(result.value.skippedTabs).toHaveLength(1);
    }
  });

  it('should skip entire window if all tabs are invalid', async () => {
    let windowIdCounter = 1;
    mockWindowsCreate.mockImplementation(() =>
      Promise.resolve({ id: windowIdCounter++, tabs: [{ id: 100 }] })
    );

    const windowsWithAllInvalid: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [
          { url: 'chrome://settings', title: 'Settings', index: 0, pinned: false, favIconUrl: undefined },
        ],
      },
      {
        windowId: 2,
        tabs: [
          { url: 'https://valid.com', title: 'Valid', index: 0, pinned: false, favIconUrl: undefined },
        ],
      },
    ];

    const result = await restoreToNewWindows(windowsWithAllInvalid);

    expect(isOk(result)).toBe(true);
    expect(mockWindowsCreate).toHaveBeenCalledTimes(1);
    if (isOk(result)) {
      expect(result.value.windowsRestored).toBe(1);
      expect(result.value.skippedTabs).toHaveLength(1);
    }
  });

  it('should report progress for skipped tabs', async () => {
    const windowsWithInvalid: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [
          { url: 'chrome://settings', title: 'Settings', index: 0, pinned: false, favIconUrl: undefined },
          { url: 'https://valid.com', title: 'Valid', index: 1, pinned: false, favIconUrl: undefined },
        ],
      },
    ];

    const onProgress = mock(() => {});
    await restoreToNewWindows(windowsWithInvalid, { onProgress });

    expect(onProgress).toHaveBeenCalledTimes(2);
    // First call is for the skipped tab
    expect(onProgress).toHaveBeenNthCalledWith(1, expect.objectContaining({
      currentTab: 1,
      totalTabs: 2,
    }));
    // Second call is for the valid tab
    expect(onProgress).toHaveBeenNthCalledWith(2, expect.objectContaining({
      currentTab: 2,
      totalTabs: 2,
    }));
  });

  it('should return empty skippedTabs when all URLs are valid', async () => {
    const validWindows: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [
          { url: 'https://example.com', title: 'Example', index: 0, pinned: false, favIconUrl: undefined },
        ],
      },
    ];

    const result = await restoreToNewWindows(validWindows);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.skippedTabs).toEqual([]);
    }
  });
});

describe('restoreToCurrentWindow - URL validation', () => {
  beforeEach(() => {
    mockWindowsGetCurrent.mockClear();
    mockWindowsCreate.mockClear();
    mockTabsCreate.mockClear();
    mockTabsUpdate.mockClear();
    mockWindowsGetCurrent.mockImplementation(() => Promise.resolve({ id: 1 }));
    mockWindowsCreate.mockImplementation(() => Promise.resolve({ id: 2, tabs: [{ id: 201 }] }));
    mockTabsCreate.mockImplementation(() => Promise.resolve({ id: 102 }));
  });

  it('should skip invalid URLs in current window', async () => {
    const windowsWithInvalid: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [
          { url: 'https://valid.com', title: 'Valid', index: 0, pinned: false, favIconUrl: undefined },
          { url: 'about:blank', title: 'Blank', index: 1, pinned: false, favIconUrl: undefined },
        ],
      },
    ];

    const result = await restoreToCurrentWindow(windowsWithInvalid);

    expect(isOk(result)).toBe(true);
    expect(mockTabsCreate).toHaveBeenCalledTimes(1);
    if (isOk(result)) {
      expect(result.value.tabsRestored).toBe(1);
      expect(result.value.skippedTabs).toHaveLength(1);
      expect(result.value.skippedTabs[0].tab.url).toBe('about:blank');
    }
  });

  it('should skip invalid URLs in additional windows', async () => {
    const multipleWindows: StoredWindowSnapshot[] = [
      { windowId: 1, tabs: [{ url: 'https://a.com', title: 'A', index: 0, pinned: false, favIconUrl: undefined }] },
      {
        windowId: 2,
        tabs: [
          { url: 'chrome://settings', title: 'Settings', index: 0, pinned: false, favIconUrl: undefined },
          { url: 'https://b.com', title: 'B', index: 1, pinned: false, favIconUrl: undefined },
        ],
      },
    ];

    const result = await restoreToCurrentWindow(multipleWindows);

    expect(isOk(result)).toBe(true);
    // The new window should use the second (valid) tab as opener
    expect(mockWindowsCreate).toHaveBeenCalledWith({
      url: 'https://b.com',
      focused: false,
    });
    if (isOk(result)) {
      expect(result.value.skippedTabs).toHaveLength(1);
    }
  });

  it('should include windowId in skipped tab info', async () => {
    const windowsWithInvalid: StoredWindowSnapshot[] = [
      {
        windowId: 42,
        tabs: [
          { url: 'chrome://extensions', title: 'Extensions', index: 0, pinned: false, favIconUrl: undefined },
          { url: 'https://valid.com', title: 'Valid', index: 1, pinned: false, favIconUrl: undefined },
        ],
      },
    ];

    const result = await restoreToCurrentWindow(windowsWithInvalid);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.skippedTabs[0].windowId).toBe(42);
    }
  });
});

describe('restoreToNewWindows - partial failure handling', () => {
  beforeEach(() => {
    mockWindowsCreate.mockClear();
    mockTabsCreate.mockClear();
    mockTabsUpdate.mockClear();
    mockWindowsCreate.mockImplementation(() => Promise.resolve({ id: 1, tabs: [{ id: 101 }] }));
    mockTabsCreate.mockImplementation(() => Promise.resolve({ id: 102 }));
  });

  it('should continue restoration when individual tab creation fails', async () => {
    let callCount = 0;
    mockTabsCreate.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Tab creation failed'));
      }
      return Promise.resolve({ id: 102 });
    });

    const windowsWithMultipleTabs: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [
          { url: 'https://first.com', title: 'First', index: 0, pinned: false, favIconUrl: undefined },
          { url: 'https://second.com', title: 'Second', index: 1, pinned: false, favIconUrl: undefined },
          { url: 'https://third.com', title: 'Third', index: 2, pinned: false, favIconUrl: undefined },
        ],
      },
    ];

    const result = await restoreToNewWindows(windowsWithMultipleTabs);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      // First tab opens window, second fails, third succeeds
      expect(result.value.tabsRestored).toBe(2);
      expect(result.value.skippedTabs).toHaveLength(1);
      expect(result.value.skippedTabs[0].reason).toContain('Falha ao criar aba');
    }
  });

  it('should include error message in skipped tab reason', async () => {
    mockTabsCreate.mockImplementation(() =>
      Promise.reject(new Error('Network error'))
    );

    const windows: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [
          { url: 'https://first.com', title: 'First', index: 0, pinned: false, favIconUrl: undefined },
          { url: 'https://second.com', title: 'Second', index: 1, pinned: false, favIconUrl: undefined },
        ],
      },
    ];

    const result = await restoreToNewWindows(windows);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.skippedTabs[0].reason).toContain('Network error');
    }
  });
});

describe('restoreToCurrentWindow - partial failure handling', () => {
  beforeEach(() => {
    mockWindowsGetCurrent.mockClear();
    mockWindowsCreate.mockClear();
    mockTabsCreate.mockClear();
    mockWindowsGetCurrent.mockImplementation(() => Promise.resolve({ id: 1 }));
    mockWindowsCreate.mockImplementation(() => Promise.resolve({ id: 2, tabs: [{ id: 201 }] }));
    mockTabsCreate.mockImplementation(() => Promise.resolve({ id: 102 }));
  });

  it('should continue restoration when tab creation fails in current window', async () => {
    let callCount = 0;
    mockTabsCreate.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Tab failed'));
      }
      return Promise.resolve({ id: 102 });
    });

    const windows: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [
          { url: 'https://first.com', title: 'First', index: 0, pinned: false, favIconUrl: undefined },
          { url: 'https://second.com', title: 'Second', index: 1, pinned: false, favIconUrl: undefined },
        ],
      },
    ];

    const result = await restoreToCurrentWindow(windows);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.tabsRestored).toBe(1);
      expect(result.value.skippedTabs).toHaveLength(1);
    }
  });

  it('should report progress even for failed tabs', async () => {
    mockTabsCreate.mockImplementation(() =>
      Promise.reject(new Error('Failed'))
    );

    const windows: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [
          { url: 'https://first.com', title: 'First', index: 0, pinned: false, favIconUrl: undefined },
          { url: 'https://second.com', title: 'Second', index: 1, pinned: false, favIconUrl: undefined },
        ],
      },
    ];

    const onProgress = mock(() => {});
    await restoreToCurrentWindow(windows, { onProgress });

    expect(onProgress).toHaveBeenCalledTimes(2);
  });
});

describe('restoreToNewWindows - timeout handling', () => {
  beforeEach(() => {
    mockWindowsCreate.mockClear();
    mockTabsCreate.mockClear();
    mockWindowsCreate.mockImplementation(() => Promise.resolve({ id: 1, tabs: [{ id: 101 }] }));
    mockTabsCreate.mockImplementation(() => Promise.resolve({ id: 102 }));
  });

  it('should handle tab creation timeout and continue', async () => {
    let callCount = 0;
    mockTabsCreate.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Simulate a timeout by never resolving
        return new Promise(() => {});
      }
      return Promise.resolve({ id: 102 });
    });

    const windows: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [
          { url: 'https://first.com', title: 'First', index: 0, pinned: false, favIconUrl: undefined },
          { url: 'https://slow.com', title: 'Slow', index: 1, pinned: false, favIconUrl: undefined },
          { url: 'https://third.com', title: 'Third', index: 2, pinned: false, favIconUrl: undefined },
        ],
      },
    ];

    // Use a very short timeout for testing (we'll need to mock the timeout)
    // For now, just test that slow tabs that reject are handled
    mockTabsCreate.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Timeout: criação de aba excedeu 30s'));
      }
      return Promise.resolve({ id: 102 });
    });

    const result = await restoreToNewWindows(windows);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.skippedTabs.some(s => s.reason.includes('Timeout'))).toBe(true);
    }
  });

  it('should include timeout message in skipped tab reason', async () => {
    mockTabsCreate.mockImplementation(() =>
      Promise.reject(new Error('Timeout: criação de aba excedeu 30s'))
    );

    const windows: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [
          { url: 'https://first.com', title: 'First', index: 0, pinned: false, favIconUrl: undefined },
          { url: 'https://second.com', title: 'Second', index: 1, pinned: false, favIconUrl: undefined },
        ],
      },
    ];

    const result = await restoreToNewWindows(windows);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.skippedTabs[0].reason).toContain('Timeout');
      expect(result.value.skippedTabs[0].reason).toContain('30s');
    }
  });
});

describe('Chrome API unavailability', () => {
  const sampleWindows: StoredWindowSnapshot[] = [
    {
      windowId: 1,
      tabs: [{ url: 'https://example.com', title: 'Example', index: 0, pinned: false, favIconUrl: undefined }],
    },
  ];

  it('should return clear error when chrome.windows is missing', async () => {
    const originalChrome = globalThis.chrome;
    // @ts-ignore
    globalThis.chrome = { tabs: { create: () => {} } };

    const result = await restoreToNewWindows(sampleWindows);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.getUserMessage()).toContain('janelas');
      expect(result.error.getUserMessage()).toContain('permissões');
    }

    globalThis.chrome = originalChrome;
  });

  it('should return clear error when chrome.tabs is missing', async () => {
    const originalChrome = globalThis.chrome;
    // @ts-ignore
    globalThis.chrome = { windows: { create: () => {}, getCurrent: () => {} } };

    const result = await restoreToCurrentWindow(sampleWindows);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.getUserMessage()).toContain('abas');
      expect(result.error.getUserMessage()).toContain('permissões');
    }

    globalThis.chrome = originalChrome;
  });

  it('should return clear error when chrome is undefined', async () => {
    const originalChrome = globalThis.chrome;
    // @ts-ignore
    globalThis.chrome = undefined;

    const result = await restoreToNewWindows(sampleWindows);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.getUserMessage()).toContain('Chrome');
      expect(result.error.getUserMessage()).toContain('extensão');
    }

    globalThis.chrome = originalChrome;
  });
});
