import { useState } from 'react';
import { ToastContainer, useToast } from './components/Toast';
import { captureAllTabs } from '../session-management';
import { createSession, initializeDatabase } from '../storage';
import { isOk } from '../storage/result';
import type { StoredWindowSnapshot } from '../storage';

export function App() {
  const [sessionName, setSessionName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toasts, dismissToast, showSessionSaved, showError } = useToast();

  const handleSaveSession = async () => {
    if (!sessionName.trim()) {
      showError('Nome obrigatório', 'Digite um nome para a sessão');
      return;
    }

    setIsSaving(true);

    try {
      // Initialize database
      await initializeDatabase();

      // Capture all tabs
      const captureResult = await captureAllTabs();

      if (!isOk(captureResult)) {
        showError('Erro ao capturar', captureResult.error.getUserMessage());
        return;
      }

      // Convert to storage format (remove runtime fields)
      const windows: StoredWindowSnapshot[] = captureResult.value.windows.map((w) => ({
        windowId: w.windowId,
        tabs: w.tabs.map((t) => ({
          url: t.url,
          title: t.title,
          favIconUrl: t.favIconUrl,
          index: t.index,
          pinned: t.pinned,
        })),
      }));

      // Save session
      const saveResult = await createSession({
        name: sessionName.trim(),
        description: description.trim() || undefined,
        windows,
      });

      if (!isOk(saveResult)) {
        showError('Erro ao salvar', saveResult.error.getUserMessage());
        return;
      }

      // Show success feedback with session name and counters
      showSessionSaved(
        saveResult.value.name,
        saveResult.value.totalTabs,
        saveResult.value.totalWindows
      );

      // Clear form
      setSessionName('');
      setDescription('');
    } catch (error) {
      showError('Erro inesperado', 'Tente novamente');
      console.error('Save session error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container flex flex-col gap-md">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-heading">SessionKeeper</h1>
      </header>

      {/* Save Session Form */}
      <section className="card flex flex-col gap-md">
        <h2 className="text-body" style={{ fontWeight: 500 }}>
          Salvar Sessão Atual
        </h2>

        <div className="flex flex-col gap-sm">
          <input
            type="text"
            className="input"
            placeholder="Nome da sessão *"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            maxLength={100}
            disabled={isSaving}
          />

          <textarea
            className="input"
            placeholder="Descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={2}
            style={{ resize: 'none' }}
            disabled={isSaving}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSaveSession}
          disabled={isSaving || !sessionName.trim()}
        >
          {isSaving ? 'Salvando...' : 'Salvar Sessão'}
        </button>
      </section>

      {/* Placeholder for session list */}
      <section className="card">
        <p className="text-body-sm text-muted" style={{ textAlign: 'center' }}>
          Suas sessões salvas aparecerão aqui
        </p>
      </section>
    </div>
  );
}
