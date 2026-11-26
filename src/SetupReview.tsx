import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { finalDailyOccurrence, nextDailyOccurrences } from './dailySchedule';
import {
  finalWeekdayOccurrence,
  nextWeekdayOccurrences,
} from './weekdaySchedule';
import {
  finalIntervalOccurrence,
  nextIntervalOccurrences,
} from './intervalSchedule';
import {
  finalMonthlyOccurrence,
  nextMonthlyOccurrences,
} from './monthlySchedule';
import type { DailyMedicineInput } from './MedicineSetup';
import type { ReminderType } from './reminderRepository';
import { translations } from './translations';

type Props = {
  language: 'en' | 'es';
  type: ReminderType;
  name: string;
  instructions: string;
  mode: 'notification' | 'alarm';
  scheduleKind: NonNullable<DailyMedicineInput['scheduleKind']> | 'once';
  times: string[];
  onceDate: string;
  onceTime: string;
  weekdays: number[];
  anchor: Date;
  intervalHours: string;
  monthlyDay: string;
  shortMonthPolicy: 'last' | 'skip';
  startDate: string;
  endDate: string | null;
  now?: Date;
};

export function SetupReview({
  language,
  type,
  name,
  instructions,
  mode,
  scheduleKind,
  times,
  onceDate,
  onceTime,
  weekdays,
  anchor,
  intervalHours,
  monthlyDay,
  shortMonthPolicy,
  startDate,
  endDate,
  now,
}: Props) {
  const t = translations[language].setup;
  const preview =
    scheduleKind === 'once'
      ? nextDailyOccurrences(
          [onceTime],
          now ?? new Date(),
          1,
          onceDate,
          onceDate,
        )
      : scheduleKind === 'weekday'
      ? nextWeekdayOccurrences(
          times,
          weekdays,
          now ?? new Date(),
          3,
          startDate,
          endDate,
        )
      : scheduleKind === 'interval'
      ? nextIntervalOccurrences(
          anchor,
          Number(intervalHours),
          new Date(
            Math.max(
              (now ?? new Date()).getTime(),
              new Date(`${startDate}T00:00:00`).getTime() - 1,
            ),
          ),
          3,
          endDate,
        )
      : scheduleKind === 'monthly'
      ? nextMonthlyOccurrences(
          times,
          monthlyDay === 'last' ? 'last' : Number(monthlyDay),
          shortMonthPolicy,
          now ?? new Date(),
          3,
          startDate,
          endDate,
        )
      : nextDailyOccurrences(times, now ?? new Date(), 3, startDate, endDate);
  const final =
    scheduleKind !== 'once' && endDate
      ? scheduleKind === 'weekday'
        ? finalWeekdayOccurrence(times, weekdays, endDate)
        : scheduleKind === 'interval'
        ? finalIntervalOccurrence(anchor, Number(intervalHours), endDate)
        : scheduleKind === 'monthly'
        ? finalMonthlyOccurrence(
            times,
            monthlyDay === 'last' ? 'last' : Number(monthlyDay),
            shortMonthPolicy,
            startDate,
            endDate,
          )
        : finalDailyOccurrence(times, endDate)
      : undefined;
  return (
    <>
      <Text style={styles.label}>
        {type === 'medicine' ? t.medicine : t.reminder}
      </Text>
      <Text style={styles.label}>{name.trim()}</Text>
      {type === 'medicine' && !!instructions.trim() && (
        <Text style={styles.label}>{instructions.trim()}</Text>
      )}
      <Text style={styles.label}>
        {mode === 'alarm' ? t.alarmMode : t.mode}
      </Text>
      <Text style={styles.label}>
        {t[scheduleKind]}
        {scheduleKind === 'once'
          ? `: ${onceDate}, ${onceTime}`
          : scheduleKind !== 'interval'
          ? `: ${times.join(', ')}`
          : `: ${intervalHours}h`}
      </Text>
      <Text accessibilityRole="header" style={styles.label}>
        {scheduleKind === 'once' ? t.oncePreview : t.nextThree}
      </Text>
      {preview.map(date => (
        <Text key={date.toISOString()} style={styles.label}>
          {date.toLocaleString(translations[language].locale, {
            dateStyle: 'full',
            timeStyle: 'short',
          })}
        </Text>
      ))}
      {preview.length === 0 && <Text style={styles.label}>{t.none}</Text>}
      {preview.length > 0 && final && (
        <>
          <Text accessibilityRole="header" style={styles.label}>
            {t.final}
          </Text>
          <Text style={styles.label}>
            {final.toLocaleString(translations[language].locale, {
              dateStyle: 'full',
              timeStyle: 'short',
            })}
          </Text>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  label: { color: '#162524', fontSize: 18, marginVertical: 8 },
});
