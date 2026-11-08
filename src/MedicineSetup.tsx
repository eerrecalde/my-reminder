import React, { useRef, useState } from 'react';
import {
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { nextDailyOccurrences } from './dailySchedule';
import type { ReminderType } from './reminderRepository';

export type DailyMedicineInput = {
  type: ReminderType;
  mode: 'notification' | 'alarm';
  name: string;
  instructions: string;
  times: string[];
};
type Props = {
  language: 'en' | 'es';
  now?: Date;
  onSave: (medicine: DailyMedicineInput) => void | Promise<void>;
  selectTime?: (time: string) => Promise<string | null>;
};

const copy = {
  en: {
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
    everyDay: 'Every day at',
    save: 'Save medicine',
    back: 'Back',
  },
  es: {
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
    everyDay: 'Todos los días a las',
    save: 'Guardar medicamento',
    back: 'Volver',
  },
};

export function MedicineSetup({ language, now, onSave, selectTime }: Props) {
  const t = copy[language];
  const [step, setStep] = useState(0);
  const [type, setType] = useState<ReminderType>('reminder');
  const [mode, setMode] = useState<'notification' | 'alarm'>('notification');
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [times, setTimes] = useState(['09:00']);
  const [error, setError] = useState('');
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
    setError('');
    setStep(step + 1);
  };
  return (
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
          <Button
            color="#00535b"
            title={t.reminder}
            onPress={() => {
              setType('reminder');
              setStep(1);
            }}
          />
          <Button
            color="#00535b"
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
          <Text style={styles.label}>{t.times}</Text>
          {times.map((time, index) => (
            <View key={`${time}-${index}`} style={styles.timeRow}>
              <Button
                color="#00535b"
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
                <Button
                  color="#00535b"
                  title={`${t.removeTime}: ${time}`}
                  onPress={() =>
                    setTimes(current => current.filter((_, i) => i !== index))
                  }
                />
              )}
            </View>
          ))}
          <Button
            color="#00535b"
            title={t.addTime}
            onPress={async () => {
              const selected = await selectTime?.('09:00');
              if (selected)
                setTimes(current =>
                  [...new Set([...current, selected])].sort(),
                );
            }}
          />
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
            {t.everyDay} {times.join(', ')}
          </Text>
          <Text accessibilityRole="header" style={styles.label}>
            {t.nextThree}
          </Text>
          {nextDailyOccurrences(times, now ?? new Date(), 3).map(date => (
            <Text key={date.toISOString()} style={styles.label}>
              {date.toLocaleString(language === 'es' ? 'es-MX' : 'en-GB', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </Text>
          ))}
        </>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
      <View style={styles.actions}>
        {step > 0 && (
          <Button
            color="#00535b"
            title={t.back}
            onPress={() => {
              setError('');
              setStep(step - 1);
            }}
          />
        )}
        {step > 0 && step < 3 ? (
          <Button
            color="#00535b"
            title={step === 1 ? t.next : t.review}
            onPress={next}
          />
        ) : step === 3 ? (
          <Button
            color="#00535b"
            title={type === 'medicine' ? t.save : t.saveReminder}
            disabled={saving}
            onPress={async () => {
              if (savingRef.current) return;
              savingRef.current = true;
              setSaving(true);
              try {
                await onSave({
                  type,
                  mode,
                  name: name.trim(),
                  instructions: type === 'medicine' ? instructions.trim() : '',
                  times: [...new Set(times)],
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
  );
}
const styles = StyleSheet.create({
  content: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
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
    borderColor: '#324b49',
    borderRadius: 6,
    minHeight: 52,
    paddingHorizontal: 12,
  },
  error: { color: '#a01818', fontSize: 18, marginVertical: 12 },
  actions: { gap: 12, marginTop: 24 },
  timeRow: { gap: 8, marginVertical: 8 },
  modeOption: { minHeight: 48, justifyContent: 'center' },
  modeText: { color: '#162524', fontSize: 18 },
});
