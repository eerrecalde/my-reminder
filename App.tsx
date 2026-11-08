import React, { useCallback, useEffect, useState } from 'react';
import {
  AppState,
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
import { reminderRepository, ReminderState } from './src/reminderRepository';

const words = {
  en: {
    today: 'Today',
    add: 'Add medicine',
    off: 'Reminders off',
    on: 'Reminders on',
    unconfirmed: 'Unconfirmed dose',
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
    empty: 'No medicines added yet.',
    error: 'Could not save. Please try again.',
    loading: 'Loading medicines…',
  },
  es: {
    today: 'Hoy',
    add: 'Agregar medicamento',
    off: 'Recordatorios desactivados',
    on: 'Recordatorios activados',
    unconfirmed: 'Dosis sin confirmar',
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
    empty: 'Aún no hay medicamentos.',
    error: 'No se pudo guardar. Inténtalo de nuevo.',
    loading: 'Cargando medicamentos…',
  },
};
export default function App() {
  const [state, setState] = useState<ReminderState>();
  const [screen, setScreen] = useState<'today' | 'setup' | 'access'>('today');
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      setState(await reminderRepository.state());
    } catch {
      setError('Unable to load medicines');
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
                  await reminderRepository.save(
                    medicine.name,
                    medicine.instructions,
                    medicine.times,
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
                {error}
              </Text>
            )}
          </>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <Text accessibilityRole="header" style={styles.title}>
              {screen === 'today' ? t.today : t.settings}
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
                {state.medicines.length === 0 ? (
                  <Text style={styles.text}>{t.empty}</Text>
                ) : (
                  state.medicines.map(medicine => (
                    <View key={medicine.id} style={styles.medicine}>
                      <Text style={styles.title}>{medicine.name}</Text>
                      <Text style={styles.text}>{medicine.instructions}</Text>
                      <Text style={styles.text}>
                        {medicine.times.join(', ')}
                      </Text>
                      {state.todayDoses
                        .filter(dose => dose.medicineId === medicine.id)
                        .map(dose => (
                          <Text key={dose.scheduledAt} style={styles.text}>
                            {t.unconfirmed}:{' '}
                            {new Date(dose.scheduledAt).toLocaleTimeString(
                              language === 'es' ? 'es-MX' : 'en-GB',
                              { hour: '2-digit', minute: '2-digit' },
                            )}
                          </Text>
                        ))}
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
                  title={t.settings}
                  onPress={() => setScreen('access')}
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
                {error}
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
  spacer: { height: 12 },
  error: { color: '#a01818', fontSize: 18 },
});
