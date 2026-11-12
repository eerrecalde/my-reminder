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
