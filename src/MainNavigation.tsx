import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from './AppIcon';
import { translations } from './translations';

export type MainTab = 'today' | 'reminders' | 'history';

export function MainNavigation({
  selected,
  language,
  onSelect,
}: {
  selected: MainTab;
  language: keyof typeof translations;
  onSelect: (tab: MainTab) => void;
}) {
  const labels = translations[language].app;
  return (
    <View style={styles.navigation} accessibilityRole="tablist">
      {(['today', 'reminders', 'history'] as const).map(tab => (
        <Pressable
          key={tab}
          testID={`nav-${tab}`}
          accessibilityRole="tab"
          accessibilityLabel={labels[tab]}
          accessibilityState={{ selected: selected === tab }}
          onPress={() => onSelect(tab)}
          style={[styles.navItem, selected === tab && styles.navSelected]}
        >
          <View accessible={false} style={styles.navIconBox}>
            <AppIcon
              name={
                tab === 'today' ? 'calendar' : tab === 'reminders' ? 'list' : 'clock'
              }
              color="#12251a"
            />
          </View>
          <Text style={styles.navText}>{labels[tab]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: '#fbf6eb',
    borderTopWidth: 1,
    borderTopColor: '#e7dfcd',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 4,
    borderRadius: 14,
  },
  navSelected: { backgroundColor: '#e0e9c7' },
  navIconBox: {
    width: 25,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    textAlign: 'center',
    color: '#253b29',
    fontSize: 12,
    fontWeight: '600',
  },
});
