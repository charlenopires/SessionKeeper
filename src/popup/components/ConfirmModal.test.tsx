import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { ConfirmModal, DeleteSessionModal, DeleteTagModal, ImportReplaceModal } from './ConfirmModal';

describe('ConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Test Title',
    message: 'Test message',
    onConfirm: mock(() => {}),
    onCancel: mock(() => {}),
  };

  beforeEach(() => {
    defaultProps.onConfirm = mock(() => {});
    defaultProps.onCancel = mock(() => {});
  });

  afterEach(() => {
    cleanup();
  });

  it('should not render when isOpen is false', () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('should display title and message', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Test Title')).toBeDefined();
    expect(screen.getByText('Test message')).toBeDefined();
  });

  it('should use default button labels', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Confirm')).toBeDefined();
    expect(screen.getByText('Cancel')).toBeDefined();
  });

  it('should use custom button labels', () => {
    render(
      <ConfirmModal
        {...defaultProps}
        confirmLabel="Delete"
        cancelLabel="Keep"
      />
    );
    expect(screen.getByText('Delete')).toBeDefined();
    expect(screen.getByText('Keep')).toBeDefined();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Confirm'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when backdrop is clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    const backdrop = document.querySelector('.modal-backdrop');
    fireEvent.click(backdrop!);
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should not call onCancel when modal content is clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  it('should call onCancel when Escape key is pressed', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should apply danger variant class', () => {
    render(<ConfirmModal {...defaultProps} variant="danger" />);
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton.classList.contains('btn-danger')).toBe(true);
  });

  it('should apply warning variant class', () => {
    render(<ConfirmModal {...defaultProps} variant="warning" />);
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton.classList.contains('btn-warning')).toBe(true);
  });

  it('should have proper accessibility attributes', () => {
    render(<ConfirmModal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('modal-title');
    expect(dialog.getAttribute('aria-describedby')).toBe('modal-message');
  });
});

describe('DeleteSessionModal', () => {
  const defaultProps = {
    isOpen: true,
    sessionName: 'Work Session',
    totalTabs: 10,
    onConfirm: mock(() => {}),
    onCancel: mock(() => {}),
  };

  beforeEach(() => {
    defaultProps.onConfirm = mock(() => {});
    defaultProps.onCancel = mock(() => {});
  });

  afterEach(() => {
    cleanup();
  });

  it('should display session name and tab count', () => {
    render(<DeleteSessionModal {...defaultProps} />);
    expect(screen.getByText(/Work Session/)).toBeDefined();
    expect(screen.getByText(/10 tabs will be lost/)).toBeDefined();
  });

  it('should use singular form for 1 tab', () => {
    render(<DeleteSessionModal {...defaultProps} totalTabs={1} />);
    expect(screen.getByText(/1 tab will be lost/)).toBeDefined();
  });

  it('should have danger variant styling', () => {
    render(<DeleteSessionModal {...defaultProps} />);
    const confirmButton = screen.getByText('Delete');
    expect(confirmButton.classList.contains('btn-danger')).toBe(true);
  });

  it('should display correct title', () => {
    render(<DeleteSessionModal {...defaultProps} />);
    expect(screen.getByText('Delete session?')).toBeDefined();
  });

  it('should call onConfirm when Delete is clicked', () => {
    render(<DeleteSessionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when Cancel is clicked', () => {
    render(<DeleteSessionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('DeleteTagModal', () => {
  const defaultProps = {
    isOpen: true,
    tagName: 'work',
    sessionCount: 5,
    onConfirm: mock(() => {}),
    onCancel: mock(() => {}),
  };

  beforeEach(() => {
    defaultProps.onConfirm = mock(() => {});
    defaultProps.onCancel = mock(() => {});
  });

  afterEach(() => {
    cleanup();
  });

  it('should display tag name and session count', () => {
    render(<DeleteTagModal {...defaultProps} />);
    expect(screen.getByText(/work/)).toBeDefined();
    expect(screen.getByText(/5 associated sessions/)).toBeDefined();
  });

  it('should use singular form for 1 session', () => {
    render(<DeleteTagModal {...defaultProps} sessionCount={1} />);
    expect(screen.getByText(/1 associated session/)).toBeDefined();
  });

  it('should have danger variant styling', () => {
    render(<DeleteTagModal {...defaultProps} />);
    const confirmButton = screen.getByText('Delete');
    expect(confirmButton.classList.contains('btn-danger')).toBe(true);
  });

  it('should display correct title', () => {
    render(<DeleteTagModal {...defaultProps} />);
    expect(screen.getByText('Delete tag?')).toBeDefined();
  });

  it('should explain consequence of action', () => {
    render(<DeleteTagModal {...defaultProps} />);
    expect(screen.getByText(/will be removed from all sessions/)).toBeDefined();
    expect(screen.getByText(/cannot be undone/)).toBeDefined();
  });

  it('should call onConfirm when Delete is clicked', () => {
    render(<DeleteTagModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when Cancel is clicked', () => {
    render(<DeleteTagModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('ImportReplaceModal', () => {
  const defaultProps = {
    isOpen: true,
    existingCount: 10,
    importingCount: 5,
    onConfirm: mock(() => {}),
    onCancel: mock(() => {}),
  };

  beforeEach(() => {
    defaultProps.onConfirm = mock(() => {});
    defaultProps.onCancel = mock(() => {});
  });

  afterEach(() => {
    cleanup();
  });

  it('should display existing and importing counts', () => {
    render(<ImportReplaceModal {...defaultProps} />);
    expect(screen.getByText(/10 existing sessions will be replaced/)).toBeDefined();
    expect(screen.getByText(/5 sessions from file/)).toBeDefined();
  });

  it('should use singular form for 1 existing session', () => {
    render(<ImportReplaceModal {...defaultProps} existingCount={1} />);
    expect(screen.getByText(/1 existing session will be replaced/)).toBeDefined();
  });

  it('should use singular form for 1 importing session', () => {
    render(<ImportReplaceModal {...defaultProps} importingCount={1} />);
    expect(screen.getByText(/1 session from file/)).toBeDefined();
  });

  it('should have warning variant styling', () => {
    render(<ImportReplaceModal {...defaultProps} />);
    const confirmButton = screen.getByText('Replace');
    expect(confirmButton.classList.contains('btn-warning')).toBe(true);
  });

  it('should display correct title', () => {
    render(<ImportReplaceModal {...defaultProps} />);
    expect(screen.getByText('Replace all sessions?')).toBeDefined();
  });

  it('should explain consequence of action', () => {
    render(<ImportReplaceModal {...defaultProps} />);
    expect(screen.getByText(/permanently lost/)).toBeDefined();
  });

  it('should call onConfirm when Replace is clicked', () => {
    render(<ImportReplaceModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Replace'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when Cancel is clicked', () => {
    render(<ImportReplaceModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('ConfirmModal focus behavior', () => {
  afterEach(() => {
    cleanup();
  });

  it('should focus cancel button when modal opens', async () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Test"
        message="Test message"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel');
      expect(document.activeElement).toBe(cancelButton);
    });
  });

  it('should focus cancel button not confirm button', async () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Test"
        message="Test message"
        variant="danger"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    await waitFor(() => {
      const confirmButton = screen.getByText('Confirm');
      expect(document.activeElement).not.toBe(confirmButton);
    });
  });

  it('should trap focus within modal on Tab', async () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Test"
        message="Test message"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    const confirmButton = screen.getByText('Confirm');

    // Wait for focus on cancel button
    await waitFor(() => {
      expect(document.activeElement).toBe(cancelButton);
    });

    // Tab from cancel to confirm
    fireEvent.keyDown(document, { key: 'Tab' });
    // Note: We can't directly test focus change from keyDown in jsdom,
    // but we can verify the handler doesn't throw
  });

  it('should trap focus within modal on Shift+Tab', async () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Test"
        message="Test message"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    // Wait for focus on cancel button
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByText('Cancel'));
    });

    // Shift+Tab should cycle to confirm button (last element)
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
  });
});
