# sessionkeeper

Chrome Extension para salvar e restaurar sessões do navegador com suporte a múltiplas janelas.

## Tooling

- **Runtime**: Bun (sempre use `bun` em vez de npm/yarn/pnpm)
- **Build**: Vite + @crxjs/vite-plugin (hot reload e manifest automático)
- **UI**: React 18 + hooks funcionais
- **Styling**: CSS customizado com design tokens
- **Database**: Dexie.js (wrapper para IndexedDB)
- **Testing**: Bun test + happy-dom para React

## Technology Decisions

- **Manifest V3**: Service Worker obrigatório para novas extensões Chrome
- **UUID v4**: Identificadores de sessões (evita conflitos em merge de imports)
- **Result Pattern**: `Result<T, E>` para error handling funcional
- **Paradigma Funcional**: Funções puras, imutabilidade, composição

## Domain Model

### Storage
Persistência de dados em IndexedDB usando Dexie.js.

**Entidades:**
- `Session`: id (UUID), name, description, windows[], tags[], totalTabs, totalWindows, createdAt, updatedAt
- `Tag`: id, name, color, createdAt
- `Settings`: key, value, updatedAt

**Arquivos principais:**
- `src/storage/db.ts` - Schema e migrations do Dexie
- `src/storage/session-operations.ts` - CRUD de sessões
- `src/storage/tag-operations.ts` - CRUD de tags
- `src/storage/errors.ts` - Tipos de erro tipados

### SessionManagement
Captura de estado atual das abas de todas as janelas.

**Tipos:**
- `CapturedTab`: url, title, favIconUrl, index, pinned, windowId, createdAt
- `WindowSnapshot`: windowId, tabs[]
- `CaptureResult`: windows[], totalTabs, capturedAt

**Regras:**
- URLs chrome:// e chrome-extension:// são filtradas
- Tabs agrupadas por windowId e ordenadas por index
- Validação: name 1-100 chars, description max 500 chars

**Arquivos principais:**
- `src/session-management/tab-capture.ts` - Captura via chrome.tabs API
- `src/session-management/duplicate-detection.ts` - Detecção de duplicatas

### SessionRestoration
Restauração de sessões em nova janela ou janela atual.

**Funcionalidades:**
- Restaurar em nova janela (cria janela para cada WindowSnapshot)
- Restaurar em janela atual (adiciona tabs à janela ativa)
- Detecção de duplicatas (URLs já abertas)
- Estratégias: ignorar duplicatas ou permitir

**Arquivos principais:**
- `src/session-management/session-restore.ts` - Lógica de restauração
- `src/session-management/url-validation.ts` - Validação de URLs

### ImportExport
Exportação e importação de dados em JSON.

**Formato:**
- Version: "1.0.0"
- Dates serialized como ISO strings
- Sessões e tags exportadas juntas

**Estratégias de import:**
- `merge`: Combina com dados existentes
- `replace`: Substitui todos os dados

**Arquivos principais:**
- `src/import-export/export.ts` - Geração de JSON
- `src/import-export/import.ts` - Parsing e validação
- `src/import-export/types.ts` - Schema de export

### UI
Interface React do popup da extensão (400x600px).

**Componentes:**
- `App.tsx` - Layout principal (header, content, footer)
- `SessionList.tsx` / `SessionCard.tsx` - Lista de sessões
- `QuickActionsBar.tsx` - Salvar sessão atual
- `SaveSessionModal.tsx` / `EditSessionModal.tsx` - Formulários
- `RestoreOptionsModal.tsx` - Opções de restauração
- `SearchFilterBar.tsx` - Busca e filtros por tag
- `TagManagementPanel.tsx` - Gerenciamento de tags
- `Toast.tsx` - Notificações (success, error, warning, info)
- `ConfirmModal.tsx` - Confirmações de ações destrutivas

**Hooks:**
- `useSessions` - Lista de sessões
- `useDeleteSession` - Exclusão com confirmação
- `useRestoreSession` - Restauração com progresso
- `useDuplicateDetection` - Detecção de URLs abertas
- `useToast` - Sistema de notificações

**Acessibilidade:**
- Navegação por Tab/Enter/Space
- Focus visible em todos elementos interativos
- aria-labels em botões e ícones
- Focus trap em modais
- Escape fecha modais

## Design System

Design tokens reference: `.claude/design-system.md`

All UI implementation must follow the design system tokens defined above.

## Running Tests

```bash
bun test              # Todos os testes
bun test --watch      # Watch mode
bun test src/storage  # Testes de um domínio
```

## Project Structure

```
src/
├── background/       # Service worker
├── storage/          # IndexedDB layer (Dexie)
├── session-management/ # Tab capture e restore
├── import-export/    # JSON export/import
└── popup/            # React UI
    ├── components/   # React components
    ├── hooks/        # Custom hooks
    └── utils/        # Utilities
```

