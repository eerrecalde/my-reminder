import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PillAction } from './PillAction';
import type { FullScreenAccess } from './reminderRepository';
import { translations } from './translations';

export function AlarmScreenAccess({
  language,
  access,
  openSettings,
}: {
  language: 'en' | 'es';
  access: FullScreenAccess;
  openSettings: () => void;
}) {
  const t = translations[language].alarmScreenAccess;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t.title}</Text>
      <Text style={styles.help}>{t.help}</Text>
      {access !== 'automatic' && (
        <Text accessibilityLiveRegion="polite" style={styles.help}>
          {access === 'allowed' ? t.allowed : t.fallback}
        </Text>
      )}
      {access === 'denied' && (
        <PillAction secondary title={t.allow} onPress={openSettings} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderColor: '#d9e1d3',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  title: { color: '#162524', fontSize: 18, fontWeight: '700' },
  help: { color: '#41483d', fontSize: 16, lineHeight: 22 },
});
