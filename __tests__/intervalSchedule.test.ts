import { finalIntervalOccurrence, nextIntervalOccurrences } from '../src/intervalSchedule';

test('keeps a past anchor cadence and previews overnight elapsed intervals', () => {
  const dates = nextIntervalOccurrences(new Date('2026-03-28T21:00:00Z'), 6, new Date('2026-03-29T00:00:00Z'), 3);
  expect(dates.map(d => d.toISOString())).toEqual([
    '2026-03-29T03:00:00.000Z', '2026-03-29T09:00:00.000Z', '2026-03-29T15:00:00.000Z',
  ]);
});

test('honours the inclusive end date and calculates the final occurrence', () => {
  const anchor = new Date(2026, 5, 1, 23);
  const after = new Date(2026, 5, 2, 0);
  const expected = [new Date(2026, 5, 2, 5), new Date(2026, 5, 2, 11), new Date(2026, 5, 2, 17), new Date(2026, 5, 2, 23)];
  expect(nextIntervalOccurrences(anchor, 6, after, 8, '2026-06-02')).toEqual(expected);
  expect(finalIntervalOccurrence(anchor, 6, '2026-06-02')).toEqual(expected[3]);
  expect(nextIntervalOccurrences(anchor, 6, expected[3], 1, '2026-06-02')).toEqual([]);
});

test('rejects nonpositive or fractional hours', () => {
  for (const hours of [0, -1, 1.5]) {
    expect(() => nextIntervalOccurrences(new Date(), hours, new Date(), 1)).toThrow();
  }
});
