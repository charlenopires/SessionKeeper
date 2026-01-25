import { describe, it, expect } from 'bun:test';
import { formatRelativeDate } from './formatRelativeDate';

describe('formatRelativeDate', () => {
  it('should return "agora mesmo" for very recent dates', () => {
    const now = new Date();
    expect(formatRelativeDate(now)).toBe('agora mesmo');
  });

  it('should return minutes for dates less than an hour ago', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    expect(formatRelativeDate(fiveMinutesAgo)).toBe('há 5 minutos');
  });

  it('should return singular minute for 1 minute ago', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
    expect(formatRelativeDate(oneMinuteAgo)).toBe('há 1 minuto');
  });

  it('should return hours for dates less than a day ago', () => {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    expect(formatRelativeDate(threeHoursAgo)).toBe('há 3 horas');
  });

  it('should return singular hour for 1 hour ago', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    expect(formatRelativeDate(oneHourAgo)).toBe('há 1 hora');
  });

  it('should return days for dates less than a week ago', () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(twoDaysAgo)).toBe('há 2 dias');
  });

  it('should return singular day for 1 day ago', () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(oneDayAgo)).toBe('há 1 dia');
  });

  it('should return weeks for dates less than a month ago', () => {
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(twoWeeksAgo)).toBe('há 2 semanas');
  });

  it('should return months for dates less than a year ago', () => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(threeMonthsAgo)).toBe('há 3 meses');
  });

  it('should return years for dates more than a year ago', () => {
    const now = new Date();
    const twoYearsAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(twoYearsAgo)).toBe('há 2 anos');
  });
});
