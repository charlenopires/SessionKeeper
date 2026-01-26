import type { StoredWindowSnapshot, StoredTab } from './types';
import { Result, Ok, Err } from '../storage/result';
import { SessionManagementError } from './errors';
import { validateUrl } from './url-validation';

/**
 * Default timeout for tab creation (30 seconds)
 */
const TAB_CREATION_TIMEOUT_MS = 30000;

/**
 * Checks if Chrome APIs are available
 * Returns an error if they're not
 */
function checkChromeApiAvailable(): SessionRestoreError | null {
  if (typeof chrome === 'undefined') {
    return new SessionRestoreError(
      'Chrome API not available',
      undefined,
      'Chrome API is not available. This feature requires a Chrome extension environment.'
    );
  }

  if (!chrome.windows || typeof chrome.windows.create !== 'function') {
    return new SessionRestoreError(
      'chrome.windows API not available',
      undefined,
      'Chrome windows API is not available. Check extension permissions.'
    );
  }

  if (!chrome.tabs || typeof chrome.tabs.create !== 'function') {
    return new SessionRestoreError(
      'chrome.tabs API not available',
      undefined,
      'Chrome tabs API is not available. Check extension permissions.'
    );
  }

  return null;
}

/**
 * Wraps a promise with a timeout
 * Rejects with TimeoutError if the promise doesn't resolve within the specified time
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout: ${operation} exceeded ${timeoutMs / 1000}s`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Error during session restoration
 */
export class SessionRestoreError extends SessionManagementError {
  constructor(message: string, cause?: unknown, userMessage?: string) {
    super(message, cause, userMessage || 'Failed to restore session. Please try again.');
    this.name = 'SessionRestoreError';
  }
}

/**
 * Progress callback for restoration
 */
export interface RestoreProgress {
  readonly currentTab: number;
  readonly totalTabs: number;
  readonly currentWindow: number;
  readonly totalWindows: number;
  readonly percent: number;
}

export type ProgressCallback = (progress: RestoreProgress) => void;

/**
 * Options for session restoration
 */
export interface RestoreOptions {
  onProgress?: ProgressCallback;
}

/**
 * Information about a skipped tab
 */
export interface SkippedTab {
  readonly tab: StoredTab;
  readonly windowId: number;
  readonly reason: string;
}

/**
 * Result of a successful restoration
 */
export interface RestoreResult {
  readonly windowIds: readonly number[];
  readonly tabsRestored: number;
  readonly windowsRestored: number;
  readonly skippedTabs: readonly SkippedTab[];
}

/**
 * Restores a session to new browser windows
 * Creates one window per WindowSnapshot and populates with tabs
 * Skips invalid URLs and reports them in the result
 */
export async function restoreToNewWindows(
  windows: readonly StoredWindowSnapshot[],
  options: RestoreOptions = {}
): Promise<Result<RestoreResult, SessionRestoreError>> {
  // Check Chrome API availability
  const apiError = checkChromeApiAvailable();
  if (apiError) {
    return Err(apiError);
  }

  const { onProgress } = options;

  if (windows.length === 0) {
    return Err(new SessionRestoreError('No windows to restore'));
  }

  const totalTabs = windows.reduce((sum, w) => sum + w.tabs.length, 0);
  const totalWindows = windows.length;

  if (totalTabs === 0) {
    return Err(new SessionRestoreError('No tabs to restore'));
  }

  try {
    const createdWindowIds: number[] = [];
    const skippedTabs: SkippedTab[] = [];
    let tabsRestored = 0;
    let tabsProcessed = 0;

    for (let windowIndex = 0; windowIndex < windows.length; windowIndex++) {
      const windowSnapshot = windows[windowIndex];
      const tabs = windowSnapshot.tabs;

      if (tabs.length === 0) continue;

      // Find first valid tab for window creation
      let firstValidTab: StoredTab | null = null;
      let firstValidTabIndex = 0;

      for (let i = 0; i < tabs.length; i++) {
        const validation = validateUrl(tabs[i].url);
        if (validation.isValid) {
          firstValidTab = tabs[i];
          firstValidTabIndex = i;
          break;
        } else {
          skippedTabs.push({
            tab: tabs[i],
            windowId: windowSnapshot.windowId,
            reason: validation.reason || 'Invalid URL',
          });
          tabsProcessed++;
          onProgress?.({
            currentTab: tabsProcessed,
            totalTabs,
            currentWindow: windowIndex + 1,
            totalWindows,
            percent: Math.round((tabsProcessed / totalTabs) * 100),
          });
        }
      }

      // Skip window if no valid tabs
      if (!firstValidTab) continue;

      // Create window with first valid tab
      const newWindow = await withTimeout(
        chrome.windows.create({
          url: firstValidTab.url,
          focused: windowIndex === 0, // Focus only the first window
        }),
        TAB_CREATION_TIMEOUT_MS,
        'window creation'
      );

      if (!newWindow.id) {
        return Err(new SessionRestoreError('Failed to create window'));
      }

      createdWindowIds.push(newWindow.id);
      tabsRestored++;
      tabsProcessed++;

      // Report progress for first tab
      onProgress?.({
        currentTab: tabsProcessed,
        totalTabs,
        currentWindow: windowIndex + 1,
        totalWindows,
        percent: Math.round((tabsProcessed / totalTabs) * 100),
      });

      // Handle pinned state for first tab if needed
      if (firstValidTab.pinned && newWindow.tabs?.[0]?.id) {
        await chrome.tabs.update(newWindow.tabs[0].id, { pinned: true });
      }

      // Create remaining tabs in order (skip already processed ones)
      let tabIndex = 1;
      for (let i = firstValidTabIndex + 1; i < tabs.length; i++) {
        const tab = tabs[i];
        const validation = validateUrl(tab.url);

        if (!validation.isValid) {
          skippedTabs.push({
            tab,
            windowId: windowSnapshot.windowId,
            reason: validation.reason || 'Invalid URL',
          });
          tabsProcessed++;
          onProgress?.({
            currentTab: tabsProcessed,
            totalTabs,
            currentWindow: windowIndex + 1,
            totalWindows,
            percent: Math.round((tabsProcessed / totalTabs) * 100),
          });
          continue;
        }

        try {
          await withTimeout(
            chrome.tabs.create({
              windowId: newWindow.id,
              url: tab.url,
              index: tabIndex,
              pinned: tab.pinned,
              active: false,
            }),
            TAB_CREATION_TIMEOUT_MS,
            'tab creation'
          );

          tabIndex++;
          tabsRestored++;
        } catch (tabError) {
          skippedTabs.push({
            tab,
            windowId: windowSnapshot.windowId,
            reason: `Failed to create tab: ${tabError instanceof Error ? tabError.message : 'Unknown error'}`,
          });
        }

        tabsProcessed++;

        onProgress?.({
          currentTab: tabsProcessed,
          totalTabs,
          currentWindow: windowIndex + 1,
          totalWindows,
          percent: Math.round((tabsProcessed / totalTabs) * 100),
        });
      }
    }

    return Ok({
      windowIds: createdWindowIds,
      tabsRestored,
      windowsRestored: createdWindowIds.length,
      skippedTabs,
    });
  } catch (error) {
    return Err(
      new SessionRestoreError(
        'Failed to restore session',
        error
      )
    );
  }
}

/**
 * Restores tabs to the current window
 * First WindowSnapshot opens in the current window
 * Additional WindowSnapshots open in new windows
 * Skips invalid URLs and reports them in the result
 */
export async function restoreToCurrentWindow(
  windows: readonly StoredWindowSnapshot[],
  options: RestoreOptions = {}
): Promise<Result<RestoreResult, SessionRestoreError>> {
  // Check Chrome API availability
  const apiError = checkChromeApiAvailable();
  if (apiError) {
    return Err(apiError);
  }

  const { onProgress } = options;

  if (windows.length === 0) {
    return Err(new SessionRestoreError('No windows to restore'));
  }

  const totalTabs = windows.reduce((sum, w) => sum + w.tabs.length, 0);
  const totalWindows = windows.length;

  if (totalTabs === 0) {
    return Err(new SessionRestoreError('No tabs to restore'));
  }

  try {
    // Get current window
    const currentWindow = await chrome.windows.getCurrent();

    if (!currentWindow.id) {
      return Err(new SessionRestoreError('Could not get current window'));
    }

    const createdWindowIds: number[] = [currentWindow.id];
    const skippedTabs: SkippedTab[] = [];
    let tabsRestored = 0;
    let tabsProcessed = 0;

    // First WindowSnapshot: restore to current window
    const firstWindowSnapshot = windows[0];
    for (const tab of firstWindowSnapshot.tabs) {
      const validation = validateUrl(tab.url);

      if (!validation.isValid) {
        skippedTabs.push({
          tab,
          windowId: firstWindowSnapshot.windowId,
          reason: validation.reason || 'Invalid URL',
        });
        tabsProcessed++;
        onProgress?.({
          currentTab: tabsProcessed,
          totalTabs,
          currentWindow: 1,
          totalWindows,
          percent: Math.round((tabsProcessed / totalTabs) * 100),
        });
        continue;
      }

      try {
        await withTimeout(
          chrome.tabs.create({
            windowId: currentWindow.id,
            url: tab.url,
            pinned: tab.pinned,
            active: false,
          }),
          TAB_CREATION_TIMEOUT_MS,
          'tab creation'
        );

        tabsRestored++;
      } catch (tabError) {
        skippedTabs.push({
          tab,
          windowId: firstWindowSnapshot.windowId,
          reason: `Failed to create tab: ${tabError instanceof Error ? tabError.message : 'Unknown error'}`,
        });
      }

      tabsProcessed++;

      onProgress?.({
        currentTab: tabsProcessed,
        totalTabs,
        currentWindow: 1,
        totalWindows,
        percent: Math.round((tabsProcessed / totalTabs) * 100),
      });
    }

    // Remaining WindowSnapshots: open in new windows
    for (let windowIndex = 1; windowIndex < windows.length; windowIndex++) {
      const windowSnapshot = windows[windowIndex];
      const tabs = windowSnapshot.tabs;

      if (tabs.length === 0) continue;

      // Find first valid tab for window creation
      let firstValidTab: StoredTab | null = null;
      let firstValidTabIndex = 0;

      for (let i = 0; i < tabs.length; i++) {
        const validation = validateUrl(tabs[i].url);
        if (validation.isValid) {
          firstValidTab = tabs[i];
          firstValidTabIndex = i;
          break;
        } else {
          skippedTabs.push({
            tab: tabs[i],
            windowId: windowSnapshot.windowId,
            reason: validation.reason || 'Invalid URL',
          });
          tabsProcessed++;
          onProgress?.({
            currentTab: tabsProcessed,
            totalTabs,
            currentWindow: windowIndex + 1,
            totalWindows,
            percent: Math.round((tabsProcessed / totalTabs) * 100),
          });
        }
      }

      // Skip window if no valid tabs
      if (!firstValidTab) continue;

      // Create window with first valid tab
      const newWindow = await withTimeout(
        chrome.windows.create({
          url: firstValidTab.url,
          focused: false,
        }),
        TAB_CREATION_TIMEOUT_MS,
        'window creation'
      );

      if (!newWindow.id) {
        return Err(new SessionRestoreError('Failed to create window'));
      }

      createdWindowIds.push(newWindow.id);
      tabsRestored++;
      tabsProcessed++;

      onProgress?.({
        currentTab: tabsProcessed,
        totalTabs,
        currentWindow: windowIndex + 1,
        totalWindows,
        percent: Math.round((tabsProcessed / totalTabs) * 100),
      });

      // Handle pinned state for first tab if needed
      if (firstValidTab.pinned && newWindow.tabs?.[0]?.id) {
        await chrome.tabs.update(newWindow.tabs[0].id, { pinned: true });
      }

      // Create remaining tabs in order (skip already processed ones)
      let tabIndex = 1;
      for (let i = firstValidTabIndex + 1; i < tabs.length; i++) {
        const tab = tabs[i];
        const validation = validateUrl(tab.url);

        if (!validation.isValid) {
          skippedTabs.push({
            tab,
            windowId: windowSnapshot.windowId,
            reason: validation.reason || 'Invalid URL',
          });
          tabsProcessed++;
          onProgress?.({
            currentTab: tabsProcessed,
            totalTabs,
            currentWindow: windowIndex + 1,
            totalWindows,
            percent: Math.round((tabsProcessed / totalTabs) * 100),
          });
          continue;
        }

        try {
          await withTimeout(
            chrome.tabs.create({
              windowId: newWindow.id,
              url: tab.url,
              index: tabIndex,
              pinned: tab.pinned,
              active: false,
            }),
            TAB_CREATION_TIMEOUT_MS,
            'tab creation'
          );

          tabIndex++;
          tabsRestored++;
        } catch (tabError) {
          skippedTabs.push({
            tab,
            windowId: windowSnapshot.windowId,
            reason: `Failed to create tab: ${tabError instanceof Error ? tabError.message : 'Unknown error'}`,
          });
        }

        tabsProcessed++;

        onProgress?.({
          currentTab: tabsProcessed,
          totalTabs,
          currentWindow: windowIndex + 1,
          totalWindows,
          percent: Math.round((tabsProcessed / totalTabs) * 100),
        });
      }
    }

    return Ok({
      windowIds: createdWindowIds,
      tabsRestored,
      windowsRestored: createdWindowIds.length,
      skippedTabs,
    });
  } catch (error) {
    return Err(
      new SessionRestoreError(
        'Failed to restore session to current window',
        error
      )
    );
  }
}
