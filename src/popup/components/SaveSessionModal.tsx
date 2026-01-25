import { useState, useEffect, useRef } from 'react';
import type { WindowSnapshot } from '../../session-management';
import type { Tag } from '../../storage';

export interface SaveSessionModalProps {
  readonly isOpen: boolean;
  readonly windows: readonly WindowSnapshot[];
  readonly existingTags: readonly Tag[];
  readonly onSave: (data: SaveSessionData) => void;
  readonly onCancel: () => void;
  readonly onCreateTag?: (name: string) => Promise<Tag | null>;
  readonly isSaving?: boolean;
}

export interface SaveSessionData {
  readonly name: string;
  readonly description?: string;
  readonly tags: readonly string[];
}

/**
 * Truncates text to a maximum length with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generates a suggested session name based on current date/time
 */
function generateSuggestedName(): string {
  const now = new Date();
  return `Sessão ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

export function SaveSessionModal({
  isOpen,
  windows,
  existingTags,
  onSave,
  onCancel,
  onCreateTag,
  isSaving = false,
}: SaveSessionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [showNewTagInput, setShowNewTagInput] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const newTagInputRef = useRef<HTMLInputElement>(null);

  // Calculate totals
  const totalWindows = windows.length;
  const totalTabs = windows.reduce((sum, w) => sum + w.tabs.length, 0);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setSelectedTags([]);
      setNewTagName('');
      setShowNewTagInput(false);
      // Focus name input after a short delay
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      tags: selectedTags,
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

  const canSave = name.trim().length > 0 && !isSaving;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div
        className="modal save-session-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-modal-title"
      >
        <h2 id="save-modal-title" className="modal-title text-heading">
          Salvar Sessão
        </h2>

        {/* Counters */}
        <div className="save-modal-counters">
          <span className="save-modal-counter">
            🪟 {totalWindows} {totalWindows === 1 ? 'janela' : 'janelas'}
          </span>
          <span className="save-modal-counter">
            📄 {totalTabs} {totalTabs === 1 ? 'aba' : 'abas'}
          </span>
        </div>

        {/* Preview */}
        <div className="save-modal-preview">
          {windows.map((window, windowIndex) => (
            <div key={windowIndex} className="save-modal-window">
              <div className="save-modal-window-header text-caption text-muted">
                Janela {windowIndex + 1} ({window.tabs.length} abas)
              </div>
              <ul className="save-modal-tabs">
                {window.tabs.slice(0, 5).map((tab, tabIndex) => (
                  <li key={tabIndex} className="save-modal-tab">
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
                    <span className="tab-title" title={tab.url}>
                      {truncateText(tab.title, 35)}
                    </span>
                  </li>
                ))}
                {window.tabs.length > 5 && (
                  <li className="save-modal-tab-more text-caption text-muted">
                    +{window.tabs.length - 5} mais abas
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="save-modal-form">
          {/* Name field */}
          <div className="save-modal-field">
            <label htmlFor="session-name" className="text-body-sm">
              Nome da sessão *
            </label>
            <input
              ref={nameInputRef}
              id="session-name"
              type="text"
              className="input"
              placeholder={generateSuggestedName()}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              disabled={isSaving}
            />
          </div>

          {/* Description field */}
          <div className="save-modal-field">
            <label htmlFor="session-description" className="text-body-sm">
              Descrição (opcional)
            </label>
            <textarea
              id="session-description"
              className="input"
              placeholder="Descreva o contexto desta sessão..."
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
                    placeholder="Nova tag..."
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
                    title="Criar tag"
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
                    title="Cancelar"
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
                  title="Criar nova tag"
                >
                  + Nova tag
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
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!canSave}
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
