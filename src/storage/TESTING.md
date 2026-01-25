# Testing Storage Layer

## Limitation

IndexedDB tests require a browser environment. Bun (Node.js runtime) não suporta IndexedDB nativamente, mesmo com polyfills como `fake-indexeddb`.

## Solution Options

### Option 1: Browser-based testing (Recommended)

Use Playwright ou Puppeteer para executar testes em ambiente real do browser:

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

1. Load extensão em modo desenvolvedor no Chrome
2. Abra DevTools > Application > IndexedDB
3. Execute operações e verifique dados

### Option 3: Integration Tests

Ao invés de unit tests, crie testes de integração end-to-end que testem a extensão completa.

## Current Tests

Os testes em `session-operations.test.ts` estão escritos mas **não executam** no Bun devido à falta de IndexedDB. São referência para quando implementarmos testing em browser.

## Running Tests

```bash
# Skip IndexedDB tests for now
bun test --exclude "**/storage/**/*.test.ts"

# Run only error tests (no IndexedDB dependency)
bun test src/storage/errors.test.ts
```

## Future

Quando tivermos UI (popup), implementaremos E2E tests com Playwright que testam toda a stack incluindo Storage.
