import { localDate } from './dailySchedule';

const HOUR = 60 * 60 * 1000;

/** Occurrences are elapsed hours from the original instant, regardless of clock changes. */
export function nextIntervalOccurrences(
  anchor: Date,
  hours: number,
  after: Date,
  count: number,
  endDate?: string | null,
): Date[] {
  if (!Number.isSafeInteger(hours) || hours <= 0 || !Number.isFinite(anchor.getTime())) {
    throw new Error('Invalid interval schedule');
  }
  const interval = hours * HOUR;
  const end = endDate ? localDate(endDate) : null;
  if (end) end.setDate(end.getDate() + 1);
  let index = Math.max(0, Math.floor((after.getTime() - anchor.getTime()) / interval) + 1);
  const result: Date[] = [];
  while (result.length < count) {
    const value = anchor.getTime() + index * interval;
    if (!Number.isFinite(value) || (end && value >= end.getTime())) break;
    const occurrence = new Date(value);
    if (!Number.isFinite(occurrence.getTime())) break;
    result.push(occurrence);
    index++;
  }
  return result;
}

export function finalIntervalOccurrence(
  anchor: Date,
  hours: number,
  endDate: string,
): Date | undefined {
  if (!Number.isSafeInteger(hours) || hours <= 0 || !Number.isFinite(anchor.getTime())) {
    throw new Error('Invalid interval schedule');
  }
  const end = localDate(endDate);
  end.setDate(end.getDate() + 1);
  const index = Math.ceil((end.getTime() - anchor.getTime()) / (hours * HOUR)) - 1;
  return index < 0 ? undefined : new Date(anchor.getTime() + index * hours * HOUR);
}
