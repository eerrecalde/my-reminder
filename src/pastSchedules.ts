import type { DailyMedicineInput } from './MedicineSetup';
import { nextDailyOccurrences } from './dailySchedule';
import { nextWeekdayOccurrences } from './weekdaySchedule';
import { nextIntervalOccurrences } from './intervalSchedule';
import { nextMonthlyOccurrences } from './monthlySchedule';

export function hasFutureOccurrence(
  schedule: DailyMedicineInput,
  now: Date,
): boolean {
  const { times, startDate, endDate } = schedule;
  switch (schedule.scheduleKind) {
    case 'weekday':
      return (
        nextWeekdayOccurrences(
          times,
          schedule.weekdays ?? [],
          now,
          1,
          startDate,
          endDate,
        ).length > 0
      );
    case 'interval':
      return (
        schedule.intervalAnchor != null &&
        schedule.intervalHours != null &&
        nextIntervalOccurrences(
          new Date(schedule.intervalAnchor),
          schedule.intervalHours,
          now,
          1,
          endDate,
        ).length > 0
      );
    case 'monthly':
      return (
        nextMonthlyOccurrences(
          times,
          schedule.monthlyDay ?? 'last',
          schedule.shortMonthPolicy ?? 'last',
          now,
          1,
          startDate,
          endDate,
        ).length > 0
      );
    default:
      return nextDailyOccurrences(times, now, 1, startDate, endDate).length > 0;
  }
}
