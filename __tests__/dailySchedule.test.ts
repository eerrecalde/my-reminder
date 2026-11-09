import {
  finalDailyOccurrence,
  nextDailyOccurrences,
} from '../src/dailySchedule';

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

const isLondon =
  new Date('2026-03-29T00:00:00Z').getTimezoneOffset() === 0 &&
  new Date('2026-03-29T03:00:00Z').getTimezoneOffset() === -60;
(isLondon ? test : test.skip)(
  'previews one occurrence when two local times converge in the spring gap',
  () => {
    const result = nextDailyOccurrences(
      ['01:30', '02:30'],
      new Date('2026-03-29T00:00:00Z'),
      3,
    );
    expect(result.map(date => date.toISOString())).toEqual([
      '2026-03-29T01:30:00.000Z',
      '2026-03-30T00:30:00.000Z',
      '2026-03-30T01:30:00.000Z',
    ]);
  },
);

test('honours start and inclusive end dates with multiple times', () => {
  const next = nextDailyOccurrences(
    ['09:00', '21:00'],
    new Date(2026, 5, 1, 12),
    3,
    '2026-06-03',
    '2026-06-03',
  );
  expect(next.map(date => [date.getDate(), date.getHours()])).toEqual([
    [3, 9],
    [3, 21],
  ]);
  expect(
    finalDailyOccurrence(['09:00', '21:00'], '2026-06-03')?.getHours(),
  ).toBe(21);
  expect(
    nextDailyOccurrences(
      ['09:00'],
      new Date(2026, 5, 4),
      3,
      '2026-06-03',
      '2026-06-03',
    ),
  ).toEqual([]);
});
