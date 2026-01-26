import { useState, useEffect, useRef } from 'react';
import type { Session, StoredWindowSnapshot, StoredTab } from '../../storage';
import type { Tag } from '../../storage';

export interface EditSessionModalProps {
  readonly isOpen: boolean;
  readonly session: Session | null;
  readonly existingTags: readonly Tag[];
  readonly onSave: (data: EditSessionData) => void;
  readonly onCancel: () => void;
  readonly onCreateTag?: (name: string) => Promise<Tag | null>;
  readonly isSaving?: boolean;
}

export interface EditSessionData {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly tags: readonly string[];
  readonly windows: StoredWindowSnapshot[];
}

export interface EditableTab extends StoredTab {
  readonly isEditing?: boolean;
}

export interface EditableWindow extends Omit<StoredWindowSnapshot, 'tabs'> {
  tabs: EditableTab[];
}

/**
 * Truncates text to a maximum length with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Deep clones windows array for editing
 */
function cloneWindows(windows: readonly StoredWindowSnapshot[]): EditableWindow[] {
  return windows.map(w => ({
    windowId: w.windowId,
    tabs: w.tabs.map(t => ({ ...t })),
  }));
}

/**
 * Compares two window arrays to detect changes
 */
function hasWindowsChanged(
  original: readonly StoredWindowSnapshot[],
  current: EditableWindow[]
): boolean {
  if (original.length !== current.length) return true;

  for (let i = 0; i < original.length; i++) {
    const origWindow = original[i];
    const currWindow = current[i];

    if (origWindow.tabs.length !== currWindow.tabs.length) return true;

    for (let j = 0; j < origWindow.tabs.length; j++) {
      const origTab = origWindow.tabs[j];
      const currTab = currWindow.tabs[j];

      if (origTab.url !== currTab.url || origTab.title !== currTab.title) {
        return true;
      }
    }
  }

  return false;
}

export function EditSessionModal({
  isOpen,
  session,
  existingTags,
  onSave,
  onCancel,
  onCreateTag,
  isSaving = false,
}: EditSessionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [windows, setWindows] = useState<EditableWindow[]>([]);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [draggedTab, setDraggedTab] = useState<{ windowIndex: number; tabIndex: number } | null>(null);
  const [dragOverTab, setDragOverTab] = useState<{ windowIndex: number; tabIndex: number } | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const newTagInputRef = useRef<HTMLInputElement>(null);

  // Original values for dirty state detection
  const [originalName, setOriginalName] = useState('');
  const [originalDescription, setOriginalDescription] = useState('');
  const [originalTags, setOriginalTags] = useState<string[]>([]);
  const [originalWindows, setOriginalWindows] = useState<readonly StoredWindowSnapshot[]>([]);

  // Calculate totals
  const totalWindows = windows.length;
  const totalTabs = windows.reduce((sum, w) => sum + w.tabs.length, 0);

  // Detect dirty state
  const isDirty =
    name !== originalName ||
    description !== originalDescription ||
    JSON.stringify(selectedTags.sort()) !== JSON.stringify([...originalTags].sort()) ||
    hasWindowsChanged(originalWindows, windows);

  // Reset form when modal opens with session data
  useEffect(() => {
    if (isOpen && session) {
      setName(session.name);
      setDescription(session.description || '');
      setSelectedTags([...session.tags]);
      setWindows(cloneWindows(session.windows));
      setEditingTabId(null);
      setNewTagName('');
      setShowNewTagInput(false);

      // Store original values
      setOriginalName(session.name);
      setOriginalDescription(session.description || '');
      setOriginalTags([...session.tags]);
      setOriginalWindows(session.windows);

      // Focus name input after a short delay
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen, session]);

  // Focus new tag input when shown
  useEffect(() => {
    if (showNewTagInput) {
      newTagInputRef.current?.focus();
    }
  }, [showNewTagInput]);

  // Keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !session) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;

    // Convert EditableWindow back to StoredWindowSnapshot
    const cleanWindows: StoredWindowSnapshot[] = windows.map(w => ({
      windowId: w.windowId,
      tabs: w.tabs.map(({ isEditing, ...tab }) => tab),
    }));

    onSave({
      id: session.id,
      name: name.trim(),
      description: description.trim() || undefined,
      tags: selectedTags,
      windows: cleanWindows,
    });
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim() || !onCreateTag) return;

    setIsCreatingTag(true);
    try {
      const tag = await onCreateTag(newTagName.trim());
      if (tag) {
        setSelectedTags(prev => [...prev, tag.name]);
        setNewTagName('');
        setShowNewTagInput(false);
      }
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleNewTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateTag();
    } else if (e.key === 'Escape') {
      setShowNewTagInput(false);
      setNewTagName('');
    }
  };

  const handleRemoveTab = (windowIndex: number, tabIndex: number) => {
    setWindows(prev => {
      const updated = [...prev];
      const window = { ...updated[windowIndex] };
      window.tabs = window.tabs
        .filter((_, i) => i !== tabIndex)
        .map((t, i) => ({ ...t, index: i }));

      // Remove window if empty
      if (window.tabs.length === 0) {
        return updated.filter((_, i) => i !== windowIndex);
      }

      updated[windowIndex] = window;
      return updated;
    });
  };

  const handleStartEditTab = (windowIndex: number, tabIndex: number) => {
    setEditingTabId(`${windowIndex}-${tabIndex}`);
  };

  const handleUpdateTab = (
    windowIndex: number,
    tabIndex: number,
    field: 'url' | 'title',
    value: string
  ) => {
    setWindows(prev => {
      const updated = [...prev];
      const window = { ...updated[windowIndex] };
      window.tabs = window.tabs.map((t, i) =>
        i === tabIndex ? { ...t, [field]: value } : t
      );
      updated[windowIndex] = window;
      return updated;
    });
  };

  const handleFinishEditTab = () => {
    setEditingTabId(null);
  };

  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      handleFinishEditTab();
    }
  };

  // Drag and drop handlers
  const handleDragStart = (windowIndex: number, tabIndex: number) => {
    setDraggedTab({ windowIndex, tabIndex });
  };

  const handleDragOver = (e: React.DragEvent, windowIndex: number, tabIndex: number) => {
    e.preventDefault();
    if (draggedTab && (draggedTab.windowIndex !== windowIndex || draggedTab.tabIndex !== tabIndex)) {
      setDragOverTab({ windowIndex, tabIndex });
    }
  };

  const handleDragLeave = () => {
    setDragOverTab(null);
  };

  const handleDrop = (e: React.DragEvent, targetWindowIndex: number, targetTabIndex: number) => {
    e.preventDefault();
    if (!draggedTab) return;

    const { windowIndex: sourceWindowIndex, tabIndex: sourceTabIndex } = draggedTab;

    // Don't do anything if dropping on itself
    if (sourceWindowIndex === targetWindowIndex && sourceTabIndex === targetTabIndex) {
      setDraggedTab(null);
      setDragOverTab(null);
      return;
    }

    setWindows(prev => {
      const updated = prev.map(w => ({ ...w, tabs: [...w.tabs] }));

      // Get the tab being dragged
      const draggedTabData = { ...updated[sourceWindowIndex].tabs[sourceTabIndex] };

      // Remove from source
      updated[sourceWindowIndex].tabs.splice(sourceTabIndex, 1);

      // If moving within the same window, adjust target index if needed
      let adjustedTargetIndex = targetTabIndex;
      if (sourceWindowIndex === targetWindowIndex && sourceTabIndex < targetTabIndex) {
        adjustedTargetIndex--;
      }

      // Insert at target position
      updated[targetWindowIndex].tabs.splice(adjustedTargetIndex, 0, draggedTabData);

      // Reindex tabs in affected windows
      updated[sourceWindowIndex].tabs = updated[sourceWindowIndex].tabs.map((t, i) => ({ ...t, index: i }));
      if (sourceWindowIndex !== targetWindowIndex) {
        updated[targetWindowIndex].tabs = updated[targetWindowIndex].tabs.map((t, i) => ({ ...t, index: i }));
      }

      // Remove empty windows
      return updated.filter(w => w.tabs.length > 0);
    });

    setDraggedTab(null);
    setDragOverTab(null);
  };

  const handleDragEnd = () => {
    setDraggedTab(null);
    setDragOverTab(null);
  };

  const canSave = name.trim().length > 0 && !isSaving && totalTabs > 0;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div
        className="modal edit-session-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
      >
        <h2 id="edit-modal-title" className="modal-title text-heading">
          Edit Session
          {isDirty && <span className="dirty-indicator" title="Unsaved changes"> *</span>}
        </h2>

        {/* Counters */}
        <div className="save-modal-counters">
          <span className="save-modal-counter">
            🪟 {totalWindows} {totalWindows === 1 ? 'window' : 'windows'}
          </span>
          <span className="save-modal-counter">
            📄 {totalTabs} {totalTabs === 1 ? 'tab' : 'tabs'}
          </span>
        </div>

        {/* Editable Tab List */}
        <div className="edit-modal-tabs-list">
          {windows.map((window, windowIndex) => (
            <div key={windowIndex} className="edit-modal-window">
              <div className="edit-modal-window-header text-caption text-muted">
                Window {windowIndex + 1} ({window.tabs.length} tabs)
              </div>
              <ul className="edit-modal-tabs">
                {window.tabs.map((tab, tabIndex) => {
                  const isEditing = editingTabId === `${windowIndex}-${tabIndex}`;
                  const isDragging = draggedTab?.windowIndex === windowIndex && draggedTab?.tabIndex === tabIndex;
                  const isDragOver = dragOverTab?.windowIndex === windowIndex && dragOverTab?.tabIndex === tabIndex;

                  return (
                    <li
                      key={tabIndex}
                      className={`edit-modal-tab ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                      draggable={!isEditing}
                      onDragStart={() => handleDragStart(windowIndex, tabIndex)}
                      onDragOver={(e) => handleDragOver(e, windowIndex, tabIndex)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, windowIndex, tabIndex)}
                      onDragEnd={handleDragEnd}
                    >
                      {isEditing ? (
                        <div className="edit-tab-form">
                          <input
                            type="text"
                            className="input input-sm"
                            value={tab.title}
                            onChange={(e) => handleUpdateTab(windowIndex, tabIndex, 'title', e.target.value)}
                            onKeyDown={handleTabKeyDown}
                            onBlur={handleFinishEditTab}
                            placeholder="Title"
                            autoFocus
                          />
                          <input
                            type="text"
                            className="input input-sm"
                            value={tab.url}
                            onChange={(e) => handleUpdateTab(windowIndex, tabIndex, 'url', e.target.value)}
                            onKeyDown={handleTabKeyDown}
                            onBlur={handleFinishEditTab}
                            placeholder="URL"
                          />
                        </div>
                      ) : (
                        <>
                          {tab.pinned && (
                            <span className="tab-pin-indicator" title="Pinned tab">📌</span>
                          )}
                          {tab.favIconUrl ? (
                            <img
                              src={tab.favIconUrl}
                              alt=""
                              className="tab-favicon"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="tab-favicon-placeholder">📄</span>
                          )}
                          <span
                            className="tab-title tab-title-editable"
                            title={tab.url}
                            onClick={() => handleStartEditTab(windowIndex, tabIndex)}
                          >
                            {truncateText(tab.title, 30)}
                          </span>
                          <button
                            type="button"
                            className="btn btn-icon btn-sm tab-remove-btn"
                            onClick={() => handleRemoveTab(windowIndex, tabIndex)}
                            title="Remove tab"
                            aria-label="Remove tab"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {totalTabs === 0 && (
            <p className="text-caption text-muted edit-modal-empty">
              No tabs in session. Add at least one tab to save.
            </p>
          )}
        </div>

        {/* Form */}
        <div className="save-modal-form">
          {/* Name field */}
          <div className="save-modal-field">
            <label htmlFor="edit-session-name" className="text-body-sm">
              Session name *
            </label>
            <input
              ref={nameInputRef}
              id="edit-session-name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              disabled={isSaving}
            />
          </div>

          {/* Description field */}
          <div className="save-modal-field">
            <label htmlFor="edit-session-description" className="text-body-sm">
              Description (optional)
            </label>
            <textarea
              id="edit-session-description"
              className="input"
              placeholder="Describe the context of this session..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
              style={{ resize: 'none' }}
              disabled={isSaving}
            />
          </div>

          {/* Tags selector */}
          <div className="save-modal-field">
            <label className="text-body-sm">Tags</label>
            <div className="save-modal-tags">
              {existingTags.map((tag) => (
                <button
                  key={tag.name}
                  type="button"
                  className={`badge save-modal-tag ${selectedTags.includes(tag.name) ? 'badge-primary' : ''}`}
                  onClick={() => toggleTag(tag.name)}
                  disabled={isSaving}
                  style={tag.color ? { borderColor: tag.color } : undefined}
                >
                  {tag.name}
                </button>
              ))}

              {/* New tag input */}
              {showNewTagInput ? (
                <div className="save-modal-new-tag-input">
                  <input
                    ref={newTagInputRef}
                    type="text"
                    className="input input-sm"
                    placeholder="New tag..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={handleNewTagKeyDown}
                    maxLength={30}
                    disabled={isCreatingTag}
                  />
                  <button
                    type="button"
                    className="btn btn-icon btn-secondary btn-sm"
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim() || isCreatingTag}
                    title="Create tag"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon btn-secondary btn-sm"
                    onClick={() => {
                      setShowNewTagInput(false);
                      setNewTagName('');
                    }}
                    disabled={isCreatingTag}
                    title="Cancel"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="badge save-modal-add-tag"
                  onClick={() => setShowNewTagInput(true)}
                  disabled={isSaving}
                  title="Create new tag"
                >
                  + New tag
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!canSave}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
