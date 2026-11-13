import { AppIcon } from './src/AppIcon';
import { SoundChoice } from './src/SoundChoice';
import { LanguageSelector } from './src/LanguageSelector';
import React, { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  Alert,
  Image,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MedicineSetup } from './src/MedicineSetup';
import { hasFutureOccurrence } from './src/pastSchedules';
import { isOneOffSchedule } from './src/dailySchedule';
import { PillAction } from './src/PillAction';
export { PillAction } from './src/PillAction';
import {
  reminderRepository,
  ReminderState,
  Occurrence,
  Outcome,
  Medicine,
} from './src/reminderRepository';

import { translations } from './src/translations';
export default function App() {
  const [state, setState] = useState<ReminderState>();
  const [screen, setScreen] = useState<
    'today' | 'reminders' | 'setup' | 'access' | 'history'
  >('today');
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pastExpanded, setPastExpanded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [editing, setEditing] = useState<Medicine>();
  const [soundDefaults, setSoundDefaults] = useState<{
    notification: string | null;
    alarm: string | null;
  }>({ notification: null, alarm: null });
  useEffect(() => {
    if (screen === 'access' && reminderRepository.soundDefaults)
      reminderRepository
        .soundDefaults()
        .then(setSoundDefaults)
        .catch(() => {});
  }, [screen]);
  const [setupOrigin, setSetupOrigin] = useState<'today' | 'reminders'>(
    'today',
  );
  const [undo, setUndo] = useState<{
    occurrence: Occurrence;
    previous: Outcome | null;
    revision: number;
    previousCleared: boolean;
  }>();
  const refresh = useCallback(async () => {
    try {
      setState(await reminderRepository.state());
    } catch {
      setError('load');
    }
  }, []);
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 30000);
    const listener = AppState.addEventListener('change', value => {
      if (value === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, [refresh]);
  const sortedUpcoming = (state?.upcoming ?? [])
    .filter(
      item =>
        item.scheduledAt > Date.now() &&
        new Date(item.scheduledAt).toDateString() === new Date().toDateString(),
    )
    .sort((a, b) => a.scheduledAt - b.scheduledAt);
  const nextUpcoming = sortedUpcoming[0];
  const overdueIds = new Set(
    (state?.todayDoses ?? [])
      .filter(item => item.actionable)
      .map(item => item.medicineId),
  );
  const now = new Date();
  const pastIds = new Set(
    (state?.medicines ?? [])
      .filter(m => !overdueIds.has(m.id) && !hasFutureOccurrence(m, now))
      .map(m => m.id),
  );
  const language = state?.language ?? 'en';
  const t = translations[language].app;
  const changeOutcome = async (
    occurrence: Occurrence,
    outcome: Outcome | null,
  ) => {
    try {
      const change = await reminderRepository.setOutcome(
        occurrence.medicineId,
        occurrence.scheduledAt,
        outcome,
      );
      if (change.changed)
        setUndo({
          occurrence,
          previous: change.previous,
          revision: change.revision,
          previousCleared: change.previousCleared,
        });
      setError('');
      await refresh();
    } catch {
      setError(t.actionError);
    }
  };
  const undoChange = async () => {
    if (!undo) return;
    try {
      await reminderRepository.undoOutcome(
        undo.occurrence.medicineId,
        undo.occurrence.scheduledAt,
        undo.previous,
        undo.revision,
        undo.previousCleared,
      );
      setUndo(undefined);
      setError('');
      await refresh();
    } catch {
      setUndo(undefined);
      setError(t.actionError);
      await refresh();
    }
  };
  const timeLabel = (at: number) =>
    new Date(at).toLocaleString(translations[language].locale, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  const scheduleLabel = (medicine: Medicine) => {
    const kind = medicine.scheduleKind ?? 'daily';
    if (isOneOffSchedule(medicine))
      return `${t.once} · ${medicine.startDate} · ${medicine.times[0]}`;
    const when =
      kind === 'interval'
        ? `${t.everyHours} ${medicine.intervalHours} ${t.hours}${
            medicine.intervalAnchor != null
              ? ` · ${t.anchor}: ${new Date(
                  medicine.intervalAnchor,
                ).toLocaleString(translations[language].locale, {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}`
              : ''
          }`
        : `${
            kind === 'weekday'
              ? (medicine.weekdays ?? [])
                  .map(day => t.weekdays[day - 1])
                  .join(', ')
              : kind === 'monthly'
              ? `${t.monthly}: ${medicine.monthlyDay ?? t.lastDay}${
                  medicine.monthlyDay != null && medicine.monthlyDay >= 29
                    ? ` · ${
                        medicine.shortMonthPolicy === 'skip'
                          ? t.shortSkip
                          : t.shortLast
                      }`
                    : ''
                }`
              : t.daily
          } · ${medicine.times.join(', ')}`;
    return `${when}${
      medicine.startDate ? ` · ${t.starts}: ${medicine.startDate}` : ''
    }${medicine.endDate ? ` · ${t.ends}: ${medicine.endDate}` : ''}`;
  };
  const occurrenceView = (
    occurrence: Occurrence,
    medicine: Medicine,
    compact = false,
  ) => {
    medicine = {
      ...medicine,
      name: occurrence.name ?? medicine.name,
      instructions: occurrence.instructions ?? medicine.instructions,
      type: occurrence.type ?? medicine.type,
    };
    const label =
      occurrence.outcome === 'completed'
        ? medicine.type === 'reminder'
          ? t.done
          : t.taken
        : occurrence.outcome === 'skipped'
        ? t.skipped
        : occurrence.outcome === 'missed'
        ? t.missed
        : medicine.type === 'reminder'
        ? t.unconfirmedReminder
        : t.unconfirmed;
    const context = `${medicine.name}, ${timeLabel(occurrence.scheduledAt)}`;
    const key = `${occurrence.medicineId}:${occurrence.scheduledAt}`;
    const showActions = !compact || expanded === key;
    return (
      <View
        key={`${occurrence.medicineId}:${occurrence.scheduledAt}`}
        style={[styles.occurrence, compact && styles.occurrenceCompact]}
      >
        <View style={styles.occurrenceHeading}>
          <View style={styles.iconCircle}>
            <AppIcon
              name={medicine.type === 'medicine' ? 'pill' : 'clock'}
              color="#4d6d38"
            />
          </View>
          <View style={styles.occurrenceCopy}>
            <Text style={styles.itemName}>
              {medicine.name}
              {medicine.type === 'medicine' && medicine.instructions
                ? ` — ${medicine.instructions}`
                : ''}
            </Text>
            <Text style={styles.text}>
              {medicine.type === 'reminder' ? t.reminder : t.medicine} · {label}
              : {timeLabel(occurrence.scheduledAt)}
            </Text>
          </View>
        </View>
        {compact && (
          <PillAction
            secondary
            title={t.change}
            accessibilityLabel={`${t.change}, ${context}`}
            onPress={() => setExpanded(expanded === key ? null : key)}
          />
        )}
        {showActions && (
          <>
            <PillAction
              title={medicine.type === 'reminder' ? t.done : t.taken}
              accessibilityLabel={`${
                medicine.type === 'reminder' ? t.done : t.taken
              }, ${context}`}
              onPress={() => changeOutcome(occurrence, 'completed')}
            />
            <PillAction
              secondary
              title={t.skip}
              accessibilityLabel={`${t.skip}, ${context}`}
              onPress={() => changeOutcome(occurrence, 'skipped')}
            />
            {occurrence.snoozed && <Text style={styles.text}>{t.snoozed}</Text>}
            {occurrence.outstanding &&
              !occurrence.snoozed &&
              occurrence.outcome == null && (
                <PillAction
                  secondary
                  title={`${t.snooze} 10 ${t.minutes}`}
                  accessibilityLabel={`${t.snooze} 10 ${t.minutes}, ${context}`}
                  onPress={async () => {
                    try {
                      await reminderRepository.snooze(
                        occurrence.medicineId,
                        occurrence.scheduledAt,
                        10,
                      );
                      setError('');
                      await refresh();
                    } catch {
                      setError(t.actionError);
                    }
                  }}
                />
              )}
            {occurrence.outcome != null && (
              <PillAction
                secondary
                title={t.unconfirm}
                accessibilityLabel={`${t.unconfirm}, ${context}`}
                onPress={() => changeOutcome(occurrence, null)}
              />
            )}
          </>
        )}
      </View>
    );
  };
  const allowNotifications = async () => {
    if (Platform.OS === 'android' && Number(Platform.Version) >= 33)
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    reminderRepository.openNotificationSettings();
  };
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.screen}>
        {screen === 'setup' ? (
          <>
            <MedicineSetup
              initial={editing}
              onExit={() => {
                setEditing(undefined);
                setError('');
                setScreen(setupOrigin);
              }}
              selectTime={time => reminderRepository.selectTime(time)}
              selectDate={date => reminderRepository.selectDate(date)}
              language={language}
              onSave={async medicine => {
                try {
                  await (editing
                    ? reminderRepository.editScheduled.bind(
                        reminderRepository,
                        editing.id,
                      )
                    : reminderRepository.saveScheduled.bind(
                        reminderRepository,
                      ))(
                    medicine.type,
                    medicine.name,
                    medicine.instructions,
                    medicine.times,
                    medicine.mode,
                    medicine.startDate!,
                    medicine.endDate ?? null,
                    medicine.scheduleKind ?? 'daily',
                    medicine.weekdays ?? [],
                    medicine.intervalHours ?? null,
                    medicine.intervalAnchor ?? null,
                    medicine.monthlyDay ?? null,
                    medicine.shortMonthPolicy ?? 'last',
                    medicine.notificationSound ?? null,
                    medicine.alarmSound ?? null,
                  );
                  await refresh();
                  setEditing(undefined);
                  setScreen('today');
                  setError('');
                } catch {
                  setError(t.error);
                }
              }}
            />
            {!!error && (
              <Text accessibilityRole="alert" style={styles.error}>
                {error === 'load' ? t.loadError : error}
              </Text>
            )}
          </>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.content}>
              {screen === 'today' && (
                <View style={styles.brandRow}>
                  <View style={styles.brandName}>
                    <Image
                      source={require('./assets/brand-sprig.png')}
                      style={styles.brandLeaf}
                      resizeMode="contain"
                    />
                    <Text style={styles.brandText}>My Reminders</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.settings}
                    onPress={() => setScreen('access')}
                    hitSlop={12}
                  >
                    <AppIcon name="moreVertical" color="#142219" />
                  </Pressable>
                </View>
              )}
              {screen === 'today' ? (
                <View style={styles.headerArt}>
                  <View style={styles.headerCopy}>
                    <Text accessibilityRole="header" style={styles.todayTitle}>
                      {t.today}
                    </Text>
                    <Text style={styles.date}>
                      {new Date().toLocaleDateString(
                        translations[language].locale,
                        { weekday: 'long', day: 'numeric', month: 'long' },
                      )}
                    </Text>
                  </View>
                  {(!state ||
                    state.medicines.length > 0 ||
                    state.todayDoses.length > 0) && (
                    <Image
                      source={require('./assets/today-illustration.png')}
                      style={styles.leaf}
                      resizeMode="contain"
                      accessibilityIgnoresInvertColors
                    />
                  )}
                </View>
              ) : (
                <Text accessibilityRole="header" style={styles.title}>
                  {screen === 'reminders'
                    ? t.reminders
                    : screen === 'history'
                    ? t.history
                    : t.options}
                </Text>
              )}
              {!state ? (
                <Text style={styles.text}>{t.loading}</Text>
              ) : screen === 'today' ? (
                <>
                  {!state.enabled && (
                    <View style={styles.warning}>
                      <View style={styles.warningHeader}>
                        <View
                          accessible={false}
                          importantForAccessibility="no-hide-descendants"
                          style={styles.warningIcon}
                        >
                          <AppIcon name="warning" color="#fff" />
                        </View>
                        <Text
                          accessibilityRole="alert"
                          style={styles.warningTitle}
                        >
                          {t.off}
                        </Text>
                      </View>
                      <Text style={styles.warningText}>
                        {!state.notifications && !state.exactAlarms
                          ? t.offBoth
                          : !state.notifications
                          ? t.offNotifications
                          : t.offAlarms}
                      </Text>
                      <PillAction
                        title={t.enable}
                        onPress={() => setScreen('access')}
                      />
                    </View>
                  )}
                  {undo && <PillAction title={t.undo} onPress={undoChange} />}
                  {state.medicines.length === 0 &&
                    state.todayDoses.length === 0 && (
                      <View style={styles.emptyCard}>
                        <Image
                          source={require('./assets/today-illustration.png')}
                          style={styles.emptyLeaf}
                          resizeMode="contain"
                        />
                        <Text
                          accessibilityRole="header"
                          style={styles.emptyTitle}
                        >
                          {t.empty}
                        </Text>
                        <Text style={styles.emptyHelp}>{t.emptyHelp}</Text>
                        <View style={styles.emptyAction}>
                          <PillAction
                            showPlus
                            title={t.add}
                            onPress={() => {
                              setSetupOrigin('today');
                              setScreen('setup');
                            }}
                          />
                        </View>
                      </View>
                    )}
                  {state.todayDoses.some(item => item.outcome == null) && (
                    <Text
                      accessibilityRole="header"
                      style={styles.sectionTitle}
                    >
                      {t.attention}
                    </Text>
                  )}
                  {[...state.todayDoses]
                    .filter(item => item.outcome == null)
                    .sort((a, b) => a.scheduledAt - b.scheduledAt)
                    .map(item =>
                      occurrenceView(
                        item,
                        state.medicines.find(m => m.id === item.medicineId) ?? {
                          id: item.medicineId,
                          name: item.name ?? '',
                          instructions: item.instructions ?? '',
                          type: item.type ?? 'reminder',
                          times: [],
                          mode: 'notification',
                        },
                      ),
                    )}
                  {nextUpcoming &&
                    (() => {
                      const medicine = state.medicines.find(
                        item => item.id === nextUpcoming.medicineId,
                      );
                      return medicine ? (
                        <View style={styles.nextCard}>
                          <Text
                            accessibilityRole="header"
                            style={styles.sectionBand}
                          >
                            {t.next}
                          </Text>
                          <View style={styles.nextBody}>
                            <View style={styles.iconCircle}>
                              <AppIcon name="clock" color="#4d6d38" />
                            </View>
                            <View style={styles.occurrenceCopy}>
                              <Text style={styles.itemName}>
                                {medicine.name}
                              </Text>
                              <Text style={styles.metaText}>
                                {t.upcoming}:{' '}
                                {timeLabel(nextUpcoming.scheduledAt)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ) : null;
                    })()}
                  {sortedUpcoming
                    .slice(1)
                    .filter(
                      item =>
                        new Date(item.scheduledAt).toDateString() ===
                        new Date().toDateString(),
                    )
                    .map(item => {
                      const medicine = state.medicines.find(
                        m => m.id === item.medicineId,
                      );
                      return medicine ? (
                        <View
                          key={`${item.medicineId}:${item.scheduledAt}`}
                          style={styles.compactCard}
                        >
                          <Text style={styles.itemName}>{medicine.name}</Text>
                          <Text style={styles.text}>
                            {t.upcoming}: {timeLabel(item.scheduledAt)}
                          </Text>
                        </View>
                      ) : null;
                    })}
                  {state.todayDoses.some(item => item.outcome != null) && (
                    <Text
                      accessibilityRole="header"
                      style={styles.sectionTitle}
                    >
                      {t.earlier}
                    </Text>
                  )}
                  {(
                    [
                      {
                        key: 'done',
                        label: t.done,
                        outcome: 'completed',
                        type: 'reminder',
                      },
                      {
                        key: 'taken',
                        label: t.taken,
                        outcome: 'completed',
                        type: 'medicine',
                      },
                      {
                        key: 'skipped',
                        label: t.skipped,
                        outcome: 'skipped',
                        type: null,
                      },
                      {
                        key: 'missed',
                        label: t.missed,
                        outcome: 'missed',
                        type: null,
                      },
                    ] as const
                  ).map(group => {
                    const items = state.todayDoses
                      .filter(item => {
                        const medicine = state.medicines.find(
                          m => m.id === item.medicineId,
                        );
                        const type =
                          item.type ??
                          medicine?.type ??
                          (medicine ? 'medicine' : 'reminder');
                        return (
                          item.outcome === group.outcome &&
                          (group.type == null || group.type === type)
                        );
                      })
                      .sort((a, b) => b.scheduledAt - a.scheduledAt);
                    if (!items.length) return null;
                    const isExpanded = expandedGroups.includes(group.key);
                    return (
                      <View key={group.key} style={styles.outcomeGroup}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${group.label} (${items.length})`}
                          accessibilityState={{ expanded: isExpanded }}
                          onPress={() =>
                            setExpandedGroups(current =>
                              current.includes(group.key)
                                ? current.filter(key => key !== group.key)
                                : [...current, group.key],
                            )
                          }
                          style={[
                            styles.outcomeHeader,
                            group.key === 'skipped' && styles.outcomeSkipped,
                            group.key === 'missed' && styles.outcomeMissed,
                          ]}
                        >
                          <AppIcon
                            name={
                              group.key === 'skipped'
                                ? 'xCircle'
                                : group.key === 'missed'
                                ? 'warning'
                                : 'checkCircle'
                            }
                            color="#203b21"
                          />
                          <Text style={styles.outcomeLabel}>
                            {group.label} ({items.length})
                          </Text>
                          <AppIcon
                            name={isExpanded ? 'chevronUp' : 'chevronDown'}
                            color="#203b21"
                          />
                        </Pressable>
                        {isExpanded &&
                          items.map(item =>
                            occurrenceView(
                              item,
                              state.medicines.find(
                                m => m.id === item.medicineId,
                              ) ?? {
                                id: item.medicineId,
                                name: item.name ?? '',
                                instructions: item.instructions ?? '',
                                type: item.type ?? 'reminder',
                                times: [],
                                mode: 'notification',
                              },
                              true,
                            ),
                          )}
                      </View>
                    );
                  })}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.settings}
                    onPress={() => setScreen('access')}
                    style={styles.accessLink}
                  >
                    <Text style={styles.accessLinkText}>{t.settings}</Text>
                    <AppIcon name="chevronRight" color="#526d40" />
                  </Pressable>
                </>
              ) : screen === 'reminders' ? (
                <>
                  <PillAction
                    title={t.add}
                    onPress={() => {
                      setEditing(undefined);
                      setSetupOrigin('reminders');
                      setScreen('setup');
                    }}
                  />
                  {state.medicines.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Text style={styles.emptyTitle}>{t.empty}</Text>
                      <Text style={styles.emptyHelp}>{t.emptyHelp}</Text>
                    </View>
                  ) : (
                    [false, true].map(isPast => {
                      const items = state.medicines.filter(
                        m => pastIds.has(m.id) === isPast,
                      );
                      if (!items.length) return null;
                      return (
                        <View key={String(isPast)} style={styles.reminderGroup}>
                          {isPast && (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityState={{ expanded: pastExpanded }}
                              onPress={() => setPastExpanded(!pastExpanded)}
                              style={styles.accessLink}
                            >
                              <Text style={styles.outcomeLabel}>
                                {t.past} ({items.length})
                              </Text>
                              <AppIcon
                                name={
                                  pastExpanded ? 'chevronUp' : 'chevronDown'
                                }
                                color="#526d40"
                              />
                            </Pressable>
                          )}
                          {(!isPast || pastExpanded) &&
                            items
                              .sort(
                                (a, b) =>
                                  (a.status === 'paused'
                                    ? 2
                                    : overdueIds.has(a.id)
                                    ? 0
                                    : 1) -
                                  (b.status === 'paused'
                                    ? 2
                                    : overdueIds.has(b.id)
                                    ? 0
                                    : 1),
                              )
                              .map(medicine => (
                                <View key={medicine.id} style={styles.medicine}>
                                  <Text style={styles.title}>
                                    {medicine.name}
                                  </Text>
                                  {overdueIds.has(medicine.id) && (
                                    <Text style={styles.overdue}>
                                      {t.overdue}
                                    </Text>
                                  )}
                                  {medicine.status === 'paused' && (
                                    <Text style={styles.text}>{t.paused}</Text>
                                  )}
                                  <Text style={styles.text}>
                                    {medicine.type === 'reminder'
                                      ? t.reminder
                                      : t.medicine}
                                  </Text>
                                  {medicine.type === 'medicine' &&
                                    !!medicine.instructions && (
                                      <Text style={styles.text}>
                                        {medicine.instructions}
                                      </Text>
                                    )}
                                  <Text style={styles.text}>
                                    {scheduleLabel(medicine)}
                                  </Text>
                                  <View style={styles.cardActions}>
                                    <Pressable
                                      accessibilityRole="button"
                                      accessibilityLabel={t.edit}
                                      style={styles.cardAction}
                                      onPress={() => {
                                        setEditing(medicine);
                                        setSetupOrigin('reminders');
                                        setScreen('setup');
                                      }}
                                    >
                                      <View style={styles.cardActionIcon}>
                                        <AppIcon name="edit" color="#315a36" />
                                      </View>
                                      <Text style={styles.cardActionText}>
                                        {t.edit}
                                      </Text>
                                    </Pressable>
                                    {!isPast && (
                                      <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel={
                                          medicine.status === 'paused'
                                            ? t.resume
                                            : t.pause
                                        }
                                        style={styles.cardAction}
                                        onPress={async () => {
                                          try {
                                            await reminderRepository.setStatus(
                                              medicine.id,
                                              medicine.status === 'paused'
                                                ? 'active'
                                                : 'paused',
                                            );
                                            await refresh();
                                          } catch {
                                            setError(t.error);
                                          }
                                        }}
                                      >
                                        <View style={styles.cardActionIcon}>
                                          <AppIcon
                                            name={
                                              medicine.status === 'paused'
                                                ? 'play'
                                                : 'pause'
                                            }
                                            color="#315a36"
                                          />
                                        </View>
                                        <Text style={styles.cardActionText}>
                                          {medicine.status === 'paused'
                                            ? t.resume
                                            : t.pause}
                                        </Text>
                                      </Pressable>
                                    )}
                                    <Pressable
                                      accessibilityRole="button"
                                      accessibilityLabel={t.delete}
                                      style={styles.cardAction}
                                      onPress={() =>
                                        Alert.alert(
                                          t.delete,
                                          t.deleteQuestion,
                                          [
                                            { text: t.cancel, style: 'cancel' },
                                            {
                                              text: t.delete,
                                              style: 'destructive',
                                              onPress: async () => {
                                                try {
                                                  await reminderRepository.setStatus(
                                                    medicine.id,
                                                    'deleted',
                                                  );
                                                  await refresh();
                                                } catch {
                                                  setError(t.error);
                                                }
                                              },
                                            },
                                          ],
                                        )
                                      }
                                    >
                                      <View style={styles.cardActionIcon}>
                                        <AppIcon
                                          name="delete"
                                          color="#a13027"
                                        />
                                      </View>
                                      <Text
                                        style={[
                                          styles.cardActionText,
                                          styles.deleteText,
                                        ]}
                                      >
                                        {t.delete}
                                      </Text>
                                    </Pressable>
                                  </View>
                                </View>
                              ))}
                        </View>
                      );
                    })
                  )}
                </>
              ) : screen === 'history' ? (
                <>
                  {undo && <PillAction title={t.undo} onPress={undoChange} />}
                  {(state.history ?? []).length === 0 && (
                    <Text style={styles.text}>{t.noHistory}</Text>
                  )}
                  {[...(state.history ?? [])]
                    .sort((a, b) => b.scheduledAt - a.scheduledAt)
                    .map((occurrence, index, items) => {
                      const date = new Date(
                        occurrence.scheduledAt,
                      ).toLocaleDateString(translations[language].locale, {
                        dateStyle: 'full',
                      });
                      const previousDate =
                        index > 0
                          ? new Date(
                              items[index - 1].scheduledAt,
                            ).toLocaleDateString(
                              translations[language].locale,
                              { dateStyle: 'full' },
                            )
                          : null;
                      const medicine = state.medicines.find(
                        item => item.id === occurrence.medicineId,
                      );
                      const details = medicine ?? {
                        id: occurrence.medicineId,
                        name: occurrence.name ?? '',
                        instructions: occurrence.instructions ?? '',
                        type: occurrence.type ?? 'reminder',
                        times: [],
                        mode: 'notification' as const,
                      };
                      return (
                        <View
                          key={`${occurrence.medicineId}:${occurrence.scheduledAt}`}
                        >
                          {date !== previousDate && (
                            <Text
                              accessibilityRole="header"
                              style={styles.sectionTitle}
                            >
                              {date}
                            </Text>
                          )}
                          {occurrenceView(occurrence, details, true)}
                        </View>
                      );
                    })}
                  <PillAction
                    secondary
                    title={t.clearHistory}
                    onPress={() =>
                      Alert.alert(t.clearHistory, t.clearQuestion, [
                        { text: t.cancel, style: 'cancel' },
                        {
                          text: t.clear,
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await reminderRepository.clearHistory();
                              setUndo(undefined);
                              await refresh();
                            } catch {
                              setError(t.actionError);
                            }
                          },
                        },
                      ])
                    }
                  />
                  <PillAction
                    secondary
                    title={t.cancel}
                    onPress={() => {
                      setUndo(undefined);
                      setScreen('today');
                    }}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>{t.settings}</Text>
                  <Text style={styles.accessIntro}>{t.accessIntro}</Text>
                  {(['notification', 'alarm'] as const).map(mode => (
                    <SoundChoice
                      key={mode}
                      mode={mode}
                      value={soundDefaults[mode]}
                      language={language}
                      isDefault
                      onChange={choice => {
                        reminderRepository
                          .setSoundDefault(mode, choice)
                          .then(() =>
                            setSoundDefaults(current => ({
                              ...current,
                              [mode]: choice,
                            })),
                          )
                          .catch(() => setError(t.error));
                      }}
                    />
                  ))}
                  <Text>{translations[language].sound.help}</Text>
                  {!state.enabled && (
                    <View style={styles.warning}>
                      <View style={styles.warningHeader}>
                        <View
                          accessible={false}
                          importantForAccessibility="no-hide-descendants"
                          style={styles.warningIcon}
                        >
                          <AppIcon name="warning" color="#fff" />
                        </View>
                        <Text
                          accessibilityRole="alert"
                          style={styles.warningTitle}
                        >
                          {t.off}
                        </Text>
                      </View>
                      <Text style={styles.warningText}>
                        {!state.notifications && !state.exactAlarms
                          ? t.offBoth
                          : !state.notifications
                          ? t.offNotifications
                          : t.offAlarms}
                      </Text>
                    </View>
                  )}
                  {state.enabled && (
                    <Text style={styles.accessReady}>{t.accessReady}</Text>
                  )}
                  {[
                    {
                      key: 'notifications',
                      title: t.notifications,
                      allowed: state.notifications,
                      help: t.notificationHelp,
                      action: state.notifications
                        ? t.notificationSettings
                        : t.allowNotifications,
                      onPress: state.notifications
                        ? () => reminderRepository.openNotificationSettings()
                        : allowNotifications,
                    },
                    {
                      key: 'exact',
                      title: t.exact,
                      allowed: state.exactAlarms,
                      help: t.exactHelp,
                      action: state.exactAlarms
                        ? t.exactSettings
                        : t.allowExact,
                      onPress: () => reminderRepository.openAlarmSettings(),
                      automatic:
                        Platform.OS === 'android' &&
                        Number(Platform.Version) < 31,
                    },
                  ].map(permission => (
                    <View
                      key={permission.key}
                      testID={`access-${permission.key}`}
                      style={styles.permissionCard}
                    >
                      <View style={styles.permissionHeader}>
                        <View
                          accessible={false}
                          importantForAccessibility="no-hide-descendants"
                          style={[
                            styles.permissionIcon,
                            permission.allowed
                              ? styles.permissionAllowed
                              : styles.permissionDenied,
                          ]}
                        >
                          <AppIcon
                            name={permission.allowed ? 'check' : 'x'}
                            color="#fff"
                          />
                        </View>
                        <View style={styles.permissionHeading}>
                          <Text style={styles.permissionTitle}>
                            {permission.title}
                          </Text>
                          <Text
                            style={[
                              styles.permissionStatus,
                              permission.allowed
                                ? styles.allowedText
                                : styles.deniedText,
                            ]}
                          >
                            {permission.allowed ? t.allowed : t.notAllowed}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.permissionHelp}>
                        {permission.help}
                      </Text>
                      {permission.automatic ? (
                        <Text style={styles.permissionHelp}>
                          {t.exactAutomatic}
                        </Text>
                      ) : (
                        <PillAction
                          secondary={permission.allowed}
                          title={permission.action}
                          onPress={permission.onPress}
                        />
                      )}
                    </View>
                  ))}
                  <PillAction
                    secondary
                    title={t.test}
                    onPress={() => reminderRepository.testReminder()}
                  />
                  <Text style={styles.accessFoot}>{t.explanation}</Text>
                  <Text style={styles.accessFoot}>{t.storage}</Text>
                  <LanguageSelector
                    title={t.language}
                    systemDefault={t.systemDefault}
                    value={state.languagePreference ?? 'system'}
                    onChange={async choice => {
                      try {
                        await reminderRepository.setLanguage(choice);
                        await refresh();
                      } catch {
                        setError(t.error);
                      }
                    }}
                  />
                  <PillAction
                    secondary
                    title={t.cancel}
                    onPress={() => {
                      refresh();
                      setScreen('today');
                    }}
                  />
                </>
              )}
              {!!error && (
                <Text accessibilityRole="alert" style={styles.error}>
                  {error === 'load' ? t.loadError : error}
                </Text>
              )}
            </ScrollView>
            {screen !== 'access' && (
              <View style={styles.navigation} accessibilityRole="tablist">
                {(['today', 'reminders', 'history'] as const).map(tab => (
                  <Pressable
                    key={tab}
                    testID={`nav-${tab}`}
                    accessibilityRole="tab"
                    accessibilityLabel={t[tab]}
                    accessibilityState={{ selected: screen === tab }}
                    onPress={() => {
                      setUndo(undefined);
                      setScreen(tab);
                    }}
                    style={[
                      styles.navItem,
                      screen === tab && styles.navSelected,
                    ]}
                  >
                    <View accessible={false} style={styles.navIconBox}>
                      <AppIcon
                        name={
                          tab === 'today'
                            ? 'calendar'
                            : tab === 'reminders'
                            ? 'list'
                            : 'clock'
                        }
                        color="#12251a"
                      />
                    </View>
                    <Text style={styles.navText}>{t[tab]}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fbf6eb' },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 12,
    paddingBottom: 32,
    flexGrow: 1,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: '#fbf6eb',
    borderTopWidth: 1,
    borderTopColor: '#e7dfcd',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 4,
    borderRadius: 14,
  },
  navSelected: { backgroundColor: '#e0e9c7' },
  navIconBox: {
    width: 25,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    textAlign: 'center',
    color: '#253b29',
    fontSize: 12,
    fontWeight: '600',
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 36,
    marginBottom: 8,
  },
  brandName: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandLeaf: { width: 48, height: 36, marginHorizontal: -7 },
  brandText: { color: '#17231a', fontSize: 17, fontWeight: '700' },
  headerArt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 76,
    marginBottom: 0,
  },
  headerCopy: { flex: 1, zIndex: 1 },
  todayTitle: {
    color: '#1f271a',
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '700',
  },
  leaf: { width: 104, height: 90, marginRight: -8 },
  date: { fontSize: 17, color: '#302e25', marginTop: 4 },
  sectionTitle: {
    color: '#314e37',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  itemName: {
    color: '#233a29',
    fontSize: 20,
    fontWeight: '700',
    flexShrink: 1,
  },
  sectionBand: {
    backgroundColor: '#e3e8c9',
    color: '#202d1b',
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: 'hidden',
  },
  nextCard: {
    backgroundColor: '#fffaf1',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e1cf',
    overflow: 'hidden',
  },
  nextBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eef0d8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  occurrenceCopy: { flex: 1 },
  occurrenceHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaText: { color: '#383b31', fontSize: 15, marginTop: 3 },
  reminderGroup: { gap: 12 },
  compactCard: { backgroundColor: '#fffdf7', borderRadius: 14, padding: 14 },
  emptyCard: {
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingTop: 32,
    paddingBottom: 12,
  },
  emptyLeaf: { width: 210, height: 140, marginBottom: 4 },
  emptyTitle: {
    color: '#17291b',
    fontSize: 22,
    textAlign: 'center',
    fontWeight: '700',
  },
  emptyHelp: {
    fontSize: 17,
    lineHeight: 24,
    color: '#3f4239',
    textAlign: 'center',
    maxWidth: 260,
    marginTop: 12,
  },
  emptyAction: { marginTop: 24, minWidth: 220, maxWidth: '100%' },
  accessLink: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  accessLinkText: { color: '#526d40', fontSize: 15, fontWeight: '600' },
  title: { color: '#162524', fontSize: 26, fontWeight: '700' },
  text: { color: '#162524', fontSize: 18, marginVertical: 8 },
  warning: {
    backgroundColor: '#fff1ee',
    borderColor: '#dca69e',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  warningHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  warningIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#b83229',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningTitle: {
    color: '#8f241e',
    fontSize: 22,
    fontWeight: '700',
    flexShrink: 1,
  },
  warningText: { color: '#4b2925', fontSize: 16, lineHeight: 23 },
  accessIntro: { color: '#41483d', fontSize: 16, lineHeight: 23 },
  accessReady: { color: '#326a35', fontSize: 16, fontWeight: '600' },
  permissionCard: {
    backgroundColor: '#fffdf7',
    borderColor: '#e4dfd0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  permissionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  permissionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionAllowed: { backgroundColor: '#3c773d' },
  permissionDenied: { backgroundColor: '#b83229' },
  permissionHeading: { flex: 1, gap: 2 },
  permissionTitle: { color: '#162524', fontSize: 18, fontWeight: '700' },
  permissionStatus: { fontSize: 15, fontWeight: '600' },
  allowedText: { color: '#326a35' },
  deniedText: { color: '#a13027' },
  permissionHelp: { color: '#41483d', fontSize: 16, lineHeight: 22 },
  accessFoot: { color: '#41483d', fontSize: 15, lineHeight: 22 },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e1cf',
    marginTop: 4,
    paddingTop: 8,
  },
  cardAction: {
    flex: 1,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    gap: 2,
  },
  cardActionIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActionText: {
    color: '#315a36',
    fontSize: 14,
    lineHeight: 18,
    includeFontPadding: false,
    textAlign: 'center',
  },
  deleteText: { color: '#a13027' },
  medicine: {
    borderWidth: 1,
    borderColor: '#e5e1cf',
    backgroundColor: '#fffaf1',
    borderRadius: 16,
    padding: 16,
    paddingBottom: 8,
    gap: 8,
  },
  occurrence: {
    gap: 9,
    marginTop: 0,
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#e5e1cf',
  },
  occurrenceCompact: { marginTop: 0, borderRadius: 14 },
  outcomeGroup: { gap: 6 },
  outcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: '#e1ebc8',
    gap: 10,
  },
  outcomeSkipped: { backgroundColor: '#f4e4cc' },
  overdue: { color: '#80551c', fontWeight: '600' },
  outcomeMissed: { backgroundColor: '#f4ded6' },
  outcomeLabel: { color: '#1b2a1c', fontSize: 17, fontWeight: '700', flex: 1 },
  error: { color: '#a01818', fontSize: 18 },
});
