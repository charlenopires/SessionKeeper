import { FolderOpen, LoaderCircle } from 'lucide-react';
import type { Session } from '../../storage';
import { SessionCard } from './SessionCard';

interface SessionListProps {
  readonly sessions: readonly Session[];
  readonly isLoading?: boolean;
  readonly onRestore?: (session: Session) => void;
  readonly onEdit?: (session: Session) => void;
  readonly onDelete?: (session: Session) => void;
  readonly onSaveFirst?: () => void;
}

function EmptyState({ onSaveFirst }: { onSaveFirst?: () => void }) {
  return (
    <div className="session-list-empty">
      <div className="empty-illustration"><FolderOpen size={48} /></div>
      <h3 className="text-body" style={{ fontWeight: 500 }}>
        No saved sessions
      </h3>
      <p className="text-body-sm text-muted">
        Save your first session to start organizing your tabs
      </p>
      {onSaveFirst && (
        <button className="btn btn-primary" onClick={onSaveFirst}>
          Save Current Session
        </button>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="session-list-loading">
      <div className="loading-spinner"><LoaderCircle size={24} className="animate-spin" /></div>
      <p className="text-body-sm text-muted">Loading sessions...</p>
    </div>
  );
}

export function SessionList({
  sessions,
  isLoading = false,
  onRestore,
  onEdit,
  onDelete,
  onSaveFirst,
}: SessionListProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (sessions.length === 0) {
    return <EmptyState onSaveFirst={onSaveFirst} />;
  }

  return (
    <div className="session-list">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          onRestore={onRestore}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
