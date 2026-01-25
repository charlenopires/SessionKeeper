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
        title="Salvar todas as abas abertas como uma nova sessão"
        aria-label="Salvar Sessão Atual"
      >
        {isSaving ? (
          <>
            <span className="btn-spinner">⏳</span>
            Salvando...
          </>
        ) : (
          <>
            <span className="btn-icon-left">💾</span>
            Salvar Sessão Atual
          </>
        )}
      </button>

      {/* Secondary actions */}
      <div className="quick-actions-secondary">
        <button
          className="btn btn-secondary flex-1"
          onClick={onExport}
          disabled={!canExport || isAnyLoading}
          title={canExport ? "Exportar todas as sessões para um arquivo JSON" : "Nenhuma sessão para exportar"}
          aria-label="Exportar sessões"
        >
          {isExporting ? (
            <>
              <span className="btn-spinner">⏳</span>
              Exportando...
            </>
          ) : (
            <>
              <span className="btn-icon-left">📥</span>
              Exportar
            </>
          )}
        </button>

        <button
          className="btn btn-secondary flex-1"
          onClick={onImport}
          disabled={isAnyLoading}
          title="Importar sessões de um arquivo JSON"
          aria-label="Importar sessões"
        >
          {isImporting ? (
            <>
              <span className="btn-spinner">⏳</span>
              Importando...
            </>
          ) : (
            <>
              <span className="btn-icon-left">📤</span>
              Importar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
