import { describe, it, expect, mock, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { RestoreOptionsModal } from './RestoreOptionsModal';
import type { Session } from '../../storage';
import type { DuplicateDetectionResult } from '../../session-management';

const mockSession: Session = {
  id: 'test-session-1',
  name: 'Test Session',
  description: 'Test description',
  windows: [
    {
      windowId: 1,
      tabs: [
        { url: 'https://example.com', title: 'Example', index: 0, pinned: false },
        { url: 'https://test.com', title: 'Test Page', index: 1, pinned: true },
      ],
    },
    {
      windowId: 2,
      tabs: [
        { url: 'https://another.com', title: 'Another Page', index: 0, pinned: false },
      ],
    },
  ],
  tags: ['work'],
  totalTabs: 3,
  totalWindows: 2,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDuplicates: DuplicateDetectionResult = {
  tabs: [
    { tab: mockSession.windows[0].tabs[0], windowId: 1, isDuplicate: true },
    { tab: mockSession.windows[0].tabs[1], windowId: 1, isDuplicate: false },
    { tab: mockSession.windows[1].tabs[0], windowId: 2, isDuplicate: false },
  ],
  duplicateCount: 1,
  totalCount: 3,
  duplicateUrls: new Set(['https://example.com']),
};

const noDuplicates: DuplicateDetectionResult = {
  tabs: [
    { tab: mockSession.windows[0].tabs[0], windowId: 1, isDuplicate: false },
    { tab: mockSession.windows[0].tabs[1], windowId: 1, isDuplicate: false },
    { tab: mockSession.windows[1].tabs[0], windowId: 2, isDuplicate: false },
  ],
  duplicateCount: 0,
  totalCount: 3,
  duplicateUrls: new Set(),
};

describe('RestoreOptionsModal', () => {
  afterEach(() => {
    cleanup();
  });

  it('should not render when closed', () => {
    render(
      <RestoreOptionsModal
        isOpen={false}
        session={mockSession}
        duplicates={null}
        onRestore={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should not render when session is null', () => {
    render(
      <RestoreOptionsModal
        isOpen={true}
        session={null}
        duplicates={null}
        onRestore={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should render when open with session', () => {
    render(
      <RestoreOptionsModal
        isOpen={true}
        session={mockSession}
        duplicates={null}
        onRestore={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Restore Session')).toBeDefined();
  });

  it('should show session preview with name and counters', () => {
    render(
      <RestoreOptionsModal
        isOpen={true}
        session={mockSession}
        duplicates={null}
        onRestore={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText('Test Session')).toBeDefined();
    expect(screen.getByText(/2 windows/)).toBeDefined();
    expect(screen.getByText(/3 tabs/)).toBeDefined();
  });

  it('should have radio buttons with New window selected by default', () => {
    render(
      <RestoreOptionsModal
        isOpen={true}
        session={mockSession}
        duplicates={null}
        onRestore={() => {}}
        onCancel={() => {}}
      />
    );

    const newWindowRadio = screen.getByLabelText('New window') as HTMLInputElement;
    const currentWindowRadio = screen.getByLabelText('Current window') as HTMLInputElement;

    expect(newWindowRadio.checked).toBe(true);
    expect(currentWindowRadio.checked).toBe(false);
  });

  it('should allow changing restore target', () => {
    render(
      <RestoreOptionsModal
        isOpen={true}
        session={mockSession}
        duplicates={null}
        onRestore={() => {}}
        onCancel={() => {}}
      />
    );

    const currentWindowRadio = screen.getByLabelText('Current window') as HTMLInputElement;
    fireEvent.click(currentWindowRadio);

    expect(currentWindowRadio.checked).toBe(true);
  });

  it('should not show duplicates section when no duplicates', () => {
    render(
      <RestoreOptionsModal
        isOpen={true}
        session={mockSession}
        duplicates={noDuplicates}
        onRestore={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.queryByText(/already open/)).toBeNull();
    expect(screen.queryByText('Skip duplicates')).toBeNull();
  });

  it('should show duplicates section when duplicates exist', () => {
    render(
      <RestoreOptionsModal
        isOpen={true}
        session={mockSession}
        duplicates={mockDuplicates}
        onRestore={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText(/1 tab is already open/)).toBeDefined();
    expect(screen.getByText('Skip duplicates')).toBeDefined();
  });

  it('should have Skip duplicates checkbox checked by default', () => {
    render(
      <RestoreOptionsModal
        isOpen={true}
        session={mockSession}
        duplicates={mockDuplicates}
        onRestore={() => {}}
        onCancel={() => {}}
      />
    );

    const checkbox = screen.getByLabelText('Skip duplicates') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('should show duplicate tabs list', () => {
    render(
      <RestoreOptionsModal
        isOpen={true}
        session={mockSession}
        duplicates={mockDuplicates}
        onRestore={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText('Example')).toBeDefined();
  });

  it('should call onRestore with correct parameters', () => {
    const onRestore = mock(() => {});
    render(
      <RestoreOptionsModal
        isOpen={true}
        session={mockSession}
        duplicates={mockDuplicates}
        onRestore={onRestore}
        onCancel={() => {}}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /^restore$/i }));

    expect(onRestore).toHaveBeenCalledWith('new-window', true);
  });

  it('should call onRestore with current-window when selected', () => {
    const onRestore = mock(() => {});
    render(
      <RestoreOptionsModal
        isOpen={true}
        session={mockSession}
        duplicates={null}
        onRestore={onRestore}
        onCancel={() => {}}
      />
    );

    fireEvent.click(screen.getByLabelText('Current window'));
    fireEvent.click(screen.getByRole('button', { name: /^restore$/i }));

    expect(onRestore).toHaveBeenCalledWith('current-window', true);
  });

  it('should call onRestore with skipDuplicates false when unchecked', () => {
    const onRestore = mock(() => {});
    render(
      <RestoreOptionsModal
        isOpen={true}
        session={mockSession}
        duplicates={mockDuplicates}
        onRestore={onRestore}
        onCancel={() => {}}
      />
    );

    fireEvent.click(screen.getByLabelText('Skip duplicates'));
    fireEvent.click(screen.getByRole('button', { name: /^restore$/i }));

    expect(onRestore).toHaveBeenCalledWith('new-window', false);
  });

  it('should call onCancel when cancel button clicked', () => {
    const onCancel = mock(() => {});
    render(
      <RestoreOptionsModal
        isOpen={true}
        session={mockSession}
        duplicates={null}
        onRestore={() => {}}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('should call onCancel when pressing Escape', () => {
    const onCancel = mock(() => {});
    render(
      <RestoreOptionsModal
        isOpen={true}
        session={mockSession}
        duplicates={null}
        onRestore={() => {}}
        onCancel={onCancel}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalled();
  });

  it('should show restoring state', () => {
    render(
      <RestoreOptionsModal
        isOpen={true}
        session={mockSession}
        duplicates={null}
        onRestore={() => {}}
        onCancel={() => {}}
        isRestoring={true}
      />
    );

    expect(screen.getByText(/restoring/i)).toBeDefined();
  });

  it('should show progress bar when restoring', () => {
    const { container } = render(
      <RestoreOptionsModal
        isOpen={true}
        session={mockSession}
        duplicates={null}
        onRestore={() => {}}
        onCancel={() => {}}
        isRestoring={true}
        progress={{
          currentTab: 2,
          totalTabs: 5,
          currentWindow: 1,
          totalWindows: 2,
          percent: 40,
        }}
      />
    );

    expect(screen.getByText(/Restoring tab 2 of 5/)).toBeDefined();

    const progressFill = container.querySelector('.restore-modal-progress-fill');
    expect(progressFill).toBeDefined();
    expect(progressFill?.getAttribute('style')).toContain('width: 40%');
  });

  it('should disable buttons when restoring', () => {
    render(
      <RestoreOptionsModal
        isOpen={true}
        session={mockSession}
        duplicates={null}
        onRestore={() => {}}
        onCancel={() => {}}
        isRestoring={true}
      />
    );

    const restoreBtn = screen.getByRole('button', { name: /restoring/i });
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });

    expect(restoreBtn.hasAttribute('disabled')).toBe(true);
    expect(cancelBtn.hasAttribute('disabled')).toBe(true);
  });
});
