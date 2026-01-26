# Database Migrations

SessionKeeper uses Dexie.js to manage IndexedDB migrations automatically.

## How it works

### Versioning System

Each schema version is declared using `this.version(N).stores({...})`. Dexie.js:

1. Automatically detects the user's current database version
2. Executes all necessary migrations sequentially
3. Updates the database to the most recent version

### Version 1 (Current)

Initial schema with three stores:

- **sessions**: Stores browser sessions
  - Indexes: `++id, name, createdAt, updatedAt, *tags`
  - Multi-entry index on `tags` allows searching by multiple tags

- **tags**: Tags to categorize sessions
  - Indexes: `++id, &name, createdAt`
  - Unique index on `name` prevents duplicates

- **settings**: App settings
  - Indexes: `++id, &key, updatedAt`
  - Unique index on `key` ensures one setting per key

## How to add a migration

### 1. Increment the version

```typescript
this.version(2).stores({
  // Declare ALL tables, even those not modified
  sessions: '++id, name, createdAt, updatedAt, *tags',
  tags: '++id, &name, createdAt',
  settings: '++id, &key, updatedAt',
})
```

### 2. Add upgrade handler (optional)

Use `.upgrade()` to transform existing data:

```typescript
this.version(2)
  .stores({...})
  .upgrade(async (tx) => {
    // Add field with default value
    await tx.table('sessions').toCollection().modify((session) => {
      session.archived = false;
    });

    // Migrate data
    const sessions = await tx.table('sessions').toArray();
    for (const session of sessions) {
      if (!session.description) {
        session.description = `Session created on ${session.createdAt}`;
        await tx.table('sessions').put(session);
      }
    }
  });
```

### 3. Update TypeScript interfaces

Always keep interfaces synchronized with the schema:

```typescript
export interface Session {
  id?: number;
  name: string;
  archived?: boolean; // New field
  // ...
}
```

## Important rules

### ✅ Do

- Always declare ALL tables in each version, even those not modified
- Use `.upgrade()` when you need to transform existing data
- Test migrations with real data before deploying
- Document the purpose of each migration in this file

### ❌ Don't

- Never remove or modify an already deployed migration
- Don't skip version numbers (use 1, 2, 3, not 1, 3, 5)
- Don't depend on specific execution order of migrations
- Don't use `null` as default value in migrations (use undefined)

## Testing migrations

To test a migration locally:

1. Install the extension with version N
2. Create test data
3. Update to version N+1
4. Verify in DevTools (Application > IndexedDB) if migration worked
5. Check logs in extension console

## Rollback

IndexedDB doesn't support automatic rollback. To revert:

1. User must uninstall the extension
2. Data will be lost (consider implementing export/backup)

## Performance

- Migrations execute only once per version
- Dexie.js uses transactions to ensure atomicity
- Large migrations can freeze UI (use batch processing)
