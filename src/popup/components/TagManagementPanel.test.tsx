import { describe, it, expect, mock, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagManagementPanel, type TagWithCount } from './TagManagementPanel';

const mockTags: TagWithCount[] = [
  { id: 1, name: 'work', color: '#F44336', createdAt: new Date(), sessionCount: 3 },
  { id: 2, name: 'personal', color: '#2196F3', createdAt: new Date(), sessionCount: 1 },
  { id: 3, name: 'project', color: '#4CAF50', createdAt: new Date(), sessionCount: 0 },
];

describe('TagManagementPanel', () => {
  afterEach(() => {
    cleanup();
  });

  it('should not render when closed', () => {
    render(
      <TagManagementPanel
        isOpen={false}
        tags={mockTags}
        onClose={() => {}}
        onCreateTag={async () => true}
        onUpdateTag={async () => true}
        onDeleteTag={async () => true}
      />
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should render when open', () => {
    render(
      <TagManagementPanel
        isOpen={true}
        tags={mockTags}
        onClose={() => {}}
        onCreateTag={async () => true}
        onUpdateTag={async () => true}
        onDeleteTag={async () => true}
      />
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Gerenciar Tags')).toBeDefined();
  });

  it('should list all tags with color preview and name', () => {
    const { container } = render(
      <TagManagementPanel
        isOpen={true}
        tags={mockTags}
        onClose={() => {}}
        onCreateTag={async () => true}
        onUpdateTag={async () => true}
        onDeleteTag={async () => true}
      />
    );

    expect(screen.getByText('work')).toBeDefined();
    expect(screen.getByText('personal')).toBeDefined();
    expect(screen.getByText('project')).toBeDefined();

    // Check color previews exist
    const colorPreviews = container.querySelectorAll('.tag-color-preview');
    expect(colorPreviews.length).toBe(3);
  });

  it('should show session count for each tag', () => {
    render(
      <TagManagementPanel
        isOpen={true}
        tags={mockTags}
        onClose={() => {}}
        onCreateTag={async () => true}
        onUpdateTag={async () => true}
        onDeleteTag={async () => true}
      />
    );

    expect(screen.getByText('3 sessões')).toBeDefined();
    expect(screen.getByText('1 sessão')).toBeDefined();
    expect(screen.getByText('0 sessões')).toBeDefined();
  });

  it('should have add new tag button', () => {
    render(
      <TagManagementPanel
        isOpen={true}
        tags={mockTags}
        onClose={() => {}}
        onCreateTag={async () => true}
        onUpdateTag={async () => true}
        onDeleteTag={async () => true}
      />
    );

    expect(screen.getByText('+ Adicionar Tag')).toBeDefined();
  });

  it('should show form when clicking add button', () => {
    render(
      <TagManagementPanel
        isOpen={true}
        tags={mockTags}
        onClose={() => {}}
        onCreateTag={async () => true}
        onUpdateTag={async () => true}
        onDeleteTag={async () => true}
      />
    );

    fireEvent.click(screen.getByText('+ Adicionar Tag'));

    expect(screen.getByPlaceholderText('Nome da tag')).toBeDefined();
    expect(screen.getByText('Cor:')).toBeDefined();
    expect(screen.getByText('Criar')).toBeDefined();
  });

  it('should show 12 predefined colors in color picker', () => {
    const { container } = render(
      <TagManagementPanel
        isOpen={true}
        tags={mockTags}
        onClose={() => {}}
        onCreateTag={async () => true}
        onUpdateTag={async () => true}
        onDeleteTag={async () => true}
      />
    );

    fireEvent.click(screen.getByText('+ Adicionar Tag'));

    const colorOptions = container.querySelectorAll('.color-picker-option');
    expect(colorOptions.length).toBe(12);
  });

  it('should call onCreateTag when submitting new tag form', async () => {
    const onCreateTag = mock(async () => true);
    render(
      <TagManagementPanel
        isOpen={true}
        tags={mockTags}
        onClose={() => {}}
        onCreateTag={onCreateTag}
        onUpdateTag={async () => true}
        onDeleteTag={async () => true}
      />
    );

    fireEvent.click(screen.getByText('+ Adicionar Tag'));

    const nameInput = screen.getByPlaceholderText('Nome da tag');
    fireEvent.change(nameInput, { target: { value: 'new-tag' } });

    fireEvent.click(screen.getByText('Criar'));

    expect(onCreateTag).toHaveBeenCalledWith('new-tag', '#F44336');
  });

  it('should show edit form when clicking on tag', () => {
    render(
      <TagManagementPanel
        isOpen={true}
        tags={mockTags}
        onClose={() => {}}
        onCreateTag={async () => true}
        onUpdateTag={async () => true}
        onDeleteTag={async () => true}
      />
    );

    fireEvent.click(screen.getByText('work'));

    const nameInput = screen.getByPlaceholderText('Nome da tag') as HTMLInputElement;
    expect(nameInput.value).toBe('work');
    expect(screen.getByText('Salvar')).toBeDefined();
  });

  it('should call onUpdateTag when submitting edit form', async () => {
    const onUpdateTag = mock(async () => true);
    render(
      <TagManagementPanel
        isOpen={true}
        tags={mockTags}
        onClose={() => {}}
        onCreateTag={async () => true}
        onUpdateTag={onUpdateTag}
        onDeleteTag={async () => true}
      />
    );

    fireEvent.click(screen.getByText('work'));

    const nameInput = screen.getByPlaceholderText('Nome da tag');
    fireEvent.change(nameInput, { target: { value: 'work-updated' } });

    fireEvent.click(screen.getByText('Salvar'));

    expect(onUpdateTag).toHaveBeenCalledWith(1, 'work-updated', '#F44336');
  });

  it('should delete tag without confirmation when no sessions', async () => {
    const onDeleteTag = mock(async () => true);
    render(
      <TagManagementPanel
        isOpen={true}
        tags={mockTags}
        onClose={() => {}}
        onCreateTag={async () => true}
        onUpdateTag={async () => true}
        onDeleteTag={onDeleteTag}
      />
    );

    // Find delete button for 'project' tag (0 sessions)
    const deleteButtons = screen.getAllByTitle('Excluir');
    fireEvent.click(deleteButtons[2]); // project is third

    expect(onDeleteTag).toHaveBeenCalledWith(3, 0);
  });

  it('should show confirmation when deleting tag with sessions', async () => {
    // This test verifies that clicking delete on a tag with sessions
    // does NOT immediately call onDeleteTag (requires confirmation)
    const onDeleteTag = mock(async () => true);

    render(
      <TagManagementPanel
        isOpen={true}
        tags={mockTags}
        onClose={() => {}}
        onCreateTag={async () => true}
        onUpdateTag={async () => true}
        onDeleteTag={onDeleteTag}
      />
    );

    // Find and click delete button for 'work' tag (3 sessions)
    const deleteButton = screen.getByLabelText('Excluir tag work');
    fireEvent.click(deleteButton);

    // The delete handler should NOT be called directly (because sessionCount > 0)
    expect(onDeleteTag).not.toHaveBeenCalled();

    // The component should show a confirmation prompt
    // We verify this by checking the confirmation exists in test:
    // "should call onDeleteTag when confirming deletion"
  });

  it('should call onDeleteTag when confirming deletion', async () => {
    const onDeleteTag = mock(async () => true);
    render(
      <TagManagementPanel
        isOpen={true}
        tags={mockTags}
        onClose={() => {}}
        onCreateTag={async () => true}
        onUpdateTag={async () => true}
        onDeleteTag={onDeleteTag}
      />
    );

    // Find delete button for 'work' tag using aria-label
    const deleteButton = screen.getByLabelText('Excluir tag work');

    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Click confirm
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /excluir$/i }));
    });

    await waitFor(() => {
      expect(onDeleteTag).toHaveBeenCalledWith(1, 3);
    });
  });

  it('should call onClose when close button clicked', () => {
    const onClose = mock(() => {});
    render(
      <TagManagementPanel
        isOpen={true}
        tags={mockTags}
        onClose={onClose}
        onCreateTag={async () => true}
        onUpdateTag={async () => true}
        onDeleteTag={async () => true}
      />
    );

    fireEvent.click(screen.getByLabelText('Fechar'));

    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when pressing Escape', () => {
    const onClose = mock(() => {});
    render(
      <TagManagementPanel
        isOpen={true}
        tags={mockTags}
        onClose={onClose}
        onCreateTag={async () => true}
        onUpdateTag={async () => true}
        onDeleteTag={async () => true}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    render(
      <TagManagementPanel
        isOpen={true}
        tags={[]}
        onClose={() => {}}
        onCreateTag={async () => true}
        onUpdateTag={async () => true}
        onDeleteTag={async () => true}
        isLoading={true}
      />
    );

    expect(screen.getByText(/carregando/i)).toBeDefined();
  });

  it('should show empty state when no tags', () => {
    render(
      <TagManagementPanel
        isOpen={true}
        tags={[]}
        onClose={() => {}}
        onCreateTag={async () => true}
        onUpdateTag={async () => true}
        onDeleteTag={async () => true}
      />
    );

    expect(screen.getByText('Nenhuma tag criada')).toBeDefined();
  });
});
