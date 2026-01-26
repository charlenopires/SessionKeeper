interface QuickActionsBarProps {
  readonly onSaveSession: () => void;
  readonly onExport: () => void;
  readonly onImport: () => void;
  readonly isSaving?: boolean;
  readonly isExporting?: boolean;
  readonly isImporting?: boolean;
  readonly canExport?: boolean;
  readonly canSave?: boolean;
}

export function QuickActionsBar({
  onSaveSession,
  onExport,
  onImport,
  isSaving = false,
  isExporting = false,
  isImporting = false,
  canExport = true,
  canSave = true,
}: QuickActionsBarProps) {
  const isAnyLoading = isSaving || isExporting || isImporting;

  return (
    <div className="quick-actions-bar">
      {/* Primary action - Save Session */}
      <button
        className="btn btn-primary quick-action-primary"
        onClick={onSaveSession}
        disabled={!canSave || isAnyLoading}
        title="Save all open tabs as a new session"
        aria-label="Save Current Session"
      >
        {isSaving ? (
          <>
            <span className="btn-spinner">⏳</span>
            Saving...
          </>
        ) : (
          <>
            <span className="btn-icon-left">💾</span>
            Save Current Session
          </>
        )}
      </button>

      {/* Secondary actions */}
      <div className="quick-actions-secondary">
        <button
          className="btn btn-secondary flex-1"
          onClick={onExport}
          disabled={!canExport || isAnyLoading}
          title={canExport ? "Export all sessions to a JSON file" : "No sessions to export"}
          aria-label="Export sessions"
        >
          {isExporting ? (
            <>
              <span className="btn-spinner">⏳</span>
              Exporting...
            </>
          ) : (
            <>
              <span className="btn-icon-left">📥</span>
              Export
            </>
          )}
        </button>

        <button
          className="btn btn-secondary flex-1"
          onClick={onImport}
          disabled={isAnyLoading}
          title="Import sessions from a JSON file"
          aria-label="Import sessions"
        >
          {isImporting ? (
            <>
              <span className="btn-spinner">⏳</span>
              Importing...
            </>
          ) : (
            <>
              <span className="btn-icon-left">📤</span>
              Import
            </>
          )}
        </button>
      </div>
    </div>
  );
}
