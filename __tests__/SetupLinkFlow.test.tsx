import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Linking, Text, TextInput } from 'react-native';
import { translations } from '../src/translations';
import App from '../App';
import { PillAction } from '../src/PillAction';

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
      state: jest
        .fn()
        .mockResolvedValue({
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
      state: jest
        .fn()
        .mockResolvedValue({
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
    state: jest
      .fn()
      .mockResolvedValue({
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
    state: jest
      .fn()
      .mockResolvedValue({
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
    state: jest
      .fn()
      .mockResolvedValue({
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
