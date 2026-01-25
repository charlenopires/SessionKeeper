import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRestoreSession } from './useRestoreSession';
import type { Session } from '../../storage';

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

describe('useRestoreSession', () => {
  const mockSession: Session = {
    id: 'test-id',
    name: 'Test Session',
    description: undefined,
    windows: [
      {
        windowId: 1,
        tabs: [
          { url: 'https://example.com', title: 'Example', index: 0, pinned: false, favIconUrl: undefined },
          { url: 'https://test.com', title: 'Test', index: 1, pinned: false, favIconUrl: undefined },
        ],
      },
    ],
    tags: [],
    totalTabs: 2,
    totalWindows: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockWindowsCreate.mockClear();
    mockTabsCreate.mockClear();
    mockTabsUpdate.mockClear();
    mockWindowsGetCurrent.mockClear();
    mockWindowsCreate.mockImplementation(() => Promise.resolve({ id: 1, tabs: [{ id: 101 }] }));
    mockTabsCreate.mockImplementation(() => Promise.resolve({ id: 102 }));
    mockWindowsGetCurrent.mockImplementation(() => Promise.resolve({ id: 1 }));
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useRestoreSession());

    expect(result.current.isRestoring).toBe(false);
    expect(result.current.progress).toBeNull();
  });

  it('should set isRestoring during restore', async () => {
    // Make the restore take longer so we can observe the loading state
    let resolveCreate: () => void;
    mockWindowsCreate.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = () => resolve({ id: 1, tabs: [{ id: 101 }] });
        })
    );

    const { result } = renderHook(() => useRestoreSession());

    // Start restore without awaiting
    act(() => {
      result.current.restore(mockSession, 'new-window');
    });

    // Should be restoring now
    expect(result.current.isRestoring).toBe(true);

    // Complete the restore
    await act(async () => {
      resolveCreate!();
    });

    expect(result.current.isRestoring).toBe(false);
  });

  it('should call restoreToNewWindows for new-window mode', async () => {
    const { result } = renderHook(() => useRestoreSession());

    await act(async () => {
      await result.current.restore(mockSession, 'new-window');
    });

    expect(mockWindowsCreate).toHaveBeenCalled();
  });

  it('should call restoreToCurrentWindow for current-window mode', async () => {
    const { result } = renderHook(() => useRestoreSession());

    await act(async () => {
      await result.current.restore(mockSession, 'current-window');
    });

    expect(mockWindowsGetCurrent).toHaveBeenCalled();
  });

  it('should call onRestored callback on success', async () => {
    const onRestored = mock(() => {});
    const { result } = renderHook(() => useRestoreSession({ onRestored }));

    await act(async () => {
      await result.current.restore(mockSession, 'new-window');
    });

    expect(onRestored).toHaveBeenCalledTimes(1);
    expect(onRestored).toHaveBeenCalledWith({
      windowIds: [1],
      tabsRestored: 2,
      windowsRestored: 1,
      skippedTabs: [],
    });
  });

  it('should call onError callback on failure', async () => {
    mockWindowsCreate.mockImplementation(() => Promise.reject(new Error('Chrome error')));
    const onError = mock(() => {});
    const { result } = renderHook(() => useRestoreSession({ onError }));

    await act(async () => {
      await result.current.restore(mockSession, 'new-window');
    });

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('should reset progress after restore completes', async () => {
    const { result } = renderHook(() => useRestoreSession());

    await act(async () => {
      await result.current.restore(mockSession, 'new-window');
    });

    expect(result.current.progress).toBeNull();
  });
});
