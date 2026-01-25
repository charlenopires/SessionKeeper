/**
 * Session Management Domain
 * Handles tab capture and session creation
 */

// Types
export type {
  CapturedTab,
  WindowSnapshot,
  CaptureResult,
  StoredTab,
  StoredWindowSnapshot,
  Session,
  CreateSessionInput,
  UpdateSessionInput,
} from './types';

// Tab capture functions
export { captureAllTabs, captureCurrentWindowTabs, captureWindowTabs } from './tab-capture';

// Session restore functions
export { restoreToNewWindows, restoreToCurrentWindow, SessionRestoreError } from './session-restore';
export type { RestoreProgress, RestoreOptions, RestoreResult, SkippedTab } from './session-restore';

// Duplicate detection
export {
  detectDuplicates,
  detectDuplicatesWithUrls,
  getOpenUrls,
  filterByStrategy,
  DuplicateDetectionError,
} from './duplicate-detection';
export type {
  DuplicateStrategy,
  TabWithDuplicateStatus,
  DuplicateDetectionResult,
} from './duplicate-detection';

// URL validation
export {
  validateUrl,
  validateWindowTabs,
  filterValidTabs,
} from './url-validation';
export type {
  UrlValidationResult,
  TabValidationStatus,
  WindowsValidationResult,
} from './url-validation';

// Errors
export {
  SessionManagementError,
  TabCaptureError,
  NoTabsFoundError,
  isSessionManagementError,
} from './errors';
