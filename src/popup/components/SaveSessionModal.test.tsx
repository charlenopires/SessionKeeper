import { describe, it, expect, mock, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SaveSessionModal } from './SaveSessionModal';
import type { WindowSnapshot } from '../../session-management';
import type { Tag } from '../../storage';

const mockWindows: WindowSnapshot[] = [
  {
    windowId: 1,
    tabs: [
      { id: 1, windowId: 1, url: 'https://example.com', title: 'Example', index: 0, pinned: false, active: true },
      { id: 2, windowId: 1, url: 'https://test.com', title: 'Test Page', index: 1, pinned: true, active: false },
    ],
  },
  {
    windowId: 2,
    tabs: [
      { id: 3, windowId: 2, url: 'https://another.com', title: 'Another Page', index: 0, pinned: false, active: false },
    ],
  },
];

const mockTags: Tag[] = [
  { id: 1, name: 'work', createdAt: new Date() },
  { id: 2, name: 'personal', color: '#ff0000', createdAt: new Date() },
];

describe('SaveSessionModal', () => {
  afterEach(() => {
    cleanup();
  });

  it('should not render when closed', () => {
    render(
      <SaveSessionModal
        isOpen={false}
        windows={mockWindows}
        existingTags={mockTags}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should render when open', () => {
    render(
      <SaveSessionModal
        isOpen={true}
        windows={mockWindows}
        existingTags={mockTags}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Save Session')).toBeDefined();
  });

  it('should show window and tab counters', () => {
    render(
      <SaveSessionModal
        isOpen={true}
        windows={mockWindows}
        existingTags={mockTags}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText(/2 windows/)).toBeDefined();
    expect(screen.getByText(/3 tabs/)).toBeDefined();
  });

  it('should show preview of windows and tabs', () => {
    render(
      <SaveSessionModal
        isOpen={true}
        windows={mockWindows}
        existingTags={mockTags}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText(/Window 1/)).toBeDefined();
    expect(screen.getByText(/Window 2/)).toBeDefined();
    expect(screen.getByText('Example')).toBeDefined();
  });

  it('should have name input with placeholder', () => {
    render(
      <SaveSessionModal
        isOpen={true}
        windows={mockWindows}
        existingTags={mockTags}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );

    const nameInput = screen.getByLabelText(/session name/i);
    expect(nameInput).toBeDefined();
    expect(nameInput.getAttribute('placeholder')).toContain('Session');
  });

  it('should have description textarea', () => {
    render(
      <SaveSessionModal
        isOpen={true}
        windows={mockWindows}
        existingTags={mockTags}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByLabelText(/description/i)).toBeDefined();
  });

  it('should show existing tags as chips', () => {
    render(
      <SaveSessionModal
        isOpen={true}
        windows={mockWindows}
        existingTags={mockTags}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText('work')).toBeDefined();
    expect(screen.getByText('personal')).toBeDefined();
  });

  it('should toggle tag selection on click', () => {
    render(
      <SaveSessionModal
        isOpen={true}
        windows={mockWindows}
        existingTags={mockTags}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );

    const workTag = screen.getByText('work');
    fireEvent.click(workTag);

    expect(workTag.className).toContain('badge-primary');
  });

  it('should have new tag button', () => {
    render(
      <SaveSessionModal
        isOpen={true}
        windows={mockWindows}
        existingTags={mockTags}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText(/new tag/i)).toBeDefined();
  });

  it('should show new tag input when clicking add button', () => {
    render(
      <SaveSessionModal
        isOpen={true}
        windows={mockWindows}
        existingTags={mockTags}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );

    fireEvent.click(screen.getByText(/new tag/i));

    expect(screen.getByPlaceholderText(/new tag/i)).toBeDefined();
  });

  it('should disable save button when name is empty', () => {
    render(
      <SaveSessionModal
        isOpen={true}
        windows={mockWindows}
        existingTags={mockTags}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /save$/i });
    expect(saveBtn.hasAttribute('disabled')).toBe(true);
  });

  it('should enable save button when name is filled', () => {
    render(
      <SaveSessionModal
        isOpen={true}
        windows={mockWindows}
        existingTags={mockTags}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );

    const nameInput = screen.getByLabelText(/session name/i);
    fireEvent.change(nameInput, { target: { value: 'My Session' } });

    const saveBtn = screen.getByRole('button', { name: /save$/i });
    expect(saveBtn.hasAttribute('disabled')).toBe(false);
  });

  it('should call onSave with form data', () => {
    const onSave = mock(() => {});
    render(
      <SaveSessionModal
        isOpen={true}
        windows={mockWindows}
        existingTags={mockTags}
        onSave={onSave}
        onCancel={() => {}}
      />
    );

    // Fill name
    fireEvent.change(screen.getByLabelText(/session name/i), {
      target: { value: 'My Session' },
    });

    // Fill description
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Test description' },
    });

    // Select a tag
    fireEvent.click(screen.getByText('work'));

    // Save
    fireEvent.click(screen.getByRole('button', { name: /save$/i }));

    expect(onSave).toHaveBeenCalledWith({
      name: 'My Session',
      description: 'Test description',
      tags: ['work'],
    });
  });

  it('should call onCancel when cancel button clicked', () => {
    const onCancel = mock(() => {});
    render(
      <SaveSessionModal
        isOpen={true}
        windows={mockWindows}
        existingTags={mockTags}
        onSave={() => {}}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('should call onCancel when pressing Escape', () => {
    const onCancel = mock(() => {});
    render(
      <SaveSessionModal
        isOpen={true}
        windows={mockWindows}
        existingTags={mockTags}
        onSave={() => {}}
        onCancel={onCancel}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalled();
  });

  it('should show saving state', () => {
    render(
      <SaveSessionModal
        isOpen={true}
        windows={mockWindows}
        existingTags={mockTags}
        onSave={() => {}}
        onCancel={() => {}}
        isSaving={true}
      />
    );

    expect(screen.getByText(/saving/i)).toBeDefined();
  });
});
