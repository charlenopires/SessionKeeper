/**
 * Types for the Session Management domain
 * Handles tab capture and session creation
 */

/**
 * Captured tab data from the browser
 * Contains all relevant information from chrome.tabs API
 */
export interface CapturedTab {
  readonly url: string;
  readonly title: string;
  readonly favIconUrl: string | undefined;
  readonly index: number;
  readonly pinned: boolean;
  readonly windowId: number;
  readonly createdAt: Date;
}

/**
 * Grouped tabs by window
 */
export interface WindowSnapshot {
  readonly windowId: number;
  readonly tabs: readonly CapturedTab[];
}

/**
 * Result of a tab capture operation
 */
export interface CaptureResult {
  readonly windows: readonly WindowSnapshot[];
  readonly totalTabs: number;
  readonly capturedAt: Date;
}

/**
 * Tab data for storage (without runtime-only fields)
 */
export interface StoredTab {
  readonly url: string;
  readonly title: string;
  readonly favIconUrl: string | undefined;
  readonly index: number;
  readonly pinned: boolean;
}

/**
 * Window snapshot for storage
 */
export interface StoredWindowSnapshot {
  readonly windowId: number;
  readonly tabs: readonly StoredTab[];
}

/**
 * Session entity for storage
 * Contains all data needed to restore a browser session
 */
export interface Session {
  readonly id: string;
  readonly name: string;
  readonly description: string | undefined;
  readonly windows: readonly StoredWindowSnapshot[];
  readonly tags: readonly string[];
  readonly totalTabs: number;
  readonly totalWindows: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Input for creating a new session
 */
export interface CreateSessionInput {
  readonly name: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly windows: readonly StoredWindowSnapshot[];
}

/**
 * Input for updating an existing session
 */
export interface UpdateSessionInput {
  readonly name?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
}
