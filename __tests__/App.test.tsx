import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Alert, AppState, NativeModules, Platform, Text } from 'react-native';
import App, { PillAction } from '../App';

test('records and undoes a reminder outcome from Today', async () => {
  const repo = require('../src/reminderRepository');
  const setOutcome = jest.fn().mockResolvedValue({
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
      .findAllByType(PillAction)
      .find(button => button.props.title === 'Done')!
      .props.onPress();
  });
  expect(setOutcome).toHaveBeenCalledWith('r', 2000, 'completed');
  await ReactTestRenderer.act(async () => {
    await renderer.root
      .findAllByType(PillAction)
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
    renderer.root.findByProps({ testID: 'nav-history' }).props.onPress(),
  );
  expect(
    renderer.root
      .findAllByType(Text)
      .some(text => JSON.stringify(text.props.children).includes('Skipped')),
  ).toBe(true);
  await ReactTestRenderer.act(() =>
    renderer.root
      .findAllByType(PillAction)
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
      .findAllByType(PillAction)
      .find(button => button.props.title === 'Review reminder access')!
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
])(
  'offers one accessible ten-minute snooze in %s',
  async (language, snoozeText, minutesText) => {
    const repository = require('../src/reminderRepository');
    const snooze = jest.fn().mockResolvedValue(undefined);
    repository.reminderRepository = {
      snooze,
      state: jest.fn().mockResolvedValue({
        enabled: true,
        language,
        medicines: [
          {
            id: 'r',
            type: 'reminder',
            name: 'Water',
            instructions: '',
            times: ['23:59'],
          },
        ],
        todayDoses: [{ medicineId: 'r', scheduledAt: 2000, outstanding: true }],
        upcoming: [],
        history: [],
      }),
    };
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
    });
    const buttons = renderer.root.findAllByType(PillAction);
    const snoozeButtons = buttons.filter(item =>
      item.props.title.startsWith(snoozeText),
    );
    expect(snoozeButtons).toHaveLength(1);
    const button = snoozeButtons[0];
    expect(button.props.title).toBe(`${snoozeText} 10 ${minutesText}`);
    expect(button.props.accessibilityLabel).toContain('Water');
    await ReactTestRenderer.act(async () => {
      await button.props.onPress();
    });
    expect(snooze).toHaveBeenCalledWith('r', 2000, 10);
    await ReactTestRenderer.act(() => renderer.unmount());
  },
);

test.each([
  ['en', 'Pause', 'Resume', 'Edit'],
  ['es', 'Pausar', 'Reanudar', 'Editar'],
])('manages reminders in %s', async (language, pause, resume, edit) => {
  const repo = require('../src/reminderRepository');
  const item = {
    id: 'm',
    type: 'medicine',
    name: 'Aspirin',
    instructions: 'With food',
    times: ['09:00'],
    mode: 'alarm',
    status: 'active',
  };
  const state = {
    enabled: true,
    exactAlarms: true,
    notifications: true,
    language,
    medicines: [item],
    todayDoses: [],
    history: [],
    upcoming: [],
  };
  const setStatus = jest.fn(async (_id, status) => {
    item.status = status;
  });
  repo.reminderRepository = {
    state: jest.fn(async () => ({ ...state, medicines: [{ ...item }] })),
    setStatus,
  };
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    view = ReactTestRenderer.create(<App />);
  });
  const press = async (title: string) =>
    ReactTestRenderer.act(async () => {
      await view.root
        .findByProps({ accessibilityLabel: title })
        .props.onPress();
    });
  await ReactTestRenderer.act(() => {
    view.root.findByProps({ testID: 'nav-reminders' }).props.onPress();
  });
  await press(pause);
  expect(setStatus).toHaveBeenCalledWith('m', 'paused');
  await press(resume);
  expect(setStatus).toHaveBeenCalledWith('m', 'active');
  await press(edit);
  expect(
    view.root
      .findAllByType(PillAction)
      .some(
        b => b.props.title === (language === 'en' ? 'Medicine' : 'Medicamento'),
      ),
  ).toBe(true);
  await ReactTestRenderer.act(() => view.unmount());
});

test('shows and corrects a deleted reminder occurrence using its saved details', async () => {
  const repo = require('../src/reminderRepository');
  const setOutcome = jest
    .fn()
    .mockResolvedValue({ previous: 'completed', revision: 2, changed: true });
  repo.reminderRepository = {
    state: jest.fn().mockResolvedValue({
      enabled: true,
      language: 'en',
      medicines: [],
      todayDoses: [
        {
          medicineId: 'm',
          scheduledAt: 2000,
          name: 'Aspirin',
          type: 'medicine',
          instructions: 'With food',
          outcome: 'completed',
        },
      ],
      history: [],
      upcoming: [],
    }),
    setOutcome,
  };
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    view = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(() => {
    view.root.findByProps({ accessibilityLabel: 'Taken (1)' }).props.onPress();
  });
  expect(
    view.root
      .findAllByType(Text)
      .some(t => JSON.stringify(t.props.children).includes('Aspirin')),
  ).toBe(true);
  await ReactTestRenderer.act(() => {
    view.root
      .findAllByType(PillAction)
      .find(b => b.props.title === 'Change outcome')!
      .props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    await view.root
      .findAllByType(PillAction)
      .find(b => b.props.title === 'Skip')!
      .props.onPress();
  });
  expect(setOutcome).toHaveBeenCalledWith('m', 2000, 'skipped');
  await ReactTestRenderer.act(() => view.unmount());
});

test.each([
  ['en', ['Today', 'Reminders', 'History']],
  ['es', ['Hoy', 'Recordatorios', 'Historial']],
])('navigation has clear accessible names in %s', async (language, labels) => {
  const repository = require('../src/reminderRepository');
  repository.reminderRepository = {
    state: jest.fn().mockResolvedValue({
      enabled: true,
      language,
      medicines: [],
      todayDoses: [],
      history: [],
      upcoming: [],
    }),
  };
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    view = ReactTestRenderer.create(<App />);
  });
  for (const [index, tab] of ['today', 'reminders', 'history'].entries()) {
    expect(
      view.root.findByProps({ testID: `nav-${tab}` }).props.accessibilityLabel,
    ).toBe(labels[index]);
  }
  await ReactTestRenderer.act(() => view.unmount());
});

test.each([
  ['en', 'Done', 'Taken', 'Skipped', 'Missed'],
  ['es', 'Hecho', 'Tomado', 'Omitido', 'No confirmado a tiempo'],
])(
  'groups earlier outcomes separately and expands their details in %s',
  async (language, done, taken, skipped, missed) => {
    const repository = require('../src/reminderRepository');
    repository.reminderRepository = {
      state: jest.fn().mockResolvedValue({
        enabled: true,
        language,
        medicines: [],
        upcoming: [],
        history: [],
        todayDoses: [
          {
            medicineId: 'r',
            name: 'Water plants',
            type: 'reminder',
            scheduledAt: 1000,
            outcome: 'completed',
          },
          {
            medicineId: 'm1',
            name: 'Vitamin A',
            type: 'medicine',
            scheduledAt: 2000,
            outcome: 'completed',
          },
          {
            medicineId: 'm2',
            name: 'Vitamin B',
            type: 'medicine',
            scheduledAt: 3000,
            outcome: 'completed',
          },
          {
            medicineId: 's',
            name: 'Walk',
            type: 'reminder',
            scheduledAt: 4000,
            outcome: 'skipped',
          },
          {
            medicineId: 'x',
            name: 'Exercise',
            type: 'reminder',
            scheduledAt: 5000,
            outcome: 'missed',
          },
        ],
      }),
    };
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      view = ReactTestRenderer.create(<App />);
    });
    for (const label of [
      `${done} (1)`,
      `${taken} (2)`,
      `${skipped} (1)`,
      `${missed} (1)`,
    ]) {
      expect(
        view.root.findByProps({ accessibilityLabel: label }).props
          .accessibilityState.expanded,
      ).toBe(false);
    }
    const hasName = (name: string) =>
      view.root
        .findAllByType(Text)
        .some(node => JSON.stringify(node.props.children).includes(name));
    expect(hasName('Vitamin A')).toBe(false);
    await ReactTestRenderer.act(() =>
      view.root
        .findByProps({ accessibilityLabel: `${taken} (2)` })
        .props.onPress(),
    );
    expect(hasName('Vitamin A')).toBe(true);
    expect(hasName('Vitamin B')).toBe(true);
    expect(hasName('Water plants')).toBe(false);
    expect(
      view.root.findByProps({ accessibilityLabel: `${taken} (2)` }).props
        .accessibilityState.expanded,
    ).toBe(true);
    await ReactTestRenderer.act(() =>
      view.root
        .findByProps({ accessibilityLabel: `${taken} (2)` })
        .props.onPress(),
    );
    expect(hasName('Vitamin A')).toBe(false);
    await ReactTestRenderer.act(() => view.unmount());
  },
);

test.each(['today', 'reminders'] as const)(
  'back from setup returns to %s',
  async origin => {
    const repo = require('../src/reminderRepository');
    repo.reminderRepository = {
      state: jest.fn().mockResolvedValue({
        enabled: true,
        notifications: true,
        exactAlarms: true,
        language: 'en',
        medicines: [],
        todayDoses: [],
        history: [],
        upcoming: [],
      }),
    };
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      view = ReactTestRenderer.create(<App />);
    });
    if (origin === 'reminders')
      await ReactTestRenderer.act(() =>
        view.root.findByProps({ testID: 'nav-reminders' }).props.onPress(),
      );
    await ReactTestRenderer.act(() =>
      view.root
        .findAllByType(PillAction)
        .find(button => button.props.title === 'Add reminder')!
        .props.onPress(),
    );
    await ReactTestRenderer.act(() =>
      view.root
        .findByProps({
          accessibilityRole: 'button',
          accessibilityLabel: 'Back',
        })
        .props.onPress(),
    );
    expect(
      view.root.findByProps({ testID: `nav-${origin}` }).props
        .accessibilityState.selected,
    ).toBe(true);
    await ReactTestRenderer.act(() => view.unmount());
  },
);

test.each([
  [
    'en',
    false,
    false,
    'Allow notifications and exact alarms so reminders can arrive on time.',
  ],
  ['en', false, true, 'Allow notifications so your reminders can appear.'],
  [
    'en',
    true,
    false,
    'Allow exact alarms so your reminders can arrive on time.',
  ],
  [
    'es',
    false,
    false,
    'Permite las notificaciones y las alarmas exactas para recibir recordatorios a tiempo.',
  ],
  [
    'es',
    false,
    true,
    'Permite las notificaciones para que aparezcan tus recordatorios.',
  ],
  [
    'es',
    true,
    false,
    'Permite las alarmas exactas para recibir tus recordatorios a tiempo.',
  ],
])(
  'explains which reminder access is missing in %s',
  async (language, notifications, exactAlarms, explanation) => {
    const repository = require('../src/reminderRepository');
    repository.reminderRepository = {
      state: jest.fn().mockResolvedValue({
        enabled: false,
        notifications,
        exactAlarms,
        language,
        medicines: [],
        todayDoses: [],
        history: [],
        upcoming: [],
      }),
    };
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      view = ReactTestRenderer.create(<App />);
    });
    expect(
      view.root
        .findAllByType(Text)
        .some(text => text.props.children === explanation),
    ).toBe(true);
    const action =
      language === 'en'
        ? 'Review reminder access'
        : 'Revisar acceso a recordatorios';
    await ReactTestRenderer.act(() =>
      view.root
        .findAllByType(PillAction)
        .find(button => button.props.title === action)!
        .props.onPress(),
    );
    expect(
      view.root
        .findAllByType(Text)
        .some(
          text =>
            text.props.children ===
            (language === 'en' ? 'Reminder access' : 'Acceso a recordatorios'),
        ),
    ).toBe(true);
    await ReactTestRenderer.act(() => view.unmount());
  },
);

test.each([
  ['en', true, true],
  ['en', true, false],
  ['en', false, true],
  ['en', false, false],
  ['es', true, true],
  ['es', true, false],
  ['es', false, true],
  ['es', false, false],
])(
  'shows the correct permission card statuses in %s',
  async (language, notifications, exactAlarms) => {
    const repository = require('../src/reminderRepository');
    const openNotificationSettings = jest.fn();
    const openAlarmSettings = jest.fn();
    repository.reminderRepository = {
      state: jest.fn().mockResolvedValue({
        enabled: notifications && exactAlarms,
        notifications,
        exactAlarms,
        language,
        medicines: [],
        todayDoses: [],
        history: [],
        upcoming: [],
      }),
      openNotificationSettings,
      openAlarmSettings,
    };
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      view = ReactTestRenderer.create(<App />);
    });
    const access =
      language === 'en' ? 'Reminder access' : 'Acceso a recordatorios';
    await ReactTestRenderer.act(() =>
      view.root
        .findAllByProps({
          accessibilityRole: 'button',
          accessibilityLabel: access,
        })[0]
        .props.onPress(),
    );
    const status = (allowed: boolean) =>
      language === 'en'
        ? allowed
          ? 'Allowed'
          : 'Not allowed'
        : allowed
        ? 'Permitidas'
        : 'No permitidas';
    const notificationCard = view.root.findByProps({
      testID: 'access-notifications',
    });
    const alarmCard = view.root.findByProps({ testID: 'access-exact' });
    expect(
      notificationCard
        .findAllByType(Text)
        .some(text => text.props.children === status(notifications)),
    ).toBe(true);
    expect(
      alarmCard
        .findAllByType(Text)
        .some(text => text.props.children === status(exactAlarms)),
    ).toBe(true);
    await ReactTestRenderer.act(async () => {
      await notificationCard.findByType(PillAction).props.onPress();
    });
    expect(openNotificationSettings).toHaveBeenCalledTimes(1);
    await ReactTestRenderer.act(() =>
      alarmCard.findByType(PillAction).props.onPress(),
    );
    expect(openAlarmSettings).toHaveBeenCalledTimes(1);
    await ReactTestRenderer.act(() => view.unmount());
  },
);

test('refreshes permission cards when the app returns from settings', async () => {
  let resume!: (state: 'active') => void;
  const subscription = jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_type, callback) => {
      resume = callback as typeof resume;
      return { remove: jest.fn() };
    });
  const repository = require('../src/reminderRepository');
  const base = {
    enabled: false,
    notifications: false,
    exactAlarms: true,
    language: 'en',
    medicines: [],
    todayDoses: [],
    history: [],
    upcoming: [],
  };
  const state = jest
    .fn()
    .mockResolvedValueOnce(base)
    .mockResolvedValue({ ...base, enabled: true, notifications: true });
  repository.reminderRepository = { state };
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    view = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(() =>
    view.root
      .findAllByProps({
        accessibilityRole: 'button',
        accessibilityLabel: 'Reminder access',
      })[0]
      .props.onPress(),
  );
  expect(
    view.root
      .findByProps({ testID: 'access-notifications' })
      .findAllByType(Text)
      .some(text => text.props.children === 'Not allowed'),
  ).toBe(true);
  await ReactTestRenderer.act(async () => {
    resume('active');
  });
  expect(
    view.root
      .findByProps({ testID: 'access-notifications' })
      .findAllByType(Text)
      .some(text => text.props.children === 'Allowed'),
  ).toBe(true);
  await ReactTestRenderer.act(() => view.unmount());
  subscription.mockRestore();
});

test('explains that exact alarms are automatic on older Android phones', async () => {
  const subscription = jest
    .spyOn(AppState, 'addEventListener')
    .mockReturnValue({ remove: jest.fn() });
  const os = jest.replaceProperty(Platform, 'OS', 'android');
  const version = jest.spyOn(Platform, 'Version', 'get').mockReturnValue(30);
  const repository = require('../src/reminderRepository');
  repository.reminderRepository = {
    state: jest.fn().mockResolvedValue({
      enabled: true,
      notifications: true,
      exactAlarms: true,
      language: 'en',
      medicines: [],
      todayDoses: [],
      history: [],
      upcoming: [],
    }),
  };
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    view = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(() =>
    view.root
      .findAllByProps({
        accessibilityRole: 'button',
        accessibilityLabel: 'Reminder access',
      })[0]
      .props.onPress(),
  );
  const card = view.root.findByProps({ testID: 'access-exact' });
  expect(
    card
      .findAllByType(Text)
      .some(
        text => text.props.children === 'Automatically allowed on this phone.',
      ),
  ).toBe(true);
  expect(card.findAllByType(PillAction)).toHaveLength(0);
  await ReactTestRenderer.act(() => view.unmount());
  version.mockRestore();
  os.restore();
  subscription.mockRestore();
});

test('does not show a past occurrence as the next reminder', async () => {
  const subscription = jest
    .spyOn(AppState, 'addEventListener')
    .mockReturnValue({ remove: jest.fn() });
  const repo = require('../src/reminderRepository');
  repo.reminderRepository = {
    state: jest.fn().mockResolvedValue({
      enabled: true,
      notifications: true,
      exactAlarms: true,
      language: 'en',
      medicines: [
        { id: 'r', name: 'Water', type: 'reminder', times: ['10:00'] },
      ],
      todayDoses: [],
      history: [],
      upcoming: [{ medicineId: 'r', scheduledAt: 2000 }],
    }),
  };
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    view = ReactTestRenderer.create(<App />);
  });
  expect(
    view.root
      .findAllByType(Text)
      .some(text => text.props.children === 'Next reminder'),
  ).toBe(false);
  await ReactTestRenderer.act(() => view.unmount());
  subscription.mockRestore();
});

test('does not show tomorrow’s reminder on Today', async () => {
  const subscription = jest
    .spyOn(AppState, 'addEventListener')
    .mockReturnValue({ remove: jest.fn() });
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const repo = require('../src/reminderRepository');
  repo.reminderRepository = {
    state: jest.fn().mockResolvedValue({
      enabled: true,
      notifications: true,
      exactAlarms: true,
      language: 'en',
      medicines: [
        { id: 'r', name: 'Compost', type: 'reminder', times: ['18:05'] },
      ],
      todayDoses: [],
      history: [],
      upcoming: [{ medicineId: 'r', scheduledAt: tomorrow.getTime() }],
    }),
  };
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    view = ReactTestRenderer.create(<App />);
  });
  expect(
    view.root
      .findAllByType(Text)
      .some(text => text.props.children === 'Next reminder'),
  ).toBe(false);
  await ReactTestRenderer.act(() => view.unmount());
  subscription.mockRestore();
});

test('shows active reminders before paused reminders in their original order', async () => {
  const subscription = jest
    .spyOn(AppState, 'addEventListener')
    .mockReturnValue({ remove: jest.fn() });
  const repo = require('../src/reminderRepository');
  repo.reminderRepository = {
    state: jest.fn().mockResolvedValue({
      enabled: true,
      exactAlarms: true,
      notifications: true,
      language: 'en',
      medicines: [
        { id: 'p', name: 'Paused first', status: 'paused', times: ['09:00'] },
        { id: 'a', name: 'Active first', status: 'active', times: ['10:00'] },
        { id: 'b', name: 'Active second', status: 'active', times: ['11:00'] },
        { id: 'q', name: 'Paused second', status: 'paused', times: ['12:00'] },
      ],
      todayDoses: [],
      history: [],
      upcoming: [],
    }),
  };
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    view = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(() => {
    view.root.findByProps({ testID: 'nav-reminders' }).props.onPress();
  });
  const names = view.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .filter(
      value =>
        typeof value === 'string' &&
        /^(Active|Paused) (first|second)$/.test(value),
    );
  expect(names).toEqual([
    'Active first',
    'Active second',
    'Paused first',
    'Paused second',
  ]);
  await ReactTestRenderer.act(() => view.unmount());
  subscription.mockRestore();
});

test.each([
  ['en', 'Delete'],
  ['es', 'Eliminar'],
])('confirms deletion in %s', async (language, label) => {
  const subscription = jest
    .spyOn(AppState, 'addEventListener')
    .mockReturnValue({ remove: jest.fn() });
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const setStatus = jest.fn().mockResolvedValue(undefined);
  const repo = require('../src/reminderRepository');
  repo.reminderRepository = {
    state: jest.fn().mockResolvedValue({
      enabled: true,
      exactAlarms: true,
      notifications: true,
      language,
      medicines: [
        { id: 'r', name: 'Water', type: 'reminder', times: ['09:00'] },
      ],
      todayDoses: [],
      history: [],
      upcoming: [],
    }),
    setStatus,
  };
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    view = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(() => {
    view.root.findByProps({ testID: 'nav-reminders' }).props.onPress();
  });
  await ReactTestRenderer.act(() => {
    view.root.findByProps({ accessibilityLabel: label }).props.onPress();
  });
  expect(setStatus).not.toHaveBeenCalled();
  const buttons = alert.mock.calls[0][2]!;
  await ReactTestRenderer.act(async () => {
    await buttons.find(button => button.style === 'destructive')!.onPress!();
  });
  expect(setStatus).toHaveBeenCalledWith('r', 'deleted');
  await ReactTestRenderer.act(() => view.unmount());
  alert.mockRestore();
  subscription.mockRestore();
});

test.each([
  ['en', 'Overdue'],
  ['es', 'Vencido'],
])(
  'shows actionable overdue reminders first in %s',
  async (language, label) => {
    const subscription = jest
      .spyOn(AppState, 'addEventListener')
      .mockReturnValue({ remove: jest.fn() });
    const repo = require('../src/reminderRepository');
    repo.reminderRepository = {
      state: jest.fn().mockResolvedValue({
        enabled: true,
        exactAlarms: true,
        notifications: true,
        language,
        medicines: [
          {
            id: 'p',
            name: 'Paused item',
            status: 'paused',
            type: 'reminder',
            times: ['09:00'],
          },
          {
            id: 'a',
            name: 'Active',
            status: 'active',
            type: 'reminder',
            times: ['09:00'],
          },
          {
            id: 'm',
            name: 'Medicine due',
            status: 'active',
            type: 'medicine',
            times: ['09:00'],
          },
          {
            id: 'r',
            name: 'Reminder due',
            status: 'active',
            type: 'reminder',
            times: ['09:00'],
          },
          {
            id: 'h',
            name: 'Missed only',
            status: 'active',
            type: 'reminder',
            times: ['09:00'],
          },
        ],
        todayDoses: [
          { medicineId: 'm', scheduledAt: 2000, actionable: true },
          { medicineId: 'r', scheduledAt: 3000, actionable: true },
          {
            medicineId: 'h',
            scheduledAt: 1000,
            outcome: 'missed',
            actionable: false,
          },
        ],
        history: [],
        upcoming: [],
      }),
    };
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      view = ReactTestRenderer.create(<App />);
    });
    await ReactTestRenderer.act(() => {
      view.root.findByProps({ testID: 'nav-reminders' }).props.onPress();
    });
    const text = view.root.findAllByType(Text).map(node => node.props.children);
    expect(
      text.filter(value =>
        [
          'Paused item',
          'Active',
          'Medicine due',
          'Reminder due',
          'Missed only',
        ].includes(value),
      ),
    ).toEqual([
      'Medicine due',
      'Reminder due',
      'Active',
      'Missed only',
      'Paused item',
    ]);
    expect(text.filter(value => value === label)).toHaveLength(2);
    await ReactTestRenderer.act(() => view.unmount());
    subscription.mockRestore();
  },
);
