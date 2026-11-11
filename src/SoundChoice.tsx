import { AppIcon } from './AppIcon';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { reminderRepository } from './reminderRepository';

type Props = {
  mode: 'notification' | 'alarm';
  value: string | null;
  onChange: (value: string | null) => void;
  language: 'en' | 'es';
  isDefault?: boolean;
};

export function SoundChoice({
  mode,
  value,
  onChange,
  language,
  isDefault,
}: Props) {
  const [info, setInfo] = useState<{
    available: boolean;
    title: string | null;
  }>({ available: true, title: null });
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    if (value && reminderRepository.soundInfo) {
      reminderRepository
        .soundInfo(value)
        .then(result => {
          if (live) setInfo(result);
        })
        .catch(() => {
          if (live) setInfo({ available: false, title: null });
        });
    } else setInfo({ available: true, title: null });
    return () => {
      live = false;
    };
  }, [value]);
  const es = language === 'es';
  const title =
    mode === 'alarm'
      ? es
        ? 'Sonido de alarma'
        : 'Alarm sound'
      : es
      ? 'Sonido de notificación'
      : 'Notification sound';
  const label =
    value === null
      ? isDefault
        ? es
          ? 'Configuración del teléfono'
          : 'Phone setting'
        : es
        ? 'Sonido predeterminado'
        : 'Default sound'
      : value === ''
      ? es
        ? 'Silencio'
        : 'Silent'
      : info.title ?? (es ? 'Sonido seleccionado' : 'Selected sound');
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${label}`}
        onPress={async () => {
          try {
            const selected = await reminderRepository.selectSound(mode, value);
            if (selected !== null) onChange(selected);
            setError(false);
          } catch {
            setError(true);
          }
        }}
        style={styles.button}
      >
        <Text style={styles.value}>{label}</Text>
        <AppIcon name="chevronRight" color="#305f55" />
      </Pressable>
      {value !== null && (
        <Pressable accessibilityRole="button" onPress={() => onChange(null)}>
          <Text style={styles.reset}>
            {isDefault
              ? es
                ? 'Restablecer configuración del teléfono'
                : 'Reset to phone setting'
              : es
              ? 'Usar sonido predeterminado'
              : 'Use default sound'}
          </Text>
        </Pressable>
      )}
      {!info.available && (
        <Text accessibilityRole="alert">
          {es
            ? 'Este sonido ya no está disponible. Se usará el sonido predeterminado.'
            : 'This sound is no longer available. The default sound will be used.'}
        </Text>
      )}
      {error && (
        <Text accessibilityRole="alert">
          {es
            ? 'No se pudo abrir el selector de sonidos.'
            : 'Could not open the sound picker.'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 12 },
  title: { color: '#162524', fontSize: 18 },
  button: { paddingVertical: 14, flexDirection: 'row', alignItems: 'center' },
  value: { color: '#305f55', fontSize: 16, flexShrink: 1 },
  reset: { color: '#305f55' },
});
