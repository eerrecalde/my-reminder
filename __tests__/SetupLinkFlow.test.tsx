import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Alert, AppState, Linking, PermissionsAndroid, Platform, Share, Text, TextInput } from 'react-native';
import type { Medicine } from '../src/reminderRepository';
import { translations } from '../src/translations';
import App from '../App';
import { PillAction } from '../src/PillAction';

test.each(['en', 'es'] as const)(
  'a recurring Medicine can be reviewed, edited and saved in %s',
  async language => {
    const saveScheduled = jest.fn().mockResolvedValue('new');
    require('../src/reminderRepository').reminderRepository = {
      state: jest.fn().mockResolvedValue({
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

test.each(['en', 'es'] as const)(
  'a caregiver shares a daily Reminder and can save an independent copy in %s',
  async language => {
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
      saveScheduled,
    };
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      view = ReactTestRenderer.create(<App />);
    });
    const copy = translations[language].setup;
    const press = async (title: string) =>
      ReactTestRenderer.act(async () => {
        await view.root
          .findAllByType(PillAction)
          .find(node => node.props.title === title)!
          .props.onPress();
      });
    await press(language === 'en' ? 'Add reminder' : translations.es.app.add);
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
  },
);

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


test.each([['en', 'reminder'], ['es', 'reminder'], ['en', 'medicine'], ['es', 'medicine']] as const)(
  'a matching %s %s setup link warns before adding a separate item',
  async (language, type) => {
    const existing = { id: 'existing', type: 'reminder', name: '  WATER  ', instructions: '', mode: 'notification', scheduleKind: 'daily', times: ['09:15'], startDate: '2099-06-30', endDate: '2099-06-30' };
    const saveScheduled = jest.fn().mockResolvedValue('new');
    const editScheduled = jest.fn();
    require('../src/reminderRepository').reminderRepository = {
      state: jest.fn().mockResolvedValue({ enabled: true, language, medicines: [existing], todayDoses: [], upcoming: [] }), saveScheduled, editScheduled,
    };
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(`https://setup-links.example.com/setup?v=1&type=${type}&name=Water&date=2099-06-30&time=09%3A15`);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => { view = ReactTestRenderer.create(<App />); });
    const save = () => view.root.findAllByType(PillAction).find(node => node.props.title === (type === 'medicine' ? translations[language].setup.save : translations[language].setup.saveReminder))!.props.onPress();
    await ReactTestRenderer.act(async () => { save(); });
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0][0]).toBe(type === 'medicine' ? translations[language].setup.duplicateMedicine : translations[language].setup.duplicateReminder);
    expect(saveScheduled).not.toHaveBeenCalled();
    await ReactTestRenderer.act(async () => { await alert.mock.calls[0][2]![0].onPress?.(); });
    expect(saveScheduled).not.toHaveBeenCalled();
    await ReactTestRenderer.act(async () => { save(); });
    await ReactTestRenderer.act(async () => { await alert.mock.calls[1][2]![1].onPress?.(); });
    expect(saveScheduled).toHaveBeenCalledTimes(1);
    expect(editScheduled).not.toHaveBeenCalled();
    expect(existing.name).toBe('  WATER  ');
    await ReactTestRenderer.act(() => view.unmount());
    jest.restoreAllMocks();
  },
);

test('reopening a saved link and a separately produced matching link both warn', async () => {
  const items: object[] = [];
  const saveScheduled = jest.fn(async (type, name, instructions, times, mode, startDate, endDate, scheduleKind) => {
    items.push({ id: `item-${items.length}`, type, name, instructions, times, mode, startDate, endDate, scheduleKind });
  });
  require('../src/reminderRepository').reminderRepository = {
    state: jest.fn(async () => ({ enabled: true, language: 'en', medicines: [...items], todayDoses: [], upcoming: [] })),
    saveScheduled,
  };
  const link = 'https://setup-links.example.com/setup?v=1&name=Water&date=2099-06-30&time=09%3A15';
  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(link);
  let receive!: (event: { url: string }) => void;
  jest.spyOn(Linking, 'addEventListener').mockImplementation((_event, callback) => {
    receive = callback;
    return { remove: jest.fn() };
  });
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => { view = ReactTestRenderer.create(<App />); });
  const save = () => view.root.findAllByType(PillAction).find(node => node.props.title === translations.en.setup.saveReminder)!.props.onPress();
  await ReactTestRenderer.act(async () => { await save(); });
  expect(items).toHaveLength(1);
  await ReactTestRenderer.act(() => receive({ url: link }));
  await ReactTestRenderer.act(async () => { save(); });
  expect(alert).toHaveBeenCalledTimes(1);
  await ReactTestRenderer.act(async () => { alert.mock.calls[0][2]![0].onPress?.(); });
  expect(items).toHaveLength(1);
  await ReactTestRenderer.act(() => receive({ url: 'https://ding-reminders.surge.sh/setup?time=09%3A15&date=2099-06-30&name=WATER&v=1&mode=alarm' }));
  await ReactTestRenderer.act(async () => { save(); });
  expect(alert).toHaveBeenCalledTimes(2);
  await ReactTestRenderer.act(async () => { alert.mock.calls[1][2]![1].onPress?.(); });
  expect(items).toHaveLength(2);
  expect(items[0]).toMatchObject({ id: 'item-0', name: 'Water', mode: 'notification' });
  expect(items[1]).toMatchObject({ id: 'item-1', name: 'WATER', mode: 'alarm' });
  await ReactTestRenderer.act(() => view.unmount());
  jest.restoreAllMocks();
});

test.each(['en', 'es'] as const)(
  'a recipient can save with missing alert access and sees updated guidance in %s',
  async language => {
    let allowed = false;
    const items: Medicine[] = [];
    let resume!: (state: 'active') => void;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, callback) => {
      resume = callback as typeof resume;
      return { remove: jest.fn() };
    });
    const openAlarmSettings = jest.fn();
    const openNotificationSettings = jest.fn();
    jest.replaceProperty(Platform, 'OS', 'android');
    jest.spyOn(Platform, 'Version', 'get').mockReturnValue(33);
    const request = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);
    const state = jest.fn(async () => ({
      enabled: allowed, notifications: allowed, exactAlarms: allowed,
      fullScreenAccess: 'allowed', language, medicines: [...items], todayDoses: [], upcoming: [],
    }));
    const saveScheduled = jest.fn(async (type, name, instructions, times, mode, startDate, endDate, scheduleKind) => {
      items.push({ id: 'saved', type, name, instructions, times, mode, startDate, endDate, scheduleKind });
    });
    require('../src/reminderRepository').reminderRepository = { state, saveScheduled, openAlarmSettings, openNotificationSettings };
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue('https://setup-links.example.com/setup?v=1&name=Water&date=2099-06-30&time=09%3A15');
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => { view = ReactTestRenderer.create(<App />); });
    const action = (title: string) => view.root.findAllByType(PillAction).find(node => node.props.title === title);
    expect(action(translations[language].app.allowExact)).toBeDefined();
    await ReactTestRenderer.act(async () => { action(translations[language].app.allowExact)!.props.onPress(); });
    expect(openAlarmSettings).toHaveBeenCalled();
    await ReactTestRenderer.act(async () => { await action(translations[language].app.allowNotifications)!.props.onPress(); });
    expect(request).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    expect(openNotificationSettings).toHaveBeenCalled();
    await ReactTestRenderer.act(async () => { await action(translations[language].setup.saveReminder)!.props.onPress(); });
    expect(items).toHaveLength(1);
    expect(view.root.findAllByType(Text).some(node => node.props.children === translations[language].app.offBoth)).toBe(true);
    allowed = true;
    await ReactTestRenderer.act(async () => { resume('active'); });
    expect(items).toHaveLength(1);
    expect(view.root.findAllByType(Text).some(node => node.props.children === translations[language].app.offBoth)).toBe(false);
    await ReactTestRenderer.act(() => view.unmount());
    jest.restoreAllMocks();
  },
);

test.each([
  ['en', 'reminder', false, true, 'notification'],
  ['es', 'medicine', true, false, 'alarm'],
] as const)(
  'review identifies only the missing access for a %s %s',
  async (language, type, notifications, exactAlarms, mode) => {
    const state = jest.fn().mockResolvedValue({ enabled: false, notifications, exactAlarms, fullScreenAccess: 'denied', language, medicines: [], todayDoses: [], upcoming: [] });
    require('../src/reminderRepository').reminderRepository = { state, openFullScreenSettings: jest.fn(), openAlarmSettings: jest.fn(), openNotificationSettings: jest.fn() };
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(`https://setup-links.example.com/setup?v=1&type=${type}&mode=${mode}&name=Water&date=2099-06-30&time=09%3A15`);
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => { view = ReactTestRenderer.create(<App />); });
    const actions = view.root.findAllByType(PillAction).map(node => node.props.title);
    expect(actions.includes(translations[language].app.allowNotifications)).toBe(!notifications);
    expect(actions.includes(translations[language].app.allowExact)).toBe(!exactAlarms);
    expect(actions.includes(translations[language].alarmScreenAccess.allow)).toBe(mode === 'alarm');
    await ReactTestRenderer.act(() => view.unmount());
    jest.restoreAllMocks();
  },
);
