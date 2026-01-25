import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ConfirmModal, DeleteSessionModal } from './ConfirmModal';

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
    expect(screen.getByText('Confirmar')).toBeDefined();
    expect(screen.getByText('Cancelar')).toBeDefined();
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
    fireEvent.click(screen.getByText('Confirmar'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancelar'));
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
    const confirmButton = screen.getByText('Confirmar');
    expect(confirmButton.classList.contains('btn-danger')).toBe(true);
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
    expect(screen.getByText(/10 abas serão perdidas/)).toBeDefined();
  });

  it('should use singular form for 1 tab', () => {
    render(<DeleteSessionModal {...defaultProps} totalTabs={1} />);
    expect(screen.getByText(/1 aba será perdida/)).toBeDefined();
  });

  it('should have danger variant styling', () => {
    render(<DeleteSessionModal {...defaultProps} />);
    const confirmButton = screen.getByText('Excluir');
    expect(confirmButton.classList.contains('btn-danger')).toBe(true);
  });

  it('should display correct title', () => {
    render(<DeleteSessionModal {...defaultProps} />);
    expect(screen.getByText('Excluir sessão?')).toBeDefined();
  });

  it('should call onConfirm when Excluir is clicked', () => {
    render(<DeleteSessionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Excluir'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when Cancelar is clicked', () => {
    render(<DeleteSessionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancelar'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });
});
