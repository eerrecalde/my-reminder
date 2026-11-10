import React, { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  Alert,
  Button,
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
import {
  reminderRepository,
  ReminderState,
  Occurrence,
  Outcome,
  Medicine,
} from './src/reminderRepository';

const words = {
  en: {
    today: 'Today',
    reminders: 'Reminders',
    attention: 'Needs attention',
    earlier: 'Earlier',
    change: 'Change outcome',
    add: 'Add reminder',
    off: 'Reminders off',
    on: 'Reminders on',
    unconfirmed: 'Unconfirmed dose',
    unconfirmedReminder: 'Unconfirmed reminder',
    medicine: 'Medicine',
    reminder: 'Reminder',
    allowed: 'Allowed',
    notAllowed: 'Not allowed',
    enable: 'Enable reminders',
    test: 'Send a test reminder',
    settings: 'Reminder access',
    notifications: 'Allow notifications',
    exact: 'Allow exact alarms',
    explanation:
      'Reminders resume after you unlock your phone for the first time after a restart.',
    storage:
      'Reminders are stored only on this phone. They may be lost if you uninstall the app, clear its data, or lose your phone.',
    daily: 'Every day',
    weekdays: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
    everyHours: 'Every',
    hours: 'hours',
    monthly: 'Monthly',
    lastDay: 'last day',
    starts: 'Starts',
    ends: 'Ends',
    shortLast: 'Use last day in shorter months',
    shortSkip: 'Skip shorter months',
    cancel: 'Cancel',
    empty: 'No reminders added yet',
    emptyHelp: 'Add a reminder for a task, an event, or a medicine.',
    error: 'Could not save. Please try again.',
    loading: 'Loading reminders…',
    loadError: 'Unable to load reminders',
    upcoming: 'Upcoming',
    next: 'Next reminder',
    done: 'Done',
    taken: 'Taken',
    skip: 'Skip',
    skipped: 'Skipped',
    missed: 'Missed',
    undo: 'Undo',
    unconfirm: 'Mark unconfirmed',
    history: 'History',
    clearHistory: 'Clear history',
    clearQuestion: 'Clear all completed, skipped and missed history?',
    clear: 'Clear',
    noHistory: 'No history yet.',
    actionError: 'Could not update the occurrence. Please try again.',
    snooze: 'Snooze',
    snoozed: 'Snoozed',
    minutes: 'minutes',
    edit: 'Edit',
    pause: 'Pause',
    resume: 'Resume',
    delete: 'Delete',
    paused: 'Paused',
    deleteQuestion: 'Delete this reminder?',
  },
  es: {
    today: 'Hoy',
    reminders: 'Recordatorios',
    attention: 'Necesitan atención',
    earlier: 'Anteriores',
    change: 'Cambiar resultado',
    add: 'Agregar recordatorio',
    off: 'Recordatorios desactivados',
    on: 'Recordatorios activados',
    unconfirmed: 'Dosis sin confirmar',
    unconfirmedReminder: 'Recordatorio sin confirmar',
    medicine: 'Medicamento',
    reminder: 'Recordatorio',
    allowed: 'Permitido',
    notAllowed: 'No permitido',
    enable: 'Activar recordatorios',
    test: 'Enviar recordatorio de prueba',
    settings: 'Acceso a recordatorios',
    notifications: 'Permitir notificaciones',
    exact: 'Permitir alarmas exactas',
    explanation:
      'Los recordatorios se reanudan después de desbloquear el teléfono por primera vez tras reiniciarlo.',
    storage:
      'Los recordatorios se guardan solo en este teléfono. Pueden perderse si desinstalas la aplicación, borras sus datos o pierdes el teléfono.',
    daily: 'Todos los días',
    weekdays: [
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo',
    ],
    everyHours: 'Cada',
    hours: 'horas',
    monthly: 'Mensual',
    lastDay: 'último día',
    starts: 'Comienza',
    ends: 'Termina',
    shortLast: 'Usar el último día en meses más cortos',
    shortSkip: 'Omitir meses más cortos',
    cancel: 'Cancelar',
    empty: 'Aún no hay recordatorios',
    emptyHelp:
      'Agrega un recordatorio para una tarea, un evento o un medicamento.',
    error: 'No se pudo guardar. Inténtalo de nuevo.',
    loading: 'Cargando recordatorios…',
    loadError: 'No se pudieron cargar los recordatorios',
    upcoming: 'Próximo',
    next: 'Próximo recordatorio',
    done: 'Hecho',
    taken: 'Tomado',
    skip: 'Omitir',
    skipped: 'Omitido',
    missed: 'No confirmado a tiempo',
    undo: 'Deshacer',
    unconfirm: 'Marcar sin confirmar',
    history: 'Historial',
    clearHistory: 'Borrar historial',
    clearQuestion:
      '¿Borrar todo el historial de recordatorios completados, omitidos y no confirmados a tiempo?',
    clear: 'Borrar',
    noHistory: 'Aún no hay historial.',
    actionError: 'No se pudo actualizar. Inténtalo de nuevo.',
    snooze: 'Posponer',
    snoozed: 'Pospuesto',
    minutes: 'minutos',
    edit: 'Editar',
    pause: 'Pausar',
    resume: 'Reanudar',
    delete: 'Eliminar',
    paused: 'Pausado',
    deleteQuestion: '¿Eliminar este recordatorio?',
  },
};
export function PillAction({
  title,
  accessibilityLabel,
  onPress,
  secondary = false,
  showPlus = false,
}: {
  title: string;
  accessibilityLabel?: string;
  onPress: () => void;
  secondary?: boolean;
  showPlus?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      style={[styles.pillAction, secondary && styles.pillSecondary]}
    >
      {showPlus && (
        <View accessible={false} style={styles.plusIcon}>
          <View style={styles.plusHorizontal} />
          <View style={styles.plusVertical} />
        </View>
      )}
      <Text style={[styles.pillLabel, secondary && styles.pillSecondaryLabel]}>
        {title}
      </Text>
    </Pressable>
  );
}
export default function App() {
  const [state, setState] = useState<ReminderState>();
  const [screen, setScreen] = useState<
    'today' | 'reminders' | 'setup' | 'access' | 'history'
  >('today');
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [editing, setEditing] = useState<Medicine>();
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
  const sortedUpcoming = [...(state?.upcoming ?? [])].sort(
    (a, b) => a.scheduledAt - b.scheduledAt,
  );
  const nextUpcoming = sortedUpcoming[0];
  const language = state?.language ?? 'en';
  const t = words[language];
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
    new Date(at).toLocaleString(language === 'es' ? 'es-MX' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  const scheduleLabel = (medicine: Medicine) => {
    const kind = medicine.scheduleKind ?? 'daily';
    const when =
      kind === 'interval'
        ? `${t.everyHours} ${medicine.intervalHours} ${t.hours}${
            medicine.intervalAnchor != null
              ? ` · ${t.starts}: ${new Date(
                  medicine.intervalAnchor,
                ).toLocaleString(language === 'es' ? 'es-MX' : 'en-GB', {
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
      kind !== 'interval' && medicine.startDate
        ? ` · ${t.starts}: ${medicine.startDate}`
        : ''
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
            <Text style={styles.iconText}>
              {medicine.type === 'medicine' ? '✚' : '◷'}
            </Text>
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
            <Button
              color="#527457"
              title={t.cancel}
              onPress={() => {
                setEditing(undefined);
                setScreen('today');
              }}
            />
            <MedicineSetup
              initial={editing}
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
                    <Text style={styles.moreIcon}>⋮</Text>
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
                        language === 'es' ? 'es-MX' : 'en-GB',
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
                    : t.settings}
                </Text>
              )}
              {!state ? (
                <Text style={styles.text}>{t.loading}</Text>
              ) : screen === 'today' ? (
                <>
                  {!state.enabled && (
                    <View style={styles.warning}>
                      <Text accessibilityRole="alert" style={styles.title}>
                        {t.off}
                      </Text>
                      <PillAction
                        title={t.enable}
                        onPress={() => setScreen('access')}
                      />
                    </View>
                  )}
                  {undo && (
                    <Button
                      color="#527457"
                      title={t.undo}
                      onPress={undoChange}
                    />
                  )}
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
                            onPress={() => setScreen('setup')}
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
                              <Text style={styles.iconText}>◷</Text>
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
                          <Text style={styles.outcomeIcon}>
                            {group.key === 'skipped'
                              ? '×'
                              : group.key === 'missed'
                              ? '!'
                              : '✓'}
                          </Text>
                          <Text style={styles.outcomeLabel}>
                            {group.label} ({items.length})
                          </Text>
                          <Text style={styles.outcomeChevron}>
                            {isExpanded ? '⌄' : '›'}
                          </Text>
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
                    <Text style={styles.accessLinkText}>{t.settings} ›</Text>
                  </Pressable>
                </>
              ) : screen === 'reminders' ? (
                <>
                  <PillAction
                    title={t.add}
                    onPress={() => {
                      setEditing(undefined);
                      setScreen('setup');
                    }}
                  />
                  {state.medicines.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Text style={styles.emptyTitle}>{t.empty}</Text>
                      <Text style={styles.emptyHelp}>{t.emptyHelp}</Text>
                    </View>
                  ) : (
                    state.medicines.map(medicine => (
                      <View key={medicine.id} style={styles.medicine}>
                        <Text style={styles.title}>{medicine.name}</Text>
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
                        <Button
                          title={t.edit}
                          color="#527457"
                          onPress={() => {
                            setEditing(medicine);
                            setScreen('setup');
                          }}
                        />
                        <Button
                          title={
                            medicine.status === 'paused' ? t.resume : t.pause
                          }
                          color="#527457"
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
                        />
                        <Button
                          title={t.delete}
                          color="#527457"
                          onPress={() =>
                            Alert.alert(t.delete, t.deleteQuestion, [
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
                            ])
                          }
                        />
                      </View>
                    ))
                  )}
                </>
              ) : screen === 'history' ? (
                <>
                  {undo && (
                    <Button
                      color="#527457"
                      title={t.undo}
                      onPress={undoChange}
                    />
                  )}
                  {(state.history ?? []).length === 0 && (
                    <Text style={styles.text}>{t.noHistory}</Text>
                  )}
                  {[...(state.history ?? [])]
                    .sort((a, b) => b.scheduledAt - a.scheduledAt)
                    .map((occurrence, index, items) => {
                      const date = new Date(
                        occurrence.scheduledAt,
                      ).toLocaleDateString(
                        language === 'es' ? 'es-MX' : 'en-GB',
                        { dateStyle: 'full' },
                      );
                      const previousDate =
                        index > 0
                          ? new Date(
                              items[index - 1].scheduledAt,
                            ).toLocaleDateString(
                              language === 'es' ? 'es-MX' : 'en-GB',
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
                  <Button
                    color="#527457"
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
                  <Button
                    color="#527457"
                    title={t.cancel}
                    onPress={() => {
                      setUndo(undefined);
                      setScreen('today');
                    }}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.text}>{t.explanation}</Text>
                  <Text style={styles.text}>{t.storage}</Text>
                  <Text style={styles.text}>
                    {t.notifications}:{' '}
                    {state.notifications ? t.allowed : t.notAllowed}
                  </Text>
                  <Button
                    color="#527457"
                    title={t.notifications}
                    onPress={allowNotifications}
                  />
                  <View style={styles.spacer} />
                  <Text style={styles.text}>
                    {t.exact}: {state.exactAlarms ? t.allowed : t.notAllowed}
                  </Text>
                  <Button
                    color="#527457"
                    title={t.exact}
                    onPress={() => reminderRepository.openAlarmSettings()}
                  />
                  <View style={styles.spacer} />
                  <Button
                    color="#527457"
                    title={t.test}
                    onPress={() => reminderRepository.testReminder()}
                  />
                  <View style={styles.spacer} />
                  <Button
                    color="#527457"
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
                      {tab === 'today' ? (
                        <View style={styles.calendarIcon}>
                          <View style={styles.calendarTop} />
                          <Text style={styles.calendarNumber}>·</Text>
                        </View>
                      ) : tab === 'reminders' ? (
                        <Text style={styles.listIcon}>☷</Text>
                      ) : (
                        <View style={styles.clockIcon}>
                          <View style={styles.clockHand} />
                        </View>
                      )}
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
  calendarIcon: {
    width: 17,
    height: 17,
    borderWidth: 1.8,
    borderColor: '#12251a',
    borderRadius: 2,
  },
  calendarTop: {
    height: 5,
    borderBottomWidth: 1.5,
    borderBottomColor: '#12251a',
  },
  calendarNumber: {
    color: '#12251a',
    textAlign: 'center',
    lineHeight: 8,
    fontWeight: '700',
  },
  listIcon: { fontSize: 24, lineHeight: 27, color: '#12251a' },
  clockIcon: {
    width: 19,
    height: 19,
    borderWidth: 1.8,
    borderColor: '#12251a',
    borderRadius: 10,
    alignItems: 'center',
  },
  clockHand: {
    width: 5,
    height: 7,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#12251a',
    marginTop: 2,
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
  moreIcon: { color: '#142219', fontSize: 27, lineHeight: 32 },
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
  iconText: { fontSize: 25, color: '#4d6d38', fontWeight: '600' },
  occurrenceCopy: { flex: 1 },
  occurrenceHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaText: { color: '#383b31', fontSize: 15, marginTop: 3 },
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
  pillAction: {
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#4b6f3d',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  pillSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#789063',
  },
  pillLabel: {
    color: '#fffdf4',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  pillSecondaryLabel: { color: '#36542b' },
  plusIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusHorizontal: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: '#fffdf4',
    borderRadius: 1,
  },
  plusVertical: {
    position: 'absolute',
    height: 20,
    width: 2,
    backgroundColor: '#fffdf4',
    borderRadius: 1,
  },
  accessLink: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  accessLinkText: { color: '#526d40', fontSize: 15, fontWeight: '600' },
  title: { color: '#162524', fontSize: 26, fontWeight: '700' },
  text: { color: '#162524', fontSize: 18, marginVertical: 8 },
  warning: {
    backgroundColor: '#fff0dc',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  medicine: {
    borderWidth: 1,
    borderColor: '#e5e1cf',
    backgroundColor: '#fffaf1',
    borderRadius: 16,
    padding: 16,
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
  outcomeMissed: { backgroundColor: '#f4ded6' },
  outcomeIcon: {
    color: '#203b21',
    fontSize: 24,
    width: 25,
    textAlign: 'center',
  },
  outcomeLabel: { color: '#1b2a1c', fontSize: 17, fontWeight: '700', flex: 1 },
  outcomeChevron: { color: '#203b21', fontSize: 27, lineHeight: 30 },
  spacer: { height: 12 },
  error: { color: '#a01818', fontSize: 18 },
});
