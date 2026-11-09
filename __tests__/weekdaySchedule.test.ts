import {
  finalWeekdayOccurrence,
  nextWeekdayOccurrences,
} from '../src/weekdaySchedule';

test('previews selected weekdays and inclusive end with multiple times', () => {
  const next = nextWeekdayOccurrences(
    ['09:00', '21:00'],
    [1, 3],
    new Date(2026, 5, 1, 12),
    3,
    '2026-06-02',
    '2026-06-08',
  );
  expect(next.map(date => [date.getDate(), date.getHours()])).toEqual([
    [3, 9],
    [3, 21],
    [8, 9],
  ]);
  const final = finalWeekdayOccurrence(
    ['09:00', '21:00'],
    [1, 3],
    '2026-06-07',
  );
  expect([final?.getDate(), final?.getHours()]).toEqual([3, 21]);
});

test('returns no occurrences when selected days fall outside the date range', () => {
  expect(
    nextWeekdayOccurrences(
      ['09:00'],
      [1],
      new Date(2026, 5, 1),
      3,
      '2026-06-02',
      '2026-06-07',
    ),
  ).toEqual([]);
});

const isLondon =
  new Date('2026-03-29T00:00:00Z').getTimezoneOffset() === 0 &&
  new Date('2026-03-29T03:00:00Z').getTimezoneOffset() === -60;
(isLondon ? test : test.skip)(
  'handles the spring gap and autumn overlap once',
  () => {
    expect(
      nextWeekdayOccurrences(
        ['01:30', '02:30'],
        [7],
        new Date('2026-03-29T00:00:00Z'),
        2,
      ).map(d => d.toISOString()),
    ).toEqual(['2026-03-29T01:30:00.000Z', '2026-04-05T00:30:00.000Z']);
    expect(
      nextWeekdayOccurrences(
        ['01:30'],
        [7],
        new Date('2026-10-25T00:45:00Z'),
        1,
      )[0].toISOString(),
    ).toBe('2026-11-01T01:30:00.000Z');
  },
);
