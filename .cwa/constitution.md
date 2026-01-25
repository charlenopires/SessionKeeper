# sessionkeeper Constitution

## Purpose

Chrome Extension para salvar e restaurar sessões do navegador com suporte a múltiplas janelas. Permite capturar o estado atual de todas as abas abertas, organizá-las com tags, e restaurá-las posteriormente em novas janelas ou na janela atual.

## Core Values

1. **Clarity** - Código funcional auto-documentado com tipos TypeScript discriminados
2. **Simplicity** - Funções puras, imutabilidade, composição sobre herança
3. **Testability** - Todas as features devem ter testes unitários com Bun test
4. **Accessibility** - Interface acessível via teclado com ARIA labels e focus trap

## Technical Constraints

- **Language**: TypeScript strict mode com tipos discriminados (Result<T, E>)
- **Framework**: React 18 com hooks funcionais (sem classes)
- **Database**: Dexie.js (wrapper para IndexedDB)
- **Runtime**: Bun (nunca npm/yarn/pnpm)
- **Build**: Vite + @crxjs/vite-plugin
- **Platform**: Chrome Extension Manifest V3 (Service Worker)
- **Minimum Test Coverage**: 80%

## Quality Standards

- All code must pass linting without warnings
- No hardcoded secrets or credentials
- Result pattern para error handling (nunca throw)
- UUID v4 para identificadores (evita conflitos em merge)
- Paradigma funcional: funções puras, imutabilidade, pipe/flow para transformações
- CSS com design tokens definidos em `.claude/design-system.md`

## Workflow Rules

- Only one task in progress at a time (WIP limit: 1)
- Specs must have acceptance criteria before implementation
- All architectural decisions must be recorded as ADRs
- Code review required before merging

## Bounded Contexts (DDD)

1. **Storage** - Persistência em IndexedDB com Dexie.js
2. **SessionManagement** - Captura de abas via chrome.tabs API
3. **SessionRestoration** - Restauração em nova janela ou janela atual
4. **ImportExport** - Export/Import JSON com validação de schema
5. **UI** - Interface React do popup (400x600px)

## Out of Scope

- Sincronização com cloud/servidor (apenas local storage)
- Suporte a outros navegadores (Firefox, Safari, Edge)
- Auto-save automático (apenas manual via botão)
- Histórico de versões de sessões

---
_Last updated: 2026-01-25_
