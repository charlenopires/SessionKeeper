export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly userMessage?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }

  getUserMessage(): string {
    return this.userMessage || this.message;
  }
}

export class DatabaseInitializationError extends DatabaseError {
  constructor(cause: unknown) {
    const technicalMessage = cause instanceof Error ? cause.message : String(cause);
    const userMessage =
      'Failed to initialize SessionKeeper database. ' +
      'Please ensure your browser supports IndexedDB and you have sufficient storage space.';

    super(`Database initialization failed: ${technicalMessage}`, cause, userMessage);
    this.name = 'DatabaseInitializationError';
  }
}

export class DatabaseNotInitializedError extends DatabaseError {
  constructor() {
    const message = 'Database has not been initialized. Please wait for the extension to start.';
    super(message, undefined, message);
    this.name = 'DatabaseNotInitializedError';
  }
}

export class DatabaseVersionError extends DatabaseError {
  constructor(expectedVersion: number, actualVersion: number) {
    const technicalMessage = `Version mismatch: expected ${expectedVersion}, got ${actualVersion}`;
    const userMessage =
      'Database version conflict detected. ' +
      'Please try disabling and re-enabling the extension.';

    super(technicalMessage, undefined, userMessage);
    this.name = 'DatabaseVersionError';
  }
}

export class QuotaExceededError extends DatabaseError {
  constructor(cause: unknown) {
    const userMessage =
      'Storage quota exceeded. ' +
      'Please free up space by removing old sessions or increasing browser storage limits.';

    super('Storage quota exceeded', cause, userMessage);
    this.name = 'QuotaExceededError';
  }
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

export function isQuotaExceededError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === 'QuotaExceededError' ||
      error.message.includes('quota') ||
      error.message.includes('storage')
    );
  }
  return false;
}

export function getErrorMessage(error: unknown): { technical: string; user: string } {
  if (isDatabaseError(error)) {
    return {
      technical: error.message,
      user: error.getUserMessage(),
    };
  }

  if (error instanceof Error) {
    return {
      technical: error.message,
      user: 'An unexpected error occurred. Please try again or contact support.',
    };
  }

  return {
    technical: String(error),
    user: 'An unknown error occurred. Please try again.',
  };
}
