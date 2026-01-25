# Database Migrations

O SessionKeeper usa Dexie.js para gerenciar migrations do IndexedDB de forma automática.

## Como funciona

### Sistema de Versionamento

Cada versão do schema é declarada usando `this.version(N).stores({...})`. O Dexie.js:

1. Detecta automaticamente a versão atual do database do usuário
2. Executa todas as migrations necessárias sequencialmente
3. Atualiza o database para a versão mais recente

### Versão 1 (Atual)

Schema inicial com três stores:

- **sessions**: Armazena sessões do browser
  - Índices: `++id, name, createdAt, updatedAt, *tags`
  - Multi-entry index em `tags` permite buscar por múltiplas tags

- **tags**: Tags para categorizar sessões
  - Índices: `++id, &name, createdAt`
  - Unique index em `name` previne duplicatas

- **settings**: Configurações do app
  - Índices: `++id, &key, updatedAt`
  - Unique index em `key` garante uma setting por chave

## Como adicionar uma migration

### 1. Incremente a versão

```typescript
this.version(2).stores({
  // Declare TODAS as tabelas, mesmo as não modificadas
  sessions: '++id, name, createdAt, updatedAt, *tags',
  tags: '++id, &name, createdAt',
  settings: '++id, &key, updatedAt',
})
```

### 2. Adicione upgrade handler (opcional)

Use `.upgrade()` para transformar dados existentes:

```typescript
this.version(2)
  .stores({...})
  .upgrade(async (tx) => {
    // Adicionar campo com valor padrão
    await tx.table('sessions').toCollection().modify((session) => {
      session.archived = false;
    });

    // Migrar dados
    const sessions = await tx.table('sessions').toArray();
    for (const session of sessions) {
      if (!session.description) {
        session.description = `Session created on ${session.createdAt}`;
        await tx.table('sessions').put(session);
      }
    }
  });
```

### 3. Atualize TypeScript interfaces

Sempre mantenha as interfaces sincronizadas com o schema:

```typescript
export interface Session {
  id?: number;
  name: string;
  archived?: boolean; // Novo campo
  // ...
}
```

## Regras importantes

### ✅ Faça

- Sempre declare TODAS as tabelas em cada versão, mesmo as não modificadas
- Use `.upgrade()` quando precisar transformar dados existentes
- Teste migrations com dados reais antes de deployar
- Documente o propósito de cada migration neste arquivo

### ❌ Não faça

- Nunca remova ou modifique uma migration já deployada
- Não pule números de versão (use 1, 2, 3, não 1, 3, 5)
- Não dependa de ordem específica de execução das migrations
- Não use `null` como valor default em migrations (use undefined)

## Testando migrations

Para testar uma migration localmente:

1. Instale a extensão com versão N
2. Crie dados de teste
3. Atualize para versão N+1
4. Verifique no DevTools (Application > IndexedDB) se a migration funcionou
5. Verifique logs no console da extensão

## Rollback

IndexedDB não suporta rollback automático. Para reverter:

1. Usuário deve desinstalar a extensão
2. Dados serão perdidos (considere implementar export/backup)

## Performance

- Migrations executam apenas uma vez por versão
- Dexie.js usa transactions para garantir atomicidade
- Migrations grandes podem travar a UI (use batch processing)
