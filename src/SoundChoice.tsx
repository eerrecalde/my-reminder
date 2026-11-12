import { AppIcon } from './AppIcon';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { reminderRepository } from './reminderRepository';
import { translations } from './translations';

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
  const t = translations[language].sound;
  const title = mode === 'alarm' ? t.alarm : t.notification;
  const label =
    value === null
      ? isDefault
        ? t.phone
        : t.default
      : value === ''
      ? t.silent
      : info.title ?? t.selected;
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
            {isDefault ? t.resetPhone : t.resetDefault}
          </Text>
        </Pressable>
      )}
      {!info.available && (
        <Text accessibilityRole="alert">{t.unavailable}</Text>
      )}
      {error && <Text accessibilityRole="alert">{t.error}</Text>}
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
