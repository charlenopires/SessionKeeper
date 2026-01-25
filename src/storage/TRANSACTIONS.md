# Transactions in SessionKeeper

O sistema de transações garante atomicidade em operações compostas: todas as operações dentro de uma transação são commitadas juntas ou todas falham (rollback automático).

## Quando usar transações

### ✅ Use transações quando:

1. **Múltiplas operações dependentes**
   - Criar uma sessão e várias tags ao mesmo tempo
   - Atualizar várias sessões relacionadas
   - Deletar sessão e seus metadados associados

2. **Operações bulk**
   - Importar múltiplas sessões
   - Atualizar várias sessões de uma vez
   - Deletar múltiplas sessões

3. **Consistência crítica**
   - Operações que não podem ser parcialmente aplicadas
   - Quando falha parcial deixaria dados inconsistentes

### ❌ Não precisa de transação quando:

- Operação única e independente
- Operações de leitura apenas
- Operações já atômicas por natureza (single CRUD)

## Como usar

### Transação genérica

Use `withTransaction` para operações customizadas:

```typescript
import { withTransaction, getDatabase } from './storage';

const result = await withTransaction(async (tx) => {
  const db = getDatabase();

  // Todas as operações dentro são atômicas
  const id1 = await db.sessions.add({
    name: 'Session 1',
    tabs: [],
    tags: ['work'],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const id2 = await db.sessions.add({
    name: 'Session 2',
    tabs: [],
    tags: ['personal'],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Se qualquer operação falhar, ambas são revertidas
  return { id1, id2 };
});

if (isOk(result)) {
  console.log('Both sessions created:', result.value);
} else {
  console.error('Transaction failed:', result.error);
}
```

### Bulk operations (built-in)

Use as funções bulk que já têm transações embutidas:

```typescript
import { bulkCreateSessions, bulkUpdateSessions, bulkDeleteSessions } from './storage';

// Criar múltiplas sessões atomicamente
const result = await bulkCreateSessions([
  { name: 'Session 1', tabs: [] },
  { name: 'Session 2', tabs: [] },
  { name: 'Session 3', tabs: [] },
]);

// Atualizar múltiplas sessões atomicamente
await bulkUpdateSessions([
  { id: 1, name: 'Updated 1' },
  { id: 2, name: 'Updated 2' },
]);

// Deletar múltiplas sessões atomicamente
await bulkDeleteSessions([1, 2, 3]);
```

## Garantias ACID

### Atomicity (Atomicidade)
Todas as operações dentro da transação são aplicadas ou nenhuma é.

```typescript
// Se o update falhar, o create também é revertido
await withTransaction(async () => {
  await createSession({ name: 'New', tabs: [] });
  await updateSession({ id: 999, name: 'Will fail' }); // Não existe
});
```

### Consistency (Consistência)
Database permanece em estado válido antes e depois da transação.

### Isolation (Isolamento)
Transações concorrentes não interferem umas com as outras.

### Durability (Durabilidade)
Uma vez commitada, a transação persiste mesmo com crashes.

## Tratamento de erros

Transações retornam `Result<T, StorageError>`:

```typescript
const result = await withTransaction(async () => {
  // Seu código aqui
  return data;
});

if (isOk(result)) {
  // Sucesso - transação foi commitada
  console.log(result.value);
} else {
  // Falha - transação foi revertida automaticamente
  console.error(result.error.getUserMessage());
}
```

## Performance

### Boas práticas

✅ **Faça:**
- Mantenha transações curtas
- Execute operações pesadas fora da transação
- Use bulk operations quando possível

```typescript
// ✅ Bom: Prepare dados antes da transação
const preparedData = heavyComputation(rawData);

await withTransaction(async () => {
  await db.sessions.add(preparedData);
});
```

❌ **Não faça:**
- Transações longas que bloqueiam o database
- Operações síncronas pesadas dentro da transação
- Chamadas de rede dentro da transação

```typescript
// ❌ Ruim: Processamento pesado dentro da transação
await withTransaction(async () => {
  const data = heavyComputation(rawData); // Bloqueia DB
  await db.sessions.add(data);
});

// ❌ Ruim: Chamada de rede dentro da transação
await withTransaction(async () => {
  const response = await fetch('https://api.example.com'); // Bloqueia DB
  await db.sessions.add(response.data);
});
```

## Exemplos avançados

### Import com validação

```typescript
import { withTransaction, getDatabase } from './storage';

async function importSessions(data: ExportData): Promise<Result<number, StorageError>> {
  return withTransaction(async () => {
    const db = getDatabase();

    // Validar antes de importar
    if (data.version !== '1.0') {
      throw new DatabaseError('Unsupported version');
    }

    // Limpar dados existentes (se replace mode)
    if (data.mode === 'replace') {
      await db.sessions.clear();
    }

    // Importar todas as sessões
    const ids = await db.sessions.bulkAdd(data.sessions, { allKeys: true });

    return ids.length;
  });
}
```

### Migração de dados

```typescript
async function migrateSessionTags(): Promise<Result<number, StorageError>> {
  return withTransaction(async () => {
    const db = getDatabase();

    const sessions = await db.sessions.toArray();
    let updated = 0;

    for (const session of sessions) {
      // Migrar formato antigo para novo
      if (session.tags.includes('old-tag')) {
        session.tags = session.tags.map(tag =>
          tag === 'old-tag' ? 'new-tag' : tag
        );
        await db.sessions.put(session);
        updated++;
      }
    }

    return updated;
  });
}
```

## Debugging

Para debugar transações:

```typescript
await withTransaction(async (tx) => {
  console.log('Transaction started');

  try {
    // Suas operações
    const result = await someOperation();
    console.log('Operation succeeded:', result);
    return result;
  } catch (error) {
    console.error('Transaction will rollback:', error);
    throw error; // Re-throw para triggerar rollback
  }
});
```

## Limitações

1. **Não pode usar async callbacks de array methods dentro de transactions**
   ```typescript
   // ❌ Não funciona
   await withTransaction(async () => {
     await Promise.all(items.map(async item => {
       await db.sessions.add(item);
     }));
   });

   // ✅ Use loop normal
   await withTransaction(async () => {
     for (const item of items) {
       await db.sessions.add(item);
     }
   });
   ```

2. **IndexedDB limites**
   - Transações têm timeout (geralmente 10-30 segundos)
   - Não pode ter transações aninhadas
   - Transação é auto-commitada ao fim da função

## Referências

- [Dexie.js Transactions](https://dexie.org/docs/Tutorial/Design#transactions)
- [IndexedDB Transactions](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction)
