# Error Handling

SessionKeeper implements a robust error handling system to ensure users always receive clear messages about problems.

## Architecture

### Error Hierarchy

```
DatabaseError (base)
├── DatabaseInitializationError
├── DatabaseNotInitializedError
├── DatabaseVersionError
└── QuotaExceededError
```

### DatabaseError (Base)

Base error containing:
- `message`: Technical message for logs
- `cause`: Original error that caused the problem
- `userMessage`: Friendly message to display to user

### Error Types

#### DatabaseInitializationError

When the database cannot be initialized.

**User message:**
> Failed to initialize SessionKeeper database. Please ensure your browser supports IndexedDB and you have sufficient storage space.

**Common causes:**
- IndexedDB not available in context
- Storage permissions denied
- Private mode with storage disabled

#### DatabaseNotInitializedError

When trying to access the database before initialization.

**User message:**
> Database has not been initialized. Please wait for the extension to start.

**Common causes:**
- Call to `getDatabase()` before `initializeDatabase()`
- Race condition on startup

#### DatabaseVersionError

Schema version conflict.

**User message:**
> Database version conflict detected. Please try disabling and re-enabling the extension.

**Common causes:**
- Extension version downgrade
- Database metadata corruption
- Inconsistent browser cache

#### QuotaExceededError

Storage limit exceeded.

**User message:**
> Storage quota exceeded. Please free up space by removing old sessions or increasing browser storage limits.

**Common causes:**
- Too many saved sessions
- Tabs with very long URLs
- Browser quota limit reached

## How to Use

### Catching Errors

```typescript
import { initializeDatabase, isDatabaseError, getErrorMessage } from './storage';

try {
  await initializeDatabase();
} catch (error) {
  if (isDatabaseError(error)) {
    // Database-specific error
    console.error('Database error:', error.message);
    showUserMessage(error.getUserMessage());
  } else {
    // Generic error
    const { technical, user } = getErrorMessage(error);
    console.error('Unexpected error:', technical);
    showUserMessage(user);
  }
}
```

### Throwing Custom Errors

```typescript
import { QuotaExceededError } from './storage/errors';

async function saveSession(session: Session) {
  try {
    await db.sessions.add(session);
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new QuotaExceededError(error);
    }
    throw error;
  }
}
```

### Helper getErrorMessage()

Extracts technical and user-friendly messages from any error:

```typescript
const { technical, user } = getErrorMessage(error);

console.error('Technical:', technical);  // For logs
alert(user);  // For the user
```

## Notifications

The service worker displays Chrome notifications on error:

```typescript
chrome.notifications.create({
  type: 'basic',
  iconUrl: 'icons/icon48.png',
  title: 'SessionKeeper Error',
  message: error.getUserMessage(),
  priority: 2,  // High priority for errors
});
```

## Best Practices

### ✅ Do

- Always catch errors in asynchronous operations
- Use `getErrorMessage()` to extract messages
- Log technical messages to console
- Display only user-friendly messages to users
- Use specific error types when appropriate

### ❌ Don't

- Never show stack traces to users
- Don't ignore errors silently
- Don't throw strings (use Error objects)
- Don't expose sensitive technical details

## Testing

Run error tests:

```bash
bun test src/storage/errors.test.ts
```

## Logging

Errors are logged with full context:

```typescript
console.error('Failed to initialize:', technical, error);
//                                      ^message  ^full object
```

This allows debugging in DevTools while keeping messages clean for users.
