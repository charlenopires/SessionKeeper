import { describe, it, expect } from 'bun:test';
import { formatRelativeDate } from './formatRelativeDate';

describe('formatRelativeDate', () => {
  it('should return "just now" for very recent dates', () => {
    const now = new Date();
    expect(formatRelativeDate(now)).toBe('just now');
  });

  it('should return minutes for dates less than an hour ago', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    expect(formatRelativeDate(fiveMinutesAgo)).toBe('5 minutes ago');
  });

  it('should return singular minute for 1 minute ago', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
    expect(formatRelativeDate(oneMinuteAgo)).toBe('1 minute ago');
  });

  it('should return hours for dates less than a day ago', () => {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    expect(formatRelativeDate(threeHoursAgo)).toBe('3 hours ago');
  });

  it('should return singular hour for 1 hour ago', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    expect(formatRelativeDate(oneHourAgo)).toBe('1 hour ago');
  });

  it('should return days for dates less than a week ago', () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(twoDaysAgo)).toBe('2 days ago');
  });

  it('should return singular day for 1 day ago', () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(oneDayAgo)).toBe('1 day ago');
  });

  it('should return weeks for dates less than a month ago', () => {
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(twoWeeksAgo)).toBe('2 weeks ago');
  });

  it('should return months for dates less than a year ago', () => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(threeMonthsAgo)).toBe('3 months ago');
  });

  it('should return years for dates more than a year ago', () => {
    const now = new Date();
    const twoYearsAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(twoYearsAgo)).toBe('2 years ago');
  });
});
