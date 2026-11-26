import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from './AppIcon';
import type { DailyMedicineInput } from './MedicineSetup';
import { translations } from './translations';

type Props = {
  language: 'en' | 'es';
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
  value: NonNullable<DailyMedicineInput['scheduleKind']> | 'once';
  onChange: (
    value: NonNullable<DailyMedicineInput['scheduleKind']> | 'once',
  ) => void;
};

export function ScheduleFrequency({
  language,
  value,
  onChange,
  open,
  onOpenChange,
}: Props) {
  const t = translations[language].setup;
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{t.frequency}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t.frequency}: ${t[value]}`}
        accessibilityState={{ expanded: open }}
        onPress={() => onOpenChange(open => !open)}
        style={styles.fieldControl}
      >
        <Text style={styles.fieldValue}>{t[value]}</Text>
        <AppIcon name={open ? 'chevronUp' : 'chevronDown'} color="#36542b" />
      </Pressable>
      {open && (
        <View accessibilityRole="radiogroup" style={styles.scheduleOptions}>
          {(['once', 'daily', 'weekday', 'interval', 'monthly'] as const).map(
            kind => (
              <Pressable
                key={kind}
                accessibilityRole="radio"
                accessibilityState={{ checked: value === kind }}
                onPress={() => {
                  onChange(kind);
                  onOpenChange(false);
                }}
                style={styles.scheduleOption}
              >
                <AppIcon
                  name={value === kind ? 'circleDot' : 'circle'}
                  color="#36542b"
                />
                <Text style={styles.modeText}>{t[kind]}</Text>
              </Pressable>
            ),
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scheduleOptions: {
    borderWidth: 1,
    borderColor: '#a4b398',
    backgroundColor: '#fffaf1',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  scheduleOption: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldGroup: { gap: 8, marginVertical: 8 },
  fieldLabel: { color: '#162524', fontSize: 17, fontWeight: '600' },
  fieldControl: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#a4b398',
    backgroundColor: '#fffaf1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  fieldValue: { color: '#162524', fontSize: 17, flexShrink: 1 },
  modeText: { color: '#162524', fontSize: 18 },
});
