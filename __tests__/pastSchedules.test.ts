import { hasFutureOccurrence } from '../src/pastSchedules';

const base = {
  type: 'reminder' as const,
  name: 'Test',
  instructions: '',
  mode: 'notification' as const,
  times: ['09:00', '17:00'],
  startDate: '2026-11-12',
  endDate: '2026-11-12',
};

test('an inclusive end date retains later times today', () => {
  expect(hasFutureOccurrence(base, new Date(2026, 10, 12, 12))).toBe(true);
  expect(hasFutureOccurrence(base, new Date(2026, 10, 12, 18))).toBe(false);
});

test.each([
  ['one-off', { times: ['09:00'] }, new Date(2026, 10, 12, 8), true],
  ['one-off ended', { times: ['09:00'] }, new Date(2026, 10, 12, 10), false],
  [
    'weekday',
    { scheduleKind: 'weekday' as const, weekdays: [4] },
    new Date(2026, 10, 12, 12),
    true,
  ],
  [
    'weekday ended',
    { scheduleKind: 'weekday' as const, weekdays: [3] },
    new Date(2026, 10, 12, 8),
    false,
  ],
  [
    'monthly',
    { scheduleKind: 'monthly' as const, monthlyDay: 12 },
    new Date(2026, 10, 12, 12),
    true,
  ],
  [
    'monthly ended',
    { scheduleKind: 'monthly' as const, monthlyDay: 11 },
    new Date(2026, 10, 12, 8),
    false,
  ],
  [
    'interval',
    {
      scheduleKind: 'interval' as const,
      intervalAnchor: new Date(2026, 10, 12, 9).getTime(),
      intervalHours: 6,
    },
    new Date(2026, 10, 12, 12),
    true,
  ],
  [
    'interval ended',
    {
      scheduleKind: 'interval' as const,
      intervalAnchor: new Date(2026, 10, 12, 9).getTime(),
      intervalHours: 24,
    },
    new Date(2026, 10, 12, 12),
    false,
  ],
])(
  '%s follows the scheduled final occurrence',
  (_label, changes, now, expected) => {
    expect(hasFutureOccurrence({ ...base, ...changes }, now as Date)).toBe(
      expected,
    );
  },
);

test('uses local clock times on a daylight-saving transition date', () => {
  const schedule = {
    ...base,
    times: ['00:30', '02:30'],
    startDate: '2026-03-29',
    endDate: '2026-03-29',
  };
  expect(hasFutureOccurrence(schedule, new Date(2026, 2, 29, 0, 45))).toBe(
    true,
  );
  expect(hasFutureOccurrence(schedule, new Date(2026, 2, 29, 3, 0))).toBe(
    false,
  );
});
