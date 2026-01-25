import type { StoredWindowSnapshot, StoredTab } from './types';
import { Result, Ok, Err } from '../storage/result';
import { SessionManagementError } from './errors';

/**
 * Error during duplicate detection
 */
export class DuplicateDetectionError extends SessionManagementError {
  constructor(message: string, cause?: unknown) {
    super(message, cause, 'Falha ao verificar duplicatas. Tente novamente.');
    this.name = 'DuplicateDetectionError';
  }
}

/**
 * Strategy for handling duplicate tabs
 */
export type DuplicateStrategy = 'skip' | 'allow';

/**
 * A tab marked as duplicate or not
 */
export interface TabWithDuplicateStatus {
  readonly tab: StoredTab;
  readonly windowId: number;
  readonly isDuplicate: boolean;
}

/**
 * Result of duplicate detection
 */
export interface DuplicateDetectionResult {
  readonly tabs: readonly TabWithDuplicateStatus[];
  readonly duplicateCount: number;
  readonly totalCount: number;
  readonly duplicateUrls: ReadonlySet<string>;
}

/**
 * Gets all currently open URLs in the browser
 */
export async function getOpenUrls(): Promise<Result<Set<string>, DuplicateDetectionError>> {
  try {
    const tabs = await chrome.tabs.query({});
    const urls = new Set<string>();

    for (const tab of tabs) {
      if (tab.url) {
        urls.add(tab.url);
      }
    }

    return Ok(urls);
  } catch (error) {
    return Err(
      new DuplicateDetectionError(
        'Failed to get open tabs',
        error
      )
    );
  }
}

/**
 * Detects duplicate URLs between a session and currently open tabs
 * Duplicates are identified by exact URL match (including query params)
 */
export async function detectDuplicates(
  windows: readonly StoredWindowSnapshot[]
): Promise<Result<DuplicateDetectionResult, DuplicateDetectionError>> {
  const openUrlsResult = await getOpenUrls();

  if (!openUrlsResult.ok) {
    return Err(openUrlsResult.error);
  }

  const openUrls = openUrlsResult.value;

  return detectDuplicatesWithUrls(windows, openUrls);
}

/**
 * Detects duplicates given a set of already open URLs
 * Useful for testing and when open URLs are already known
 */
export function detectDuplicatesWithUrls(
  windows: readonly StoredWindowSnapshot[],
  openUrls: ReadonlySet<string>
): Result<DuplicateDetectionResult, DuplicateDetectionError> {
  try {
    const tabs: TabWithDuplicateStatus[] = [];
    const duplicateUrls = new Set<string>();
    let duplicateCount = 0;

    for (const window of windows) {
      for (const tab of window.tabs) {
        const isDuplicate = openUrls.has(tab.url);

        if (isDuplicate) {
          duplicateCount++;
          duplicateUrls.add(tab.url);
        }

        tabs.push({
          tab,
          windowId: window.windowId,
          isDuplicate,
        });
      }
    }

    return Ok({
      tabs,
      duplicateCount,
      totalCount: tabs.length,
      duplicateUrls,
    });
  } catch (error) {
    return Err(
      new DuplicateDetectionError(
        'Failed to detect duplicates',
        error
      )
    );
  }
}

/**
 * Filters out duplicate tabs based on strategy
 */
export function filterByStrategy(
  windows: readonly StoredWindowSnapshot[],
  duplicateUrls: ReadonlySet<string>,
  strategy: DuplicateStrategy
): StoredWindowSnapshot[] {
  if (strategy === 'allow') {
    // Return all windows/tabs as-is
    return windows.map(w => ({ ...w }));
  }

  // Skip strategy: filter out duplicate URLs
  return windows
    .map(window => ({
      windowId: window.windowId,
      tabs: window.tabs.filter(tab => !duplicateUrls.has(tab.url)),
    }))
    .filter(window => window.tabs.length > 0);
}
