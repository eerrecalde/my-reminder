import React, { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  Alert,
  Button,
  PermissionsAndroid,
  Platform,
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
    cancel: 'Cancel',
    empty: 'No reminders added yet.',
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
  },
  es: {
    today: 'Hoy',
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
    cancel: 'Cancelar',
    empty: 'Aún no hay recordatorios.',
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
  },
};
export default function App() {
  const [state, setState] = useState<ReminderState>();
  const [screen, setScreen] = useState<
    'today' | 'setup' | 'access' | 'history'
  >('today');
  const [error, setError] = useState('');
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
  const occurrenceView = (occurrence: Occurrence, medicine: Medicine) => {
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
    return (
      <View
        key={`${occurrence.medicineId}:${occurrence.scheduledAt}`}
        style={styles.occurrence}
      >
        <Text style={styles.text}>
          {label}: {timeLabel(occurrence.scheduledAt)}
        </Text>
        <Button
          color="#00535b"
          title={medicine.type === 'reminder' ? t.done : t.taken}
          accessibilityLabel={`${
            medicine.type === 'reminder' ? t.done : t.taken
          }, ${context}`}
          onPress={() => changeOutcome(occurrence, 'completed')}
        />
        <Button
          color="#00535b"
          title={t.skip}
          accessibilityLabel={`${t.skip}, ${context}`}
          onPress={() => changeOutcome(occurrence, 'skipped')}
        />
        {occurrence.snoozed && <Text style={styles.text}>{t.snoozed}</Text>}
        {occurrence.outstanding && !occurrence.snoozed && occurrence.outcome == null && (
          <Button
            color="#00535b"
            title={`${t.snooze} 10 ${t.minutes}`}
            accessibilityLabel={`${t.snooze} 10 ${t.minutes}, ${context}`}
            onPress={async () => {
              try {
                await reminderRepository.snooze(occurrence.medicineId, occurrence.scheduledAt, 10);
                setError('');
                await refresh();
              } catch {
                setError(t.actionError);
              }
            }}
          />
        )}
        {occurrence.outcome != null && (
          <Button
            color="#00535b"
            title={t.unconfirm}
            accessibilityLabel={`${t.unconfirm}, ${context}`}
            onPress={() => changeOutcome(occurrence, null)}
          />
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
              color="#00535b"
              title={t.cancel}
              onPress={() => setScreen('today')}
            />
            <MedicineSetup
              selectTime={time => reminderRepository.selectTime(time)}
              language={language}
              onSave={async medicine => {
                try {
                  await reminderRepository.saveTyped(
                    medicine.type,
                    medicine.name,
                    medicine.instructions,
                    medicine.times,
                    medicine.mode,
                  );
                  await refresh();
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
          <ScrollView contentContainerStyle={styles.content}>
            <Text accessibilityRole="header" style={styles.title}>
              {screen === 'today'
                ? t.today
                : screen === 'history'
                ? t.history
                : t.settings}
            </Text>
            {!state ? (
              <Text style={styles.text}>{t.loading}</Text>
            ) : screen === 'today' ? (
              <>
                {state.enabled && <Text style={styles.text}>{t.on}</Text>}
                {!state.enabled && (
                  <View style={styles.warning}>
                    <Text accessibilityRole="alert" style={styles.title}>
                      {t.off}
                    </Text>
                    <Button
                      color="#00535b"
                      title={t.enable}
                      onPress={() => setScreen('access')}
                    />
                  </View>
                )}
                {undo && (
                  <Button color="#00535b" title={t.undo} onPress={undoChange} />
                )}
                {(state.upcoming ?? []).length > 0 &&
                  (() => {
                    const next = [...state.upcoming].sort(
                      (a, b) => a.scheduledAt - b.scheduledAt,
                    )[0];
                    const medicine = state.medicines.find(
                      item => item.id === next.medicineId,
                    );
                    return medicine ? (
                      <Text style={styles.title}>
                        {t.next}: {medicine.name}, {timeLabel(next.scheduledAt)}
                      </Text>
                    ) : null;
                  })()}
                {state.medicines.length === 0 ? (
                  <Text style={styles.text}>{t.empty}</Text>
                ) : (
                  state.medicines.map(medicine => (
                    <View key={medicine.id} style={styles.medicine}>
                      <Text style={styles.title}>{medicine.name}</Text>
                      <Text style={styles.text}>
                        {medicine.type === 'reminder' ? t.reminder : t.medicine}
                      </Text>
                      {medicine.type === 'medicine' &&
                        !!medicine.instructions && (
                          <Text style={styles.text}>
                            {medicine.instructions}
                          </Text>
                        )}
                      <Text style={styles.text}>
                        {medicine.times.join(', ')}
                      </Text>
                      {(state.upcoming ?? [])
                        .filter(
                          item =>
                            item.medicineId === medicine.id &&
                            new Date(item.scheduledAt).toDateString() ===
                              new Date().toDateString(),
                        )
                        .map(item => (
                          <Text key={item.scheduledAt} style={styles.text}>
                            {t.upcoming}: {timeLabel(item.scheduledAt)}
                          </Text>
                        ))}
                      {state.todayDoses
                        .filter(dose => dose.medicineId === medicine.id)
                        .map(dose => occurrenceView(dose, medicine))}
                    </View>
                  ))
                )}
                <Button
                  color="#00535b"
                  title={t.add}
                  onPress={() => setScreen('setup')}
                />
                <View style={styles.spacer} />
                <Button
                  color="#00535b"
                  title={t.history}
                  onPress={() => {
                    setUndo(undefined);
                    setScreen('history');
                  }}
                />
                <View style={styles.spacer} />
                <Button
                  color="#00535b"
                  title={t.settings}
                  onPress={() => setScreen('access')}
                />
              </>
            ) : screen === 'history' ? (
              <>
                {undo && (
                  <Button color="#00535b" title={t.undo} onPress={undoChange} />
                )}
                {(state.history ?? []).length === 0 && (
                  <Text style={styles.text}>{t.noHistory}</Text>
                )}
                {[...(state.history ?? [])].reverse().map(occurrence => {
                  const medicine = state.medicines.find(
                    item => item.id === occurrence.medicineId,
                  );
                  return medicine ? (
                    <View
                      key={`${occurrence.medicineId}:${occurrence.scheduledAt}`}
                      style={styles.medicine}
                    >
                      <Text style={styles.title}>{medicine.name}</Text>
                      {occurrenceView(occurrence, medicine)}
                    </View>
                  ) : null;
                })}
                <Button
                  color="#00535b"
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
                  color="#00535b"
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
                <Text style={styles.text}>
                  {t.notifications}:{' '}
                  {state.notifications ? t.allowed : t.notAllowed}
                </Text>
                <Button
                  color="#00535b"
                  title={t.notifications}
                  onPress={allowNotifications}
                />
                <View style={styles.spacer} />
                <Text style={styles.text}>
                  {t.exact}: {state.exactAlarms ? t.allowed : t.notAllowed}
                </Text>
                <Button
                  color="#00535b"
                  title={t.exact}
                  onPress={() => reminderRepository.openAlarmSettings()}
                />
                <View style={styles.spacer} />
                <Button
                  color="#00535b"
                  title={t.test}
                  onPress={() => reminderRepository.testReminder()}
                />
                <View style={styles.spacer} />
                <Button
                  color="#00535b"
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
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, gap: 12 },
  title: { color: '#162524', fontSize: 26, fontWeight: '700' },
  text: { color: '#162524', fontSize: 18, marginVertical: 8 },
  warning: { borderWidth: 2, borderColor: '#a01818', padding: 16, gap: 12 },
  medicine: { borderWidth: 1, borderColor: '#324b49', padding: 16 },
  occurrence: { gap: 8, marginVertical: 8 },
  spacer: { height: 12 },
  error: { color: '#a01818', fontSize: 18 },
});
