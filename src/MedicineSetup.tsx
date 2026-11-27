import { AppHeader } from './AppHeader';
import { AppIcon } from './AppIcon';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Pressable,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  isOneOffSchedule,
  localDate,
  localDateString,
  nextDailyOccurrences,
} from './dailySchedule';
import type { ReminderType } from './reminderRepository';
import { PillAction } from './PillAction';
import type { FullScreenAccess } from './reminderRepository';
import { ReminderAlertChoice } from './ReminderAlertChoice';
import { AlarmScreenAccess } from './AlarmScreenAccess';
import { SetupReview } from './SetupReview';
import { ScheduleFrequency } from './ScheduleFrequency';
import { createSetupLink } from './setupLink';
import { hasFutureOccurrence } from './pastSchedules';

export type DailyMedicineInput = {
  type: ReminderType;
  scheduleKind?: 'daily' | 'weekday' | 'interval' | 'monthly';
  weekdays?: number[];
  intervalHours?: number | null;
  intervalAnchor?: number | null;
  monthlyDay?: number | null;
  shortMonthPolicy?: 'last' | 'skip';
  mode: 'notification' | 'alarm';
  notificationSound?: string | null;
  alarmSound?: string | null;
  name: string;
  instructions: string;
  times: string[];
  startDate?: string | null;
  endDate?: string | null;
};
type Props = {
  language: 'en' | 'es';
  initial?: DailyMedicineInput;
  initialReview?: boolean;
  now?: Date;
  onSave: (medicine: DailyMedicineInput) => void | Promise<void>;
  onExit: () => void;
  fullScreenAccess?: FullScreenAccess;
  openFullScreenSettings?: () => void;
  selectDate?: (date: string) => Promise<string | null>;
  selectTime?: (time: string) => Promise<string | null>;
};

import { translations } from './translations';

export function MedicineSetup({
  language,
  initial,
  initialReview,
  now,
  onSave,
  onExit,
  selectTime,
  selectDate,
  fullScreenAccess,
  openFullScreenSettings,
}: Props) {
  const t = translations[language].setup;
  const currentTime = () => {
    const date = now ?? new Date();
    return `${String(date.getHours()).padStart(2, '0')}:${String(
      date.getMinutes(),
    ).padStart(2, '0')}`;
  };
  const [step, setStep] = useState(initialReview ? 3 : 0);
  const [type, setType] = useState<ReminderType>(initial?.type ?? 'reminder');
  const [mode, setMode] = useState<'notification' | 'alarm'>(
    initial?.mode ?? 'notification',
  );
  const [notificationSound, setNotificationSound] = useState<string | null>(
    initial?.notificationSound ?? null,
  );
  const [alarmSound, setAlarmSound] = useState<string | null>(
    initial?.alarmSound ?? null,
  );
  const [name, setName] = useState(initial?.name ?? '');
  const [instructions, setInstructions] = useState(initial?.instructions ?? '');
  const [times, setTimes] = useState(initial?.times ?? []);
  const [startDate, setStartDate] = useState(
    initial?.startDate ?? localDateString(now ?? new Date()),
  );
  const [endDate, setEndDate] = useState<string | null>(
    initial?.endDate ?? null,
  );
  const [scheduleKind, setScheduleKind] = useState<
    NonNullable<DailyMedicineInput['scheduleKind']> | 'once'
  >(
    initial && isOneOffSchedule(initial)
      ? 'once'
      : initial
      ? initial.scheduleKind ?? 'daily'
      : 'once',
  );
  const [frequencyOpen, setFrequencyOpen] = useState(false);
  const [onceDate, setOnceDate] = useState(
    initial?.startDate ?? localDateString(now ?? new Date()),
  );
  const [onceTime, setOnceTime] = useState(initial?.times[0] ?? '');
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
      : '',
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
  const pastLink =
    initialReview &&
    step === 3 &&
    scheduleKind === 'once' &&
    nextDailyOccurrences([onceTime], now ?? new Date(), 1, onceDate, onceDate)
      .length === 0;
  const preparedInput = (): DailyMedicineInput => ({
    type,
    scheduleKind: scheduleKind === 'once' ? 'daily' : scheduleKind,
    weekdays,
    intervalHours: scheduleKind === 'interval' ? Number(intervalHours) : null,
    intervalAnchor: scheduleKind === 'interval' ? anchor.getTime() : null,
    monthlyDay:
      scheduleKind === 'monthly' && monthlyDay !== 'last'
        ? Number(monthlyDay)
        : null,
    shortMonthPolicy,
    mode,
    notificationSound,
    alarmSound,
    name: name.trim(),
    instructions:
      type === 'medicine' || !initialReview ? instructions.trim() : '',
    times:
      scheduleKind === 'once'
        ? [onceTime]
        : scheduleKind === 'interval' && !times.length
        ? [anchorTime]
        : [...new Set(times)],
    startDate: scheduleKind === 'once' ? onceDate : startDate,
    endDate: scheduleKind === 'once' ? onceDate : endDate,
  });
  const expiredRecurring = () =>
    scheduleKind !== 'once' &&
    !!endDate &&
    !hasFutureOccurrence(preparedInput(), now ?? new Date());
  const expiredLink = initialReview && step === 3 && expiredRecurring();
  const goBack = useCallback(() => {
    setError('');
    if (step === 0 || (initialReview && step === 3)) onExit();
    else setStep(step - 1);
  }, [step, onExit, initialReview]);
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
    if (
      step === 2 &&
      (scheduleKind === 'once'
        ? !onceTime
        : scheduleKind === 'interval'
        ? !anchorTime
        : !times.length)
    ) {
      setError(t.timeRequired);
      return;
    }
    if (
      step === 2 &&
      ((scheduleKind === 'weekday' && !weekdays.length) ||
        (scheduleKind === 'interval' &&
          (!Number.isSafeInteger(Number(intervalHours)) ||
            Number(intervalHours) < 1 ||
            Number(intervalHours) > 2147483647 ||
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
    if (
      step === 2 &&
      scheduleKind === 'once' &&
      nextDailyOccurrences([onceTime], now ?? new Date(), 1, onceDate, onceDate)
        .length === 0
    ) {
      setError(t.onceFuture);
      return;
    }
    if (
      step === 2 &&
      scheduleKind !== 'once' &&
      endDate &&
      endDate < startDate
    ) {
      setError(t.invalidDates);
      return;
    }
    setError('');
    setStep(step + 1);
  };
  const formatDate = (value: string) =>
    localDate(value).toLocaleDateString(translations[language].locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  const dateField = (
    label: string,
    value: string | null,
    action: string,
    accessibilityLabel: string,
    onPress: () => void,
  ) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel}: ${
          value ? formatDate(value) : t.noEnd
        }`}
        onPress={onPress}
        style={styles.fieldControl}
      >
        <Text style={styles.fieldValue}>
          {value ? formatDate(value) : t.noEnd}
        </Text>
        <View style={styles.fieldActionRow}>
          <Text style={styles.fieldAction}>{action}</Text>
          <AppIcon name="chevronRight" color="#76500f" />
        </View>
      </Pressable>
    </View>
  );
  return (
    <View style={styles.screen}>
      <AppHeader
        language={language}
        action={{ kind: 'back', label: t.back, onPress: goBack }}
      />
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
            <ScheduleFrequency
              language={language}
              value={scheduleKind}
              onChange={setScheduleKind}
              open={frequencyOpen}
              onOpenChange={setFrequencyOpen}
            />
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
                  <AppIcon
                    name={
                      weekdays.includes(index + 1) ? 'squareCheck' : 'square'
                    }
                    color="#76500f"
                  />
                  <Text style={styles.modeText}>{label}</Text>
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
                {dateField(t.first, anchorDate, t.change, t.first, async () => {
                  const value = await selectDate?.(anchorDate);
                  if (value) setAnchorDate(value);
                })}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t.onceTime}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${t.first}, ${
                      anchorTime
                        ? `${t.changeTime}: ${anchorTime}`
                        : t.selectTime
                    }`}
                    onPress={async () => {
                      const value = await selectTime?.(
                        anchorTime || currentTime(),
                      );
                      if (value) setAnchorTime(value);
                    }}
                    style={styles.fieldControl}
                  >
                    <Text style={styles.fieldValue}>
                      {anchorTime || t.selectTime}
                    </Text>
                    <View style={styles.fieldActionRow}>
                      <Text style={styles.fieldAction}>
                        {anchorTime ? t.change : t.select}
                      </Text>
                      <AppIcon name="chevronRight" color="#76500f" />
                    </View>
                  </Pressable>
                </View>
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
                  <AppIcon
                    name={monthlyDay === 'last' ? 'circleDot' : 'circle'}
                    color="#76500f"
                  />
                  <Text style={styles.modeText}>{t.lastDay}</Text>
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
                        <AppIcon
                          name={
                            shortMonthPolicy === policy ? 'circleDot' : 'circle'
                          }
                          color="#76500f"
                        />
                        <Text style={styles.modeText}>
                          {policy === 'last' ? t.useLast : t.skipMonth}
                        </Text>
                      </Pressable>
                    ))}
                  </>
                )}
              </>
            )}
            {scheduleKind === 'once' ? (
              <>
                {dateField(
                  t.onceDate,
                  onceDate,
                  t.change,
                  t.onceDate,
                  async () => {
                    const value = await selectDate?.(onceDate);
                    if (value) setOnceDate(value);
                  },
                )}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t.onceTime}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      onceTime ? `${t.changeTime}: ${onceTime}` : t.selectTime
                    }
                    onPress={async () => {
                      const value = await selectTime?.(
                        onceTime || currentTime(),
                      );
                      if (value) setOnceTime(value);
                    }}
                    style={styles.fieldControl}
                  >
                    <Text style={styles.fieldValue}>
                      {onceTime || t.selectTime}
                    </Text>
                    <View style={styles.fieldActionRow}>
                      <Text style={styles.fieldAction}>
                        {onceTime ? t.change : t.select}
                      </Text>
                      <AppIcon name="chevronRight" color="#76500f" />
                    </View>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                {dateField(
                  t.startDate,
                  startDate,
                  t.change,
                  t.startDate,
                  async () => {
                    const value = await selectDate?.(startDate);
                    if (value) setStartDate(value);
                  },
                )}
                {dateField(
                  t.endDate,
                  endDate,
                  endDate ? t.change : t.setDate,
                  t.setEnd,
                  async () => {
                    const value = await selectDate?.(endDate ?? startDate);
                    if (value) setEndDate(value);
                  },
                )}
                {endDate && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.clearEnd}
                    onPress={() => setEndDate(null)}
                    style={styles.linkButton}
                  >
                    <Text style={styles.linkText}>{t.clearEnd}</Text>
                  </Pressable>
                )}
                {scheduleKind !== 'interval' && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>{t.times}</Text>
                    {times.map((time, index) => (
                      <View key={`${time}-${index}`} style={styles.timeRow}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${t.changeTime}: ${time}`}
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
                          style={[styles.fieldControl, styles.timeControl]}
                        >
                          <Text style={styles.fieldValue}>{time}</Text>
                          <View style={styles.fieldActionRow}>
                            <Text style={styles.fieldAction}>{t.change}</Text>
                            <AppIcon name="chevronRight" color="#76500f" />
                          </View>
                        </Pressable>
                        {times.length > 1 && (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`${t.removeTime}: ${time}`}
                            onPress={() =>
                              setTimes(current =>
                                current.filter((_, i) => i !== index),
                              )
                            }
                            style={styles.removeButton}
                          >
                            <Text style={styles.removeText}>{t.remove}</Text>
                          </Pressable>
                        )}
                      </View>
                    ))}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        times.length ? t.addTime : t.selectTime
                      }
                      onPress={async () => {
                        const selected = await selectTime?.(currentTime());
                        if (selected)
                          setTimes(current =>
                            [...new Set([...current, selected])].sort(),
                          );
                      }}
                      style={
                        times.length ? styles.linkButton : styles.fieldControl
                      }
                    >
                      {times.length ? (
                        <View style={styles.fieldActionRow}>
                          <AppIcon name="plus" color="#76500f" />
                          <Text style={styles.linkText}>{t.addTime}</Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.fieldValue}>{t.selectTime}</Text>
                          <View style={styles.fieldActionRow}>
                            <Text style={styles.fieldAction}>{t.select}</Text>
                            <AppIcon name="chevronRight" color="#76500f" />
                          </View>
                        </>
                      )}
                    </Pressable>
                  </View>
                )}
              </>
            )}
            <ReminderAlertChoice
              language={language}
              mode={mode}
              onModeChange={setMode}
              notificationSound={notificationSound}
              onNotificationSoundChange={setNotificationSound}
              alarmSound={alarmSound}
              onAlarmSoundChange={setAlarmSound}
              fullScreenAccess={fullScreenAccess}
              openFullScreenSettings={openFullScreenSettings}
            />
          </>
        )}
        {step === 3 && (
          <SetupReview
            language={language}
            type={type}
            name={name}
            instructions={instructions}
            mode={mode}
            scheduleKind={scheduleKind}
            times={times}
            onceDate={onceDate}
            onceTime={onceTime}
            weekdays={weekdays}
            anchor={anchor}
            intervalHours={intervalHours}
            monthlyDay={monthlyDay}
            shortMonthPolicy={shortMonthPolicy}
            startDate={startDate}
            endDate={endDate}
            now={now}
          />
        )}
        {step === 3 &&
          initialReview &&
          mode === 'alarm' &&
          fullScreenAccess &&
          openFullScreenSettings && (
            <AlarmScreenAccess
              language={language}
              access={fullScreenAccess}
              openSettings={openFullScreenSettings}
            />
          )}
        {(!!error || pastLink || (step === 3 && expiredLink)) && (
          <Text accessibilityRole="alert" style={styles.error}>
            {error || (pastLink ? t.onceFuture : t.expiredEnd)}
          </Text>
        )}
        <View style={styles.actions}>
          {step > 0 && step < 3 ? (
            <PillAction title={step === 1 ? t.next : t.review} onPress={next} />
          ) : step === 3 ? (
            <>
              <PillAction
                title={type === 'medicine' ? t.save : t.saveReminder}
                disabled={saving}
                onPress={async () => {
                  if (savingRef.current) return;
                  if (expiredRecurring()) {
                    setError(t.expiredEnd);
                    return;
                  }
                  if (
                    scheduleKind === 'once' &&
                    nextDailyOccurrences(
                      [onceTime],
                      now ?? new Date(),
                      1,
                      onceDate,
                      onceDate,
                    ).length === 0
                  ) {
                    setError(initialReview ? '' : t.onceFuture);
                    return;
                  }
                  savingRef.current = true;
                  setSaving(true);
                  try {
                    await onSave(preparedInput());
                  } finally {
                    savingRef.current = false;
                    setSaving(false);
                  }
                }}
              />
              {!initial && (
                <>
                  <Text style={styles.error}>{t.shareTestNotice}</Text>
                  <PillAction
                    secondary
                    title={t.shareSetup}
                    onPress={async () => {
                      if (expiredRecurring()) {
                        setError(t.expiredEnd);
                        return;
                      }
                      if (
                        scheduleKind === 'once' &&
                        nextDailyOccurrences(
                          [onceTime],
                          now ?? new Date(),
                          1,
                          onceDate,
                          onceDate,
                        ).length === 0
                      ) {
                        setError(t.onceFuture);
                        return;
                      }
                      try {
                        await Share.share({
                          message: createSetupLink(preparedInput()),
                        });
                      } catch {
                        setError(t.shareError);
                      }
                    }}
                  />
                </>
              )}
              {initialReview && (
                <PillAction
                  secondary
                  title={t.editLink}
                  onPress={() => {
                    setError('');
                    setStep(1);
                  }}
                />
              )}
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fbf6eb' },
  content: { padding: 24, backgroundColor: '#fbf6eb', flexGrow: 1 },
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
    borderColor: '#b9a582',
    backgroundColor: '#fffaf1',
    borderRadius: 12,
    minHeight: 52,
    paddingHorizontal: 12,
  },
  error: { color: '#a01818', fontSize: 18, marginVertical: 12 },
  actions: { gap: 12, marginTop: 24 },
  fieldGroup: { gap: 8, marginVertical: 8 },
  fieldLabel: { color: '#162524', fontSize: 17, fontWeight: '600' },
  fieldControl: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#b9a582',
    backgroundColor: '#fffaf1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  fieldValue: { color: '#162524', fontSize: 17, flexShrink: 1 },
  fieldActionRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fieldAction: { color: '#76500f', fontSize: 15, fontWeight: '600' },
  timeRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  timeControl: { flex: 1 },
  removeButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d9b8ac',
    borderRadius: 10,
  },
  removeText: { color: '#99433a', fontSize: 15, fontWeight: '600' },
  linkButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  linkText: { color: '#76500f', fontSize: 16, fontWeight: '700' },
  modeOption: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeText: { color: '#162524', fontSize: 18 },
});
