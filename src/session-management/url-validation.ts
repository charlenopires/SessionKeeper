import type { StoredTab, StoredWindowSnapshot } from './types';

/**
 * Valid URL protocols for restoration
 */
const VALID_PROTOCOLS = ['http:', 'https:', 'file:', 'ftp:'];

/**
 * Chrome internal URLs that cannot be restored
 */
const BLOCKED_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'about:',
  'edge://',
  'brave://',
];

/**
 * Result of URL validation
 */
export interface UrlValidationResult {
  readonly isValid: boolean;
  readonly reason?: string;
}

/**
 * Tab with validation status
 */
export interface TabValidationStatus {
  readonly tab: StoredTab;
  readonly windowId: number;
  readonly isValid: boolean;
  readonly reason?: string;
}

/**
 * Result of validating all tabs in windows
 */
export interface WindowsValidationResult {
  readonly validTabs: TabValidationStatus[];
  readonly invalidTabs: TabValidationStatus[];
  readonly totalCount: number;
  readonly validCount: number;
  readonly invalidCount: number;
}

/**
 * Validates a single URL
 * Checks for empty, malformed, and blocked URLs
 */
export function validateUrl(url: string | undefined): UrlValidationResult {
  // Empty or undefined URL
  if (!url || url.trim() === '') {
    return { isValid: false, reason: 'URL vazia ou indefinida' };
  }

  // Check for blocked prefixes (chrome://, about:, etc.)
  for (const prefix of BLOCKED_PREFIXES) {
    if (url.toLowerCase().startsWith(prefix)) {
      return { isValid: false, reason: `URL de sistema bloqueada: ${prefix}` };
    }
  }

  // Try to parse the URL
  try {
    const parsed = new URL(url);

    // Check for valid protocol
    if (!VALID_PROTOCOLS.includes(parsed.protocol)) {
      return { isValid: false, reason: `Protocolo inválido: ${parsed.protocol}` };
    }

    // Check for valid hostname (except for file:// URLs)
    if (parsed.protocol !== 'file:' && !parsed.hostname) {
      return { isValid: false, reason: 'URL sem hostname' };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, reason: 'URL malformada' };
  }
}

/**
 * Validates all tabs in the given windows
 * Returns categorized results for valid and invalid tabs
 */
export function validateWindowTabs(
  windows: readonly StoredWindowSnapshot[]
): WindowsValidationResult {
  const validTabs: TabValidationStatus[] = [];
  const invalidTabs: TabValidationStatus[] = [];

  for (const window of windows) {
    for (const tab of window.tabs) {
      const validation = validateUrl(tab.url);
      const status: TabValidationStatus = {
        tab,
        windowId: window.windowId,
        isValid: validation.isValid,
        reason: validation.reason,
      };

      if (validation.isValid) {
        validTabs.push(status);
      } else {
        invalidTabs.push(status);
      }
    }
  }

  return {
    validTabs,
    invalidTabs,
    totalCount: validTabs.length + invalidTabs.length,
    validCount: validTabs.length,
    invalidCount: invalidTabs.length,
  };
}

/**
 * Filters windows to only include valid tabs
 * Returns new window snapshots with only valid tabs
 * Empty windows are removed
 */
export function filterValidTabs(
  windows: readonly StoredWindowSnapshot[]
): StoredWindowSnapshot[] {
  return windows
    .map(window => ({
      ...window,
      tabs: window.tabs.filter(tab => validateUrl(tab.url).isValid),
    }))
    .filter(window => window.tabs.length > 0);
}
