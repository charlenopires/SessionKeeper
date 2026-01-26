import { describe, it, expect, mock, afterEach, beforeEach } from 'bun:test';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import { SearchFilterBar, SearchEmptyState } from './SearchFilterBar';
import type { Tag } from '../../storage';

const mockTags: Tag[] = [
  { id: 1, name: 'work', color: '#F44336', createdAt: new Date() },
  { id: 2, name: 'personal', color: '#2196F3', createdAt: new Date() },
  { id: 3, name: 'project', color: '#4CAF50', createdAt: new Date() },
];

describe('SearchFilterBar', () => {
  let onSearchChange: ReturnType<typeof mock>;
  let onTagsChange: ReturnType<typeof mock>;

  beforeEach(() => {
    onSearchChange = mock(() => {});
    onTagsChange = mock(() => {});
  });

  afterEach(() => {
    cleanup();
  });

  it('should render search input', () => {
    render(
      <SearchFilterBar
        tags={mockTags}
        totalSessions={5}
        filteredCount={5}
        onSearchChange={onSearchChange}
        onTagsChange={onTagsChange}
        selectedTags={[]}
        searchTerm=""
      />
    );

    expect(screen.getByPlaceholderText('Search sessions...')).toBeDefined();
  });

  it('should render tag filter button when tags exist', () => {
    render(
      <SearchFilterBar
        tags={mockTags}
        totalSessions={5}
        filteredCount={5}
        onSearchChange={onSearchChange}
        onTagsChange={onTagsChange}
        selectedTags={[]}
        searchTerm=""
      />
    );

    expect(screen.getByText(/Tags/)).toBeDefined();
  });

  it('should not render tag filter button when no tags', () => {
    render(
      <SearchFilterBar
        tags={[]}
        totalSessions={5}
        filteredCount={5}
        onSearchChange={onSearchChange}
        onTagsChange={onTagsChange}
        selectedTags={[]}
        searchTerm=""
      />
    );

    expect(screen.queryByText(/Tags/)).toBeNull();
  });

  it('should show results counter with total sessions', () => {
    render(
      <SearchFilterBar
        tags={mockTags}
        totalSessions={10}
        filteredCount={10}
        onSearchChange={onSearchChange}
        onTagsChange={onTagsChange}
        selectedTags={[]}
        searchTerm=""
      />
    );

    expect(screen.getByText('10 sessions')).toBeDefined();
  });

  it('should show singular "session" for 1 session', () => {
    render(
      <SearchFilterBar
        tags={mockTags}
        totalSessions={1}
        filteredCount={1}
        onSearchChange={onSearchChange}
        onTagsChange={onTagsChange}
        selectedTags={[]}
        searchTerm=""
      />
    );

    expect(screen.getByText('1 session')).toBeDefined();
  });

  it('should show filtered count when different from total', () => {
    render(
      <SearchFilterBar
        tags={mockTags}
        totalSessions={10}
        filteredCount={3}
        onSearchChange={onSearchChange}
        onTagsChange={onTagsChange}
        selectedTags={['work']}
        searchTerm=""
      />
    );

    expect(screen.getByText('3 of 10 sessions')).toBeDefined();
  });

  it('should call onSearchChange after debounce', async () => {
    render(
      <SearchFilterBar
        tags={mockTags}
        totalSessions={5}
        filteredCount={5}
        onSearchChange={onSearchChange}
        onTagsChange={onTagsChange}
        selectedTags={[]}
        searchTerm=""
      />
    );

    const input = screen.getByPlaceholderText('Search sessions...');
    fireEvent.change(input, { target: { value: 'test' } });

    // Should not be called immediately
    expect(onSearchChange).not.toHaveBeenCalledWith('test');

    // Wait for debounce (300ms)
    await waitFor(() => {
      expect(onSearchChange).toHaveBeenCalledWith('test');
    }, { timeout: 500 });
  });

  it('should be case-insensitive (component passes value as-is)', () => {
    render(
      <SearchFilterBar
        tags={mockTags}
        totalSessions={5}
        filteredCount={5}
        onSearchChange={onSearchChange}
        onTagsChange={onTagsChange}
        selectedTags={[]}
        searchTerm=""
      />
    );

    const input = screen.getByPlaceholderText('Search sessions...');
    fireEvent.change(input, { target: { value: 'TEST' } });

    // The component passes the value as-is; case-insensitivity is handled by the parent
    expect((input as HTMLInputElement).value).toBe('TEST');
  });

  it('should open tag dropdown when clicking tag button', () => {
    render(
      <SearchFilterBar
        tags={mockTags}
        totalSessions={5}
        filteredCount={5}
        onSearchChange={onSearchChange}
        onTagsChange={onTagsChange}
        selectedTags={[]}
        searchTerm=""
      />
    );

    fireEvent.click(screen.getByText(/Tags/));

    expect(screen.getByRole('listbox')).toBeDefined();
    expect(screen.getByText('work')).toBeDefined();
    expect(screen.getByText('personal')).toBeDefined();
    expect(screen.getByText('project')).toBeDefined();
  });

  it('should call onTagsChange when selecting a tag', () => {
    render(
      <SearchFilterBar
        tags={mockTags}
        totalSessions={5}
        filteredCount={5}
        onSearchChange={onSearchChange}
        onTagsChange={onTagsChange}
        selectedTags={[]}
        searchTerm=""
      />
    );

    fireEvent.click(screen.getByText(/Tags/));
    fireEvent.click(screen.getByText('work'));

    expect(onTagsChange).toHaveBeenCalledWith(['work']);
  });

  it('should allow multiple tags selection (OR logic)', () => {
    render(
      <SearchFilterBar
        tags={mockTags}
        totalSessions={5}
        filteredCount={5}
        onSearchChange={onSearchChange}
        onTagsChange={onTagsChange}
        selectedTags={['work']}
        searchTerm=""
      />
    );

    fireEvent.click(screen.getByText(/Tags/));
    fireEvent.click(screen.getByText('personal'));

    expect(onTagsChange).toHaveBeenCalledWith(['work', 'personal']);
  });

  it('should show selected tags as chips', () => {
    render(
      <SearchFilterBar
        tags={mockTags}
        totalSessions={5}
        filteredCount={3}
        onSearchChange={onSearchChange}
        onTagsChange={onTagsChange}
        selectedTags={['work', 'personal']}
        searchTerm=""
      />
    );

    // Should have chip buttons with tag names
    const workChip = screen.getByLabelText('Remove filter work');
    const personalChip = screen.getByLabelText('Remove filter personal');

    expect(workChip).toBeDefined();
    expect(personalChip).toBeDefined();
  });

  it('should highlight selected tags in dropdown', () => {
    render(
      <SearchFilterBar
        tags={mockTags}
        totalSessions={5}
        filteredCount={3}
        onSearchChange={onSearchChange}
        onTagsChange={onTagsChange}
        selectedTags={['work']}
        searchTerm=""
      />
    );

    fireEvent.click(screen.getByText(/Tags/));

    const workOption = screen.getByRole('option', { name: /work/ });
    expect(workOption.getAttribute('aria-selected')).toBe('true');
  });

  it('should show tag count badge on filter button', () => {
    const { container } = render(
      <SearchFilterBar
        tags={mockTags}
        totalSessions={5}
        filteredCount={3}
        onSearchChange={onSearchChange}
        onTagsChange={onTagsChange}
        selectedTags={['work', 'personal']}
        searchTerm=""
      />
    );

    const countBadge = container.querySelector('.tag-filter-count');
    expect(countBadge?.textContent).toBe('2');
  });

  it('should show clear button when filters active', () => {
    render(
      <SearchFilterBar
        tags={mockTags}
        totalSessions={5}
        filteredCount={3}
        onSearchChange={onSearchChange}
        onTagsChange={onTagsChange}
        selectedTags={['work']}
        searchTerm="test"
      />
    );

    expect(screen.getByLabelText('Clear search and filters')).toBeDefined();
  });

  it('should not show clear button when no filters active', () => {
    render(
      <SearchFilterBar
        tags={mockTags}
        totalSessions={5}
        filteredCount={5}
        onSearchChange={onSearchChange}
        onTagsChange={onTagsChange}
        selectedTags={[]}
        searchTerm=""
      />
    );

    expect(screen.queryByLabelText('Clear search and filters')).toBeNull();
  });

  it('should clear all filters when clicking clear button', async () => {
    render(
      <SearchFilterBar
        tags={mockTags}
        totalSessions={5}
        filteredCount={3}
        onSearchChange={onSearchChange}
        onTagsChange={onTagsChange}
        selectedTags={['work']}
        searchTerm="test"
      />
    );

    fireEvent.click(screen.getByLabelText('Clear search and filters'));

    expect(onSearchChange).toHaveBeenCalledWith('');
    expect(onTagsChange).toHaveBeenCalledWith([]);
  });

  it('should remove tag when clicking chip', () => {
    render(
      <SearchFilterBar
        tags={mockTags}
        totalSessions={5}
        filteredCount={3}
        onSearchChange={onSearchChange}
        onTagsChange={onTagsChange}
        selectedTags={['work', 'personal']}
        searchTerm=""
      />
    );

    fireEvent.click(screen.getByLabelText('Remove filter work'));

    expect(onTagsChange).toHaveBeenCalledWith(['personal']);
  });

  it('should close dropdown when Escape is pressed', () => {
    render(
      <SearchFilterBar
        tags={mockTags}
        totalSessions={5}
        filteredCount={5}
        onSearchChange={onSearchChange}
        onTagsChange={onTagsChange}
        selectedTags={[]}
        searchTerm=""
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByText(/Tags/));
    expect(screen.getByRole('listbox')).toBeDefined();

    // Press Escape
    fireEvent.keyDown(screen.getByText(/Tags/).parentElement!, { key: 'Escape' });

    // Dropdown should be closed
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('should show 0 sessions when total is 0', () => {
    render(
      <SearchFilterBar
        tags={[]}
        totalSessions={0}
        filteredCount={0}
        onSearchChange={onSearchChange}
        onTagsChange={onTagsChange}
        selectedTags={[]}
        searchTerm=""
      />
    );

    expect(screen.getByText('0 sessions')).toBeDefined();
  });
});

describe('SearchEmptyState', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render empty state message', () => {
    render(<SearchEmptyState onClear={() => {}} />);

    expect(screen.getByText('No sessions found')).toBeDefined();
    expect(screen.getByText('Try adjusting your search terms or filters')).toBeDefined();
  });

  it('should have clear button', () => {
    render(<SearchEmptyState onClear={() => {}} />);

    expect(screen.getByText('Clear Filters')).toBeDefined();
  });

  it('should call onClear when clicking button', () => {
    const onClear = mock(() => {});
    render(<SearchEmptyState onClear={onClear} />);

    fireEvent.click(screen.getByText('Clear Filters'));

    expect(onClear).toHaveBeenCalled();
  });
});
