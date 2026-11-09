import {
  finalMonthlyOccurrence,
  nextMonthlyOccurrences,
} from '../src/monthlySchedule';

test('uses the last day in short months including leap February', () => {
  const dates = nextMonthlyOccurrences(
    ['09:00'],
    31,
    'last',
    new Date(2024, 0, 31, 10),
    3,
  );
  expect(
    dates.map(d => [
      d.getFullYear(),
      d.getMonth() + 1,
      d.getDate(),
      d.getHours(),
    ]),
  ).toEqual([
    [2024, 2, 29, 9],
    [2024, 3, 31, 9],
    [2024, 4, 30, 9],
  ]);
});

test('skips short months and finds the final occurrence within date bounds', () => {
  const dates = nextMonthlyOccurrences(
    ['09:00', '21:00'],
    31,
    'skip',
    new Date(2026, 0, 31, 22),
    3,
    '2026-02-01',
    '2026-05-30',
  );
  expect(dates.map(d => [d.getMonth() + 1, d.getDate(), d.getHours()])).toEqual(
    [
      [3, 31, 9],
      [3, 31, 21],
    ],
  );
  expect(
    finalMonthlyOccurrence(
      ['09:00', '21:00'],
      31,
      'skip',
      '2026-02-01',
      '2026-05-30',
    ),
  ).toEqual(new Date(2026, 2, 31, 21));
  expect(
    finalMonthlyOccurrence(['09:00'], 31, 'skip', '2026-04-01', '2026-05-30'),
  ).toBeUndefined();
});

test('last-day schedules follow local clock across daylight saving time', () => {
  const dates = nextMonthlyOccurrences(
    ['09:00'],
    'last',
    'last',
    new Date(2026, 1, 28, 10),
    2,
  );
  expect(dates.map(d => [d.getMonth(), d.getDate(), d.getHours()])).toEqual([
    [2, 31, 9],
    [3, 30, 9],
  ]);
});
