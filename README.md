# SessionKeeper

Chrome extension for managing browser sessions.

## Development

This project uses **Bun** as the package manager.

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build
```

## Architecture

The project follows Domain-Driven Design (DDD) principles with bounded contexts:

- **Storage**: IndexedDB persistence with Dexie.js
- **SessionManagement**: Session capture and editing
- **SessionRestoration**: Session restoration logic
- **ImportExport**: Data import/export functionality
- **UI**: React-based popup interface

## Tech Stack

- TypeScript
- React
- Dexie.js (IndexedDB wrapper)
- Vite
- Chrome Extension Manifest V3
