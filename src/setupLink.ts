import type { DailyMedicineInput } from './MedicineSetup';
import { isDailyTime, localDate, localDateString } from './dailySchedule';

/** Parse only the supported version, rejecting any information we cannot honour. */
export function parseSetupLink(url: string): DailyMedicineInput | null {
  const match =
    /^https:\/\/(ding-reminders\.surge\.sh|setup-links\.example\.com)\/setup\?([^#]*)$/.exec(
      url,
    );
  if (!match) return null;
  const fields: Record<string, string> = {};
  try {
    for (const pair of match[2].split('&')) {
      const index = pair.indexOf('=');
      if (index < 0) return null;
      const key = decodeURIComponent(pair.slice(0, index).replace(/\+/g, ' '));
      const value = decodeURIComponent(
        pair.slice(index + 1).replace(/\+/g, ' '),
      );
      if (
        !['v', 'name', 'date', 'time', 'type', 'mode', 'instructions'].includes(
          key,
        ) ||
        Object.prototype.hasOwnProperty.call(fields, key)
      )
        return null;
      fields[key] = value;
    }
  } catch {
    return null;
  }
  const { v, name, date, time, type, mode, instructions } = fields;
  if (
    v !== '1' ||
    !name?.trim() ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') ||
    localDateString(localDate(date)) !== date ||
    !isDailyTime(time ?? '') ||
    (type !== undefined && type !== 'reminder' && type !== 'medicine') ||
    (mode !== undefined && mode !== 'notification' && mode !== 'alarm') ||
    (instructions !== undefined && type !== 'medicine')
  )
    return null;
  return {
    type: type ?? 'reminder',
    name: name.trim(),
    instructions: instructions?.trim() ?? '',
    mode: mode ?? 'notification',
    times: [time],
    startDate: date,
    endDate: date,
    scheduleKind: 'daily',
  };
}

/** Create a test-host link until the production host is verified. */
export function createSetupLink(input: DailyMedicineInput): string {
  const fields: [string, string][] = [
    ['v', '1'],
    ['name', input.name],
    ['date', input.startDate!],
    ['time', input.times[0]],
    ['type', input.type],
    ['mode', input.mode],
  ];
  if (input.type === 'medicine' && input.instructions)
    fields.push(['instructions', input.instructions]);
  return `https://setup-links.example.com/setup?${fields
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')}`;
}
