import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from './AppIcon';

type LanguageChoice = 'system' | 'en' | 'es';

export function LanguageSelector({
  title,
  systemDefault,
  value,
  onChange,
}: {
  title: string;
  systemDefault: string;
  value: LanguageChoice;
  onChange: (choice: LanguageChoice) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const choices: { value: LanguageChoice; label: string }[] = [
    { value: 'system', label: systemDefault },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
  ];
  const selected = choices.find(choice => choice.value === value) ?? choices[0];
  return (
    <View style={styles.card}>
      <View style={styles.title}>
        <AppIcon name="languages" color="#203b21" />
        <Text style={styles.titleText}>{title}</Text>
      </View>
      <Pressable
        testID="language-dropdown"
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityValue={{ text: selected.label }}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={styles.dropdown}
      >
        <View style={styles.label}>
          {selected.value === 'system' && (
            <AppIcon name="globe" color="#203b21" />
          )}
          <Text style={styles.text}>{selected.label}</Text>
        </View>
        <AppIcon name={open ? 'chevronUp' : 'chevronDown'} color="#203b21" />
      </Pressable>
      {open && (
        <ScrollView style={styles.options} nestedScrollEnabled>
          {choices.map(choice => (
            <Pressable
              key={choice.value}
              testID={`language-${choice.value}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: value === choice.value }}
              onPress={async () => {
                await onChange(choice.value);
                setOpen(false);
              }}
              style={styles.option}
            >
              {choice.value === 'system' && (
                <AppIcon name="globe" color="#203b21" />
              )}
              <Text style={styles.text}>{choice.label}</Text>
              {value === choice.value && (
                <AppIcon name="check" color="#203b21" />
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fffdf7',
    borderColor: '#e5e1d4',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  title: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titleText: { color: '#162524', fontSize: 18, fontWeight: '700' },
  dropdown: {
    borderWidth: 1,
    borderColor: '#526d40',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  text: { color: '#162524', fontSize: 16, flexShrink: 1 },
  options: { maxHeight: 220 },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
