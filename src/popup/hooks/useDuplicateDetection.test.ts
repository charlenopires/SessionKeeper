import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useDuplicateDetection } from './useDuplicateDetection';
import type { Session } from '../../storage';

// Mock chrome APIs
const mockTabsQuery = mock(() => Promise.resolve([]));

// @ts-ignore - Mock chrome global
globalThis.chrome = {
  tabs: {
    query: mockTabsQuery,
  },
};

describe('useDuplicateDetection', () => {
  const mockSession: Session = {
    id: 'test-id',
    name: 'Test Session',
    description: undefined,
    windows: [
      {
        windowId: 1,
        tabs: [
          { url: 'https://example.com', title: 'Example', index: 0, pinned: false, favIconUrl: undefined },
          { url: 'https://unique.com', title: 'Unique', index: 1, pinned: false, favIconUrl: undefined },
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
    mockTabsQuery.mockClear();
    mockTabsQuery.mockImplementation(() => Promise.resolve([{ url: 'https://example.com' }]));
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDuplicateDetection());

    expect(result.current.isChecking).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.strategy).toBe('skip');
  });

  it('should use custom default strategy', () => {
    const { result } = renderHook(() =>
      useDuplicateDetection({ defaultStrategy: 'allow' })
    );

    expect(result.current.strategy).toBe('allow');
  });

  it('should detect duplicates and return result', async () => {
    const { result } = renderHook(() => useDuplicateDetection());

    let detectResult: any;
    await act(async () => {
      detectResult = await result.current.checkDuplicates(mockSession);
    });

    expect(detectResult).not.toBeNull();
    expect(detectResult.duplicateCount).toBe(1);
    expect(detectResult.totalCount).toBe(2);
    expect(result.current.result).toEqual(detectResult);
  });

  it('should set isChecking during detection', async () => {
    let resolveQuery: () => void;
    mockTabsQuery.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveQuery = () => resolve([{ url: 'https://example.com' }]);
        })
    );

    const { result } = renderHook(() => useDuplicateDetection());

    act(() => {
      result.current.checkDuplicates(mockSession);
    });

    expect(result.current.isChecking).toBe(true);

    await act(async () => {
      resolveQuery!();
    });

    expect(result.current.isChecking).toBe(false);
  });

  it('should allow changing strategy', () => {
    const { result } = renderHook(() => useDuplicateDetection());

    expect(result.current.strategy).toBe('skip');

    act(() => {
      result.current.setStrategy('allow');
    });

    expect(result.current.strategy).toBe('allow');
  });

  it('should filter windows based on strategy', async () => {
    const { result } = renderHook(() => useDuplicateDetection());

    await act(async () => {
      await result.current.checkDuplicates(mockSession);
    });

    // Skip strategy (default)
    const skippedWindows = result.current.getFilteredWindows();
    expect(skippedWindows.length).toBe(1);
    expect(skippedWindows[0].tabs.length).toBe(1);
    expect(skippedWindows[0].tabs[0].url).toBe('https://unique.com');

    // Allow strategy
    act(() => {
      result.current.setStrategy('allow');
    });

    const allowedWindows = result.current.getFilteredWindows();
    expect(allowedWindows.length).toBe(1);
    expect(allowedWindows[0].tabs.length).toBe(2);
  });

  it('should reset state', async () => {
    const { result } = renderHook(() => useDuplicateDetection());

    await act(async () => {
      await result.current.checkDuplicates(mockSession);
    });

    expect(result.current.result).not.toBeNull();

    act(() => {
      result.current.setStrategy('allow');
      result.current.reset();
    });

    expect(result.current.result).toBeNull();
    expect(result.current.strategy).toBe('skip');
  });

  it('should call onError on failure', async () => {
    mockTabsQuery.mockImplementation(() => Promise.reject(new Error('Chrome error')));
    const onError = mock(() => {});

    const { result } = renderHook(() => useDuplicateDetection({ onError }));

    await act(async () => {
      await result.current.checkDuplicates(mockSession);
    });

    expect(onError).toHaveBeenCalled();
  });

  it('should return empty array from getFilteredWindows when no result', () => {
    const { result } = renderHook(() => useDuplicateDetection());

    const filtered = result.current.getFilteredWindows();

    expect(filtered).toEqual([]);
  });
});
