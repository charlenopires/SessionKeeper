/**
 * Tab Capture Service
 * Captures tab data from the browser using chrome.tabs API
 */

import { Result, Ok, Err } from '../storage/result';
import { CapturedTab, WindowSnapshot, CaptureResult } from './types';
import { TabCaptureError, NoTabsFoundError, SessionManagementError } from './errors';

/**
 * URLs that should be filtered out during capture
 */
const FILTERED_URL_PREFIXES = ['chrome://', 'chrome-extension://'] as const;

/**
 * Checks if a URL should be filtered out
 */
const isFilteredUrl = (url: string | undefined): boolean => {
  if (!url) return true;
  return FILTERED_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
};

/**
 * Converts a chrome.tabs.Tab to a CapturedTab
 */
const toCapturedTab = (tab: chrome.tabs.Tab, capturedAt: Date): CapturedTab | null => {
  if (isFilteredUrl(tab.url)) {
    return null;
  }

  return {
    url: tab.url!,
    title: tab.title || '',
    favIconUrl: tab.favIconUrl,
    index: tab.index,
    pinned: tab.pinned,
    windowId: tab.windowId,
    createdAt: capturedAt,
  };
};

/**
 * Groups captured tabs by window ID
 */
const groupTabsByWindow = (tabs: readonly CapturedTab[]): readonly WindowSnapshot[] => {
  const windowMap = new Map<number, CapturedTab[]>();

  for (const tab of tabs) {
    const existing = windowMap.get(tab.windowId);
    if (existing) {
      existing.push(tab);
    } else {
      windowMap.set(tab.windowId, [tab]);
    }
  }

  return Array.from(windowMap.entries())
    .map(([windowId, windowTabs]) => ({
      windowId,
      tabs: windowTabs.sort((a, b) => a.index - b.index),
    }))
    .sort((a, b) => a.windowId - b.windowId);
};

/**
 * Captures all tabs from all windows
 * Filters out chrome:// and chrome-extension:// URLs
 */
export const captureAllTabs = async (): Promise<Result<CaptureResult, SessionManagementError>> => {
  const capturedAt = new Date();

  try {
    const allTabs = await chrome.tabs.query({});

    const capturedTabs = allTabs
      .map((tab) => toCapturedTab(tab, capturedAt))
      .filter((tab): tab is CapturedTab => tab !== null);

    if (capturedTabs.length === 0) {
      return Err(new NoTabsFoundError());
    }

    const windows = groupTabsByWindow(capturedTabs);

    return Ok({
      windows,
      totalTabs: capturedTabs.length,
      capturedAt,
    });
  } catch (error) {
    return Err(new TabCaptureError(error));
  }
};

/**
 * Captures tabs from the current window only
 */
export const captureCurrentWindowTabs = async (): Promise<Result<CaptureResult, SessionManagementError>> => {
  const capturedAt = new Date();

  try {
    const currentWindow = await chrome.windows.getCurrent();
    const windowTabs = await chrome.tabs.query({ windowId: currentWindow.id });

    const capturedTabs = windowTabs
      .map((tab) => toCapturedTab(tab, capturedAt))
      .filter((tab): tab is CapturedTab => tab !== null);

    if (capturedTabs.length === 0) {
      return Err(new NoTabsFoundError());
    }

    const windows = groupTabsByWindow(capturedTabs);

    return Ok({
      windows,
      totalTabs: capturedTabs.length,
      capturedAt,
    });
  } catch (error) {
    return Err(new TabCaptureError(error));
  }
};

/**
 * Captures tabs from a specific window
 */
export const captureWindowTabs = async (
  windowId: number
): Promise<Result<CaptureResult, SessionManagementError>> => {
  const capturedAt = new Date();

  try {
    const windowTabs = await chrome.tabs.query({ windowId });

    const capturedTabs = windowTabs
      .map((tab) => toCapturedTab(tab, capturedAt))
      .filter((tab): tab is CapturedTab => tab !== null);

    if (capturedTabs.length === 0) {
      return Err(new NoTabsFoundError());
    }

    const windows = groupTabsByWindow(capturedTabs);

    return Ok({
      windows,
      totalTabs: capturedTabs.length,
      capturedAt,
    });
  } catch (error) {
    return Err(new TabCaptureError(error));
  }
};
