/**
 * Formats a date as a relative time string in Portuguese
 * @param date The date to format
 * @returns A string like "há 2 dias", "há 1 hora", etc.
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) {
    return 'agora mesmo';
  }

  if (diffMinutes < 60) {
    return diffMinutes === 1 ? 'há 1 minuto' : `há ${diffMinutes} minutos`;
  }

  if (diffHours < 24) {
    return diffHours === 1 ? 'há 1 hora' : `há ${diffHours} horas`;
  }

  if (diffDays < 7) {
    return diffDays === 1 ? 'há 1 dia' : `há ${diffDays} dias`;
  }

  if (diffWeeks < 4) {
    return diffWeeks === 1 ? 'há 1 semana' : `há ${diffWeeks} semanas`;
  }

  if (diffMonths < 12) {
    return diffMonths === 1 ? 'há 1 mês' : `há ${diffMonths} meses`;
  }

  const diffYears = Math.floor(diffMonths / 12);
  return diffYears === 1 ? 'há 1 ano' : `há ${diffYears} anos`;
}
