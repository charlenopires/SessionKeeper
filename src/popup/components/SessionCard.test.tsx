import { describe, it, expect, mock, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SessionCard } from './SessionCard';
import type { Session } from '../../storage';

const mockSession: Session = {
  id: 'test-id',
  name: 'Test Session',
  description: 'This is a test session description that might be long',
  windows: [
    {
      windowId: 1,
      tabs: [
        { url: 'https://example.com', title: 'Example', index: 0, pinned: true, favIconUrl: 'https://example.com/favicon.ico' },
        { url: 'https://test.com', title: 'Test Page', index: 1, pinned: false },
      ],
    },
  ],
  tags: ['work', 'important'],
  totalTabs: 2,
  totalWindows: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('SessionCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render session name', () => {
    render(<SessionCard session={mockSession} />);
    expect(screen.getByText('Test Session')).toBeDefined();
  });

  it('should render truncated description', () => {
    render(<SessionCard session={mockSession} />);
    expect(screen.getByText(/This is a test session/)).toBeDefined();
  });

  it('should render tags as badges', () => {
    render(<SessionCard session={mockSession} />);
    expect(screen.getByText('work')).toBeDefined();
    expect(screen.getByText('important')).toBeDefined();
  });

  it('should render window and tab counters', () => {
    render(<SessionCard session={mockSession} />);
    expect(screen.getByText(/🪟 1/)).toBeDefined();
    expect(screen.getByText(/📄 2/)).toBeDefined();
  });

  it('should render relative date', () => {
    render(<SessionCard session={mockSession} />);
    expect(screen.getByText('just now')).toBeDefined();
  });

  it('should show action buttons on hover', () => {
    const { container } = render(<SessionCard session={mockSession} />);

    const card = container.querySelector('article')!;
    fireEvent.mouseEnter(card);

    expect(screen.getByRole('button', { name: /restore/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /edit/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /delete/i })).toBeDefined();
  });

  it('should expand preview on click', () => {
    const { container } = render(<SessionCard session={mockSession} />);

    const card = container.querySelector('article')!;
    fireEvent.click(card);

    expect(screen.getByText(/Window 1/)).toBeDefined();
    expect(screen.getByText('Example')).toBeDefined();
    expect(screen.getByText('Test Page')).toBeDefined();
  });

  it('should show pin indicator for pinned tabs', () => {
    const { container } = render(<SessionCard session={mockSession} />);

    const card = container.querySelector('article')!;
    fireEvent.click(card);

    expect(screen.getByTitle('Pinned tab')).toBeDefined();
  });

  it('should call onRestore when restore button clicked', () => {
    const onRestore = mock(() => {});
    const { container } = render(<SessionCard session={mockSession} onRestore={onRestore} />);

    const card = container.querySelector('article')!;
    fireEvent.mouseEnter(card);

    const restoreBtn = screen.getByRole('button', { name: /restore/i });
    fireEvent.click(restoreBtn);

    expect(onRestore).toHaveBeenCalledWith(mockSession);
  });

  it('should call onDelete when delete button clicked', () => {
    const onDelete = mock(() => {});
    const { container } = render(<SessionCard session={mockSession} onDelete={onDelete} />);

    const card = container.querySelector('article')!;
    fireEvent.mouseEnter(card);

    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledWith(mockSession);
  });

  it('should call onEdit when edit button clicked', () => {
    const onEdit = mock(() => {});
    const { container } = render(<SessionCard session={mockSession} onEdit={onEdit} />);

    const card = container.querySelector('article')!;
    fireEvent.mouseEnter(card);

    const editBtn = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editBtn);

    expect(onEdit).toHaveBeenCalledWith(mockSession);
  });
});
