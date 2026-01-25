import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave } from './useAutoSave';

describe('useAutoSave', () => {
  beforeEach(() => {
    // Reset timers
  });

  it('should debounce save calls by default 500ms', async () => {
    const saveFn = mock(() => Promise.resolve());
    const { result } = renderHook(() => useAutoSave(saveFn));

    act(() => {
      result.current.save({ value: 1 });
      result.current.save({ value: 2 });
      result.current.save({ value: 3 });
    });

    // Should not have called saveFn yet
    expect(saveFn).not.toHaveBeenCalled();
    expect(result.current.isPending).toBe(true);

    // Wait for debounce
    await waitFor(
      () => {
        expect(saveFn).toHaveBeenCalledTimes(1);
      },
      { timeout: 1000 }
    );

    // Should only have called with the last value
    expect(saveFn).toHaveBeenCalledWith({ value: 3 });
  });

  it('should respect custom debounce time', async () => {
    const saveFn = mock(() => Promise.resolve());
    const { result } = renderHook(() => useAutoSave(saveFn, { debounceMs: 100 }));

    act(() => {
      result.current.save({ test: true });
    });

    expect(saveFn).not.toHaveBeenCalled();

    await waitFor(
      () => {
        expect(saveFn).toHaveBeenCalledTimes(1);
      },
      { timeout: 300 }
    );
  });

  it('should call saveImmediately without debounce', async () => {
    const saveFn = mock(() => Promise.resolve());
    const { result } = renderHook(() => useAutoSave(saveFn));

    await act(async () => {
      await result.current.saveImmediately({ immediate: true });
    });

    expect(saveFn).toHaveBeenCalledTimes(1);
    expect(saveFn).toHaveBeenCalledWith({ immediate: true });
  });

  it('should cancel pending save when saveImmediately is called', async () => {
    const saveFn = mock(() => Promise.resolve());
    const { result } = renderHook(() => useAutoSave(saveFn, { debounceMs: 500 }));

    act(() => {
      result.current.save({ pending: true });
    });

    expect(result.current.isPending).toBe(true);

    await act(async () => {
      await result.current.saveImmediately({ immediate: true });
    });

    // Only immediate call should have been made
    expect(saveFn).toHaveBeenCalledTimes(1);
    expect(saveFn).toHaveBeenCalledWith({ immediate: true });
  });

  it('should cancel pending save', async () => {
    const saveFn = mock(() => Promise.resolve());
    const { result } = renderHook(() => useAutoSave(saveFn, { debounceMs: 100 }));

    act(() => {
      result.current.save({ value: 1 });
    });

    expect(result.current.isPending).toBe(true);

    act(() => {
      result.current.cancel();
    });

    expect(result.current.isPending).toBe(false);

    // Wait to ensure save is not called
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(saveFn).not.toHaveBeenCalled();
  });

  it('should track isSaving state', async () => {
    let resolvePromise: () => void;
    const saveFn = mock(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        })
    );

    const { result } = renderHook(() => useAutoSave(saveFn, { debounceMs: 50 }));

    act(() => {
      result.current.save({ value: 1 });
    });

    // Wait for debounce and save to start
    await waitFor(() => {
      expect(result.current.isSaving).toBe(true);
    });

    // Resolve the save
    act(() => {
      resolvePromise!();
    });

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });
  });

  it('should update lastSavedAt after successful save', async () => {
    const saveFn = mock(() => Promise.resolve());
    const { result } = renderHook(() => useAutoSave(saveFn, { debounceMs: 50 }));

    expect(result.current.lastSavedAt).toBeNull();

    act(() => {
      result.current.save({ value: 1 });
    });

    await waitFor(() => {
      expect(result.current.lastSavedAt).toBeInstanceOf(Date);
    });
  });

  it('should track error state on save failure', async () => {
    const error = new Error('Save failed');
    const saveFn = mock(() => Promise.reject(error));
    const onError = mock(() => {});

    const { result } = renderHook(() => useAutoSave(saveFn, { debounceMs: 50, onError }));

    act(() => {
      result.current.save({ value: 1 });
    });

    await waitFor(() => {
      expect(result.current.error).toBe(error);
    });

    expect(onError).toHaveBeenCalledWith(error);
  });

  it('should call onSaving callback when save starts', async () => {
    const saveFn = mock(() => Promise.resolve());
    const onSaving = mock(() => {});

    const { result } = renderHook(() => useAutoSave(saveFn, { debounceMs: 50, onSaving }));

    act(() => {
      result.current.save({ value: 1 });
    });

    await waitFor(() => {
      expect(onSaving).toHaveBeenCalled();
    });
  });

  it('should call onSaved callback after successful save', async () => {
    const saveFn = mock(() => Promise.resolve());
    const onSaved = mock(() => {});

    const { result } = renderHook(() => useAutoSave(saveFn, { debounceMs: 50, onSaved }));

    act(() => {
      result.current.save({ value: 1 });
    });

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
    });
  });

  it('should clear error on new save attempt', async () => {
    let shouldFail = true;
    const saveFn = mock(() => (shouldFail ? Promise.reject(new Error('fail')) : Promise.resolve()));

    const { result } = renderHook(() => useAutoSave(saveFn, { debounceMs: 50 }));

    // First save fails
    act(() => {
      result.current.save({ value: 1 });
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    // Second save succeeds
    shouldFail = false;
    act(() => {
      result.current.save({ value: 2 });
    });

    // Error should be cleared immediately when new save is scheduled
    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });
});
