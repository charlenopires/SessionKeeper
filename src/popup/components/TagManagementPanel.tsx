import { useState, useEffect, useRef } from 'react';
import { X, Trash2, LoaderCircle } from 'lucide-react';
import type { Tag } from '../../storage';

export interface TagWithCount extends Tag {
  sessionCount: number;
}

export interface TagManagementPanelProps {
  readonly isOpen: boolean;
  readonly tags: readonly TagWithCount[];
  readonly onClose: () => void;
  readonly onCreateTag: (name: string, color?: string) => Promise<boolean>;
  readonly onUpdateTag: (id: number, name: string, color?: string) => Promise<boolean>;
  readonly onDeleteTag: (id: number, sessionCount: number) => Promise<boolean>;
  readonly isLoading?: boolean;
}

// 12 predefined colors for tag color picker
const PREDEFINED_COLORS = [
  '#F44336', // Red
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#673AB7', // Deep Purple
  '#3F51B5', // Indigo
  '#2196F3', // Blue
  '#03A9F4', // Light Blue
  '#00BCD4', // Cyan
  '#009688', // Teal
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#795548', // Brown
];

interface TagFormState {
  name: string;
  color: string;
}

export function TagManagementPanel({
  isOpen,
  tags,
  onClose,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  isLoading = false,
}: TagManagementPanelProps) {
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [formState, setFormState] = useState<TagFormState>({ name: '', color: PREDEFINED_COLORS[0] });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset state when panel opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsAddingTag(false);
      setEditingTagId(null);
      setFormState({ name: '', color: PREDEFINED_COLORS[0] });
      setDeleteConfirmId(null);
    }
  }, [isOpen]);

  // Focus name input when adding or editing
  useEffect(() => {
    if (isAddingTag || editingTagId !== null) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isAddingTag, editingTagId]);

  // Keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAddingTag || editingTagId !== null) {
          handleCancelForm();
        } else if (deleteConfirmId !== null) {
          setDeleteConfirmId(null);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAddingTag, editingTagId, deleteConfirmId, onClose]);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setIsAddingTag(true);
    setEditingTagId(null);
    setFormState({ name: '', color: PREDEFINED_COLORS[0] });
  };

  const handleStartEdit = (tag: TagWithCount) => {
    setIsAddingTag(false);
    setEditingTagId(tag.id!);
    setFormState({ name: tag.name, color: tag.color || PREDEFINED_COLORS[0] });
  };

  const handleCancelForm = () => {
    setIsAddingTag(false);
    setEditingTagId(null);
    setFormState({ name: '', color: PREDEFINED_COLORS[0] });
  };

  const handleSaveTag = async () => {
    if (!formState.name.trim()) return;

    setIsSaving(true);
    try {
      if (isAddingTag) {
        const success = await onCreateTag(formState.name.trim(), formState.color);
        if (success) {
          handleCancelForm();
        }
      } else if (editingTagId !== null) {
        const success = await onUpdateTag(editingTagId, formState.name.trim(), formState.color);
        if (success) {
          handleCancelForm();
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (tag: TagWithCount) => {
    if (tag.sessionCount > 0) {
      setDeleteConfirmId(tag.id!);
    } else {
      handleConfirmDelete(tag.id!, 0);
    }
  };

  const handleConfirmDelete = async (id: number, sessionCount: number) => {
    setIsSaving(true);
    try {
      await onDeleteTag(id, sessionCount);
      setDeleteConfirmId(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTag();
    }
  };

  const tagToDelete = tags.find(t => t.id === deleteConfirmId);

  return (
    <div className="tag-panel-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tag-panel" role="dialog" aria-modal="true" aria-labelledby="tag-panel-title">
        <div className="tag-panel-header">
          <h2 id="tag-panel-title" className="text-heading">Manage Tags</h2>
          <button
            className="btn btn-icon btn-secondary"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="tag-panel-content">
          {/* Add tag button */}
          {!isAddingTag && editingTagId === null && (
            <button
              className="btn btn-secondary tag-panel-add-btn"
              onClick={handleStartAdd}
              disabled={isLoading}
            >
              + Add Tag
            </button>
          )}

          {/* Add/Edit form */}
          {(isAddingTag || editingTagId !== null) && (
            <div className="tag-form">
              <div className="tag-form-row">
                <input
                  ref={nameInputRef}
                  type="text"
                  className="input tag-form-name"
                  placeholder="Tag name"
                  value={formState.name}
                  onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                  onKeyDown={handleFormKeyDown}
                  maxLength={30}
                  disabled={isSaving}
                />
              </div>

              <div className="tag-form-colors">
                <label className="text-caption text-muted">Color:</label>
                <div className="color-picker">
                  {PREDEFINED_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-picker-option ${formState.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormState(prev => ({ ...prev, color }))}
                      disabled={isSaving}
                      aria-label={`Color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div className="tag-form-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleCancelForm}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveTag}
                  disabled={!formState.name.trim() || isSaving}
                >
                  {isSaving ? 'Saving...' : (isAddingTag ? 'Create' : 'Save')}
                </button>
              </div>
            </div>
          )}

          {/* Delete confirmation */}
          {deleteConfirmId !== null && tagToDelete && (
            <div className="tag-delete-confirm">
              <p className="text-body-sm">
                The tag <strong>"{tagToDelete.name}"</strong> is associated with{' '}
                <strong>{tagToDelete.sessionCount} {tagToDelete.sessionCount === 1 ? 'session' : 'sessions'}</strong>.
                Are you sure you want to delete?
              </p>
              <div className="tag-delete-confirm-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleConfirmDelete(deleteConfirmId, tagToDelete.sessionCount)}
                  disabled={isSaving}
                >
                  {isSaving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          )}

          {/* Tags list */}
          {isLoading ? (
            <div className="tag-panel-loading">
              <LoaderCircle size={20} className="loading-spinner animate-spin" />
              <span className="text-muted">Loading tags...</span>
            </div>
          ) : tags.length === 0 ? (
            <div className="tag-panel-empty">
              <p className="text-muted">No tags created</p>
              <p className="text-caption text-muted">Create tags to organize your sessions</p>
            </div>
          ) : (
            <ul className="tag-list">
              {tags.map((tag) => (
                <li
                  key={tag.id}
                  className={`tag-list-item ${editingTagId === tag.id ? 'editing' : ''}`}
                >
                  <div
                    className="tag-list-item-content"
                    onClick={() => editingTagId === null && !isAddingTag && handleStartEdit(tag)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && editingTagId === null && !isAddingTag) {
                        handleStartEdit(tag);
                      }
                    }}
                  >
                    <span
                      className="tag-color-preview"
                      style={{ backgroundColor: tag.color || PREDEFINED_COLORS[0] }}
                    />
                    <span className="tag-name">{tag.name}</span>
                    <span className="tag-session-count badge">
                      {tag.sessionCount} {tag.sessionCount === 1 ? 'session' : 'sessions'}
                    </span>
                  </div>
                  <button
                    className="btn btn-icon btn-sm tag-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(tag);
                    }}
                    disabled={isSaving || editingTagId !== null || isAddingTag}
                    aria-label={`Delete tag ${tag.name}`}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
