import type { DailyMedicineInput } from './MedicineSetup';

// Names ignore surrounding/repeated whitespace, Unicode composition and case.
// Schedules compare their meaningful fields; unordered times and weekdays are sets.
export function matchesSetup(a: DailyMedicineInput, b: DailyMedicineInput): boolean {
  const name = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
  const set = (values: (string | number)[]) => [...new Set(values)].sort().join(',');
  const kind = a.scheduleKind ?? 'daily';
  if (name(a.name) !== name(b.name) || kind !== (b.scheduleKind ?? 'daily') ||
      (a.startDate || null) !== (b.startDate || null) || (a.endDate || null) !== (b.endDate || null)) return false;
  if (kind === 'interval') return a.intervalHours === b.intervalHours && a.intervalAnchor === b.intervalAnchor;
  if (set(a.times) !== set(b.times)) return false;
  if (kind === 'weekday') return set(a.weekdays ?? []) === set(b.weekdays ?? []);
  if (kind === 'monthly') return (a.monthlyDay ?? null) === (b.monthlyDay ?? null) &&
    ((a.monthlyDay ?? 0) < 29 || (a.shortMonthPolicy ?? 'last') === (b.shortMonthPolicy ?? 'last'));
  return true;
}
