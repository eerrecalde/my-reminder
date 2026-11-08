import { StatusBar, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { displayName } from './app.json';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.screen}>
        <Text accessibilityRole="header" style={styles.title}>
          {displayName}
        </Text>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    color: '#162524',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
});
