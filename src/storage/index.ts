export { initializeDatabase, getDatabase, closeDatabase } from './db';
export type { Session, Tag, Settings, StoredTab, StoredWindowSnapshot } from './db';
export {
  DatabaseError,
  DatabaseInitializationError,
  DatabaseNotInitializedError,
  DatabaseVersionError,
  QuotaExceededError,
  isDatabaseError,
  isQuotaExceededError,
  getErrorMessage,
} from './errors';
export {
  createSession,
  getSession,
  getAllSessions,
  updateSession,
  deleteSession,
  withTransaction,
  bulkCreateSessions,
  bulkDeleteSessions,
  bulkUpdateSessions,
  removeTab,
  updateTab,
  ValidationError,
} from './session-operations';
export type {
  StorageError,
  CreateSessionInput,
  UpdateSessionInput,
  RemoveTabInput,
  UpdateTabInput,
} from './session-operations';
export {
  createTag,
  getTag,
  getAllTags,
  updateTag,
  deleteTag,
  bulkCreateTags,
  bulkDeleteTags,
} from './tag-operations';
export type {
  CreateTagInput,
  UpdateTagInput,
} from './tag-operations';
export {
  searchSessionsByName,
  filterSessionsByTags,
  getSessionsByDateRange,
  countSessions,
  getStorageStats,
  advancedSearch,
  getRecentlyUpdatedSessions,
} from './queries';
export type { StorageStats } from './queries';
export { Ok, Err, isOk, isErr, unwrap, unwrapOr, map, mapErr, flatMap, fromPromise } from './result';
export type { Result } from './result';
