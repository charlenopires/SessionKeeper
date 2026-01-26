# Testing Storage Layer

## Limitation

IndexedDB tests require a browser environment. Bun (Node.js runtime) doesn't support IndexedDB natively, even with polyfills like `fake-indexeddb`.

## Solution Options

### Option 1: Browser-based testing (Recommended)

Use Playwright or Puppeteer to run tests in real browser environment:

```bash
bun add -d @playwright/test
```

```typescript
// session-operations.browser.test.ts
import { test, expect } from '@playwright/test';

test('should create session', async ({ page }) => {
  await page.goto('chrome-extension://...');
  // Test real extension behavior
});
```

### Option 2: Manual Testing

1. Load extension in developer mode in Chrome
2. Open DevTools > Application > IndexedDB
3. Execute operations and verify data

### Option 3: Integration Tests

Instead of unit tests, create end-to-end integration tests that test the complete extension.

## Current Tests

Tests in `session-operations.test.ts` are written but **do not run** in Bun due to lack of IndexedDB. They serve as reference for when we implement browser testing.

## Running Tests

```bash
# Skip IndexedDB tests for now
bun test --exclude "**/storage/**/*.test.ts"

# Run only error tests (no IndexedDB dependency)
bun test src/storage/errors.test.ts
```

## Future

When we have UI (popup), we will implement E2E tests with Playwright that test the entire stack including Storage.
