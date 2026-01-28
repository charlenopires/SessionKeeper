import { Save, Download, Upload, LoaderCircle } from 'lucide-react';

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
            <LoaderCircle size={16} className="btn-spinner animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save size={16} className="btn-icon-left" />
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
              <LoaderCircle size={16} className="btn-spinner animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download size={16} className="btn-icon-left" />
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
              <LoaderCircle size={16} className="btn-spinner animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload size={16} className="btn-icon-left" />
              Import
            </>
          )}
        </button>
      </div>
    </div>
  );
}
