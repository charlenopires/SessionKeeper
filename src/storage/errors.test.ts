import { describe, it, expect } from 'bun:test';
import {
  DatabaseError,
  DatabaseInitializationError,
  DatabaseNotInitializedError,
  DatabaseVersionError,
  QuotaExceededError,
  isDatabaseError,
  isQuotaExceededError,
  getErrorMessage,
} from './errors';

describe('Database Errors', () => {
  describe('DatabaseError', () => {
    it('should create a basic database error', () => {
      const error = new DatabaseError('Test error');
      expect(error.name).toBe('DatabaseError');
      expect(error.message).toBe('Test error');
      expect(error.getUserMessage()).toBe('Test error');
    });

    it('should use custom user message when provided', () => {
      const error = new DatabaseError('Technical message', undefined, 'User-friendly message');
      expect(error.message).toBe('Technical message');
      expect(error.getUserMessage()).toBe('User-friendly message');
    });
  });

  describe('DatabaseInitializationError', () => {
    it('should create initialization error with cause', () => {
      const cause = new Error('IndexedDB not available');
      const error = new DatabaseInitializationError(cause);

      expect(error.name).toBe('DatabaseInitializationError');
      expect(error.message).toContain('IndexedDB not available');
      expect(error.getUserMessage()).toContain('initialize SessionKeeper database');
    });
  });

  describe('DatabaseNotInitializedError', () => {
    it('should create not initialized error', () => {
      const error = new DatabaseNotInitializedError();

      expect(error.name).toBe('DatabaseNotInitializedError');
      expect(error.getUserMessage()).toContain('not been initialized');
    });
  });

  describe('DatabaseVersionError', () => {
    it('should create version mismatch error', () => {
      const error = new DatabaseVersionError(2, 1);

      expect(error.name).toBe('DatabaseVersionError');
      expect(error.message).toContain('expected 2, got 1');
      expect(error.getUserMessage()).toContain('version conflict');
    });
  });

  describe('QuotaExceededError', () => {
    it('should create quota exceeded error', () => {
      const cause = new Error('Storage quota exceeded');
      const error = new QuotaExceededError(cause);

      expect(error.name).toBe('QuotaExceededError');
      expect(error.getUserMessage()).toContain('quota exceeded');
    });
  });

  describe('isDatabaseError', () => {
    it('should identify database errors', () => {
      const dbError = new DatabaseError('test');
      const regularError = new Error('test');

      expect(isDatabaseError(dbError)).toBe(true);
      expect(isDatabaseError(regularError)).toBe(false);
      expect(isDatabaseError('string')).toBe(false);
    });
  });

  describe('isQuotaExceededError', () => {
    it('should identify quota errors by name', () => {
      const error = new Error('test');
      error.name = 'QuotaExceededError';

      expect(isQuotaExceededError(error)).toBe(true);
    });

    it('should identify quota errors by message', () => {
      expect(isQuotaExceededError(new Error('Storage quota exceeded'))).toBe(true);
      expect(isQuotaExceededError(new Error('quota full'))).toBe(true);
      expect(isQuotaExceededError(new Error('storage limit'))).toBe(true);
    });

    it('should return false for non-quota errors', () => {
      expect(isQuotaExceededError(new Error('random error'))).toBe(false);
      expect(isQuotaExceededError('string')).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract messages from DatabaseError', () => {
      const error = new DatabaseError('Technical', undefined, 'User-friendly');
      const { technical, user } = getErrorMessage(error);

      expect(technical).toBe('Technical');
      expect(user).toBe('User-friendly');
    });

    it('should handle regular Error objects', () => {
      const error = new Error('Something went wrong');
      const { technical, user } = getErrorMessage(error);

      expect(technical).toBe('Something went wrong');
      expect(user).toContain('unexpected error');
    });

    it('should handle non-Error values', () => {
      const { technical, user } = getErrorMessage('string error');

      expect(technical).toBe('string error');
      expect(user).toContain('unknown error');
    });
  });
});
