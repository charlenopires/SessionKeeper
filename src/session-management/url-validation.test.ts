import { describe, it, expect } from 'bun:test';
import {
  validateUrl,
  validateWindowTabs,
  filterValidTabs,
} from './url-validation';
import type { StoredWindowSnapshot } from './types';

describe('validateUrl', () => {
  describe('valid URLs', () => {
    it('should accept https URLs', () => {
      const result = validateUrl('https://example.com');
      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should accept http URLs', () => {
      const result = validateUrl('http://example.com');
      expect(result.isValid).toBe(true);
    });

    it('should accept https URLs with path', () => {
      const result = validateUrl('https://example.com/path/to/page');
      expect(result.isValid).toBe(true);
    });

    it('should accept https URLs with query params', () => {
      const result = validateUrl('https://example.com?query=value&foo=bar');
      expect(result.isValid).toBe(true);
    });

    it('should accept https URLs with hash', () => {
      const result = validateUrl('https://example.com#section');
      expect(result.isValid).toBe(true);
    });

    it('should accept file URLs', () => {
      const result = validateUrl('file:///path/to/file.html');
      expect(result.isValid).toBe(true);
    });

    it('should accept ftp URLs', () => {
      const result = validateUrl('ftp://ftp.example.com/file');
      expect(result.isValid).toBe(true);
    });

    it('should accept URLs with port', () => {
      const result = validateUrl('https://example.com:8080/page');
      expect(result.isValid).toBe(true);
    });

    it('should accept localhost URLs', () => {
      const result = validateUrl('http://localhost:3000');
      expect(result.isValid).toBe(true);
    });

    it('should accept IP address URLs', () => {
      const result = validateUrl('http://192.168.1.1:8080');
      expect(result.isValid).toBe(true);
    });
  });

  describe('invalid URLs', () => {
    it('should reject empty string', () => {
      const result = validateUrl('');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Empty or undefined URL');
    });

    it('should reject undefined', () => {
      const result = validateUrl(undefined);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Empty or undefined URL');
    });

    it('should reject whitespace-only string', () => {
      const result = validateUrl('   ');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Empty or undefined URL');
    });

    it('should reject malformed URLs', () => {
      const result = validateUrl('not a url');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Malformed URL');
    });

    it('should reject URLs without protocol', () => {
      const result = validateUrl('example.com');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Malformed URL');
    });

    it('should reject javascript: URLs', () => {
      const result = validateUrl('javascript:alert(1)');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Invalid protocol: javascript:');
    });

    it('should reject data: URLs', () => {
      const result = validateUrl('data:text/html,<h1>Hello</h1>');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Invalid protocol: data:');
    });

    it('should reject chrome:// URLs', () => {
      const result = validateUrl('chrome://settings');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Blocked system URL: chrome://');
    });

    it('should reject chrome-extension:// URLs', () => {
      const result = validateUrl('chrome-extension://abc123/popup.html');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Blocked system URL: chrome-extension://');
    });

    it('should reject about: URLs', () => {
      const result = validateUrl('about:blank');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Blocked system URL: about:');
    });

    it('should reject edge:// URLs', () => {
      const result = validateUrl('edge://settings');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Blocked system URL: edge://');
    });

    it('should reject brave:// URLs', () => {
      const result = validateUrl('brave://settings');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Blocked system URL: brave://');
    });

    it('should be case insensitive for blocked prefixes', () => {
      const result = validateUrl('CHROME://settings');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Blocked system URL: chrome://');
    });
  });
});

describe('validateWindowTabs', () => {
  const createTab = (url: string, title = 'Tab'): StoredWindowSnapshot['tabs'][0] => ({
    url,
    title,
    index: 0,
    pinned: false,
    favIconUrl: undefined,
  });

  it('should validate all tabs and categorize them', () => {
    const windows: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [
          createTab('https://example.com', 'Valid'),
          createTab('chrome://settings', 'Invalid'),
        ],
      },
    ];

    const result = validateWindowTabs(windows);

    expect(result.totalCount).toBe(2);
    expect(result.validCount).toBe(1);
    expect(result.invalidCount).toBe(1);
    expect(result.validTabs.length).toBe(1);
    expect(result.invalidTabs.length).toBe(1);
  });

  it('should include windowId in validation status', () => {
    const windows: StoredWindowSnapshot[] = [
      {
        windowId: 42,
        tabs: [createTab('https://example.com')],
      },
    ];

    const result = validateWindowTabs(windows);

    expect(result.validTabs[0].windowId).toBe(42);
  });

  it('should include reason for invalid tabs', () => {
    const windows: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [createTab('chrome://settings')],
      },
    ];

    const result = validateWindowTabs(windows);

    expect(result.invalidTabs[0].reason).toBe('Blocked system URL: chrome://');
  });

  it('should handle multiple windows', () => {
    const windows: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [createTab('https://a.com')],
      },
      {
        windowId: 2,
        tabs: [
          createTab('https://b.com'),
          createTab('chrome://settings'),
        ],
      },
    ];

    const result = validateWindowTabs(windows);

    expect(result.validCount).toBe(2);
    expect(result.invalidCount).toBe(1);
  });

  it('should return empty arrays for empty windows', () => {
    const result = validateWindowTabs([]);

    expect(result.validTabs).toEqual([]);
    expect(result.invalidTabs).toEqual([]);
    expect(result.totalCount).toBe(0);
  });
});

describe('filterValidTabs', () => {
  const createTab = (url: string): StoredWindowSnapshot['tabs'][0] => ({
    url,
    title: 'Tab',
    index: 0,
    pinned: false,
    favIconUrl: undefined,
  });

  it('should filter out invalid tabs', () => {
    const windows: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [
          createTab('https://example.com'),
          createTab('chrome://settings'),
        ],
      },
    ];

    const filtered = filterValidTabs(windows);

    expect(filtered.length).toBe(1);
    expect(filtered[0].tabs.length).toBe(1);
    expect(filtered[0].tabs[0].url).toBe('https://example.com');
  });

  it('should remove windows with no valid tabs', () => {
    const windows: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [createTab('chrome://settings')],
      },
      {
        windowId: 2,
        tabs: [createTab('https://example.com')],
      },
    ];

    const filtered = filterValidTabs(windows);

    expect(filtered.length).toBe(1);
    expect(filtered[0].windowId).toBe(2);
  });

  it('should preserve window structure', () => {
    const windows: StoredWindowSnapshot[] = [
      {
        windowId: 123,
        tabs: [createTab('https://example.com')],
      },
    ];

    const filtered = filterValidTabs(windows);

    expect(filtered[0].windowId).toBe(123);
  });

  it('should return empty array when all tabs are invalid', () => {
    const windows: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [
          createTab('chrome://settings'),
          createTab('about:blank'),
        ],
      },
    ];

    const filtered = filterValidTabs(windows);

    expect(filtered.length).toBe(0);
  });

  it('should preserve tab order', () => {
    const windows: StoredWindowSnapshot[] = [
      {
        windowId: 1,
        tabs: [
          createTab('https://first.com'),
          createTab('chrome://settings'),
          createTab('https://second.com'),
          createTab('about:blank'),
          createTab('https://third.com'),
        ],
      },
    ];

    const filtered = filterValidTabs(windows);

    expect(filtered[0].tabs.length).toBe(3);
    expect(filtered[0].tabs[0].url).toBe('https://first.com');
    expect(filtered[0].tabs[1].url).toBe('https://second.com');
    expect(filtered[0].tabs[2].url).toBe('https://third.com');
  });
});
