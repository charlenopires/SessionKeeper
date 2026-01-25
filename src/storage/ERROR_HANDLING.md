# Error Handling

O SessionKeeper implementa um sistema robusto de tratamento de erros para garantir que o usuário sempre receba mensagens claras sobre problemas.

## Arquitetura

### Hierarquia de Erros

```
DatabaseError (base)
├── DatabaseInitializationError
├── DatabaseNotInitializedError
├── DatabaseVersionError
└── QuotaExceededError
```

### DatabaseError (Base)

Erro base que contém:
- `message`: Mensagem técnica para logs
- `cause`: Erro original que causou o problema
- `userMessage`: Mensagem amigável para exibir ao usuário

### Tipos de Erros

#### DatabaseInitializationError

Quando o banco de dados não pode ser inicializado.

**Mensagem ao usuário:**
> Failed to initialize SessionKeeper database. Please ensure your browser supports IndexedDB and you have sufficient storage space.

**Causas comuns:**
- IndexedDB não disponível no contexto
- Permissões de storage negadas
- Modo privado com storage desabilitado

#### DatabaseNotInitializedError

Quando tentam acessar o database antes da inicialização.

**Mensagem ao usuário:**
> Database has not been initialized. Please wait for the extension to start.

**Causas comuns:**
- Chamada a `getDatabase()` antes de `initializeDatabase()`
- Race condition no startup

#### DatabaseVersionError

Conflito de versão do schema.

**Mensagem ao usuário:**
> Database version conflict detected. Please try disabling and re-enabling the extension.

**Causas comuns:**
- Downgrade de versão da extensão
- Corrupção do metadata do database
- Cache inconsistente do browser

#### QuotaExceededError

Limite de armazenamento excedido.

**Mensagem ao usuário:**
> Storage quota exceeded. Please free up space by removing old sessions or increasing browser storage limits.

**Causas comuns:**
- Muitas sessões salvas
- Tabs com URLs muito longas
- Limite de quota do browser atingido

## Como Usar

### Capturando Erros

```typescript
import { initializeDatabase, isDatabaseError, getErrorMessage } from './storage';

try {
  await initializeDatabase();
} catch (error) {
  if (isDatabaseError(error)) {
    // Erro específico do database
    console.error('Database error:', error.message);
    showUserMessage(error.getUserMessage());
  } else {
    // Erro genérico
    const { technical, user } = getErrorMessage(error);
    console.error('Unexpected error:', technical);
    showUserMessage(user);
  }
}
```

### Lançando Erros Customizados

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

Extrai mensagens técnicas e user-friendly de qualquer erro:

```typescript
const { technical, user } = getErrorMessage(error);

console.error('Technical:', technical);  // Para logs
alert(user);  // Para o usuário
```

## Notificações

O service worker exibe notificações do Chrome em caso de erro:

```typescript
chrome.notifications.create({
  type: 'basic',
  iconUrl: 'icons/icon48.png',
  title: 'SessionKeeper Error',
  message: error.getUserMessage(),
  priority: 2,  // Alta prioridade para erros
});
```

## Boas Práticas

### ✅ Faça

- Sempre capture erros em operações assíncronas
- Use `getErrorMessage()` para extrair mensagens
- Log mensagens técnicas no console
- Exiba apenas mensagens user-friendly ao usuário
- Use tipos de erro específicos quando apropriado

### ❌ Não faça

- Nunca mostre stack traces ao usuário
- Não ignore erros silenciosamente
- Não faça throw de strings (use Error objects)
- Não exponha detalhes técnicos sensíveis

## Testando

Execute os testes de erro:

```bash
bun test src/storage/errors.test.ts
```

## Logging

Erros são logados com contexto completo:

```typescript
console.error('Failed to initialize:', technical, error);
//                                      ^message  ^objeto completo
```

Isso permite debugging no DevTools mantendo mensagens limpas para o usuário.
