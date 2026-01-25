import { useState } from 'react';
import type { Session } from '../../storage';
import { formatRelativeDate } from '../utils/formatRelativeDate';

interface SessionCardProps {
  readonly session: Session;
  readonly onRestore?: (session: Session) => void;
  readonly onEdit?: (session: Session) => void;
  readonly onDelete?: (session: Session) => void;
}

/**
 * Truncates text to a maximum length with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function SessionCard({ session, onRestore, onEdit, onDelete }: SessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRestore?.(session);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(session);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(session);
  };

  return (
    <article
      className="session-card"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-expanded={isExpanded}
    >
      {/* Card Header */}
      <div className="session-card-header">
        <div className="session-card-info">
          <h3 className="session-card-name">{session.name}</h3>
          {session.description && (
            <p className="session-card-description text-muted">
              {truncateText(session.description, 60)}
            </p>
          )}
        </div>

        {/* Action buttons - visible on hover */}
        <div className={`session-card-actions ${isHovered ? 'visible' : ''}`}>
          <button
            className="btn btn-icon btn-secondary session-action-btn"
            onClick={handleRestore}
            aria-label="Restaurar sessão"
            title="Restaurar"
          >
            🔄
          </button>
          <button
            className="btn btn-icon btn-secondary session-action-btn"
            onClick={handleEdit}
            aria-label="Editar sessão"
            title="Editar"
          >
            ✏️
          </button>
          <button
            className="btn btn-icon btn-secondary session-action-btn"
            onClick={handleDelete}
            aria-label="Excluir sessão"
            title="Excluir"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Tags */}
      {session.tags.length > 0 && (
        <div className="session-card-tags">
          {session.tags.map((tag) => (
            <span key={tag} className="badge badge-primary">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Meta info */}
      <div className="session-card-meta">
        <span className="session-card-stat" title="Janelas">
          🪟 {session.totalWindows}
        </span>
        <span className="session-card-stat" title="Abas">
          📄 {session.totalTabs}
        </span>
        <span className="session-card-date text-muted">
          {formatRelativeDate(session.createdAt)}
        </span>
      </div>

      {/* Expanded preview */}
      {isExpanded && (
        <div className="session-card-preview">
          {session.windows.map((window, windowIndex) => (
            <div key={windowIndex} className="session-preview-window">
              <div className="session-preview-window-header text-caption text-muted">
                Janela {windowIndex + 1} ({window.tabs.length} abas)
              </div>
              <ul className="session-preview-tabs">
                {window.tabs.map((tab, tabIndex) => (
                  <li key={tabIndex} className="session-preview-tab">
                    {tab.pinned && (
                      <span className="tab-pin-indicator" title="Aba fixada">📌</span>
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
                    <span className="tab-title" title={tab.url}>
                      {truncateText(tab.title, 40)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
