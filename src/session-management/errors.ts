/**
 * Domain-specific errors for Session Management
 */

export class SessionManagementError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly userMessage?: string
  ) {
    super(message);
    this.name = 'SessionManagementError';
  }

  getUserMessage(): string {
    return this.userMessage || this.message;
  }
}

export class TabCaptureError extends SessionManagementError {
  constructor(cause: unknown) {
    const technicalMessage = cause instanceof Error ? cause.message : String(cause);
    const userMessage =
      'Failed to capture browser tabs. ' +
      'Please ensure the extension has permission to access tabs.';

    super(`Tab capture failed: ${technicalMessage}`, cause, userMessage);
    this.name = 'TabCaptureError';
  }
}

export class NoTabsFoundError extends SessionManagementError {
  constructor() {
    const message = 'No tabs found to capture. All tabs may be filtered (chrome:// URLs).';
    super(message, undefined, message);
    this.name = 'NoTabsFoundError';
  }
}

export function isSessionManagementError(error: unknown): error is SessionManagementError {
  return error instanceof SessionManagementError;
}
