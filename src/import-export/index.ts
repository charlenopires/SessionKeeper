/**
 * Import/Export Domain
 * Handles exporting and importing session data
 */

// Types
export {
  EXPORT_VERSION,
  sessionToExported,
  tagToExported,
  exportedToSession,
  exportedToTag,
} from './types';
export type {
  ExportData,
  ExportedSession,
  ExportedTag,
  ExportResult,
  ImportStrategy,
  ImportResult,
  ImportError,
} from './types';

// Export functions
export {
  ExportError,
  generateExportData,
  formatExportJson,
  generateExportFilename,
  downloadFile,
  exportSessions,
} from './export';

// Import functions
export {
  ImportValidationError,
  validateExportData,
  parseAndValidateJson,
  readFileAsText,
  openFilePicker,
  importFromData,
  importSessions,
} from './import';
export type { ValidationResult } from './import';
