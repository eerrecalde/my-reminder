import { isDailyTime, localDate } from './dailySchedule';

export type MonthlyDay = number | 'last';
export type ShortMonth = 'last' | 'skip';

function monthlyDate(
  year: number,
  month: number,
  day: MonthlyDay,
  shortMonth: ShortMonth,
): Date | null {
  const last = new Date(year, month + 1, 0).getDate();
  if (day !== 'last' && (!Number.isInteger(day) || day < 1 || day > 31)) {
    throw new Error('Invalid monthly day');
  }
  if (day !== 'last' && day > last && shortMonth === 'skip') return null;
  return new Date(year, month, day === 'last' ? last : Math.min(day, last));
}

function candidates(day: Date, times: string[]): Date[] {
  return [...new Set(times)]
    .map(time => {
      if (!isDailyTime(time)) throw new Error('Invalid time');
      const [hour, minute] = time.split(':').map(Number);
      return new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        hour,
        minute,
      );
    })
    .sort((a, b) => a.getTime() - b.getTime());
}

export function nextMonthlyOccurrences(
  times: string[],
  dayOfMonth: MonthlyDay,
  shortMonth: ShortMonth,
  after: Date,
  count: number,
  startDate?: string | null,
  endDate?: string | null,
): Date[] {
  if (!times.length || count <= 0) return [];
  const start = startDate ? localDate(startDate) : null;
  const end = endDate ? localDate(endDate) : null;
  const first = start && start > after ? start : after;
  const result: Date[] = [];
  for (let offset = 0; result.length < count; offset++) {
    const month = new Date(first.getFullYear(), first.getMonth() + offset, 1);
    if (end && month > end) break;
    const day = monthlyDate(
      month.getFullYear(),
      month.getMonth(),
      dayOfMonth,
      shortMonth,
    );
    if (!day || (start && day < start) || (end && day > end)) continue;
    for (const occurrence of candidates(day, times)) {
      if (
        occurrence > after &&
        !result.some(date => date.getTime() === occurrence.getTime())
      )
        result.push(occurrence);
    }
  }
  return result.slice(0, count);
}

export function finalMonthlyOccurrence(
  times: string[],
  dayOfMonth: MonthlyDay,
  shortMonth: ShortMonth,
  startDate: string | null | undefined,
  endDate: string,
): Date | undefined {
  if (!times.length) return undefined;
  const start = startDate ? localDate(startDate) : null;
  const end = localDate(endDate);
  // A skipped day 29–31 always occurs within the preceding two months.
  for (let offset = 0; offset < 3; offset++) {
    const month = new Date(end.getFullYear(), end.getMonth() - offset, 1);
    if (
      start &&
      month.getFullYear() * 12 + month.getMonth() <
        start.getFullYear() * 12 + start.getMonth()
    )
      break;
    const day = monthlyDate(
      month.getFullYear(),
      month.getMonth(),
      dayOfMonth,
      shortMonth,
    );
    if (day && day <= end && (!start || day >= start))
      return candidates(day, times).pop();
  }
  return undefined;
}
