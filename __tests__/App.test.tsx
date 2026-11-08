import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Alert, Button, NativeModules, Text } from 'react-native';
import App from '../App';

test('records and undoes a reminder outcome from Today', async () => {
  const repo = require('../src/reminderRepository');
  const setOutcome = jest
    .fn()
    .mockResolvedValue({
      previous: null,
      revision: 1,
      previousCleared: false,
      changed: true,
    });
  const undoOutcome = jest.fn().mockResolvedValue(undefined);
  repo.reminderRepository = {
    state: jest.fn().mockResolvedValue({
      enabled: true,
      exactAlarms: true,
      notifications: true,
      language: 'en',
      medicines: [
        {
          id: 'r',
          type: 'reminder',
          name: 'Water',
          instructions: '',
          times: ['10:00'],
        },
      ],
      todayDoses: [{ medicineId: 'r', scheduledAt: 2000, outcome: null }],
      history: [],
      upcoming: [],
    }),
    setOutcome,
    undoOutcome,
  };
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(async () => {
    await renderer.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Done')!
      .props.onPress();
  });
  expect(setOutcome).toHaveBeenCalledWith('r', 2000, 'completed');
  await ReactTestRenderer.act(async () => {
    await renderer.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Undo')!
      .props.onPress();
  });
  expect(undoOutcome).toHaveBeenCalledWith('r', 2000, null, 1, false);
  await ReactTestRenderer.act(() => renderer.unmount());
});

jest.mock('react-native-safe-area-context', () => {
  const mock = jest.requireActual('react-native-safe-area-context/jest/mock');
  return mock.default;
});

test('history is cleared only after confirmation', async () => {
  const repo = require('../src/reminderRepository');
  const clearHistory = jest.fn().mockResolvedValue(undefined);
  repo.reminderRepository = {
    state: jest.fn().mockResolvedValue({
      enabled: true,
      exactAlarms: true,
      notifications: true,
      language: 'en',
      medicines: [
        {
          id: 'm',
          type: 'medicine',
          name: 'Aspirin',
          instructions: '',
          times: ['09:00'],
        },
      ],
      todayDoses: [],
      upcoming: [],
      history: [{ medicineId: 'm', scheduledAt: 2000, outcome: 'skipped' }],
    }),
    clearHistory,
  };
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(() =>
    renderer.root
      .findAllByType(Button)
      .find(button => button.props.title === 'History')!
      .props.onPress(),
  );
  expect(
    renderer.root
      .findAllByType(Text)
      .some(text => JSON.stringify(text.props.children).includes('Skipped')),
  ).toBe(true);
  await ReactTestRenderer.act(() =>
    renderer.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Clear history')!
      .props.onPress(),
  );
  expect(clearHistory).not.toHaveBeenCalled();
  const actions = alert.mock.calls[0][2]!;
  await ReactTestRenderer.act(async () => {
    await actions.find(action => action.text === 'Clear')!.onPress!();
  });
  expect(clearHistory).toHaveBeenCalledTimes(1);
  alert.mockRestore();
  await ReactTestRenderer.act(() => renderer.unmount());
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

test.each([
  ['en', 'Snooze', 'minutes'],
  ['es', 'Posponer', 'minutos'],
])('offers one accessible ten-minute snooze in %s', async (language, snoozeText, minutesText) => {
  const repository = require('../src/reminderRepository');
  const snooze = jest.fn().mockResolvedValue(undefined);
  repository.reminderRepository = {
    snooze,
    state: jest.fn().mockResolvedValue({
      enabled: true, language, medicines: [
        { id: 'r', type: 'reminder', name: 'Water', instructions: '', times: ['23:59'] },
      ], todayDoses: [{ medicineId: 'r', scheduledAt: 2000, outstanding: true }], upcoming: [], history: [],
    }),
  };
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => { renderer = ReactTestRenderer.create(<App />); });
  const buttons = renderer.root.findAllByType(Button);
  const snoozeButtons = buttons.filter(item => item.props.title.startsWith(snoozeText));
  expect(snoozeButtons).toHaveLength(1);
  const button = snoozeButtons[0];
  expect(button.props.title).toBe(`${snoozeText} 10 ${minutesText}`);
  expect(button.props.accessibilityLabel).toContain('Water');
  await ReactTestRenderer.act(async () => { await button.props.onPress(); });
  expect(snooze).toHaveBeenCalledWith('r', 2000, 10);
  await ReactTestRenderer.act(() => renderer.unmount());
});
