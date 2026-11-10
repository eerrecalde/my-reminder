import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function PillAction({
  title,
  accessibilityLabel,
  onPress,
  secondary = false,
  showPlus = false,
}: {
  title: string;
  accessibilityLabel?: string;
  onPress: () => void;
  secondary?: boolean;
  showPlus?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      style={[styles.pillAction, secondary && styles.pillSecondary]}
    >
      {showPlus && (
        <View accessible={false} style={styles.plusIcon}>
          <View style={styles.plusHorizontal} />
          <View style={styles.plusVertical} />
        </View>
      )}
      <Text style={[styles.pillLabel, secondary && styles.pillSecondaryLabel]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pillAction: {
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#4b6f3d',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  pillSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#789063',
  },
  pillLabel: {
    color: '#fffdf4',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  pillSecondaryLabel: { color: '#36542b' },
  plusIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusHorizontal: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: '#fffdf4',
    borderRadius: 1,
  },
  plusVertical: {
    position: 'absolute',
    height: 20,
    width: 2,
    backgroundColor: '#fffdf4',
    borderRadius: 1,
  },
});
