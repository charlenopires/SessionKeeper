# Transactions in SessionKeeper

The transaction system ensures atomicity in composite operations: all operations within a transaction are committed together or all fail (automatic rollback).

## When to use transactions

### ✅ Use transactions when:

1. **Multiple dependent operations**
   - Create a session and several tags at the same time
   - Update multiple related sessions
   - Delete session and its associated metadata

2. **Bulk operations**
   - Import multiple sessions
   - Update multiple sessions at once
   - Delete multiple sessions

3. **Critical consistency**
   - Operations that cannot be partially applied
   - When partial failure would leave inconsistent data

### ❌ Don't need transaction when:

- Single and independent operation
- Read-only operations
- Already atomic operations by nature (single CRUD)

## How to use

### Generic transaction

Use `withTransaction` for custom operations:

```typescript
import { withTransaction, getDatabase } from './storage';

const result = await withTransaction(async (tx) => {
  const db = getDatabase();

  // All operations inside are atomic
  const id1 = await db.sessions.add({
    name: 'Session 1',
    tabs: [],
    tags: ['work'],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const id2 = await db.sessions.add({
    name: 'Session 2',
    tabs: [],
    tags: ['personal'],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // If any operation fails, both are rolled back
  return { id1, id2 };
});

if (isOk(result)) {
  console.log('Both sessions created:', result.value);
} else {
  console.error('Transaction failed:', result.error);
}
```

### Bulk operations (built-in)

Use bulk functions that already have transactions built-in:

```typescript
import { bulkCreateSessions, bulkUpdateSessions, bulkDeleteSessions } from './storage';

// Create multiple sessions atomically
const result = await bulkCreateSessions([
  { name: 'Session 1', tabs: [] },
  { name: 'Session 2', tabs: [] },
  { name: 'Session 3', tabs: [] },
]);

// Update multiple sessions atomically
await bulkUpdateSessions([
  { id: 1, name: 'Updated 1' },
  { id: 2, name: 'Updated 2' },
]);

// Delete multiple sessions atomically
await bulkDeleteSessions([1, 2, 3]);
```

## ACID Guarantees

### Atomicity
All operations within the transaction are applied or none are.

```typescript
// If update fails, create is also rolled back
await withTransaction(async () => {
  await createSession({ name: 'New', tabs: [] });
  await updateSession({ id: 999, name: 'Will fail' }); // Doesn't exist
});
```

### Consistency
Database remains in valid state before and after transaction.

### Isolation
Concurrent transactions don't interfere with each other.

### Durability
Once committed, the transaction persists even through crashes.

## Error handling

Transactions return `Result<T, StorageError>`:

```typescript
const result = await withTransaction(async () => {
  // Your code here
  return data;
});

if (isOk(result)) {
  // Success - transaction was committed
  console.log(result.value);
} else {
  // Failure - transaction was automatically rolled back
  console.error(result.error.getUserMessage());
}
```

## Performance

### Best practices

✅ **Do:**
- Keep transactions short
- Execute heavy operations outside the transaction
- Use bulk operations when possible

```typescript
// ✅ Good: Prepare data before transaction
const preparedData = heavyComputation(rawData);

await withTransaction(async () => {
  await db.sessions.add(preparedData);
});
```

❌ **Don't:**
- Long transactions that block the database
- Heavy synchronous operations inside the transaction
- Network calls inside the transaction

```typescript
// ❌ Bad: Heavy processing inside transaction
await withTransaction(async () => {
  const data = heavyComputation(rawData); // Blocks DB
  await db.sessions.add(data);
});

// ❌ Bad: Network call inside transaction
await withTransaction(async () => {
  const response = await fetch('https://api.example.com'); // Blocks DB
  await db.sessions.add(response.data);
});
```

## Advanced examples

### Import with validation

```typescript
import { withTransaction, getDatabase } from './storage';

async function importSessions(data: ExportData): Promise<Result<number, StorageError>> {
  return withTransaction(async () => {
    const db = getDatabase();

    // Validate before importing
    if (data.version !== '1.0') {
      throw new DatabaseError('Unsupported version');
    }

    // Clear existing data (if replace mode)
    if (data.mode === 'replace') {
      await db.sessions.clear();
    }

    // Import all sessions
    const ids = await db.sessions.bulkAdd(data.sessions, { allKeys: true });

    return ids.length;
  });
}
```

### Data migration

```typescript
async function migrateSessionTags(): Promise<Result<number, StorageError>> {
  return withTransaction(async () => {
    const db = getDatabase();

    const sessions = await db.sessions.toArray();
    let updated = 0;

    for (const session of sessions) {
      // Migrate old format to new
      if (session.tags.includes('old-tag')) {
        session.tags = session.tags.map(tag =>
          tag === 'old-tag' ? 'new-tag' : tag
        );
        await db.sessions.put(session);
        updated++;
      }
    }

    return updated;
  });
}
```

## Debugging

To debug transactions:

```typescript
await withTransaction(async (tx) => {
  console.log('Transaction started');

  try {
    // Your operations
    const result = await someOperation();
    console.log('Operation succeeded:', result);
    return result;
  } catch (error) {
    console.error('Transaction will rollback:', error);
    throw error; // Re-throw to trigger rollback
  }
});
```

## Limitations

1. **Cannot use async callbacks of array methods inside transactions**
   ```typescript
   // ❌ Doesn't work
   await withTransaction(async () => {
     await Promise.all(items.map(async item => {
       await db.sessions.add(item);
     }));
   });

   // ✅ Use normal loop
   await withTransaction(async () => {
     for (const item of items) {
       await db.sessions.add(item);
     }
   });
   ```

2. **IndexedDB limits**
   - Transactions have timeout (usually 10-30 seconds)
   - Cannot have nested transactions
   - Transaction is auto-committed at end of function

## References

- [Dexie.js Transactions](https://dexie.org/docs/Tutorial/Design#transactions)
- [IndexedDB Transactions](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction)
