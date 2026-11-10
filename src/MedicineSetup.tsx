import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  finalDailyOccurrence,
  localDateString,
  nextDailyOccurrences,
} from './dailySchedule';
import {
  nextWeekdayOccurrences,
  finalWeekdayOccurrence,
} from './weekdaySchedule';
import {
  nextIntervalOccurrences,
  finalIntervalOccurrence,
} from './intervalSchedule';
import {
  nextMonthlyOccurrences,
  finalMonthlyOccurrence,
} from './monthlySchedule';
import type { ReminderType } from './reminderRepository';
import { PillAction } from './PillAction';

export type DailyMedicineInput = {
  type: ReminderType;
  scheduleKind?: 'daily' | 'weekday' | 'interval' | 'monthly';
  weekdays?: number[];
  intervalHours?: number | null;
  intervalAnchor?: number | null;
  monthlyDay?: number | null;
  shortMonthPolicy?: 'last' | 'skip';
  mode: 'notification' | 'alarm';
  name: string;
  instructions: string;
  times: string[];
  startDate?: string | null;
  endDate?: string | null;
};
type Props = {
  language: 'en' | 'es';
  initial?: DailyMedicineInput;
  now?: Date;
  onSave: (medicine: DailyMedicineInput) => void | Promise<void>;
  onExit: () => void;
  selectDate?: (date: string) => Promise<string | null>;
  selectTime?: (time: string) => Promise<string | null>;
};

const copy = {
  en: {
    daily: 'Every day',
    weekday: 'Selected weekdays',
    interval: 'Every X hours',
    monthly: 'Monthly',
    weekdays: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
    hours: 'Hours between reminders',
    monthDay: 'Day of month (1–31)',
    lastDay: 'Last day of month',
    shortMonth: 'When the day is unavailable',
    useLast: 'Use last day',
    skipMonth: 'Skip month',
    invalidSchedule: 'Choose valid schedule settings',
    first: 'First reminder date and time',
    medicine: 'Medicine',
    reminder: 'Reminder',
    choose: 'Choose a type',
    reminderName: 'Reminder name',
    reminderRequired: 'Enter a reminder name',
    saveReminder: 'Save reminder',
    name: 'Medicine name',
    instructions: 'Dose instructions (optional)',
    next: 'Next',
    required: 'Enter a medicine name',
    schedule: 'Schedule',
    times: 'Daily times',
    addTime: 'Add a time',
    changeTime: 'Change time',
    removeTime: 'Remove time',
    invalid: 'Enter one or more times, for example 09:00, 21:00',
    mode: 'Reminder: Notification',
    alarmMode: 'Reminder: Alarm',
    notification: 'Notification',
    alarm: 'Alarm',
    review: 'Review',
    nextThree: 'Next three reminders',
    startDate: 'Start date',
    endDate: 'End date (optional)',
    setEnd: 'Set end date',
    clearEnd: 'Remove end date',
    invalidDates: 'End date must be on or after start date',
    final: 'Final reminder',
    none: 'No future reminders',
    everyDay: 'Every day at',
    save: 'Save medicine',
    back: 'Back',
  },
  es: {
    daily: 'Todos los días',
    weekday: 'Días de la semana',
    interval: 'Cada X horas',
    monthly: 'Mensual',
    weekdays: [
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo',
    ],
    hours: 'Horas entre recordatorios',
    monthDay: 'Día del mes (1–31)',
    lastDay: 'Último día del mes',
    shortMonth: 'Cuando no exista el día',
    useLast: 'Usar el último día',
    skipMonth: 'Omitir el mes',
    invalidSchedule: 'Elige una programación válida',
    first: 'Fecha y hora del primer recordatorio',
    medicine: 'Medicamento',
    reminder: 'Recordatorio',
    choose: 'Elige un tipo',
    reminderName: 'Nombre del recordatorio',
    reminderRequired: 'Escribe el nombre del recordatorio',
    saveReminder: 'Guardar recordatorio',
    name: 'Nombre del medicamento',
    instructions: 'Indicaciones de la dosis (opcional)',
    next: 'Continuar',
    required: 'Escribe el nombre del medicamento',
    schedule: 'Horario',
    times: 'Horas diarias',
    addTime: 'Agregar una hora',
    changeTime: 'Cambiar hora',
    removeTime: 'Quitar hora',
    invalid: 'Escribe una o más horas, por ejemplo 09:00, 21:00',
    mode: 'Recordatorio: Notificación',
    alarmMode: 'Recordatorio: Alarma',
    notification: 'Notificación',
    alarm: 'Alarma',
    review: 'Revisar',
    nextThree: 'Próximos tres recordatorios',
    startDate: 'Fecha de inicio',
    endDate: 'Fecha de fin (opcional)',
    setEnd: 'Elegir fecha de fin',
    clearEnd: 'Quitar fecha de fin',
    invalidDates: 'La fecha de fin debe ser igual o posterior a la de inicio',
    final: 'Último recordatorio',
    none: 'No hay recordatorios futuros',
    everyDay: 'Todos los días a las',
    save: 'Guardar medicamento',
    back: 'Volver',
  },
};

export function MedicineSetup({
  language,
  initial,
  now,
  onSave,
  onExit,
  selectTime,
  selectDate,
}: Props) {
  const t = copy[language];
  const [step, setStep] = useState(0);
  const [type, setType] = useState<ReminderType>(initial?.type ?? 'reminder');
  const [mode, setMode] = useState<'notification' | 'alarm'>(
    initial?.mode ?? 'notification',
  );
  const [name, setName] = useState(initial?.name ?? '');
  const [instructions, setInstructions] = useState(initial?.instructions ?? '');
  const [times, setTimes] = useState(initial?.times ?? ['09:00']);
  const [startDate, setStartDate] = useState(
    initial?.startDate ?? localDateString(now ?? new Date()),
  );
  const [endDate, setEndDate] = useState<string | null>(
    initial?.endDate ?? null,
  );
  const [scheduleKind, setScheduleKind] = useState<
    NonNullable<DailyMedicineInput['scheduleKind']>
  >(initial?.scheduleKind ?? 'daily');
  const [weekdays, setWeekdays] = useState<number[]>(initial?.weekdays ?? [1]);
  const [intervalHours, setIntervalHours] = useState(
    String(initial?.intervalHours ?? 8),
  );
  const [anchorDate, setAnchorDate] = useState(
    localDateString(
      initial?.intervalAnchor
        ? new Date(initial.intervalAnchor)
        : now ?? new Date(),
    ),
  );
  const [anchorTime, setAnchorTime] = useState(
    initial?.intervalAnchor
      ? `${String(new Date(initial.intervalAnchor).getHours()).padStart(
          2,
          '0',
        )}:${String(new Date(initial.intervalAnchor).getMinutes()).padStart(
          2,
          '0',
        )}`
      : '09:00',
  );
  const [monthlyDay, setMonthlyDay] = useState(
    initial?.monthlyDay == null && initial?.scheduleKind === 'monthly'
      ? 'last'
      : String(initial?.monthlyDay ?? 1),
  );
  const [shortMonthPolicy, setShortMonthPolicy] = useState<'last' | 'skip'>(
    initial?.shortMonthPolicy ?? 'last',
  );
  const originalAnchor =
    initial?.intervalAnchor != null ? new Date(initial.intervalAnchor) : null;
  const originalTime = originalAnchor
    ? `${String(originalAnchor.getHours()).padStart(2, '0')}:${String(
        originalAnchor.getMinutes(),
      ).padStart(2, '0')}`
    : null;
  const anchor =
    originalAnchor &&
    anchorDate === localDateString(originalAnchor) &&
    anchorTime === originalTime
      ? originalAnchor
      : new Date(`${anchorDate}T${anchorTime}:00`);
  const [error, setError] = useState('');
  const goBack = useCallback(() => {
    setError('');
    if (step === 0) onExit();
    else setStep(step - 1);
  }, [step, onExit]);
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => listener.remove();
  }, [goBack]);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const next = () => {
    if (step === 1 && !name.trim()) {
      setError(type === 'medicine' ? t.required : t.reminderRequired);
      return;
    }
    if (step === 2 && !times.length) {
      setError(t.invalid);
      return;
    }
    if (
      step === 2 &&
      ((scheduleKind === 'weekday' && !weekdays.length) ||
        (scheduleKind === 'interval' &&
          (!Number.isSafeInteger(Number(intervalHours)) ||
            Number(intervalHours) < 1 ||
            !Number.isFinite(anchor.getTime()))) ||
        (scheduleKind === 'monthly' &&
          monthlyDay !== 'last' &&
          (!Number.isInteger(Number(monthlyDay)) ||
            Number(monthlyDay) < 1 ||
            Number(monthlyDay) > 31)))
    ) {
      setError(t.invalidSchedule);
      return;
    }
    if (step === 2 && endDate && endDate < startDate) {
      setError(t.invalidDates);
      return;
    }
    setError('');
    setStep(step + 1);
  };
  const preview =
    step !== 3
      ? []
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
    step === 3 && endDate
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
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.back}
          onPress={goBack}
          style={styles.back}
        >
          <View
            style={styles.arrowIcon}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
          >
            <View style={styles.arrowShaft} />
            <View style={styles.arrowHead} />
          </View>
          <Text style={styles.backText}>{t.back}</Text>
        </Pressable>
        <View style={styles.brand}>
          <Image
            source={require('../assets/brand-sprig.png')}
            style={styles.brandLeaf}
            resizeMode="contain"
            accessible={false}
          />
          <Text style={styles.brandText}>My Reminders</Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text accessibilityRole="header" style={styles.heading}>
          {
            [
              t.choose,
              type === 'medicine' ? t.medicine : t.reminder,
              t.schedule,
              t.review,
            ][step]
          }
        </Text>
        {step === 0 && (
          <View style={styles.actions}>
            <PillAction
              title={t.reminder}
              onPress={() => {
                setType('reminder');
                setStep(1);
              }}
            />
            <PillAction
              title={t.medicine}
              onPress={() => {
                setType('medicine');
                setStep(1);
              }}
            />
          </View>
        )}
        {step === 1 && (
          <>
            <Text style={styles.label}>
              {type === 'medicine' ? t.name : t.reminderName}
            </Text>
            <TextInput
              accessibilityLabel={type === 'medicine' ? t.name : t.reminderName}
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
            {type === 'medicine' && (
              <>
                <Text style={styles.label}>{t.instructions}</Text>
                <TextInput
                  accessibilityLabel={t.instructions}
                  style={styles.input}
                  value={instructions}
                  onChangeText={setInstructions}
                />
              </>
            )}
          </>
        )}
        {step === 2 && (
          <>
            <View accessibilityRole="radiogroup">
              {(['daily', 'weekday', 'interval', 'monthly'] as const).map(
                kind => (
                  <Pressable
                    key={kind}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: scheduleKind === kind }}
                    onPress={() => setScheduleKind(kind)}
                    style={styles.modeOption}
                  >
                    <Text style={styles.modeText}>
                      {scheduleKind === kind ? '● ' : '○ '}
                      {t[kind]}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
            {scheduleKind === 'weekday' &&
              t.weekdays.map((label, index) => (
                <Pressable
                  key={label}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: weekdays.includes(index + 1) }}
                  onPress={() =>
                    setWeekdays(current =>
                      current.includes(index + 1)
                        ? current.filter(day => day !== index + 1)
                        : [...current, index + 1],
                    )
                  }
                  style={styles.modeOption}
                >
                  <Text style={styles.modeText}>
                    {weekdays.includes(index + 1) ? '☑ ' : '□ '}
                    {label}
                  </Text>
                </Pressable>
              ))}
            {scheduleKind === 'interval' && (
              <>
                <Text style={styles.label}>{t.hours}</Text>
                <TextInput
                  accessibilityLabel={t.hours}
                  style={styles.input}
                  keyboardType="number-pad"
                  value={intervalHours}
                  onChangeText={setIntervalHours}
                />
                <Text style={styles.label}>
                  {t.first}: {anchorDate} {anchorTime}
                </Text>
                <PillAction
                  title={t.startDate}
                  onPress={async () => {
                    const value = await selectDate?.(anchorDate);
                    if (value) setAnchorDate(value);
                  }}
                />
                <PillAction
                  title={t.changeTime}
                  onPress={async () => {
                    const value = await selectTime?.(anchorTime);
                    if (value) setAnchorTime(value);
                  }}
                />
              </>
            )}
            {scheduleKind === 'monthly' && (
              <>
                <Text style={styles.label}>{t.monthDay}</Text>
                <TextInput
                  accessibilityLabel={t.monthDay}
                  style={styles.input}
                  keyboardType="number-pad"
                  value={monthlyDay === 'last' ? '' : monthlyDay}
                  onChangeText={setMonthlyDay}
                />
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: monthlyDay === 'last' }}
                  onPress={() => setMonthlyDay('last')}
                  style={styles.modeOption}
                >
                  <Text style={styles.modeText}>
                    {monthlyDay === 'last' ? '● ' : '○ '}
                    {t.lastDay}
                  </Text>
                </Pressable>
                {Number(monthlyDay) >= 29 && monthlyDay !== 'last' && (
                  <>
                    <Text style={styles.label}>{t.shortMonth}</Text>
                    {(['last', 'skip'] as const).map(policy => (
                      <Pressable
                        key={policy}
                        accessibilityRole="radio"
                        accessibilityState={{
                          checked: shortMonthPolicy === policy,
                        }}
                        onPress={() => setShortMonthPolicy(policy)}
                        style={styles.modeOption}
                      >
                        <Text style={styles.modeText}>
                          {shortMonthPolicy === policy ? '● ' : '○ '}
                          {policy === 'last' ? t.useLast : t.skipMonth}
                        </Text>
                      </Pressable>
                    ))}
                  </>
                )}
              </>
            )}
            <Text style={styles.label}>
              {t.startDate}: {startDate}
            </Text>
            <PillAction
              title={t.startDate}
              onPress={async () => {
                const value = await selectDate?.(startDate);
                if (value) setStartDate(value);
              }}
            />
            <Text style={styles.label}>
              {t.endDate}
              {endDate ? `: ${endDate}` : ''}
            </Text>
            <PillAction
              title={t.setEnd}
              onPress={async () => {
                const value = await selectDate?.(endDate ?? startDate);
                if (value) setEndDate(value);
              }}
            />
            {endDate && (
              <PillAction
                secondary
                title={t.clearEnd}
                onPress={() => setEndDate(null)}
              />
            )}
            {scheduleKind !== 'interval' && (
              <>
                <Text style={styles.label}>{t.times}</Text>
                {times.map((time, index) => (
                  <View key={`${time}-${index}`} style={styles.timeRow}>
                    <PillAction
                      title={`${t.changeTime}: ${time}`}
                      onPress={async () => {
                        const selected = await selectTime?.(time);
                        if (selected)
                          setTimes(current =>
                            [
                              ...new Set(
                                current.map((value, i) =>
                                  i === index ? selected : value,
                                ),
                              ),
                            ].sort(),
                          );
                      }}
                    />
                    {times.length > 1 && (
                      <PillAction
                        title={`${t.removeTime}: ${time}`}
                        onPress={() =>
                          setTimes(current =>
                            current.filter((_, i) => i !== index),
                          )
                        }
                      />
                    )}
                  </View>
                ))}
                <PillAction
                  title={t.addTime}
                  onPress={async () => {
                    const selected = await selectTime?.('09:00');
                    if (selected)
                      setTimes(current =>
                        [...new Set([...current, selected])].sort(),
                      );
                  }}
                />
              </>
            )}
            <Text accessibilityLiveRegion="polite" style={styles.label}>
              {mode === 'alarm' ? t.alarmMode : t.mode}
            </Text>
            <View accessibilityRole="radiogroup">
              {(['notification', 'alarm'] as const).map(choice => (
                <Pressable
                  key={choice}
                  accessibilityRole="radio"
                  accessibilityLabel={t[choice]}
                  accessibilityState={{ checked: mode === choice }}
                  onPress={() => setMode(choice)}
                  style={styles.modeOption}
                >
                  <Text style={styles.modeText}>
                    {mode === choice ? '● ' : '○ '}
                    {t[choice]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
        {step === 3 && (
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
              {scheduleKind !== 'interval'
                ? `: ${times.join(', ')}`
                : `: ${intervalHours}h`}
            </Text>
            <Text accessibilityRole="header" style={styles.label}>
              {t.nextThree}
            </Text>
            {preview.map(date => (
              <Text key={date.toISOString()} style={styles.label}>
                {date.toLocaleString(language === 'es' ? 'es-MX' : 'en-GB', {
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
                  {final.toLocaleString(language === 'es' ? 'es-MX' : 'en-GB', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })}
                </Text>
              </>
            )}
          </>
        )}
        {!!error && (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        )}
        <View style={styles.actions}>
          {step > 0 && step < 3 ? (
            <PillAction title={step === 1 ? t.next : t.review} onPress={next} />
          ) : step === 3 ? (
            <PillAction
              title={type === 'medicine' ? t.save : t.saveReminder}
              disabled={saving}
              onPress={async () => {
                if (savingRef.current) return;
                savingRef.current = true;
                setSaving(true);
                try {
                  await onSave({
                    type,
                    scheduleKind,
                    weekdays,
                    intervalHours:
                      scheduleKind === 'interval'
                        ? Number(intervalHours)
                        : null,
                    intervalAnchor:
                      scheduleKind === 'interval' ? anchor.getTime() : null,
                    monthlyDay:
                      scheduleKind === 'monthly' && monthlyDay !== 'last'
                        ? Number(monthlyDay)
                        : null,
                    shortMonthPolicy,
                    mode,
                    name: name.trim(),
                    instructions: instructions.trim(),
                    times: [...new Set(times)],
                    startDate,
                    endDate,
                  });
                } finally {
                  savingRef.current = false;
                  setSaving(false);
                }
              }}
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fbf6eb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 12,
  },
  brand: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, gap: 6 },
  brandLeaf: { width: 40, height: 36 },
  brandText: {
    color: '#17231a',
    fontSize: 17,
    fontWeight: '700',
    flexShrink: 1,
  },
  content: { padding: 24, backgroundColor: '#fbf6eb', flexGrow: 1 },
  back: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
  },
  arrowIcon: { width: 24, height: 24 },
  arrowShaft: {
    position: 'absolute',
    left: 3,
    top: 11,
    width: 19,
    height: 2,
    backgroundColor: '#36542b',
  },
  arrowHead: {
    position: 'absolute',
    left: 4,
    top: 7,
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#36542b',
    transform: [{ rotate: '45deg' }],
  },
  backText: { color: '#36542b', fontSize: 18, fontWeight: '600' },
  heading: {
    color: '#162524',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  label: { color: '#162524', fontSize: 18, marginVertical: 8 },
  input: {
    color: '#162524',
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#a4b398',
    backgroundColor: '#fffaf1',
    borderRadius: 12,
    minHeight: 52,
    paddingHorizontal: 12,
  },
  error: { color: '#a01818', fontSize: 18, marginVertical: 12 },
  actions: { gap: 12, marginTop: 24 },
  timeRow: { gap: 8, marginVertical: 8 },
  modeOption: { minHeight: 48, justifyContent: 'center' },
  modeText: { color: '#162524', fontSize: 18 },
});
