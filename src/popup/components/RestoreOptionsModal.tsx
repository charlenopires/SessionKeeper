import { useState, useEffect } from 'react';
import type { Session } from '../../storage';
import type { RestoreProgress, DuplicateDetectionResult, TabWithDuplicateStatus } from '../../session-management';

export type RestoreTarget = 'new-window' | 'current-window';

export interface RestoreOptionsModalProps {
  readonly isOpen: boolean;
  readonly session: Session | null;
  readonly duplicates: DuplicateDetectionResult | null;
  readonly onRestore: (target: RestoreTarget, skipDuplicates: boolean) => void;
  readonly onCancel: () => void;
  readonly isRestoring?: boolean;
  readonly progress?: RestoreProgress | null;
}

/**
 * Truncates text to a maximum length with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function RestoreOptionsModal({
  isOpen,
  session,
  duplicates,
  onRestore,
  onCancel,
  isRestoring = false,
  progress = null,
}: RestoreOptionsModalProps) {
  const [restoreTarget, setRestoreTarget] = useState<RestoreTarget>('new-window');
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRestoreTarget('new-window');
      setSkipDuplicates(true);
    }
  }, [isOpen]);

  // Keyboard handling
  useEffect(() => {
    if (!isOpen || isRestoring) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRestoring, onCancel]);

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
    if (e.target === e.currentTarget && !isRestoring) {
      onCancel();
    }
  };

  const handleRestore = () => {
    onRestore(restoreTarget, skipDuplicates);
  };

  const hasDuplicates = duplicates && duplicates.duplicateCount > 0;
  const duplicateTabs: TabWithDuplicateStatus[] = duplicates
    ? duplicates.tabs.filter(t => t.isDuplicate)
    : [];

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div
        className="modal restore-options-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="restore-modal-title"
      >
        <h2 id="restore-modal-title" className="modal-title text-heading">
          Restaurar Sessão
        </h2>

        {/* Session Preview */}
        <div className="restore-modal-preview">
          <h3 className="restore-modal-session-name">{session.name}</h3>
          {session.description && (
            <p className="text-caption text-muted">{truncateText(session.description, 80)}</p>
          )}
          <div className="restore-modal-counters">
            <span className="restore-modal-counter">
              🪟 {session.totalWindows} {session.totalWindows === 1 ? 'janela' : 'janelas'}
            </span>
            <span className="restore-modal-counter">
              📄 {session.totalTabs} {session.totalTabs === 1 ? 'aba' : 'abas'}
            </span>
          </div>
        </div>

        {/* Restore Target Options */}
        <div className="restore-modal-options">
          <label className="text-body-sm">Abrir em:</label>
          <div className="restore-modal-radio-group">
            <label className="restore-modal-radio">
              <input
                type="radio"
                name="restore-target"
                value="new-window"
                checked={restoreTarget === 'new-window'}
                onChange={() => setRestoreTarget('new-window')}
                disabled={isRestoring}
              />
              <span>Nova janela</span>
            </label>
            <label className="restore-modal-radio">
              <input
                type="radio"
                name="restore-target"
                value="current-window"
                checked={restoreTarget === 'current-window'}
                onChange={() => setRestoreTarget('current-window')}
                disabled={isRestoring}
              />
              <span>Janela atual</span>
            </label>
          </div>
        </div>

        {/* Duplicates Section */}
        {hasDuplicates && (
          <div className="restore-modal-duplicates">
            <div className="restore-modal-duplicates-header">
              <span className="text-body-sm text-warning">
                ⚠️ {duplicates.duplicateCount} {duplicates.duplicateCount === 1 ? 'aba já está aberta' : 'abas já estão abertas'}
              </span>
            </div>

            <label className="restore-modal-checkbox">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                disabled={isRestoring}
              />
              <span>Ignorar duplicatas</span>
            </label>

            {/* Duplicate tabs list */}
            <div className="restore-modal-duplicates-list">
              {duplicateTabs.slice(0, 5).map((item, index) => (
                <div key={index} className="restore-modal-duplicate-item">
                  {item.tab.favIconUrl ? (
                    <img
                      src={item.tab.favIconUrl}
                      alt=""
                      className="tab-favicon"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="tab-favicon-placeholder">📄</span>
                  )}
                  <span className="tab-title" title={item.tab.url}>
                    {truncateText(item.tab.title, 35)}
                  </span>
                </div>
              ))}
              {duplicateTabs.length > 5 && (
                <div className="restore-modal-duplicate-more text-caption text-muted">
                  +{duplicateTabs.length - 5} mais duplicatas
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isRestoring && progress && (
          <div className="restore-modal-progress">
            <div className="restore-modal-progress-bar">
              <div
                className="restore-modal-progress-fill"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="restore-modal-progress-text text-caption text-muted">
              Restaurando aba {progress.currentTab} de {progress.totalTabs}...
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isRestoring}
          >
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleRestore}
            disabled={isRestoring}
          >
            {isRestoring ? 'Restaurando...' : 'Restaurar'}
          </button>
        </div>
      </div>
    </div>
  );
}
