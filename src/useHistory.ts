import { useCallback, useEffect, useRef, useState } from 'react';
import { reminderRepository, Occurrence, Outcome } from './reminderRepository';

export function useHistory(active: boolean, revision: number | undefined) {
  const historyRevision = useRef<number | undefined>(undefined);
  const [history, setHistory] = useState<Occurrence[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyHasMore, setHistoryHasMore] = useState(true);
  const [historyError, setHistoryError] = useState<'first' | 'more' | null>(null);
  const historyRef = useRef<Occurrence[]>([]);
  const historyGeneration = useRef(0);
  const historyInFlight = useRef(false);
  const historyResetInFlight = useRef(false);
  const loadHistory = useCallback(async (reset: boolean, minimum = 50) => {
    if (!reset && historyInFlight.current) return;
    const generation = reset ? ++historyGeneration.current : historyGeneration.current;
    if (reset && minimum === 50) {
      historyRef.current = [];
      setHistory([]);
    }
    historyInFlight.current = true;
    historyResetInFlight.current = reset;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      let rows = reset ? [] : historyRef.current;
      let page: Occurrence[];
      do {
        const last = rows[rows.length - 1];
        page = await reminderRepository.historyPage(last?.scheduledAt ?? null, last?.medicineId ?? null);
        rows = [...rows, ...page];
      } while (reset && rows.length < minimum && page.length === 50);
      if (generation !== historyGeneration.current) return;
      if (!reset) {
        const keys = new Set(historyRef.current.map(row => `${row.medicineId}:${row.scheduledAt}`));
        rows = [...historyRef.current, ...page.filter(row => !keys.has(`${row.medicineId}:${row.scheduledAt}`))];
      }
      historyRef.current = rows;
      setHistory(rows);
      setHistoryHasMore(page.length === 50);
    } catch {
      if (generation === historyGeneration.current) setHistoryError(reset ? 'first' : 'more');
    } finally {
      if (generation === historyGeneration.current) {
        historyInFlight.current = false;
        historyResetInFlight.current = false;
        setHistoryLoading(false);
      }
    }
  }, []);
  useEffect(() => {
    const generation = historyGeneration;
    const inFlight = historyInFlight;
    if (active) {
      historyRevision.current = undefined;
      loadHistory(true);
    }
    return () => { generation.current++; inFlight.current = false; };
  }, [active, loadHistory]);
  useEffect(() => {
    if (!active || revision == null) return;
    if (historyRevision.current == null) {
      historyRevision.current = revision;
    } else if (historyRevision.current !== revision) {
      historyRevision.current = revision;
      loadHistory(true);
    }
  }, [active, revision, loadHistory]);
  const updateHistoryOccurrence = (occurrence: Occurrence, outcome: Outcome | null, cleared = false) => {
    if (historyInFlight.current && historyResetInFlight.current) {
      historyGeneration.current++;
      historyInFlight.current = false;
      loadHistory(true);
      return;
    }
    const rows = historyRef.current.filter(row => row.medicineId !== occurrence.medicineId || row.scheduledAt !== occurrence.scheduledAt);
    if (outcome != null && !cleared) {
      rows.push({ ...occurrence, outcome });
      rows.sort((a, b) => b.scheduledAt - a.scheduledAt || (a.medicineId < b.medicineId ? 1 : a.medicineId > b.medicineId ? -1 : 0));
    }
    historyRef.current = rows;
    setHistory(rows);
  };
  return { history, historyLoading, historyHasMore, historyError, historyRevision, loadHistory, updateHistoryOccurrence };
}
