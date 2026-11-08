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
    state: jest
      .fn()
      .mockResolvedValue({
        enabled: false,
        exactAlarms: false,
        notifications: false,
        language: 'en',
        medicines: [],
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
