# Storage Expert Agent

## Role

You are an expert in the **Storage** bounded context for SessionKeeper.

## Context Description

Persistência de dados em IndexedDB usando Dexie.js, CRUD de entidades, migrations e tratamento de erros.

## Key Files

- `src/storage/db.ts` - Database schema, migrations, initialization
- `src/storage/session-operations.ts` - Session CRUD operations (16KB)
- `src/storage/tag-operations.ts` - Tag CRUD operations (9KB)
- `src/storage/errors.ts` - Typed error classes
- `src/storage/result.ts` - Result<T, E> pattern
- `src/storage/queries.ts` - Query utilities (7KB)
- `src/storage/index.ts` - Public API exports

### Documentation

- `src/storage/ERROR_HANDLING.md` - Error handling patterns
- `src/storage/MIGRATIONS.md` - Database migration guide
- `src/storage/TRANSACTIONS.md` - Transaction patterns with examples
- `src/storage/transaction-examples.ts` - Code examples for transactions

## Database Schema

**Version 2 (current):**

```typescript
// Sessions table - primary key is UUID string
sessions: 'id, name, createdAt, updatedAt, *tags'

// Tags table - auto-increment id, unique name
tags: '++id, &name, createdAt'

// Settings table - key-value store
settings: '++id, &key, updatedAt'
```

## Entity Types

```typescript
interface Session {
  id: string;           // UUID v4
  name: string;         // 1-100 chars
  description?: string; // max 500 chars
  windows: StoredWindowSnapshot[];
  tags: string[];       // tag names
  totalTabs: number;
  totalWindows: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Tag {
  id?: number;
  name: string;         // unique
  color?: string;       // hex color
  createdAt: Date;
}

interface Settings {
  id?: number;
  key: string;          // unique
  value: string | number | boolean;
  updatedAt: Date;
}
```

## Main Operations

### Session Operations (`session-operations.ts`)
- `createSession(data)` - Create with UUID generation
- `getSession(id)` - Get by ID
- `updateSession(id, data)` - Partial update with updatedAt
- `deleteSession(id)` - Delete by ID
- `listSessions()` - List all sorted by createdAt DESC
- `searchSessions(query)` - Search by name/description

### Tag Operations (`tag-operations.ts`)
- `createTag(name, color?)` - Create with unique name check
- `getTag(id)` - Get by ID
- `getTagByName(name)` - Get by name
- `updateTag(id, data)` - Update name/color
- `deleteTag(id)` - Delete tag
- `listTags()` - List all sorted by name
- `getSessionCountByTag(tagName)` - Count sessions using tag

## Patterns

- **Result Pattern**: All operations return `Result<T, E>` instead of throwing
- **Singleton DB**: Use `getDatabase()` to access, `initializeDatabase()` to init
- **Migrations**: Dexie handles migrations automatically via version()
- **Multi-entry Index**: `*tags` allows querying sessions by any tag

## Error Handling

```typescript
// Error types
DatabaseInitializationError  // Failed to open DB
DatabaseNotInitializedError  // getDatabase() before init
QuotaExceededError          // Storage quota exceeded
SessionNotFoundError        // Session ID not found
TagNotFoundError            // Tag ID not found
DuplicateTagNameError       // Tag name already exists
```

## Important Rules

- Always use Dexie transactions for multi-step operations
- Never store Date objects directly - Dexie handles serialization
- Tag names must be unique (enforced by index)
- Session IDs are UUID v4, generated with `crypto.randomUUID()`
- Run `bun test src/storage` to verify changes
