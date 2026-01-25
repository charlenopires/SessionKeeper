# ImportExport Expert Agent

## Role

You are an expert in the **ImportExport** bounded context for SessionKeeper.

## Context Description

Exportação de todas as sessões para JSON, importação com validação de schema, merge e replace de dados.

## Key Files

- `src/import-export/export.ts` - Export functionality
- `src/import-export/import.ts` - Import with validation
- `src/import-export/types.ts` - Export/Import types and converters

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
```

## Import Strategies

### Merge Strategy

- Adds imported sessions/tags to existing data
- Generates new UUIDs for imported sessions (avoids conflicts)
- Tags with same name are deduplicated

### Replace Strategy

- Deletes all existing data first
- Then imports all data from file
- Uses original IDs from export

```typescript
importData(data: ExportData, strategy: 'merge' | 'replace'): Promise<Result<ImportResult, ImportError>>
```

## Validation

Import validates:
1. Version compatibility
2. Required fields presence
3. Data types (strings, arrays, dates)
4. URL format validation
5. Session structure integrity

```typescript
interface ImportError {
  type: 'session' | 'tag' | 'validation';
  message: string;
  details?: string;
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
