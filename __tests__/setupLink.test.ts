import { createSetupLink, parseSetupLink } from '../src/setupLink';

const base =
  'https://ding-reminders.surge.sh/setup?v=1&name=Drink%20water&date=2099-06-30&time=09%3A15';

test('accepts a one-time Reminder with defaults and decoded text', () => {
  expect(parseSetupLink(base)).toMatchObject({
    type: 'reminder',
    name: 'Drink water',
    instructions: '',
    mode: 'notification',
    times: ['09:15'],
    startDate: '2099-06-30',
    endDate: '2099-06-30',
  });
});

test('accepts an explicit Medicine and alarm', () => {
  expect(
    parseSetupLink(
      `${base}&type=medicine&instructions=Take%20with%20food&mode=alarm`,
    ),
  ).toMatchObject({
    type: 'medicine',
    instructions: 'Take with food',
    mode: 'alarm',
  });
});

test('accepts a recurring daily schedule with multiple local times', () => {
  expect(
    parseSetupLink(
      'https://setup-links.example.com/setup?v=1&name=Water&schedule=daily&start=2020-01-01&times=09%3A00%2C18%3A30',
    ),
  ).toMatchObject({
    scheduleKind: 'daily',
    startDate: '2020-01-01',
    endDate: null,
    times: ['09:00', '18:30'],
  });
});

test('shares and receives a weekday schedule without losing its days or times', () => {
  const link = createSetupLink({
    type: 'medicine',
    name: 'Example',
    instructions: 'Food',
    mode: 'alarm',
    scheduleKind: 'weekday',
    startDate: '2020-01-01',
    endDate: '2099-01-01',
    times: ['08:00', '18:30'],
    weekdays: [1, 5],
  });
  expect(parseSetupLink(link)).toMatchObject({
    scheduleKind: 'weekday',
    weekdays: [1, 5],
    times: ['08:00', '18:30'],
    startDate: '2020-01-01',
    endDate: '2099-01-01',
  });
});

test.each(['last', 'skip'] as const)(
  'preserves the monthly short-month policy %s',
  policy => {
    const input = {
      type: 'reminder' as const,
      name: 'Example',
      instructions: '',
      mode: 'notification' as const,
      scheduleKind: 'monthly' as const,
      startDate: '2020-01-01',
      endDate: null,
      times: ['09:15'],
      monthlyDay: 31,
      shortMonthPolicy: policy,
    };
    expect(parseSetupLink(createSetupLink(input))).toMatchObject(input);
  },
);

test('interprets an interval anchor as recipient local time', () => {
  const link =
    'https://setup-links.example.com/setup?v=1&name=Example&schedule=interval&start=2020-01-01&hours=8&anchor=2020-01-02T09%3A15';
  const proposal = parseSetupLink(link)!;
  expect(proposal.intervalAnchor).toBe(new Date(2020, 0, 2, 9, 15).getTime());
  expect(parseSetupLink(createSetupLink(proposal))).toMatchObject({
    intervalAnchor: proposal.intervalAnchor,
    intervalHours: 8,
  });
});

test.each([
  'schedule=weekday&start=2020-01-01&times=09%3A00&weekdays=0',
  'schedule=weekday&start=2020-01-01&times=09%3A00',
  'schedule=interval&start=2020-01-01&hours=0&anchor=2020-01-02T09%3A15',
  'schedule=interval&start=2020-01-01&hours=2147483648&anchor=2020-01-02T09%3A15',
  'schedule=monthly&start=2020-01-01&times=09%3A00&day=32&shortMonth=skip',
  'schedule=monthly&start=2020-01-01&times=09%3A00&day=31&shortMonth=other',
  'schedule=daily&start=2020-01-01&times=09%3A00&weekdays=1',
  'schedule=daily&start=2020-01-01&end=2019-01-01&times=09%3A00',
])('rejects malformed recurring values: %s', fields => {
  expect(
    parseSetupLink(
      `https://setup-links.example.com/setup?v=1&name=Example&${fields}`,
    ),
  ).toBeNull();
});

test.each([
  base.replace('v=1', 'v=2'),
  base.replace('&name=Drink%20water', ''),
  base.replace('2099-06-30', '2099-02-30'),
  base.replace('09%3A15', '25%3A00'),
  `${base}&instructions=Food`,
  `${base}&unknown=x`,
  `${base}&type=other`,
  `${base}&mode=silent`,
  `${base}&v=1`,
  `${base}&name=%ZZ`,
  `${base}#fragment`,
])('rejects unsupported or malformed links: %s', link => {
  expect(parseSetupLink(link)).toBeNull();
});
