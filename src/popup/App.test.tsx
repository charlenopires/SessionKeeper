import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import Dexie from 'dexie';
import { App } from './App';
import { closeDatabase } from '../storage';

describe('App - Popup Layout', () => {
  beforeEach(async () => {
    await closeDatabase();
    await Dexie.delete('session-keeper-db');
  });

  afterEach(async () => {
    cleanup();
    await closeDatabase();
    await Dexie.delete('session-keeper-db');
  });

  it('should render the popup layout structure', () => {
    render(<App />);

    // Check header exists with title
    expect(screen.getByRole('banner')).toBeDefined();
    expect(screen.getByText('Session Keeper')).toBeDefined();

    // Check settings button exists
    expect(screen.getByRole('button', { name: /settings/i })).toBeDefined();

    // Check main content area exists
    expect(screen.getByRole('main')).toBeDefined();

    // Check quick actions bar exists
    expect(screen.getByRole('button', { name: /save current session/i })).toBeDefined();
  });

  it('should have header with logo, title and settings button', () => {
    render(<App />);

    const header = screen.getByRole('banner');
    expect(header).toBeDefined();

    // Title
    expect(screen.getByText('Session Keeper')).toBeDefined();

    // Logo emoji
    expect(screen.getByText('📑')).toBeDefined();

    // Settings button
    expect(screen.getByRole('button', { name: /settings/i })).toBeDefined();
  });

  it('should have quick actions bar with save, export and import buttons', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /save current session/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /export/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /import/i })).toBeDefined();
  });

  it('should have main area for content', () => {
    render(<App />);

    const main = screen.getByRole('main');
    expect(main).toBeDefined();
    expect(main.className).toContain('popup-main');
  });
});
