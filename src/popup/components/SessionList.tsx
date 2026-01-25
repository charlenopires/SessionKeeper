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
      <div className="empty-illustration">📂</div>
      <h3 className="text-body" style={{ fontWeight: 500 }}>
        Nenhuma sessão salva
      </h3>
      <p className="text-body-sm text-muted">
        Salve sua primeira sessão para começar a organizar suas abas
      </p>
      {onSaveFirst && (
        <button className="btn btn-primary" onClick={onSaveFirst}>
          Salvar Sessão Atual
        </button>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="session-list-loading">
      <div className="loading-spinner">⏳</div>
      <p className="text-body-sm text-muted">Carregando sessões...</p>
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
