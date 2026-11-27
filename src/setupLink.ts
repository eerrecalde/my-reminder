import type { DailyMedicineInput } from './MedicineSetup';
import {
  isDailyTime,
  isOneOffSchedule,
  localDate,
  localDateString,
} from './dailySchedule';

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
        ![
          'v',
          'name',
          'date',
          'time',
          'type',
          'mode',
          'instructions',
          'schedule',
          'start',
          'end',
          'times',
          'weekdays',
          'hours',
          'anchor',
          'day',
          'shortMonth',
        ].includes(key) ||
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
    (type !== undefined && type !== 'reminder' && type !== 'medicine') ||
    (mode !== undefined && mode !== 'notification' && mode !== 'alarm') ||
    (instructions !== undefined && type !== 'medicine')
  )
    return null;
  const validDate = (value: string | undefined) =>
    !!value &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    localDateString(localDate(value)) === value;
  const common = {
    type: type ?? 'reminder',
    name: name.trim(),
    instructions: instructions?.trim() ?? '',
    mode: mode ?? 'notification',
  } as const;
  if (fields.schedule !== undefined) {
    const {
      schedule,
      start,
      end,
      times,
      weekdays,
      hours,
      anchor,
      day,
      shortMonth,
    } = fields;
    const allowed = [
      'v',
      'name',
      'type',
      'mode',
      'instructions',
      'schedule',
      'start',
      'end',
      ...(schedule === 'weekday'
        ? ['times', 'weekdays']
        : schedule === 'interval'
        ? ['hours', 'anchor']
        : schedule === 'monthly'
        ? ['times', 'day', 'shortMonth']
        : ['times']),
    ];
    if (
      !['daily', 'weekday', 'interval', 'monthly'].includes(schedule) ||
      Object.keys(fields).some(key => !allowed.includes(key)) ||
      !validDate(start) ||
      (end !== undefined && (!validDate(end) || end < start))
    )
      return null;
    const clockTimes = times?.split(',') ?? [];
    if (
      schedule !== 'interval' &&
      (!clockTimes.length ||
        clockTimes.some(value => !isDailyTime(value)) ||
        new Set(clockTimes).size !== clockTimes.length)
    )
      return null;
    const selectedDays = weekdays?.split(',').map(Number) ?? [];
    if (
      schedule === 'weekday' &&
      (!weekdays ||
        !/^[1-7](,[1-7])*$/.test(weekdays) ||
        new Set(selectedDays).size !== selectedDays.length)
    )
      return null;
    const anchorParts = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(
      anchor ?? '',
    );
    const anchorDate = anchorParts
      ? new Date(`${anchorParts[1]}T${anchorParts[2]}:00`)
      : null;
    if (
      schedule === 'interval' &&
      (!hours ||
        !/^[1-9]\d*$/.test(hours) ||
        !Number.isSafeInteger(Number(hours)) ||
        Number(hours) > 2147483647 ||
        !anchorParts ||
        !validDate(anchorParts[1]) ||
        !isDailyTime(anchorParts[2]) ||
        !anchorDate ||
        !Number.isFinite(anchorDate.getTime()) ||
        localDateString(anchorDate) !== anchorParts[1] ||
        `${String(anchorDate.getHours()).padStart(2, '0')}:${String(
          anchorDate.getMinutes(),
        ).padStart(2, '0')}` !== anchorParts[2])
    )
      return null;
    if (
      schedule === 'monthly' &&
      (!day ||
        !/^(last|[1-9]|[12]\d|3[01])$/.test(day) ||
        !['last', 'skip'].includes(shortMonth ?? ''))
    )
      return null;
    return {
      ...common,
      scheduleKind: schedule as 'daily' | 'weekday' | 'interval' | 'monthly',
      startDate: start,
      endDate: end ?? null,
      times: schedule === 'interval' ? [anchorParts![2]] : clockTimes,
      weekdays: selectedDays,
      intervalHours: schedule === 'interval' ? Number(hours) : null,
      intervalAnchor: anchorDate?.getTime() ?? null,
      monthlyDay: schedule === 'monthly' && day !== 'last' ? Number(day) : null,
      shortMonthPolicy: shortMonth === 'skip' ? 'skip' : 'last',
    };
  }
  if (
    Object.keys(fields).some(
      key =>
        !['v', 'name', 'date', 'time', 'type', 'mode', 'instructions'].includes(
          key,
        ),
    ) ||
    !validDate(date) ||
    !isDailyTime(time ?? '')
  )
    return null;
  return {
    ...common,
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
    ['type', input.type],
    ['mode', input.mode],
  ];
  if (isOneOffSchedule(input)) {
    fields.push(['date', input.startDate!], ['time', input.times[0]]);
  } else {
    const kind = input.scheduleKind ?? 'daily';
    fields.push(['schedule', kind], ['start', input.startDate!]);
    if (input.endDate) fields.push(['end', input.endDate]);
    if (kind === 'interval') {
      const anchor = new Date(input.intervalAnchor!);
      const time = `${String(anchor.getHours()).padStart(2, '0')}:${String(
        anchor.getMinutes(),
      ).padStart(2, '0')}`;
      fields.push(
        ['hours', String(input.intervalHours)],
        ['anchor', `${localDateString(anchor)}T${time}`],
      );
    } else {
      fields.push(['times', input.times.join(',')]);
      if (kind === 'weekday')
        fields.push(['weekdays', input.weekdays!.join(',')]);
      if (kind === 'monthly')
        fields.push(
          ['day', String(input.monthlyDay ?? 'last')],
          ['shortMonth', input.shortMonthPolicy ?? 'last'],
        );
    }
  }
  if (input.type === 'medicine' && input.instructions)
    fields.push(['instructions', input.instructions]);
  return `https://setup-links.example.com/setup?${fields
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')}`;
}
