import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from './AppIcon';

type Action = { kind: 'back' | 'settings'; label: string; onPress: () => void };

export function AppHeader({ action }: { action?: Action }) {
  return (
    <View style={styles.header}>
      <View style={styles.brandPosition} pointerEvents="none">
        <View style={styles.brand}>
          <Image
            source={require('../assets/brand-sprig.png')}
            style={styles.leaf}
            resizeMode="contain"
            accessible={false}
          />
          <Text style={styles.brandText}>My Reminders</Text>
        </View>
      </View>
      {action && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          style={action.kind === 'back' ? styles.back : styles.settings}
          hitSlop={action.kind === 'settings' ? 12 : undefined}
        >
          <AppIcon
            name={action.kind === 'back' ? 'arrowLeft' : 'settings'}
            color={action.kind === 'back' ? '#36542b' : '#142219'}
          />
          {action.kind === 'back' && (
            <Text style={styles.backText}>{action.label}</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    marginHorizontal: 24,
    paddingTop: 8,
    justifyContent: 'center',
  },
  brandPosition: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 8,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leaf: { width: 40, height: 36 },
  brandText: { color: '#17231a', fontSize: 17, fontWeight: '700' },
  back: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
  },
  backText: { color: '#36542b', fontSize: 18, fontWeight: '600' },
  settings: {
    alignSelf: 'flex-end',
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -12,
  },
});
