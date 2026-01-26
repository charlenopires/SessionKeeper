import { useState, useMemo, useCallback, useEffect } from 'react';
import { ToastContainer, useToast } from './components/Toast';
import { SessionList } from './components/SessionList';
import { QuickActionsBar } from './components/QuickActionsBar';
import { SaveSessionModal, type SaveSessionData } from './components/SaveSessionModal';
import { EditSessionModal, type EditSessionData } from './components/EditSessionModal';
import { RestoreOptionsModal, type RestoreTarget } from './components/RestoreOptionsModal';
import { TagManagementPanel, type TagWithCount } from './components/TagManagementPanel';
import { SearchFilterBar, SearchEmptyState } from './components/SearchFilterBar';
import { DeleteSessionModal } from './components/ConfirmModal';
import { useSessions } from './hooks';
import {
  captureAllTabs,
  detectDuplicates,
  filterByStrategy,
  restoreToNewWindows,
  restoreToCurrentWindow,
  type WindowSnapshot,
  type RestoreProgress,
  type DuplicateDetectionResult,
} from '../session-management';
import { createSession, createTag, getAllTags, initializeDatabase, updateTag, deleteTag, deleteSession } from '../storage';
import { getDatabase } from '../storage/db';
import { exportSessions, importSessions } from '../import-export';
import { isOk } from '../storage/result';
import type { StoredWindowSnapshot, Session, Tag } from '../storage';

export function App() {
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isTagPanelOpen, setIsTagPanelOpen] = useState(false);
  const [tagsWithCounts, setTagsWithCounts] = useState<TagWithCount[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [capturedWindows, setCapturedWindows] = useState<WindowSnapshot[]>([]);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [restoringSession, setRestoringSession] = useState<Session | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateDetectionResult | null>(null);
  const [restoreProgress, setRestoreProgress] = useState<RestoreProgress | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingSession, setDeletingSession] = useState<Session | null>(null);
  const { toasts, dismissToast, showSessionSaved, showError, showSuccess } = useToast();
  const { sessions, isLoading, refresh } = useSessions();

  // Filter sessions based on search term and selected tags
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Filter by search term (case-insensitive)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(session =>
        session.name.toLowerCase().includes(term)
      );
    }

    // Filter by tags (OR logic - session must have at least one selected tag)
    if (selectedFilterTags.length > 0) {
      result = result.filter(session =>
        session.tags.some(tag => selectedFilterTags.includes(tag))
      );
    }

    return result;
  }, [sessions, searchTerm, selectedFilterTags]);

  const hasActiveFilters = searchTerm.length > 0 || selectedFilterTags.length > 0;

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleTagsFilterChange = useCallback((tags: string[]) => {
    setSelectedFilterTags(tags);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedFilterTags([]);
  }, []);

  const loadTags = async () => {
    try {
      await initializeDatabase();
      const result = await getAllTags();
      if (isOk(result)) {
        setTags(result.value);
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  // Load tags on mount for search filter
  useEffect(() => {
    loadTags();
  }, []);

  const handleOpenSaveModal = async () => {
    try {
      await initializeDatabase();

      // Capture all tabs
      const captureResult = await captureAllTabs();

      if (!isOk(captureResult)) {
        showError('Capture error', captureResult.error.getUserMessage());
        return;
      }

      // Load existing tags
      await loadTags();

      setCapturedWindows([...captureResult.value.windows]);
      setIsSaveModalOpen(true);
    } catch (error) {
      showError('Unexpected error', 'Please try again');
      console.error('Capture error:', error);
    }
  };

  const handleSaveSession = async (data: SaveSessionData) => {
    setIsSaving(true);

    try {
      // Convert to storage format (remove runtime fields)
      const windows: StoredWindowSnapshot[] = capturedWindows.map((w) => ({
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
        name: data.name,
        description: data.description,
        windows,
        tags: [...data.tags],
      });

      if (!isOk(saveResult)) {
        showError('Save error', saveResult.error.getUserMessage());
        return;
      }

      // Show success feedback with session name and counters
      showSessionSaved(
        saveResult.value.name,
        saveResult.value.totalTabs,
        saveResult.value.totalWindows
      );

      // Close modal and refresh list
      setIsSaveModalOpen(false);
      await refresh();
    } catch (error) {
      showError('Unexpected error', 'Please try again');
      console.error('Save session error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateTag = async (name: string): Promise<Tag | null> => {
    try {
      const result = await createTag({ name });
      if (isOk(result)) {
        setTags(prev => [...prev, result.value]);
        return result.value;
      }
      return null;
    } catch (error) {
      console.error('Failed to create tag:', error);
      return null;
    }
  };

  const loadTagsWithCounts = async () => {
    setIsLoadingTags(true);
    try {
      await initializeDatabase();
      const tagsResult = await getAllTags();
      if (isOk(tagsResult)) {
        const db = getDatabase();
        const allSessions = await db.sessions.toArray();

        const tagsWithSessionCounts: TagWithCount[] = tagsResult.value.map(tag => ({
          ...tag,
          sessionCount: allSessions.filter(s => s.tags.includes(tag.name)).length,
        }));

        setTagsWithCounts(tagsWithSessionCounts);
        setTags(tagsResult.value);
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setIsLoadingTags(false);
    }
  };

  const handleOpenTagPanel = async () => {
    await loadTagsWithCounts();
    setIsTagPanelOpen(true);
  };

  const handleCreateTagInPanel = async (name: string, color?: string): Promise<boolean> => {
    try {
      const result = await createTag({ name, color });
      if (isOk(result)) {
        await loadTagsWithCounts();
        showSuccess('Tag created', `"${name}" was created`);
        return true;
      } else {
        showError('Error creating tag', result.error.getUserMessage());
        return false;
      }
    } catch (error) {
      showError('Unexpected error', 'Please try again');
      return false;
    }
  };

  const handleUpdateTagInPanel = async (id: number, name: string, color?: string): Promise<boolean> => {
    try {
      const result = await updateTag({ id, name, color });
      if (isOk(result)) {
        await loadTagsWithCounts();
        showSuccess('Tag updated', `"${name}" was saved`);
        return true;
      } else {
        showError('Error updating tag', result.error.getUserMessage());
        return false;
      }
    } catch (error) {
      showError('Unexpected error', 'Please try again');
      return false;
    }
  };

  const handleDeleteTagInPanel = async (id: number, sessionCount: number): Promise<boolean> => {
    try {
      const result = await deleteTag(id);
      if (isOk(result)) {
        await loadTagsWithCounts();
        await refresh(); // Refresh sessions to update tag references
        showSuccess('Tag deleted', sessionCount > 0 ? `Tag removed from ${sessionCount} sessions` : 'Tag deleted');
        return true;
      } else {
        showError('Error deleting tag', result.error.getUserMessage());
        return false;
      }
    } catch (error) {
      showError('Unexpected error', 'Please try again');
      return false;
    }
  };

  const handleRestore = async (session: Session) => {
    try {
      await initializeDatabase();

      // Detect duplicates
      const duplicateResult = await detectDuplicates(session.windows);
      if (isOk(duplicateResult)) {
        setDuplicates(duplicateResult.value);
      } else {
        setDuplicates(null);
      }

      setRestoringSession(session);
      setRestoreProgress(null);
      setIsRestoreModalOpen(true);
    } catch (error) {
      showError('Unexpected error', 'Please try again');
      console.error('Restore session error:', error);
    }
  };

  const handleRestoreSession = async (target: RestoreTarget, skipDuplicates: boolean) => {
    if (!restoringSession) return;

    setIsRestoring(true);
    setRestoreProgress(null);

    try {
      // Filter duplicates if needed
      let windowsToRestore = restoringSession.windows;
      if (skipDuplicates && duplicates && duplicates.duplicateCount > 0) {
        windowsToRestore = filterByStrategy(
          restoringSession.windows,
          duplicates.duplicateUrls,
          'skip'
        );
      }

      // Restore based on target
      const restoreFunc = target === 'new-window' ? restoreToNewWindows : restoreToCurrentWindow;
      const result = await restoreFunc(windowsToRestore, {
        onProgress: (progress) => setRestoreProgress(progress),
      });

      if (isOk(result)) {
        const { tabsRestored, windowsRestored, skippedTabs } = result.value;

        if (skippedTabs.length > 0) {
          showSuccess(
            'Session restored',
            `${tabsRestored} tabs in ${windowsRestored} windows (${skippedTabs.length} skipped)`
          );
        } else {
          showSuccess(
            'Session restored',
            `${tabsRestored} tabs in ${windowsRestored} windows`
          );
        }

        // Close modal
        setIsRestoreModalOpen(false);
        setRestoringSession(null);
        setDuplicates(null);
        setRestoreProgress(null);
      } else {
        showError('Restore error', result.error.getUserMessage());
      }
    } catch (error) {
      showError('Unexpected error', 'Please try again');
      console.error('Restore session error:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleEdit = async (session: Session) => {
    try {
      await initializeDatabase();
      await loadTags();
      setEditingSession(session);
      setIsEditModalOpen(true);
    } catch (error) {
      showError('Unexpected error', 'Please try again');
      console.error('Edit session error:', error);
    }
  };

  const handleEditSession = async (data: EditSessionData) => {
    setIsSaving(true);

    try {
      const db = getDatabase();

      // Update the session with new windows data
      const updated = {
        ...editingSession!,
        name: data.name,
        description: data.description,
        tags: [...data.tags],
        windows: data.windows,
        totalTabs: data.windows.reduce((sum, w) => sum + w.tabs.length, 0),
        totalWindows: data.windows.length,
        updatedAt: new Date(),
      };

      await db.sessions.put(updated);

      showSuccess('Session updated', `"${data.name}" was saved`);

      // Close modal and refresh list
      setIsEditModalOpen(false);
      setEditingSession(null);
      await refresh();
    } catch (error) {
      showError('Save error', 'Unable to save changes');
      console.error('Edit session error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (session: Session) => {
    setDeletingSession(session);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSession) return;

    try {
      const result = await deleteSession(deletingSession.id);
      if (isOk(result)) {
        showSuccess('Session deleted', `"${deletingSession.name}" was removed`);
        await refresh();
      } else {
        showError('Error deleting', result.error.getUserMessage());
      }
    } catch (error) {
      showError('Unexpected error', 'Please try again');
      console.error('Delete session error:', error);
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingSession(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeletingSession(null);
  };

  const handleQuickSave = () => {
    handleOpenSaveModal();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportSessions();
      if (isOk(result)) {
        showSuccess(
          'Export completed',
          `${result.value.sessionCount} sessions exported`
        );
      } else {
        showError('Error exporting', result.error.getUserMessage());
      }
    } catch (error) {
      showError('Unexpected error', 'Please try again');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const result = await importSessions('merge');
      if (isOk(result)) {
        showSuccess(
          'Import completed',
          `${result.value.sessionsImported} sessions imported`
        );
        await refresh();
      } else {
        showError('Error importing', result.error.getUserMessage());
      }
    } catch (error) {
      showError('Unexpected error', 'Please try again');
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="popup-layout">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Save Session Modal */}
      <SaveSessionModal
        isOpen={isSaveModalOpen}
        windows={capturedWindows}
        existingTags={tags}
        onSave={handleSaveSession}
        onCancel={() => setIsSaveModalOpen(false)}
        onCreateTag={handleCreateTag}
        isSaving={isSaving}
      />

      {/* Edit Session Modal */}
      <EditSessionModal
        isOpen={isEditModalOpen}
        session={editingSession}
        existingTags={tags}
        onSave={handleEditSession}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingSession(null);
        }}
        onCreateTag={handleCreateTag}
        isSaving={isSaving}
      />

      {/* Restore Options Modal */}
      <RestoreOptionsModal
        isOpen={isRestoreModalOpen}
        session={restoringSession}
        duplicates={duplicates}
        onRestore={handleRestoreSession}
        onCancel={() => {
          if (!isRestoring) {
            setIsRestoreModalOpen(false);
            setRestoringSession(null);
            setDuplicates(null);
            setRestoreProgress(null);
          }
        }}
        isRestoring={isRestoring}
        progress={restoreProgress}
      />

      {/* Tag Management Panel */}
      <TagManagementPanel
        isOpen={isTagPanelOpen}
        tags={tagsWithCounts}
        onClose={() => setIsTagPanelOpen(false)}
        onCreateTag={handleCreateTagInPanel}
        onUpdateTag={handleUpdateTagInPanel}
        onDeleteTag={handleDeleteTagInPanel}
        isLoading={isLoadingTags}
      />

      {/* Delete Session Modal */}
      {deletingSession && (
        <DeleteSessionModal
          isOpen={isDeleteModalOpen}
          sessionName={deletingSession.name}
          totalTabs={deletingSession.totalTabs}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}

      {/* Header */}
      <header className="popup-header">
        <div className="flex items-center gap-sm">
          <span className="popup-logo">📑</span>
          <h1 className="text-heading">Session Keeper</h1>
        </div>
        <button
          className="btn btn-icon btn-secondary"
          aria-label="Settings"
          onClick={handleOpenTagPanel}
        >
          ⚙️
        </button>
      </header>

      {/* Search and Filter Bar */}
      {!isLoading && sessions.length > 0 && (
        <SearchFilterBar
          tags={tags}
          totalSessions={sessions.length}
          filteredCount={filteredSessions.length}
          onSearchChange={handleSearchChange}
          onTagsChange={handleTagsFilterChange}
          selectedTags={selectedFilterTags}
          searchTerm={searchTerm}
        />
      )}

      {/* Main Content */}
      <main className="popup-main">
        {/* Search Empty State */}
        {!isLoading && sessions.length > 0 && hasActiveFilters && filteredSessions.length === 0 ? (
          <SearchEmptyState onClear={handleClearFilters} />
        ) : (
          /* Session List */
          <SessionList
            sessions={filteredSessions}
            isLoading={isLoading}
            onRestore={handleRestore}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSaveFirst={handleOpenSaveModal}
          />
        )}
      </main>

      {/* Footer - Quick Actions Bar */}
      <QuickActionsBar
        onSaveSession={handleQuickSave}
        onExport={handleExport}
        onImport={handleImport}
        isSaving={isSaving}
        isExporting={isExporting}
        isImporting={isImporting}
        canExport={sessions.length > 0}
        canSave={true}
      />
    </div>
  );
}
