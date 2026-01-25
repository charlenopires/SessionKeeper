import {
  getAllSessions,
  createSession,
  bulkDeleteSessions,
  getAllTags,
  createTag,
  Result,
  Ok,
  Err,
  isOk,
} from '../storage';
import {
  exportedToSession,
  exportedToTag,
  type ExportData,
  type ImportStrategy,
  type ImportResult,
  type ImportError,
} from './types';

/**
 * Error during import operation
 */
export class ImportValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly userMessage?: string
  ) {
    super(message);
    this.name = 'ImportValidationError';
  }

  getUserMessage(): string {
    return this.userMessage || 'Arquivo de importação inválido.';
  }
}

/**
 * Validation result for import data
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

/**
 * Validates that a value is a non-empty string
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates that a value is a valid ISO date string
 */
function isValidISODate(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Validates a single exported session
 */
function validateExportedSession(session: unknown, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Sessão ${index + 1}`;

  if (!session || typeof session !== 'object') {
    errors.push(`${prefix}: deve ser um objeto`);
    return errors;
  }

  const s = session as Record<string, unknown>;

  if (!isNonEmptyString(s.id)) {
    errors.push(`${prefix}: campo 'id' é obrigatório`);
  }

  if (!isNonEmptyString(s.name)) {
    errors.push(`${prefix}: campo 'name' é obrigatório`);
  }

  if (!Array.isArray(s.windows)) {
    errors.push(`${prefix}: campo 'windows' deve ser um array`);
  } else {
    for (let i = 0; i < s.windows.length; i++) {
      const w = s.windows[i] as Record<string, unknown>;
      if (!w || typeof w !== 'object') {
        errors.push(`${prefix}, Janela ${i + 1}: deve ser um objeto`);
        continue;
      }
      if (typeof w.windowId !== 'number') {
        errors.push(`${prefix}, Janela ${i + 1}: campo 'windowId' deve ser um número`);
      }
      if (!Array.isArray(w.tabs)) {
        errors.push(`${prefix}, Janela ${i + 1}: campo 'tabs' deve ser um array`);
      } else {
        for (let j = 0; j < w.tabs.length; j++) {
          const t = w.tabs[j] as Record<string, unknown>;
          if (!t || typeof t !== 'object') {
            errors.push(`${prefix}, Janela ${i + 1}, Aba ${j + 1}: deve ser um objeto`);
            continue;
          }
          if (!isNonEmptyString(t.url)) {
            errors.push(`${prefix}, Janela ${i + 1}, Aba ${j + 1}: campo 'url' é obrigatório`);
          }
          if (!isNonEmptyString(t.title)) {
            errors.push(`${prefix}, Janela ${i + 1}, Aba ${j + 1}: campo 'title' é obrigatório`);
          }
        }
      }
    }
  }

  if (!Array.isArray(s.tags)) {
    errors.push(`${prefix}: campo 'tags' deve ser um array`);
  }

  if (!isValidISODate(s.createdAt)) {
    errors.push(`${prefix}: campo 'createdAt' deve ser uma data válida`);
  }

  if (!isValidISODate(s.updatedAt)) {
    errors.push(`${prefix}: campo 'updatedAt' deve ser uma data válida`);
  }

  return errors;
}

/**
 * Validates a single exported tag
 */
function validateExportedTag(tag: unknown, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Tag ${index + 1}`;

  if (!tag || typeof tag !== 'object') {
    errors.push(`${prefix}: deve ser um objeto`);
    return errors;
  }

  const t = tag as Record<string, unknown>;

  if (!isNonEmptyString(t.name)) {
    errors.push(`${prefix}: campo 'name' é obrigatório`);
  }

  if (!isValidISODate(t.createdAt)) {
    errors.push(`${prefix}: campo 'createdAt' deve ser uma data válida`);
  }

  return errors;
}

/**
 * Validates the complete export data structure
 */
export function validateExportData(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Arquivo deve conter um objeto JSON válido'] };
  }

  const d = data as Record<string, unknown>;

  // Validate version
  if (!isNonEmptyString(d.version)) {
    errors.push("Campo 'version' é obrigatório");
  }

  // Validate exportedAt
  if (!isValidISODate(d.exportedAt)) {
    errors.push("Campo 'exportedAt' deve ser uma data válida");
  }

  // Validate sessions array
  if (!Array.isArray(d.sessions)) {
    errors.push("Campo 'sessions' deve ser um array");
  } else {
    for (let i = 0; i < d.sessions.length; i++) {
      errors.push(...validateExportedSession(d.sessions[i], i));
    }
  }

  // Validate tags array
  if (!Array.isArray(d.tags)) {
    errors.push("Campo 'tags' deve ser um array");
  } else {
    for (let i = 0; i < d.tags.length; i++) {
      errors.push(...validateExportedTag(d.tags[i], i));
    }
  }

  // Validate tag references in sessions
  if (Array.isArray(d.sessions) && Array.isArray(d.tags)) {
    const tagNames = new Set(
      (d.tags as Array<{ name?: unknown }>)
        .filter(t => typeof t?.name === 'string')
        .map(t => (t.name as string).toLowerCase())
    );

    for (let i = 0; i < d.sessions.length; i++) {
      const session = d.sessions[i] as Record<string, unknown>;
      if (Array.isArray(session?.tags)) {
        for (const tagName of session.tags) {
          if (typeof tagName === 'string' && !tagNames.has(tagName.toLowerCase())) {
            errors.push(`Sessão ${i + 1}: tag '${tagName}' não existe no array de tags`);
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Parses JSON string and validates against export schema
 */
export function parseAndValidateJson(jsonString: string): Result<ExportData, ImportValidationError> {
  // Try to parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return Err(new ImportValidationError(
      'Invalid JSON',
      undefined,
      'O arquivo não contém JSON válido. Verifique se o arquivo não está corrompido.'
    ));
  }

  // Validate structure
  const validation = validateExportData(parsed);
  if (!validation.isValid) {
    const firstErrors = validation.errors.slice(0, 3);
    const moreCount = validation.errors.length - 3;
    let message = firstErrors.join('; ');
    if (moreCount > 0) {
      message += `; e mais ${moreCount} erro(s)`;
    }

    return Err(new ImportValidationError(
      `Validation failed: ${validation.errors.join(', ')}`,
      undefined,
      `Estrutura do arquivo inválida: ${message}`
    ));
  }

  return Ok(parsed as ExportData);
}

/**
 * Reads a file and returns its content as string
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'));
    reader.readAsText(file);
  });
}

/**
 * Opens a file picker dialog for JSON files
 */
export function openFilePicker(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = () => {
      const file = input.files?.[0] || null;
      resolve(file);
    };

    input.oncancel = () => {
      resolve(null);
    };

    input.click();
  });
}

/**
 * Imports sessions using merge strategy
 * Adds imported sessions without removing existing ones
 * Generates new UUIDs for sessions with conflicting IDs
 */
async function importWithMerge(
  data: ExportData
): Promise<Result<ImportResult, ImportValidationError>> {
  const errors: ImportError[] = [];
  let sessionsImported = 0;
  let tagsImported = 0;
  let totalTabs = 0;

  try {
    // Get existing session IDs to check for conflicts
    const existingSessionsResult = await getAllSessions();
    if (!isOk(existingSessionsResult)) {
      return Err(new ImportValidationError(
        'Failed to get existing sessions',
        undefined,
        'Não foi possível verificar sessões existentes.'
      ));
    }
    const existingIds = new Set(existingSessionsResult.value.map(s => s.id));

    // Get existing tags to merge by name
    const existingTagsResult = await getAllTags();
    if (!isOk(existingTagsResult)) {
      return Err(new ImportValidationError(
        'Failed to get existing tags',
        undefined,
        'Não foi possível verificar tags existentes.'
      ));
    }
    const existingTagNames = new Set(existingTagsResult.value.map(t => t.name.toLowerCase()));

    // Import tags (only new ones)
    for (const exportedTag of data.tags) {
      if (!existingTagNames.has(exportedTag.name.toLowerCase())) {
        const tagData = exportedToTag(exportedTag);
        const result = await createTag({ name: tagData.name, color: tagData.color });
        if (isOk(result)) {
          tagsImported++;
        } else {
          errors.push({
            type: 'tag',
            message: `Falha ao importar tag '${exportedTag.name}'`,
            details: String(result.error),
          });
        }
      }
    }

    // Import sessions
    for (const exportedSession of data.sessions) {
      // Check for ID conflict and generate new UUID if needed
      let sessionId = exportedSession.id;
      if (existingIds.has(sessionId)) {
        sessionId = crypto.randomUUID();
      }

      const sessionData = exportedToSession(exportedSession, sessionId);
      const result = await createSession({
        name: sessionData.name,
        description: sessionData.description,
        windows: sessionData.windows,
        tags: sessionData.tags,
      });

      if (isOk(result)) {
        sessionsImported++;
        totalTabs += exportedSession.totalTabs;
      } else {
        errors.push({
          type: 'session',
          message: `Falha ao importar sessão '${exportedSession.name}'`,
          details: String(result.error),
        });
      }
    }

    return Ok({
      sessionsImported,
      tagsImported,
      totalTabs,
      errors,
    });
  } catch (error) {
    return Err(new ImportValidationError(
      'Import failed',
      undefined,
      'Erro inesperado durante a importação.'
    ));
  }
}

/**
 * Imports sessions using replace strategy
 * Removes all existing sessions before importing
 */
async function importWithReplace(
  data: ExportData
): Promise<Result<ImportResult, ImportValidationError>> {
  const errors: ImportError[] = [];
  let sessionsImported = 0;
  let tagsImported = 0;
  let totalTabs = 0;

  try {
    // Delete all existing sessions
    const existingSessionsResult = await getAllSessions();
    if (!isOk(existingSessionsResult)) {
      return Err(new ImportValidationError(
        'Failed to get existing sessions',
        undefined,
        'Não foi possível acessar sessões existentes.'
      ));
    }

    const existingIds = existingSessionsResult.value.map(s => s.id);
    if (existingIds.length > 0) {
      const deleteResult = await bulkDeleteSessions(existingIds);
      if (!isOk(deleteResult)) {
        return Err(new ImportValidationError(
          'Failed to delete existing sessions',
          undefined,
          'Não foi possível remover sessões existentes.'
        ));
      }
    }

    // Get existing tags to merge by name
    const existingTagsResult = await getAllTags();
    if (!isOk(existingTagsResult)) {
      return Err(new ImportValidationError(
        'Failed to get existing tags',
        undefined,
        'Não foi possível verificar tags existentes.'
      ));
    }
    const existingTagNames = new Set(existingTagsResult.value.map(t => t.name.toLowerCase()));

    // Import tags (only new ones)
    for (const exportedTag of data.tags) {
      if (!existingTagNames.has(exportedTag.name.toLowerCase())) {
        const tagData = exportedToTag(exportedTag);
        const result = await createTag({ name: tagData.name, color: tagData.color });
        if (isOk(result)) {
          tagsImported++;
        } else {
          errors.push({
            type: 'tag',
            message: `Falha ao importar tag '${exportedTag.name}'`,
            details: String(result.error),
          });
        }
      }
    }

    // Import all sessions with original IDs
    for (const exportedSession of data.sessions) {
      const sessionData = exportedToSession(exportedSession);
      const result = await createSession({
        name: sessionData.name,
        description: sessionData.description,
        windows: sessionData.windows,
        tags: sessionData.tags,
      });

      if (isOk(result)) {
        sessionsImported++;
        totalTabs += exportedSession.totalTabs;
      } else {
        errors.push({
          type: 'session',
          message: `Falha ao importar sessão '${exportedSession.name}'`,
          details: String(result.error),
        });
      }
    }

    return Ok({
      sessionsImported,
      tagsImported,
      totalTabs,
      errors,
    });
  } catch (error) {
    return Err(new ImportValidationError(
      'Import failed',
      undefined,
      'Erro inesperado durante a importação.'
    ));
  }
}

/**
 * Imports sessions from export data using the specified strategy
 */
export async function importFromData(
  data: ExportData,
  strategy: ImportStrategy
): Promise<Result<ImportResult, ImportValidationError>> {
  if (strategy === 'merge') {
    return importWithMerge(data);
  } else {
    return importWithReplace(data);
  }
}

/**
 * Complete import flow: opens file picker, reads file, validates, and imports
 */
export async function importSessions(
  strategy: ImportStrategy
): Promise<Result<ImportResult, ImportValidationError>> {
  // Open file picker
  const file = await openFilePicker();
  if (!file) {
    return Err(new ImportValidationError(
      'No file selected',
      undefined,
      'Nenhum arquivo selecionado.'
    ));
  }

  // Read file content
  let content: string;
  try {
    content = await readFileAsText(file);
  } catch (error) {
    return Err(new ImportValidationError(
      'Failed to read file',
      undefined,
      'Não foi possível ler o arquivo selecionado.'
    ));
  }

  // Parse and validate
  const parseResult = parseAndValidateJson(content);
  if (!isOk(parseResult)) {
    return parseResult;
  }

  // Import with selected strategy
  return importFromData(parseResult.value, strategy);
}
