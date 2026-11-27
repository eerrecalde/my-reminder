import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Linking, Share, Text, TextInput } from 'react-native';
import { translations } from '../src/translations';
import App from '../App';
import { PillAction } from '../src/PillAction';

test.each(['en', 'es'] as const)(
  'a recurring Medicine can be reviewed, edited and saved in %s',
  async language => {
    const saveScheduled = jest.fn().mockResolvedValue('new');
    require('../src/reminderRepository').reminderRepository = {
      state: jest
        .fn()
        .mockResolvedValue({
          enabled: true,
          language,
          medicines: [],
          todayDoses: [],
          upcoming: [],
        }),
      saveScheduled,
    };
    jest
      .spyOn(Linking, 'getInitialURL')
      .mockResolvedValue(
        'https://setup-links.example.com/setup?v=1&type=medicine&name=Example&instructions=Food&schedule=weekday&start=2000-01-01&times=08%3A00%2C18%3A30&weekdays=1%2C5',
      );
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      view = ReactTestRenderer.create(<App />);
    });
    const copy = translations[language].setup;
    expect(
      view.root
        .findAllByType(Text)
        .some(
          node =>
            node.props.children === `${copy.weekdays[0]}, ${copy.weekdays[4]}`,
        ),
    ).toBe(true);
    const press = async (title: string) =>
      ReactTestRenderer.act(async () => {
        await view.root
          .findAllByType(PillAction)
          .find(node => node.props.title === title)!
          .props.onPress();
      });
    await press(copy.editLink);
    await ReactTestRenderer.act(() =>
      view.root.findAllByType(TextInput)[0].props.onChangeText('Changed'),
    );
    await press(copy.next);
    await press(copy.review);
    expect(saveScheduled).not.toHaveBeenCalled();
    await press(copy.save);
    expect(saveScheduled).toHaveBeenCalledWith(
      'medicine',
      'Changed',
      'Food',
      ['08:00', '18:30'],
      'notification',
      '2000-01-01',
      null,
      'weekday',
      [1, 5],
      null,
      null,
      null,
      'last',
      null,
      null,
    );
    await ReactTestRenderer.act(() => view.unmount());
    jest.restoreAllMocks();
  },
);

test('a caregiver shares a daily Reminder and can save an independent copy', async () => {
  const share = jest
    .spyOn(Share, 'share')
    .mockResolvedValue({
      action: Share.dismissedAction,
      activityType: undefined,
    });
  const saveScheduled = jest.fn().mockResolvedValue('copy');
  require('../src/reminderRepository').reminderRepository = {
    state: jest
      .fn()
      .mockResolvedValue({
        enabled: true,
        language: 'en',
        medicines: [],
        todayDoses: [],
        upcoming: [],
      }),
    selectTime: jest.fn().mockResolvedValue('09:15'),
    saveScheduled,
  };
  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    view = ReactTestRenderer.create(<App />);
  });
  const copy = translations.en.setup;
  const press = async (title: string) =>
    ReactTestRenderer.act(async () => {
      await view.root
        .findAllByType(PillAction)
        .find(node => node.props.title === title)!
        .props.onPress();
    });
  await press('Add reminder');
  await press(copy.reminder);
  await ReactTestRenderer.act(() =>
    view.root.findAllByType(TextInput)[0].props.onChangeText('Water'),
  );
  await press(copy.next);
  await ReactTestRenderer.act(() =>
    view.root
      .findByProps({ accessibilityLabel: `${copy.frequency}: ${copy.once}` })
      .props.onPress(),
  );
  await ReactTestRenderer.act(() =>
    view.root
      .findAll(
        node =>
          node.props.accessibilityRole === 'radio' &&
          node
            .findAllByType(Text)
            .some(child => child.props.children === copy.daily),
      )[0]
      .props.onPress(),
  );
  await ReactTestRenderer.act(async () => {
    await view.root
      .findByProps({ accessibilityLabel: copy.selectTime })
      .props.onPress();
  });
  await press(copy.review);
  await press(copy.shareSetup);
  expect(saveScheduled).not.toHaveBeenCalled();
  const link = share.mock.calls[0][0].message!;
  expect(require('../src/setupLink').parseSetupLink(link)).toMatchObject({
    name: 'Water',
    scheduleKind: 'daily',
    times: ['09:15'],
  });
  await press(copy.saveReminder);
  expect(saveScheduled).toHaveBeenCalledWith(
    'reminder',
    'Water',
    '',
    ['09:15'],
    'notification',
    expect.any(String),
    null,
    'daily',
    expect.any(Array),
    null,
    null,
    null,
    'last',
    null,
    null,
  );
  await ReactTestRenderer.act(() => view.unmount());
  jest.restoreAllMocks();
});

test('an expired recurring link cannot be saved', async () => {
  const saveScheduled = jest.fn();
  require('../src/reminderRepository').reminderRepository = {
    state: jest.fn().mockResolvedValue({
      enabled: true,
      language: 'en',
      medicines: [],
      todayDoses: [],
      upcoming: [],
    }),
    saveScheduled,
  };
  jest
    .spyOn(Linking, 'getInitialURL')
    .mockResolvedValue(
      'https://setup-links.example.com/setup?v=1&name=Water&schedule=daily&start=2000-01-01&end=2001-01-01&times=09%3A00',
    );
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    view = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(async () => {
    await view.root
      .findAllByType(PillAction)
      .find(node => node.props.title === 'Save reminder')!
      .props.onPress();
  });
  expect(saveScheduled).not.toHaveBeenCalled();
  await ReactTestRenderer.act(() => view.unmount());
  jest.restoreAllMocks();
});

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

test.each(['en', 'es'] as const)(
  'a shared Reminder is reviewed and saved as new in %s',
  async language => {
    const saveScheduled = jest.fn().mockResolvedValue('new');
    const editScheduled = jest.fn();
    require('../src/reminderRepository').reminderRepository = {
      state: jest.fn().mockResolvedValue({
        enabled: true,
        exactAlarms: true,
        notifications: true,
        language,
        medicines: [
          {
            id: 'existing',
            type: 'reminder',
            name: 'Existing',
            instructions: '',
            times: ['09:00'],
          },
        ],
        todayDoses: [],
        upcoming: [],
      }),
      saveScheduled,
      editScheduled,
    };
    jest
      .spyOn(Linking, 'getInitialURL')
      .mockResolvedValue(
        'https://ding-reminders.surge.sh/setup?v=1&name=Water&date=2099-06-30&time=09%3A15',
      );
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      view = ReactTestRenderer.create(<App />);
    });
    expect(
      view.root
        .findAllByType(Text)
        .some(node => node.props.children === 'Water'),
    ).toBe(true);
    expect(saveScheduled).not.toHaveBeenCalled();
    const save = view.root
      .findAllByType(PillAction)
      .find(
        node =>
          node.props.title ===
          (language === 'en' ? 'Save reminder' : 'Guardar recordatorio'),
      );
    expect(save).toBeDefined();
    await ReactTestRenderer.act(async () => {
      await save!.props.onPress();
    });
    expect(saveScheduled).toHaveBeenCalledTimes(1);
    expect(editScheduled).not.toHaveBeenCalled();
    await ReactTestRenderer.act(() => view.unmount());
    jest.restoreAllMocks();
  },
);

test.each(['en', 'es'] as const)(
  'a running app reviews a Medicine link without changing existing items in %s',
  async language => {
    const saveScheduled = jest.fn().mockResolvedValue('new');
    const editScheduled = jest.fn();
    require('../src/reminderRepository').reminderRepository = {
      state: jest.fn().mockResolvedValue({
        enabled: true,
        exactAlarms: true,
        notifications: true,
        language,
        medicines: [
          {
            id: 'existing',
            type: 'reminder',
            name: 'Existing',
            instructions: '',
            times: ['09:00'],
          },
        ],
        todayDoses: [],
        upcoming: [],
      }),
      saveScheduled,
      editScheduled,
    };
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
    let receive!: (event: { url: string }) => void;
    jest
      .spyOn(Linking, 'addEventListener')
      .mockImplementation((_type, callback) => {
        receive = callback;
        return { remove: jest.fn() };
      });
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      view = ReactTestRenderer.create(<App />);
    });
    await ReactTestRenderer.act(() =>
      receive({
        url: 'https://setup-links.example.com/setup?v=1&name=Example&type=medicine&instructions=With%20food&mode=alarm&date=2099-06-30&time=09%3A15',
      }),
    );
    expect(
      view.root
        .findAllByType(Text)
        .some(node => node.props.children === 'With food'),
    ).toBe(true);
    expect(saveScheduled).not.toHaveBeenCalled();
    const edit = view.root
      .findAllByType(PillAction)
      .find(
        node =>
          node.props.title ===
          (language === 'en' ? 'Edit details' : 'Editar datos'),
      )!;
    await ReactTestRenderer.act(() => edit.props.onPress());
    expect(saveScheduled).not.toHaveBeenCalled();
    await ReactTestRenderer.act(() =>
      view.root.findAllByType(TextInput)[0].props.onChangeText('Changed'),
    );
    const copy = translations[language].setup;
    await ReactTestRenderer.act(() =>
      view.root
        .findAllByType(PillAction)
        .find(node => node.props.title === copy.next)!
        .props.onPress(),
    );
    await ReactTestRenderer.act(() =>
      view.root
        .findAllByType(PillAction)
        .find(node => node.props.title === copy.review)!
        .props.onPress(),
    );
    expect(
      view.root
        .findAllByType(Text)
        .some(node => node.props.children === 'Changed'),
    ).toBe(true);
    expect(saveScheduled).not.toHaveBeenCalled();
    await ReactTestRenderer.act(async () => {
      await view.root
        .findAllByType(PillAction)
        .find(node => node.props.title === copy.save)!
        .props.onPress();
    });
    expect(saveScheduled).toHaveBeenCalledWith(
      'medicine',
      'Changed',
      'With food',
      ['09:15'],
      'alarm',
      '2099-06-30',
      '2099-06-30',
      'daily',
      expect.any(Array),
      null,
      null,
      null,
      'last',
      null,
      null,
    );
    expect(editScheduled).not.toHaveBeenCalled();
    await ReactTestRenderer.act(() => view.unmount());
    jest.restoreAllMocks();
  },
);

test('an invalid link shows an error and saves nothing', async () => {
  const saveScheduled = jest.fn();
  require('../src/reminderRepository').reminderRepository = {
    state: jest.fn().mockResolvedValue({
      enabled: true,
      language: 'en',
      medicines: [],
      todayDoses: [],
      upcoming: [],
    }),
    saveScheduled,
  };
  jest
    .spyOn(Linking, 'getInitialURL')
    .mockResolvedValue('https://setup-links.example.com/setup?v=2');
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    view = ReactTestRenderer.create(<App />);
  });
  expect(
    view.root
      .findAllByType(Text)
      .some(
        node =>
          typeof node.props.children === 'string' &&
          node.props.children.includes('invalid or unsupported'),
      ),
  ).toBe(true);
  expect(saveScheduled).not.toHaveBeenCalled();
  await ReactTestRenderer.act(() => view.unmount());
  jest.restoreAllMocks();
});

test('a past one-time link asks for a future time and cannot be saved', async () => {
  const saveScheduled = jest.fn();
  require('../src/reminderRepository').reminderRepository = {
    state: jest.fn().mockResolvedValue({
      enabled: true,
      language: 'en',
      medicines: [],
      todayDoses: [],
      upcoming: [],
    }),
    saveScheduled,
  };
  jest
    .spyOn(Linking, 'getInitialURL')
    .mockResolvedValue(
      'https://setup-links.example.com/setup?v=1&name=Water&date=2000-01-01&time=09%3A15',
    );
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    view = ReactTestRenderer.create(<App />);
  });
  expect(
    view.root
      .findAllByType(Text)
      .some(node => node.props.children === 'Choose a future date and time.'),
  ).toBe(true);
  await ReactTestRenderer.act(async () => {
    await view.root
      .findAllByType(PillAction)
      .find(node => node.props.title === 'Save reminder')!
      .props.onPress();
  });
  expect(saveScheduled).not.toHaveBeenCalled();
  await ReactTestRenderer.act(() => view.unmount());
  jest.restoreAllMocks();
});

test('a shared Alarm shows the existing Alarm screen guidance', async () => {
  require('../src/reminderRepository').reminderRepository = {
    state: jest.fn().mockResolvedValue({
      enabled: true,
      fullScreenAccess: 'denied',
      language: 'en',
      medicines: [],
      todayDoses: [],
      upcoming: [],
    }),
  };
  jest
    .spyOn(Linking, 'getInitialURL')
    .mockResolvedValue(
      'https://setup-links.example.com/setup?v=1&name=Water&date=2099-06-30&time=09%3A15&mode=alarm',
    );
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    view = ReactTestRenderer.create(<App />);
  });
  expect(
    view.root
      .findAllByType(Text)
      .some(
        node =>
          node.props.children === translations.en.alarmScreenAccess.fallback,
      ),
  ).toBe(true);
  await ReactTestRenderer.act(() => view.unmount());
  jest.restoreAllMocks();
});

test('a past link uses the saved language even when it loads later', async () => {
  let resolveState!: (value: object) => void;
  require('../src/reminderRepository').reminderRepository = {
    state: jest.fn().mockReturnValue(
      new Promise(resolve => {
        resolveState = resolve;
      }),
    ),
  };
  jest
    .spyOn(Linking, 'getInitialURL')
    .mockResolvedValue(
      'https://setup-links.example.com/setup?v=1&name=Water&date=2000-01-01&time=09%3A15',
    );
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    view = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(async () => {
    await view.root
      .findAllByType(PillAction)
      .find(node => node.props.title === 'Save reminder')!
      .props.onPress();
  });
  await ReactTestRenderer.act(async () =>
    resolveState({
      enabled: true,
      language: 'es',
      medicines: [],
      todayDoses: [],
      upcoming: [],
    }),
  );
  expect(
    view.root
      .findAllByType(Text)
      .some(node => node.props.children === translations.es.setup.onceFuture),
  ).toBe(true);
  await ReactTestRenderer.act(() => view.unmount());
  jest.restoreAllMocks();
});

test('cancelling a valid link leaves existing items untouched', async () => {
  const saveScheduled = jest.fn();
  const editScheduled = jest.fn();
  require('../src/reminderRepository').reminderRepository = {
    state: jest.fn().mockResolvedValue({
      enabled: true,
      language: 'en',
      medicines: [
        {
          id: 'existing',
          type: 'reminder',
          name: 'Existing',
          instructions: '',
          times: ['09:00'],
        },
      ],
      todayDoses: [],
      upcoming: [],
    }),
    saveScheduled,
    editScheduled,
  };
  jest
    .spyOn(Linking, 'getInitialURL')
    .mockResolvedValue(
      'https://setup-links.example.com/setup?v=1&name=Water&date=2099-06-30&time=09%3A15',
    );
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    view = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(() =>
    view.root.findByProps({ accessibilityLabel: 'Back' }).props.onPress(),
  );
  expect(saveScheduled).not.toHaveBeenCalled();
  expect(editScheduled).not.toHaveBeenCalled();
  await ReactTestRenderer.act(() => view.unmount());
  jest.restoreAllMocks();
});

test.each([
  ['en', 'medicine'],
  ['es', 'medicine'],
  ['en', 'reminder'],
  ['es', 'reminder'],
] as const)(
  'shares a prepared %s %s without saving, then saves an independent copy',
  async (language, type) => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({
      action: Share.dismissedAction,
      activityType: undefined,
    });
    const saveScheduled = jest.fn().mockResolvedValue('copy');
    require('../src/reminderRepository').reminderRepository = {
      state: jest.fn().mockResolvedValue({
        enabled: true,
        language,
        medicines: [],
        todayDoses: [],
        upcoming: [],
      }),
      selectTime: jest.fn().mockResolvedValue('09:15'),
      selectDate: jest.fn().mockResolvedValue('2099-06-30'),
      saveScheduled,
    };
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
    let receive!: (event: { url: string }) => void;
    jest
      .spyOn(Linking, 'addEventListener')
      .mockImplementation((_event, callback) => {
        receive = callback;
        return { remove: jest.fn() };
      });
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      view = ReactTestRenderer.create(<App />);
    });
    const press = async (title: string) =>
      ReactTestRenderer.act(async () => {
        await view.root
          .findAllByType(PillAction)
          .find(node => node.props.title === title)!
          .props.onPress();
      });
    await press(language === 'en' ? 'Add reminder' : translations.es.app.add);
    await press(
      type === 'medicine'
        ? translations[language].setup.medicine
        : translations[language].setup.reminder,
    );
    await ReactTestRenderer.act(() => {
      const inputs = view.root.findAllByType(TextInput);
      inputs[0].props.onChangeText('Café & tea');
      if (type === 'medicine')
        inputs[1].props.onChangeText('After food & water');
    });
    const copy = translations[language].setup;
    await press(copy.next);
    if (type === 'reminder')
      await ReactTestRenderer.act(() =>
        view.root
          .findAll(
            node =>
              node.props.accessibilityRole === 'radio' &&
              node.props.accessibilityLabel ===
                (language === 'en' ? 'Alarm' : 'Alarma'),
          )[0]
          .props.onPress(),
      );
    await ReactTestRenderer.act(async () => {
      await view.root
        .findAll(node =>
          node.props.accessibilityLabel?.startsWith(`${copy.onceDate}: `),
        )[0]
        .props.onPress();
      await view.root
        .findAll(
          node =>
            node.props.accessibilityLabel ===
            (language === 'en' ? 'Select a time' : 'Elegir una hora'),
        )[0]
        .props.onPress();
    });
    await press(copy.review);
    await press(copy.shareSetup);
    expect(saveScheduled).not.toHaveBeenCalled();
    expect(share).toHaveBeenCalledTimes(1);
    const link = share.mock.calls[0][0].message;
    expect(link).toContain('setup-links.example.com/setup?');
    expect(require('../src/setupLink').parseSetupLink(link)).toMatchObject({
      type,
      mode: type === 'medicine' ? 'notification' : 'alarm',
      name: 'Café & tea',
      instructions: type === 'medicine' ? 'After food & water' : '',
      startDate: '2099-06-30',
      endDate: '2099-06-30',
      times: ['09:15'],
    });
    await press(type === 'medicine' ? copy.save : copy.saveReminder);
    expect(saveScheduled).toHaveBeenCalledTimes(1);
    expect(saveScheduled).toHaveBeenCalledWith(
      type,
      'Café & tea',
      type === 'medicine' ? 'After food & water' : '',
      ['09:15'],
      type === 'medicine' ? 'notification' : 'alarm',
      '2099-06-30',
      '2099-06-30',
      'daily',
      expect.any(Array),
      null,
      null,
      null,
      'last',
      null,
      null,
    );
    await ReactTestRenderer.act(() => receive({ url: link! }));
    expect(
      view.root
        .findAllByType(Text)
        .some(node => node.props.children === 'Café & tea'),
    ).toBe(true);
    if (type === 'medicine')
      expect(
        view.root
          .findAllByType(Text)
          .some(node => node.props.children === 'After food & water'),
      ).toBe(true);
    expect(saveScheduled).toHaveBeenCalledTimes(1);
    await ReactTestRenderer.act(() => view.unmount());
    jest.restoreAllMocks();
  },
);
