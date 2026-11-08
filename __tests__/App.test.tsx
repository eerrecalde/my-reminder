import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Button, NativeModules, Text } from 'react-native';
import App from '../App';

jest.mock('react-native-safe-area-context', () => {
  const mock = jest.requireActual('react-native-safe-area-context/jest/mock');
  return mock.default;
});

test('shows reminders off and offers an enable action when access is missing', async () => {
  NativeModules.ReminderRepository = {
    state: jest.fn().mockResolvedValue({
      enabled: false,
      exactAlarms: false,
      notifications: false,
      language: 'en',
      medicines: [],
      todayDoses: [],
    }),
  };
  // The repository is bound when the app module is loaded, so use its exported object.
  const repository = require('../src/reminderRepository');
  repository.reminderRepository = NativeModules.ReminderRepository;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  expect(
    renderer.root
      .findAllByType(Text)
      .some(text => text.props.children === 'Reminders off'),
  ).toBe(true);
  await ReactTestRenderer.act(() =>
    renderer.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Enable reminders')!
      .props.onPress(),
  );
  expect(
    renderer.root
      .findAllByType(Text)
      .some(text => text.props.children === 'Reminder access'),
  ).toBe(true);
});

test('shows a recovered dose as unconfirmed on Today', async () => {
  const repository = require('../src/reminderRepository');
  repository.reminderRepository = {
    state: jest
      .fn()
      .mockResolvedValue({
        enabled: true,
        exactAlarms: true,
        notifications: true,
        language: 'en',
        medicines: [
          { id: 'a', name: 'Aspirin', instructions: '', times: ['09:00'] },
        ],
        todayDoses: [
          { medicineId: 'a', scheduledAt: new Date(2026, 5, 1, 9).getTime() },
        ],
      }),
  };
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  expect(
    renderer.root
      .findAllByType(Text)
      .some(text =>
        JSON.stringify(text.props.children).includes('Unconfirmed dose'),
      ),
  ).toBe(true);
});
