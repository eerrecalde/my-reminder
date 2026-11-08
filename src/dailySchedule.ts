/** Future local clock-time occurrences, including daylight-saving adjustments. */
export function nextDailyOccurrences(
  times: string[],
  after: Date,
  count: number,
): Date[] {
  const clockTimes = [...new Set(times)].map(time => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      throw new Error('Invalid daily time');
    }
    return time.split(':').map(Number);
  });
  if (clockTimes.length === 0 || count <= 0) return [];
  const result: Date[] = [];
  for (let day = 0; result.length < count; day++) {
    const candidates = clockTimes.map(
      ([hour, minute]) =>
        new Date(
          after.getFullYear(),
          after.getMonth(),
          after.getDate() + day,
          hour,
          minute,
        ),
    );
    candidates.sort((a, b) => a.getTime() - b.getTime());
    result.push(...candidates.filter(date => date.getTime() > after.getTime()));
  }
  return result.slice(0, count);
}
