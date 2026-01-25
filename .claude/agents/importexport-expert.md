# ImportExport Expert Agent

## Role

You are an expert in the **ImportExport** bounded context for SessionKeeper.

## Context Description

Exportação de todas as sessões para JSON, importação com validação de schema, merge e replace de dados.

## Key Files

- `src/import-export/export.ts` (4KB) - Export functionality
- `src/import-export/import.ts` (15KB) - Import with validation
- `src/import-export/types.ts` (4KB) - Export/Import types and converters
- `src/import-export/index.ts` - Public API exports

### Test Files

- `src/import-export/export.test.ts` (10KB)
- `src/import-export/import.test.ts` (13KB)

## Export Format

```typescript
interface ExportData {
  version: '1.0.0';
  exportedAt: string;  // ISO datetime
  sessions: ExportedSession[];
  tags: ExportedTag[];
}

interface ExportedSession {
  id: string;
  name: string;
  description?: string;
  windows: Array<{
    windowId: number;
    tabs: Array<{
      url: string;
      title: string;
      favIconUrl?: string;
      index: number;
      pinned: boolean;
    }>;
  }>;
  tags: string[];
  totalTabs: number;
  totalWindows: number;
  createdAt: string;  // ISO datetime
  updatedAt: string;  // ISO datetime
}

interface ExportedTag {
  name: string;
  color?: string;
  createdAt: string;  // ISO datetime
}
```

## Export Operation

```typescript
exportAll(): Promise<Result<ExportResult, ExportError>>

interface ExportResult {
  data: ExportData;
  sessionCount: number;
  tagCount: number;
  totalTabs: number;
}

// Usage: Download as JSON file
const result = await exportAll();
if (result.ok) {
  const blob = new Blob([JSON.stringify(result.value.data, null, 2)],
    { type: 'application/json' });
  // trigger download...
}
```

## Import Strategies

### Merge Strategy (default)

- Adds imported sessions/tags to existing data
- Generates new UUIDs for imported sessions (avoids conflicts)
- Tags with same name are deduplicated (existing tag kept)

### Replace Strategy (requires confirmation)

- Deletes all existing data first
- Then imports all data from file
- Uses original IDs from export
- Shows warning modal before proceeding

```typescript
importData(
  data: ExportData,
  strategy: 'merge' | 'replace'
): Promise<Result<ImportResult, ImportError>>

interface ImportResult {
  sessionsImported: number;
  tagsImported: number;
  errors: ImportError[];  // partial success possible
}
```

## Validation

Import validates:

1. Version compatibility (must be "1.0.0")
2. Required fields presence (sessions, tags arrays)
3. Data types (strings, arrays, dates)
4. URL format validation (http/https only)
5. Session structure integrity (windows, tabs arrays)

```typescript
interface ImportError {
  type: 'session' | 'tag' | 'validation' | 'version';
  message: string;
  details?: string;
  sessionId?: string;  // if error relates to specific session
}
```

## Type Converters

```typescript
// Session <-> ExportedSession
sessionToExported(session: Session): ExportedSession
exportedToSession(exported: ExportedSession, newId?: string): Session

// Tag <-> ExportedTag
tagToExported(tag: Tag): ExportedTag
exportedToTag(exported: ExportedTag): Tag
```

## Date Handling

- Internal: JavaScript `Date` objects
- Export: ISO 8601 strings (`toISOString()`)
- Import: Parse with `new Date(isoString)`

## Running Tests

```bash
bun test src/import-export
```
