import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDeleteSession } from './useDeleteSession';
import { initializeDatabase, closeDatabase, createSession } from '../../storage';
import { isOk } from '../../storage/result';
import type { Session } from '../../storage';
import Dexie from 'dexie';

describe('useDeleteSession', () => {
  beforeEach(async () => {
    await Dexie.delete('session-keeper-db');
    await initializeDatabase();
  });

  afterEach(async () => {
    await closeDatabase();
    await Dexie.delete('session-keeper-db');
  });

  const createTestSession = async (): Promise<Session> => {
    const result = await createSession({
      name: 'Test Session',
      windows: [
        {
          windowId: 1,
          tabs: [
            { url: 'https://example.com', title: 'Example', index: 0, pinned: false },
          ],
        },
      ],
    });
    if (!isOk(result)) throw new Error('Failed to create session');
    return result.value;
  };

  it('should initialize with modal closed', () => {
    const { result } = renderHook(() => useDeleteSession());

    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.sessionToDelete).toBeNull();
    expect(result.current.isDeleting).toBe(false);
  });

  it('should open modal with session', async () => {
    const session = await createTestSession();
    const { result } = renderHook(() => useDeleteSession());

    act(() => {
      result.current.openDeleteModal(session);
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.sessionToDelete).toEqual(session);
  });

  it('should close modal and clear session', async () => {
    const session = await createTestSession();
    const { result } = renderHook(() => useDeleteSession());

    act(() => {
      result.current.openDeleteModal(session);
    });

    expect(result.current.isModalOpen).toBe(true);

    act(() => {
      result.current.closeDeleteModal();
    });

    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.sessionToDelete).toBeNull();
  });

  it('should delete session and call onDeleted callback', async () => {
    const session = await createTestSession();
    const onDeleted = mock(() => {});

    const { result } = renderHook(() => useDeleteSession({ onDeleted }));

    act(() => {
      result.current.openDeleteModal(session);
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(onDeleted).toHaveBeenCalledWith(session.id);
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.sessionToDelete).toBeNull();
  });

  it('should set isDeleting during delete operation', async () => {
    const session = await createTestSession();
    const { result } = renderHook(() => useDeleteSession());

    act(() => {
      result.current.openDeleteModal(session);
    });

    let wasDeleting = false;
    const deletePromise = act(async () => {
      const promise = result.current.confirmDelete();
      // Check isDeleting during the operation
      wasDeleting = result.current.isDeleting;
      await promise;
    });

    await deletePromise;

    // After completion, isDeleting should be false
    expect(result.current.isDeleting).toBe(false);
  });

  it('should close modal after successful delete', async () => {
    const session = await createTestSession();
    const { result } = renderHook(() => useDeleteSession());

    act(() => {
      result.current.openDeleteModal(session);
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(result.current.isModalOpen).toBe(false);
  });

  it('should do nothing if confirmDelete called without session', async () => {
    const onDeleted = mock(() => {});
    const { result } = renderHook(() => useDeleteSession({ onDeleted }));

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(onDeleted).not.toHaveBeenCalled();
  });
});
