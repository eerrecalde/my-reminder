import { nextDailyOccurrences } from '../src/dailySchedule';

test('returns the next three future occurrences across midnight', () => {
  const result = nextDailyOccurrences(
    ['09:00', '21:00'],
    new Date(2026, 5, 1, 12),
    3,
  );
  expect(result.map(date => [date.getDate(), date.getHours()])).toEqual([
    [1, 21],
    [2, 9],
    [2, 21],
  ]);
});
