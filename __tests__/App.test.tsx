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
  await ReactTestRenderer.act(() => renderer.unmount());
});

test('shows a recovered dose as unconfirmed on Today', async () => {
  const repository = require('../src/reminderRepository');
  repository.reminderRepository = {
    state: jest.fn().mockResolvedValue({
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
  await ReactTestRenderer.act(() => renderer.unmount());
});

test.each([
  ['en', 'Medicine', 'Reminder', 'Unconfirmed dose', 'Unconfirmed reminder'],
  [
    'es',
    'Medicamento',
    'Recordatorio',
    'Dosis sin confirmar',
    'Recordatorio sin confirmar',
  ],
])(
  'shows type-appropriate wording on Today in %s',
  async (
    language,
    medicineLabel,
    reminderLabel,
    doseLabel,
    reminderDueLabel,
  ) => {
    const repository = require('../src/reminderRepository');
    repository.reminderRepository = {
      state: jest.fn().mockResolvedValue({
        enabled: true,
        exactAlarms: true,
        notifications: true,
        language,
        medicines: [
          {
            id: 'm',
            type: 'medicine',
            name: 'Aspirin',
            instructions: 'One tablet',
            times: ['09:00'],
          },
          {
            id: 'r',
            type: 'reminder',
            name: 'Water',
            instructions: '',
            times: ['10:00'],
          },
        ],
        todayDoses: [
          { medicineId: 'm', scheduledAt: 1000 },
          { medicineId: 'r', scheduledAt: 2000 },
        ],
      }),
    };
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
    });
    const labels = renderer.root
      .findAllByType(Text)
      .map(text => JSON.stringify(text.props.children));
    for (const label of [
      medicineLabel,
      reminderLabel,
      doseLabel,
      reminderDueLabel,
      'One tablet',
    ]) {
      expect(labels.some(text => text.includes(label))).toBe(true);
    }
    await ReactTestRenderer.act(() => renderer.unmount());
  },
);
