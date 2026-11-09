import { isDailyTime, localDate } from './dailySchedule';

// ISO weekdays: Monday is 1 and Sunday is 7.
function selected(day: Date, weekdays: number[]): boolean {
  return weekdays.includes(day.getDay() || 7);
}

export function nextWeekdayOccurrences(
  times: string[],
  weekdays: number[],
  after: Date,
  count: number,
  startDate?: string | null,
  endDate?: string | null,
): Date[] {
  if (!weekdays.length || !times.length || count <= 0) return [];
  if (
    weekdays.some(day => !Number.isInteger(day) || day < 1 || day > 7) ||
    times.some(time => !isDailyTime(time))
  )
    throw new Error('Invalid weekday schedule');
  const start = startDate
    ? localDate(startDate)
    : new Date(after.getFullYear(), after.getMonth(), after.getDate());
  const today = new Date(
    after.getFullYear(),
    after.getMonth(),
    after.getDate(),
  );
  const first = new Date(Math.max(start.getTime(), today.getTime()));
  const end = endDate ? localDate(endDate) : null;
  const result: Date[] = [];
  for (let offset = 0; result.length < count; offset++) {
    const day = new Date(
      first.getFullYear(),
      first.getMonth(),
      first.getDate() + offset,
    );
    if (end && day > end) break;
    if (!selected(day, weekdays)) continue;
    const candidates = [...new Set(times)]
      .map(time => {
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
    result.push(
      ...candidates.filter(
        (date, index) =>
          date > after &&
          (index === 0 || date.getTime() !== candidates[index - 1].getTime()),
      ),
    );
  }
  return result.slice(0, count);
}

export function finalWeekdayOccurrence(
  times: string[],
  weekdays: number[],
  endDate: string,
): Date | undefined {
  if (!times.length || !weekdays.length) return undefined;
  if (
    weekdays.some(day => !Number.isInteger(day) || day < 1 || day > 7) ||
    times.some(time => !isDailyTime(time))
  )
    throw new Error('Invalid weekday schedule');
  const end = localDate(endDate);
  for (let offset = 0; offset < 7; offset++) {
    const day = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate() - offset,
    );
    if (selected(day, weekdays)) {
      return times
        .map(time => {
          const [hour, minute] = time.split(':').map(Number);
          return new Date(
            day.getFullYear(),
            day.getMonth(),
            day.getDate(),
            hour,
            minute,
          );
        })
        .sort((a, b) => b.getTime() - a.getTime())[0];
    }
  }
  return undefined;
}
