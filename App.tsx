import { AppIcon } from './src/AppIcon';
import { SoundChoice } from './src/SoundChoice';
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
    enable: 'Review reminder access',
    offBoth:
      'Allow notifications and exact alarms so reminders can arrive on time.',
    offNotifications: 'Allow notifications so your reminders can appear.',
    offAlarms: 'Allow exact alarms so your reminders can arrive on time.',
    test: 'Send a test reminder',
    settings: 'Reminder access',
    notifications: 'Notifications',
    exact: 'Exact alarms',
    accessIntro:
      'Notifications and exact alarms are needed for reminders to arrive on time.',
    notificationHelp: 'Lets reminders appear on your phone.',
    exactHelp: 'Lets reminders arrive at the scheduled time.',
    allowNotifications: 'Allow notifications',
    notificationSettings: 'Notification settings',
    allowExact: 'Allow exact alarms',
    exactSettings: 'Exact alarm settings',
    accessReady: 'Both permissions are allowed.',
    exactAutomatic: 'Automatically allowed on this phone.',
    explanation:
      'Reminders resume after you unlock your phone for the first time after a restart.',
    storage:
      'Reminders are stored only on this phone. They may be lost if you uninstall the app, clear its data, or lose your phone.',
    once: 'Once',
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
    anchor: 'Interval reference',
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
    allowed: 'Permitidas',
    notAllowed: 'No permitidas',
    enable: 'Revisar acceso a recordatorios',
    offBoth:
      'Permite las notificaciones y las alarmas exactas para recibir recordatorios a tiempo.',
    offNotifications:
      'Permite las notificaciones para que aparezcan tus recordatorios.',
    offAlarms:
      'Permite las alarmas exactas para recibir tus recordatorios a tiempo.',
    test: 'Enviar recordatorio de prueba',
    settings: 'Acceso a recordatorios',
    notifications: 'Notificaciones',
    exact: 'Alarmas exactas',
    accessIntro:
      'Se necesitan notificaciones y alarmas exactas para recibir recordatorios a tiempo.',
    notificationHelp: 'Permite que los recordatorios aparezcan en tu teléfono.',
    exactHelp: 'Permite que los recordatorios lleguen a la hora programada.',
    allowNotifications: 'Permitir notificaciones',
    notificationSettings: 'Configuración de notificaciones',
    allowExact: 'Permitir alarmas exactas',
    exactSettings: 'Configuración de alarmas exactas',
    accessReady: 'Ambos permisos están habilitados.',
    exactAutomatic: 'Se permiten automáticamente en este teléfono.',
    explanation:
      'Los recordatorios se reanudan después de desbloquear el teléfono por primera vez tras reiniciarlo.',
    storage:
      'Los recordatorios se guardan solo en este teléfono. Pueden perderse si desinstalas la aplicación, borras sus datos o pierdes el teléfono.',
    once: 'Una vez',
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
    anchor: 'Referencia del intervalo',
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
export default function App() {
  const [state, setState] = useState<ReminderState>();
  const [screen, setScreen] = useState<
    'today' | 'reminders' | 'setup' | 'access' | 'history'
  >('today');
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
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
    if (isOneOffSchedule(medicine))
      return `${t.once} · ${medicine.startDate} · ${medicine.times[0]}`;
    const when =
      kind === 'interval'
        ? `${t.everyHours} ${medicine.intervalHours} ${t.hours}${
            medicine.intervalAnchor != null
              ? ` · ${t.anchor}: ${new Date(
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
            {medicine.type === 'medicine' ? (
              <Text style={styles.iconText}>✚</Text>
            ) : (
              <AppIcon name="clock" color="#4d6d38" />
            )}
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
                      <View style={styles.warningHeader}>
                        <View
                          accessible={false}
                          importantForAccessibility="no-hide-descendants"
                          style={styles.warningIcon}
                        >
                          <Text style={styles.warningIconText}>!</Text>
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
                    <Text style={styles.accessLinkText}>{t.settings} ›</Text>
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
                        <PillAction
                          title={t.edit}
                          onPress={() => {
                            setEditing(medicine);
                            setSetupOrigin('reminders');
                            setScreen('setup');
                          }}
                        />
                        <PillAction
                          title={
                            medicine.status === 'paused' ? t.resume : t.pause
                          }
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
                        <PillAction
                          secondary
                          title={t.delete}
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
                  {undo && <PillAction title={t.undo} onPress={undoChange} />}
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
                  <Text>
                    {language === 'es'
                      ? 'El sonido también depende de la configuración de notificaciones del teléfono.'
                      : 'Sound also depends on your phone’s notification settings.'}
                  </Text>
                  {!state.enabled && (
                    <View style={styles.warning}>
                      <View style={styles.warningHeader}>
                        <View
                          accessible={false}
                          importantForAccessibility="no-hide-descendants"
                          style={styles.warningIcon}
                        >
                          <Text style={styles.warningIconText}>!</Text>
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
                          <Text style={styles.permissionIconText}>
                            {permission.allowed ? '✓' : '×'}
                          </Text>
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
                      {tab === 'today' ? (
                        <View style={styles.calendarIcon}>
                          <View style={styles.calendarTop} />
                          <Text style={styles.calendarNumber}>·</Text>
                        </View>
                      ) : tab === 'reminders' ? (
                        <Text style={styles.listIcon}>☷</Text>
                      ) : (
                        <AppIcon name="clock" color="#12251a" />
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
  accessLink: {
    alignSelf: 'center',
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
  warningIconText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
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
  permissionIconText: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 26,
  },
  permissionHeading: { flex: 1, gap: 2 },
  permissionTitle: { color: '#162524', fontSize: 18, fontWeight: '700' },
  permissionStatus: { fontSize: 15, fontWeight: '600' },
  allowedText: { color: '#326a35' },
  deniedText: { color: '#a13027' },
  permissionHelp: { color: '#41483d', fontSize: 16, lineHeight: 22 },
  accessFoot: { color: '#41483d', fontSize: 15, lineHeight: 22 },
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
  error: { color: '#a01818', fontSize: 18 },
});
