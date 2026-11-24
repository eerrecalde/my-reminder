import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AlarmScreenAccess } from './AlarmScreenAccess';
import { AppIcon } from './AppIcon';
import type { FullScreenAccess } from './reminderRepository';
import { SoundChoice } from './SoundChoice';
import { translations } from './translations';

type Props = {
  language: 'en' | 'es';
  mode: 'notification' | 'alarm';
  onModeChange: (mode: 'notification' | 'alarm') => void;
  notificationSound: string | null;
  onNotificationSoundChange: (sound: string | null) => void;
  alarmSound: string | null;
  onAlarmSoundChange: (sound: string | null) => void;
  fullScreenAccess?: FullScreenAccess;
  openFullScreenSettings?: () => void;
};

export function ReminderAlertChoice({
  language,
  mode,
  onModeChange,
  notificationSound,
  onNotificationSoundChange,
  alarmSound,
  onAlarmSoundChange,
  fullScreenAccess,
  openFullScreenSettings,
}: Props) {
  const t = translations[language].setup;
  return (
    <>
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
            onPress={() => onModeChange(choice)}
            style={styles.modeOption}
          >
            <AppIcon
              name={mode === choice ? 'circleDot' : 'circle'}
              color="#36542b"
            />
            <Text style={styles.modeText}>{t[choice]}</Text>
          </Pressable>
        ))}
      </View>
      {mode === 'alarm' && fullScreenAccess && openFullScreenSettings && (
        <AlarmScreenAccess
          language={language}
          access={fullScreenAccess}
          openSettings={openFullScreenSettings}
        />
      )}
      <SoundChoice
        mode={mode}
        value={mode === 'alarm' ? alarmSound : notificationSound}
        onChange={
          mode === 'alarm' ? onAlarmSoundChange : onNotificationSoundChange
        }
        language={language}
      />
    </>
  );
}

const styles = StyleSheet.create({
  label: { color: '#162524', fontSize: 18, marginVertical: 8 },
  modeOption: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeText: { color: '#162524', fontSize: 18 },
});
