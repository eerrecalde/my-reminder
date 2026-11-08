import React, { useState } from 'react';
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { nextDailyOccurrences } from './dailySchedule';

export type DailyMedicineInput = {
  name: string;
  instructions: string;
  times: string[];
};
type Props = {
  language: 'en' | 'es';
  now?: Date;
  onSave: (medicine: DailyMedicineInput) => void;
};

const copy = {
  en: {
    medicine: 'Medicine',
    name: 'Medicine name',
    instructions: 'Dose instructions (optional)',
    next: 'Next',
    required: 'Enter a medicine name',
    schedule: 'Schedule',
    times: 'Daily times (24-hour, separated by commas)',
    invalid: 'Enter one or more times, for example 09:00, 21:00',
    mode: 'Reminder: Notification',
    review: 'Review',
    nextThree: 'Next three reminders',
    save: 'Save medicine',
    back: 'Back',
  },
  es: {
    medicine: 'Medicamento',
    name: 'Nombre del medicamento',
    instructions: 'Indicaciones de la dosis (opcional)',
    next: 'Continuar',
    required: 'Escribe el nombre del medicamento',
    schedule: 'Horario',
    times: 'Horas diarias (formato de 24 horas, separadas por comas)',
    invalid: 'Escribe una o más horas, por ejemplo 09:00, 21:00',
    mode: 'Recordatorio: Notificación',
    review: 'Revisar',
    nextThree: 'Próximos tres recordatorios',
    save: 'Guardar medicamento',
    back: 'Volver',
  },
};

export function MedicineSetup({ language, now, onSave }: Props) {
  const t = copy[language];
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [timeText, setTimeText] = useState('09:00');
  const [error, setError] = useState('');
  const times = timeText.split(',').map(time => time.trim());
  const next = () => {
    if (step === 0 && !name.trim()) {
      setError(t.required);
      return;
    }
    if (
      step === 1 &&
      (!times.length ||
        times.some(time => !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)))
    ) {
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
        {[t.medicine, t.schedule, t.review][step]}
      </Text>
      {step === 0 && (
        <>
          <Text style={styles.label}>{t.name}</Text>
          <TextInput
            accessibilityLabel={t.name}
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <Text style={styles.label}>{t.instructions}</Text>
          <TextInput
            accessibilityLabel={t.instructions}
            style={styles.input}
            value={instructions}
            onChangeText={setInstructions}
          />
        </>
      )}
      {step === 1 && (
        <>
          <Text style={styles.label}>{t.times}</Text>
          <TextInput
            accessibilityLabel={t.times}
            style={styles.input}
            value={timeText}
            onChangeText={setTimeText}
          />
          <Text style={styles.label}>{t.mode}</Text>
        </>
      )}
      {step === 2 && (
        <>
          <Text style={styles.label}>{name.trim()}</Text>
          {!!instructions.trim() && (
            <Text style={styles.label}>{instructions.trim()}</Text>
          )}
          <Text style={styles.label}>{t.mode}</Text>
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
            title={t.back}
            onPress={() => {
              setError('');
              setStep(step - 1);
            }}
          />
        )}
        {step < 2 ? (
          <Button title={step === 0 ? t.next : t.review} onPress={next} />
        ) : (
          <Button
            title={t.save}
            onPress={() =>
              onSave({
                name: name.trim(),
                instructions: instructions.trim(),
                times: [...new Set(times)],
              })
            }
          />
        )}
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
});
