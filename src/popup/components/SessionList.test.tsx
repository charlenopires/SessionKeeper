import { describe, it, expect, mock, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SessionList } from './SessionList';
import type { Session } from '../../storage';

const mockSessions: Session[] = [
  {
    id: 'session-1',
    name: 'Session 1',
    description: 'First session',
    windows: [
      {
        windowId: 1,
        tabs: [{ url: 'https://a.com', title: 'A', index: 0, pinned: false }],
      },
    ],
    tags: ['work'],
    totalTabs: 1,
    totalWindows: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'session-2',
    name: 'Session 2',
    description: 'Second session',
    windows: [
      {
        windowId: 1,
        tabs: [{ url: 'https://b.com', title: 'B', index: 0, pinned: false }],
      },
    ],
    tags: [],
    totalTabs: 1,
    totalWindows: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('SessionList', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render cards for each session', () => {
    render(<SessionList sessions={mockSessions} />);

    expect(screen.getByText('Session 1')).toBeDefined();
    expect(screen.getByText('Session 2')).toBeDefined();
  });

  it('should render empty state when no sessions', () => {
    render(<SessionList sessions={[]} />);

    expect(screen.getByText('No saved sessions')).toBeDefined();
    expect(screen.getByText(/Save your first session/)).toBeDefined();
  });

  it('should render CTA button in empty state', () => {
    const onSaveFirst = mock(() => {});
    render(<SessionList sessions={[]} onSaveFirst={onSaveFirst} />);

    const ctaButton = screen.getByRole('button', { name: /save current session/i });
    expect(ctaButton).toBeDefined();

    fireEvent.click(ctaButton);
    expect(onSaveFirst).toHaveBeenCalled();
  });

  it('should render loading state', () => {
    render(<SessionList sessions={[]} isLoading={true} />);

    expect(screen.getByText(/loading/i)).toBeDefined();
  });

  it('should pass onRestore to cards', () => {
    const onRestore = mock(() => {});
    render(<SessionList sessions={mockSessions} onRestore={onRestore} />);

    const firstCard = screen.getByText('Session 1').closest('article');
    fireEvent.mouseEnter(firstCard!);

    const restoreBtn = screen.getAllByRole('button', { name: /restore/i })[0];
    fireEvent.click(restoreBtn);

    expect(onRestore).toHaveBeenCalledWith(mockSessions[0]);
  });

  it('should pass onDelete to cards', () => {
    const onDelete = mock(() => {});
    render(<SessionList sessions={mockSessions} onDelete={onDelete} />);

    const firstCard = screen.getByText('Session 1').closest('article');
    fireEvent.mouseEnter(firstCard!);

    const deleteBtn = screen.getAllByRole('button', { name: /delete/i })[0];
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledWith(mockSessions[0]);
  });
});
