import { getAllSessions, getAllTags, Result, Ok, Err, isOk } from '../storage';
import {
  EXPORT_VERSION,
  sessionToExported,
  tagToExported,
  type ExportData,
  type ExportResult,
} from './types';

/**
 * Error during export operation
 */
export class ExportError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly userMessage?: string
  ) {
    super(message);
    this.name = 'ExportError';
  }

  getUserMessage(): string {
    return this.userMessage || 'Failed to export sessions. Please try again.';
  }
}

/**
 * Generates export data from all sessions and tags
 * Returns ExportData with version, timestamp, sessions, and tags
 */
export async function generateExportData(): Promise<Result<ExportResult, ExportError>> {
  try {
    // Fetch all sessions
    const sessionsResult = await getAllSessions();
    if (!isOk(sessionsResult)) {
      return Err(new ExportError(
        'Failed to fetch sessions',
        sessionsResult.error,
        'Unable to load sessions for export.'
      ));
    }

    // Fetch all tags
    const tagsResult = await getAllTags();
    if (!isOk(tagsResult)) {
      return Err(new ExportError(
        'Failed to fetch tags',
        tagsResult.error,
        'Unable to load tags for export.'
      ));
    }

    const sessions = sessionsResult.value;
    const tags = tagsResult.value;

    // Convert to exported format
    const exportedSessions = sessions.map(sessionToExported);
    const exportedTags = tags.map(tagToExported);

    // Calculate total tabs
    const totalTabs = sessions.reduce((sum, s) => sum + s.totalTabs, 0);

    const exportData: ExportData = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      sessions: exportedSessions,
      tags: exportedTags,
    };

    return Ok({
      data: exportData,
      sessionCount: sessions.length,
      tagCount: tags.length,
      totalTabs,
    });
  } catch (error) {
    return Err(new ExportError(
      'Unexpected error during export',
      error,
      'Unexpected error during export. Please try again.'
    ));
  }
}

/**
 * Converts ExportData to formatted JSON string
 * Uses 2-space indentation for readability
 */
export function formatExportJson(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Generates the export filename with current date
 * Format: session-keeper-export-YYYY-MM-DD.json
 */
export function generateExportFilename(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `session-keeper-export-${year}-${month}-${day}.json`;
}

/**
 * Triggers a file download in the browser
 * Creates a temporary link and clicks it to download the file
 */
export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Complete export flow: generates data, formats JSON, and triggers download
 * Returns export statistics for feedback
 */
export async function exportSessions(): Promise<Result<ExportResult, ExportError>> {
  const result = await generateExportData();

  if (!isOk(result)) {
    return result;
  }

  const { data, sessionCount, tagCount, totalTabs } = result.value;

  // Format and download
  const json = formatExportJson(data);
  const filename = generateExportFilename();
  downloadFile(json, filename);

  return Ok({ data, sessionCount, tagCount, totalTabs });
}
