import { matchesSetup } from '../src/duplicateSetup';
import type { DailyMedicineInput } from '../src/MedicineSetup';

const base: DailyMedicineInput = { type: 'reminder', name: ' Café  time ', instructions: '', mode: 'notification', times: ['09:00', '18:00'], startDate: '2026-01-01', endDate: null };

test.each([
  [{ scheduleKind: 'daily' }, { times: ['18:00', '09:00', '09:00'] }, { times: ['09:01'] }],
  [{ scheduleKind: 'weekday', weekdays: [1, 5] }, { weekdays: [5, 1] }, { weekdays: [1, 4] }],
  [{ scheduleKind: 'interval', intervalHours: 8, intervalAnchor: 1000 }, { times: ['10:00'] }, { intervalHours: 12 }],
  [{ scheduleKind: 'monthly', monthlyDay: 31, shortMonthPolicy: 'last' }, { shortMonthPolicy: 'last' }, { shortMonthPolicy: 'skip' }],
] as [Partial<DailyMedicineInput>, Partial<DailyMedicineInput>, Partial<DailyMedicineInput>][])('compares meaningful schedule fields %#', (schedule, same, different) => {
  const item = { ...base, ...schedule };
  expect(matchesSetup(item, { ...item, ...same, name: 'cafe\u0301 time', type: 'medicine', mode: 'alarm' })).toBe(true);
  expect(matchesSetup(item, { ...item, ...different })).toBe(false);
  expect(matchesSetup(item, { ...item, endDate: '2030-01-01' })).toBe(false);
});
