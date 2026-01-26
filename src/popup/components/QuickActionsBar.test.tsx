import { describe, it, expect, mock, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QuickActionsBar } from './QuickActionsBar';

describe('QuickActionsBar', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render primary save button', () => {
    render(
      <QuickActionsBar
        onSaveSession={() => {}}
        onExport={() => {}}
        onImport={() => {}}
      />
    );

    expect(screen.getByRole('button', { name: /save current session/i })).toBeDefined();
  });

  it('should render export button with icon', () => {
    render(
      <QuickActionsBar
        onSaveSession={() => {}}
        onExport={() => {}}
        onImport={() => {}}
      />
    );

    const exportBtn = screen.getByRole('button', { name: /export/i });
    expect(exportBtn).toBeDefined();
    expect(exportBtn.textContent).toContain('📥');
  });

  it('should render import button with icon', () => {
    render(
      <QuickActionsBar
        onSaveSession={() => {}}
        onExport={() => {}}
        onImport={() => {}}
      />
    );

    const importBtn = screen.getByRole('button', { name: /import/i });
    expect(importBtn).toBeDefined();
    expect(importBtn.textContent).toContain('📤');
  });

  it('should have tooltips on buttons', () => {
    render(
      <QuickActionsBar
        onSaveSession={() => {}}
        onExport={() => {}}
        onImport={() => {}}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /save current session/i });
    const exportBtn = screen.getByRole('button', { name: /export/i });
    const importBtn = screen.getByRole('button', { name: /import/i });

    expect(saveBtn.getAttribute('title')).toBeDefined();
    expect(exportBtn.getAttribute('title')).toBeDefined();
    expect(importBtn.getAttribute('title')).toBeDefined();
  });

  it('should disable export when canExport is false', () => {
    render(
      <QuickActionsBar
        onSaveSession={() => {}}
        onExport={() => {}}
        onImport={() => {}}
        canExport={false}
      />
    );

    const exportBtn = screen.getByRole('button', { name: /export/i });
    expect(exportBtn.hasAttribute('disabled')).toBe(true);
  });

  it('should disable save when canSave is false', () => {
    render(
      <QuickActionsBar
        onSaveSession={() => {}}
        onExport={() => {}}
        onImport={() => {}}
        canSave={false}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /save current session/i });
    expect(saveBtn.hasAttribute('disabled')).toBe(true);
  });

  it('should show loading state when saving', () => {
    render(
      <QuickActionsBar
        onSaveSession={() => {}}
        onExport={() => {}}
        onImport={() => {}}
        isSaving={true}
      />
    );

    expect(screen.getByText(/saving/i)).toBeDefined();
  });

  it('should show loading state when exporting', () => {
    render(
      <QuickActionsBar
        onSaveSession={() => {}}
        onExport={() => {}}
        onImport={() => {}}
        isExporting={true}
      />
    );

    expect(screen.getByText(/exporting/i)).toBeDefined();
  });

  it('should show loading state when importing', () => {
    render(
      <QuickActionsBar
        onSaveSession={() => {}}
        onExport={() => {}}
        onImport={() => {}}
        isImporting={true}
      />
    );

    expect(screen.getByText(/importing/i)).toBeDefined();
  });

  it('should disable all buttons when any is loading', () => {
    render(
      <QuickActionsBar
        onSaveSession={() => {}}
        onExport={() => {}}
        onImport={() => {}}
        isSaving={true}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /save current session/i });
    const exportBtn = screen.getByRole('button', { name: /export/i });
    const importBtn = screen.getByRole('button', { name: /import/i });

    expect(saveBtn.hasAttribute('disabled')).toBe(true);
    expect(exportBtn.hasAttribute('disabled')).toBe(true);
    expect(importBtn.hasAttribute('disabled')).toBe(true);
  });

  it('should call onSaveSession when save button clicked', () => {
    const onSaveSession = mock(() => {});
    render(
      <QuickActionsBar
        onSaveSession={onSaveSession}
        onExport={() => {}}
        onImport={() => {}}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /save current session/i });
    fireEvent.click(saveBtn);

    expect(onSaveSession).toHaveBeenCalled();
  });

  it('should call onExport when export button clicked', () => {
    const onExport = mock(() => {});
    render(
      <QuickActionsBar
        onSaveSession={() => {}}
        onExport={onExport}
        onImport={() => {}}
      />
    );

    const exportBtn = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportBtn);

    expect(onExport).toHaveBeenCalled();
  });

  it('should call onImport when import button clicked', () => {
    const onImport = mock(() => {});
    render(
      <QuickActionsBar
        onSaveSession={() => {}}
        onExport={() => {}}
        onImport={onImport}
      />
    );

    const importBtn = screen.getByRole('button', { name: /import/i });
    fireEvent.click(importBtn);

    expect(onImport).toHaveBeenCalled();
  });

  it('should show tooltip explaining why export is disabled', () => {
    render(
      <QuickActionsBar
        onSaveSession={() => {}}
        onExport={() => {}}
        onImport={() => {}}
        canExport={false}
      />
    );

    const exportBtn = screen.getByRole('button', { name: /export/i });
    expect(exportBtn.getAttribute('title')).toContain('No sessions');
  });
});
