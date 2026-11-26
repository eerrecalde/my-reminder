import React from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { PillAction } from './PillAction';
import {
  reminderRepository,
  Medicine,
  Occurrence,
  ReminderState,
} from './reminderRepository';
import { translations } from './translations';

type Props = {
  history: Occurrence[];
  historyLoading: boolean;
  historyHasMore: boolean;
  historyError: 'first' | 'more' | null;
  state: ReminderState | undefined;
  error: string;
  language: keyof typeof translations;
  undo: boolean;
  undoChange: () => void;
  loadHistory: (reset: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  setUndo: (value: undefined) => void;
  setError: (value: string) => void;
  onCancel: () => void;
  occurrenceView: (
    occurrence: Occurrence,
    medicine: Medicine,
    compact?: boolean,
  ) => React.ReactNode;
};

export function HistoryScreen({
  history,
  historyLoading,
  historyHasMore,
  historyError,
  state,
  error,
  language,
  undo,
  undoChange,
  loadHistory,
  refresh,
  setUndo,
  setError,
  onCancel,
  occurrenceView,
}: Props) {
  const t = translations[language].app;
  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={history}
      onEndReached={() => {
        if (historyHasMore && !historyLoading && !historyError)
          loadHistory(false);
      }}
      onEndReachedThreshold={0.5}
      keyExtractor={item => `${item.medicineId}:${item.scheduledAt}`}
      ListHeaderComponent={
        <>
          <Text accessibilityRole="header" style={styles.title}>
            {t.history}
          </Text>
          {undo && <PillAction title={t.undo} onPress={undoChange} />}
          {(!state || (historyLoading && history.length === 0)) && (
            <Text style={styles.text}>{t.loading}</Text>
          )}
          {!state && !!error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error === 'load' ? t.loadError : error}
            </Text>
          )}
          {historyError === 'first' && (
            <>
              <Text accessibilityRole="alert" style={styles.error}>
                {t.loadError}
              </Text>
              <PillAction
                secondary
                title={t.retry}
                onPress={() => loadHistory(true)}
              />
            </>
          )}
          {state &&
            !historyLoading &&
            !historyError &&
            history.length === 0 && (
              <Text style={styles.text}>{t.noHistory}</Text>
            )}
        </>
      }
      renderItem={({ item: occurrence, index }) => {
        const formatDate = (at: number) =>
          new Date(at).toLocaleDateString(translations[language].locale, {
            dateStyle: 'full',
          });
        const date = formatDate(occurrence.scheduledAt);
        const previousDate =
          index > 0 ? formatDate(history[index - 1].scheduledAt) : null;
        const medicine = state?.medicines.find(
          item => item.id === occurrence.medicineId,
        );
        const details = medicine ?? {
          id: occurrence.medicineId,
          name: occurrence.name ?? '',
          instructions: occurrence.instructions ?? '',
          type: occurrence.type ?? 'reminder',
          times: [],
          mode: 'notification' as const,
        };
        return (
          <View>
            {date !== previousDate && (
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                {date}
              </Text>
            )}
            {occurrenceView(occurrence, details, true)}
          </View>
        );
      }}
      ListFooterComponent={
        state ? (
          <>
            {historyError === 'more' && (
              <>
                <Text accessibilityRole="alert" style={styles.error}>
                  {t.loadError}
                </Text>
                <PillAction
                  secondary
                  title={t.retry}
                  onPress={() => loadHistory(false)}
                />
              </>
            )}
            <PillAction
              secondary
              title={t.clearHistory}
              onPress={() =>
                Alert.alert(t.clearHistory, t.clearQuestion, [
                  { text: t.cancel, style: 'cancel' },
                  {
                    text: t.clear,
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await reminderRepository.clearHistory();
                        await loadHistory(true);
                        setUndo(undefined);
                        await refresh();
                      } catch {
                        setError(t.actionError);
                      }
                    },
                  },
                ])
              }
            />
            <PillAction
              secondary
              title={t.cancel}
              onPress={() => {
                onCancel();
              }}
            />
            {!!error && (
              <Text accessibilityRole="alert" style={styles.error}>
                {error === 'load' ? t.loadError : error}
              </Text>
            )}
          </>
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 12,
    paddingBottom: 32,
    flexGrow: 1,
  },
  title: { color: '#162524', fontSize: 26, fontWeight: '700' },
  text: { color: '#162524', fontSize: 18, marginVertical: 8 },
  error: { color: '#a01818', fontSize: 18 },
  sectionTitle: {
    color: '#314e37',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
});
