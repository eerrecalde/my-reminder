import { parseSetupLink } from '../src/setupLink';

const base = 'https://ding-reminders.surge.sh/setup?v=1&name=Drink%20water&date=2099-06-30&time=09%3A15';

test('accepts a one-time Reminder with defaults and decoded text', () => {
  expect(parseSetupLink(base)).toMatchObject({
    type: 'reminder', name: 'Drink water', instructions: '', mode: 'notification',
    times: ['09:15'], startDate: '2099-06-30', endDate: '2099-06-30',
  });
});

test('accepts an explicit Medicine and alarm', () => {
  expect(parseSetupLink(`${base}&type=medicine&instructions=Take%20with%20food&mode=alarm`)).toMatchObject({
    type: 'medicine', instructions: 'Take with food', mode: 'alarm',
  });
});

test.each([
  base.replace('v=1', 'v=2'), base.replace('&name=Drink%20water', ''),
  base.replace('2099-06-30', '2099-02-30'), base.replace('09%3A15', '25%3A00'),
  `${base}&instructions=Food`, `${base}&unknown=x`, `${base}&type=other`,
  `${base}&mode=silent`, `${base}&v=1`, `${base}&name=%ZZ`, `${base}#fragment`,
])('rejects unsupported or malformed links: %s', link => {
  expect(parseSetupLink(link)).toBeNull();
});
