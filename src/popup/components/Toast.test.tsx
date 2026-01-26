import { describe, it, expect, mock, afterEach, beforeAll, afterAll } from 'bun:test';
import { renderHook, act, render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useToast, Toast, ToastContainer } from './Toast';

// Mock requestAnimationFrame for test environment
const originalRAF = globalThis.requestAnimationFrame;
beforeAll(() => {
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(() => callback(Date.now()), 0) as unknown as number;
  };
});
afterAll(() => {
  globalThis.requestAnimationFrame = originalRAF;
});

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
    expect(result.current.toasts[0].title).toBe('"Work Session" saved');
    expect(result.current.toasts[0].message).toBe('10 tabs in 2 windows');
  });

  it('should use singular form for 1 tab and 1 window', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSessionSaved('Single', 1, 1);
    });

    expect(result.current.toasts[0].message).toBe('1 tab in 1 window');
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

describe('Toast Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render with title and message', () => {
    const onDismiss = mock(() => {});
    render(
      <Toast
        toast={{ id: '1', type: 'success', title: 'Test Title', message: 'Test Message' }}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText('Test Title')).toBeDefined();
    expect(screen.getByText('Test Message')).toBeDefined();
  });

  it('should render X button to close', () => {
    const onDismiss = mock(() => {});
    render(
      <Toast
        toast={{ id: '1', type: 'success', title: 'Test' }}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByLabelText('Close notification')).toBeDefined();
  });

  it('should call onDismiss when X button is clicked', async () => {
    const onDismiss = mock(() => {});
    render(
      <Toast
        toast={{ id: '1', type: 'success', title: 'Test' }}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByLabelText('Close notification'));

    // Wait for animation timeout (300ms)
    await new Promise(resolve => setTimeout(resolve, 350));

    expect(onDismiss).toHaveBeenCalledWith('1');
  });

  it('should have role alert for accessibility', () => {
    const onDismiss = mock(() => {});
    render(
      <Toast
        toast={{ id: '1', type: 'error', title: 'Error' }}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('should display correct icon for each type', () => {
    const onDismiss = mock(() => {});

    const { rerender, container } = render(
      <Toast toast={{ id: '1', type: 'success', title: 'Success' }} onDismiss={onDismiss} />
    );
    // Icon is in a span, not the button
    const getIconSpan = () => container.querySelector('.toast > span');
    expect(getIconSpan()?.textContent).toBe('✓');

    rerender(<Toast toast={{ id: '2', type: 'error', title: 'Error' }} onDismiss={onDismiss} />);
    expect(getIconSpan()?.textContent).toBe('✕');

    rerender(<Toast toast={{ id: '3', type: 'info', title: 'Info' }} onDismiss={onDismiss} />);
    expect(getIconSpan()?.textContent).toBe('ℹ');

    rerender(<Toast toast={{ id: '4', type: 'warning', title: 'Warning' }} onDismiss={onDismiss} />);
    expect(getIconSpan()?.textContent).toBe('⚠');
  });
});

describe('ToastContainer', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render multiple toasts', () => {
    const onDismiss = mock(() => {});
    const toasts = [
      { id: '1', type: 'success' as const, title: 'First' },
      { id: '2', type: 'error' as const, title: 'Second' },
    ];

    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);

    expect(screen.getByText('First')).toBeDefined();
    expect(screen.getByText('Second')).toBeDefined();
  });

  it('should be positioned at top-right', () => {
    const onDismiss = mock(() => {});
    const { container } = render(
      <ToastContainer toasts={[{ id: '1', type: 'success', title: 'Test' }]} onDismiss={onDismiss} />
    );

    const toastContainer = container.querySelector('.toast-container');
    expect(toastContainer).toBeDefined();
    expect(toastContainer?.getAttribute('style')).toContain('right:');
    expect(toastContainer?.getAttribute('style')).toContain('top:');
    expect(toastContainer?.getAttribute('style')).not.toContain('left:');
  });

  it('should render empty when no toasts', () => {
    const onDismiss = mock(() => {});
    const { container } = render(<ToastContainer toasts={[]} onDismiss={onDismiss} />);

    const toastContainer = container.querySelector('.toast-container');
    expect(toastContainer?.children.length).toBe(0);
  });
});
