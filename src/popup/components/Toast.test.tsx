import { describe, it, expect } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useToast } from './Toast';

describe('useToast', () => {
  it('should add toast with unique id', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('Test', 'Message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[0].title).toBe('Test');
    expect(result.current.toasts[0].message).toBe('Message');
    expect(result.current.toasts[0].id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('should dismiss toast by id', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      toastId = result.current.showSuccess('Test');
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.dismissToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should show session saved feedback with correct message', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSessionSaved('Work Session', 10, 2);
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[0].title).toBe('"Work Session" salva');
    expect(result.current.toasts[0].message).toBe('10 abas em 2 janelas');
  });

  it('should use singular form for 1 tab and 1 window', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSessionSaved('Single', 1, 1);
    });

    expect(result.current.toasts[0].message).toBe('1 aba em 1 janela');
  });

  it('should show error toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showError('Error Title', 'Error Message');
    });

    expect(result.current.toasts[0].type).toBe('error');
    expect(result.current.toasts[0].title).toBe('Error Title');
  });

  it('should show info toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showInfo('Info Title');
    });

    expect(result.current.toasts[0].type).toBe('info');
  });

  it('should show warning toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showWarning('Warning Title');
    });

    expect(result.current.toasts[0].type).toBe('warning');
  });

  it('should support multiple toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('First');
      result.current.showError('Second');
      result.current.showInfo('Third');
    });

    expect(result.current.toasts).toHaveLength(3);
    expect(result.current.toasts[0].title).toBe('First');
    expect(result.current.toasts[1].title).toBe('Second');
    expect(result.current.toasts[2].title).toBe('Third');
  });
});
