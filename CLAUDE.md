# sessionkeeper

## Tooling

This project uses **Bun** as the primary package manager and runtime. Always use `bun` commands instead of npm/yarn/pnpm.

## Domain Model

### ImportExport

Exportação de todas as sessões para JSON, importação com validação de schema, merge e replace de dados

### SessionManagement

Captura de estado atual das abas de todas as janelas, criação e edição de sessões com metadados completos

### SessionRestoration

Restauração de sessões em nova janela ou janela atual, detecção e tratamento de URLs duplicadas

### Storage

Persistência de dados em IndexedDB, CRUD de entidades, cache e sincronização de sessões, tags e configurações

### UI

Interface React do popup da extensão, componentes visuais, modais, filtros e interações do usuário

## Design System

Design tokens reference: `.claude/design-system.md`

All UI implementation must follow the design system tokens defined above.

