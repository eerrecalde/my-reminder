export function isDailyTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

/** Future local clock-time occurrences, including daylight-saving adjustments. */
export function nextDailyOccurrences(
  times: string[],
  after: Date,
  count: number,
  startDate?: string | null,
  endDate?: string | null,
): Date[] {
  const clockTimes = [...new Set(times)].map(time => {
    if (!isDailyTime(time)) {
      throw new Error('Invalid daily time');
    }
    return time.split(':').map(Number);
  });
  if (clockTimes.length === 0 || count <= 0) return [];
  const result: Date[] = [];
  const start = startDate
    ? localDate(startDate)
    : new Date(after.getFullYear(), after.getMonth(), after.getDate());
  const end = endDate ? localDate(endDate) : null;
  const first = new Date(
    Math.max(
      start.getTime(),
      new Date(
        after.getFullYear(),
        after.getMonth(),
        after.getDate(),
      ).getTime(),
    ),
  );
  for (let day = 0; result.length < count; day++) {
    const current = new Date(
      first.getFullYear(),
      first.getMonth(),
      first.getDate() + day,
    );
    if (end && current > end) break;
    const candidates = clockTimes.map(
      ([hour, minute]) =>
        new Date(
          current.getFullYear(),
          current.getMonth(),
          current.getDate(),
          hour,
          minute,
        ),
    );
    candidates.sort((a, b) => a.getTime() - b.getTime());
    result.push(
      ...candidates.filter(
        (date, index) =>
          date.getTime() > after.getTime() &&
          (index === 0 || date.getTime() !== candidates[index - 1].getTime()),
      ),
    );
  }
  return result.slice(0, count);
}

export function localDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function localDateString(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function finalDailyOccurrence(
  times: string[],
  endDate: string,
): Date | undefined {
  const day = localDate(endDate);
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

/** A single daily time bounded to one date represents a one-off reminder. */
export function isOneOffSchedule(schedule: {
  scheduleKind?: string;
  times: string[];
  startDate?: string | null;
  endDate?: string | null;
}): boolean {
  return (
    (schedule.scheduleKind == null || schedule.scheduleKind === 'daily') &&
    !!schedule.startDate &&
    schedule.startDate === schedule.endDate &&
    schedule.times.length === 1
  );
}
