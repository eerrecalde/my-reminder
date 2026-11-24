import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AppState, Text } from 'react-native';
import App, { PillAction } from '../App';
import { MedicineSetup } from '../src/MedicineSetup';
import { SoundChoice } from '../src/SoundChoice';

jest.mock('react-native-safe-area-context', () => {
  const mock = jest.requireActual('react-native-safe-area-context/jest/mock');
  return mock.default;
});

test.each([true, false])(
  'refreshes affected channels after changing the notification default (initially blocked: %s)',
  async initiallyBlocked => {
    const subscription = jest
      .spyOn(AppState, 'addEventListener')
      .mockReturnValue({ remove: jest.fn() });
    const makeState = (blocked: boolean) => ({
      enabled: true,
      notifications: true,
      exactAlarms: true,
      language: 'en',
      medicines: [
        {
          id: 'water',
          name: 'Water',
          type: 'reminder',
          mode: 'notification',
          times: ['09:00'],
          blockedNotificationChannel: blocked ? 'sound-blocked' : null,
        },
      ],
      todayDoses: [],
      history: [],
      upcoming: [],
    });
    const state = jest
      .fn()
      .mockResolvedValueOnce(makeState(initiallyBlocked))
      .mockResolvedValue(makeState(!initiallyBlocked));
    const repository = require('../src/reminderRepository');
    repository.reminderRepository = {
      state,
      setSoundDefault: jest.fn().mockResolvedValue(undefined),
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
    expect(
      view.root
        .findAllByType(Text)
        .filter(item => item.props.testID === 'blocked-channel-warning'),
    ).toHaveLength(initiallyBlocked ? 1 : 0);
    await ReactTestRenderer.act(async () => {
      view.root
        .findAllByType(SoundChoice)
        .find(item => item.props.mode === 'notification')!
        .props.onChange('new-sound');
    });
    expect(
      view.root
        .findAllByType(Text)
        .filter(item => item.props.testID === 'blocked-channel-warning'),
    ).toHaveLength(initiallyBlocked ? 0 : 1);
    await ReactTestRenderer.act(() => view.unmount());
    subscription.mockRestore();
  },
);

test.each([
  ['en', 'Review reminder access'],
  ['es', 'Revisar acceso a recordatorios'],
])(
  'identifies affected reminders, opens channel settings, and refreshes after return in %s',
  async (language, accessLabel) => {
    let resume!: (state: 'active') => void;
    const subscription = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_type, callback) => {
        resume = callback as typeof resume;
        return { remove: jest.fn() };
      });
    const blocked = {
      enabled: true,
      notifications: true,
      exactAlarms: true,
      language,
      medicines: [
        {
          id: 'water',
          name: 'Water',
          type: 'reminder',
          mode: 'notification',
          times: ['09:00'],
          blockedNotificationChannel: 'sound-water',
        },
        {
          id: 'tablet',
          name: 'Tablet',
          type: 'medicine',
          status: 'paused',
          mode: 'notification',
          times: ['10:00'],
          blockedNotificationChannel: 'sound-tablet',
        },
      ],
      todayDoses: [],
      history: [],
      upcoming: [],
    };
    const state = jest
      .fn()
      .mockResolvedValueOnce(blocked)
      .mockResolvedValue({
        ...blocked,
        medicines: blocked.medicines.map(item => ({
          ...item,
          blockedNotificationChannel: null,
        })),
      });
    const openNotificationChannelSettings = jest.fn();
    const repository = require('../src/reminderRepository');
    repository.reminderRepository = { state, openNotificationChannelSettings };
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      view = ReactTestRenderer.create(<App />);
    });
    expect(
      view.root.findByProps({ testID: 'blocked-channel-warning' }),
    ).toBeTruthy();
    await ReactTestRenderer.act(() =>
      view.root
        .findAllByProps({
          accessibilityRole: 'button',
          accessibilityLabel: accessLabel,
        })[0]
        .props.onPress(),
    );
    const water = view.root.findByProps({ testID: 'blocked-channel-water' });
    const tablet = view.root.findByProps({ testID: 'blocked-channel-tablet' });
    expect(
      water.findAllByType(Text).some(node => node.props.children === 'Water'),
    ).toBe(true);
    expect(
      tablet.findAllByType(Text).some(node => node.props.children === 'Tablet'),
    ).toBe(true);
    expect(
      tablet
        .findAllByType(Text)
        .some(
          node =>
            node.props.children === (language === 'en' ? 'Paused' : 'Pausado'),
        ),
    ).toBe(true);
    await ReactTestRenderer.act(() =>
      water.findByType(PillAction).props.onPress(),
    );
    expect(openNotificationChannelSettings).toHaveBeenCalledWith('sound-water');
    await ReactTestRenderer.act(async () => {
      resume('active');
    });
    expect(
      view.root.findAllByProps({ testID: 'blocked-channel-warning' }),
    ).toHaveLength(0);
    await ReactTestRenderer.act(() => view.unmount());
    subscription.mockRestore();
  },
);

test.each(['reminder', 'medicine'])(
  'allows saving a %s while a selected channel is blocked',
  async type => {
    const subscription = jest
      .spyOn(AppState, 'addEventListener')
      .mockReturnValue({ remove: jest.fn() });
    const repository = require('../src/reminderRepository');
    const saveScheduled = jest.fn().mockResolvedValue('new-id');
    repository.reminderRepository = {
      state: jest.fn().mockResolvedValue({
        enabled: true,
        notifications: true,
        exactAlarms: true,
        language: 'en',
        medicines: [
          {
            id: 'blocked',
            name: 'Existing',
            type: 'reminder',
            mode: 'notification',
            times: ['09:00'],
            blockedNotificationChannel: 'blocked-sound',
          },
        ],
        todayDoses: [],
        history: [],
        upcoming: [],
      }),
      saveScheduled,
    };
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      view = ReactTestRenderer.create(<App />);
    });
    await ReactTestRenderer.act(() =>
      view.root.findByProps({ testID: 'nav-reminders' }).props.onPress(),
    );
    await ReactTestRenderer.act(() =>
      view.root
        .findAllByType(PillAction)
        .find(item => item.props.title === 'Add reminder')!
        .props.onPress(),
    );
    await ReactTestRenderer.act(async () =>
      view.root.findByType(MedicineSetup).props.onSave({
        type,
        name: 'New',
        instructions: '',
        times: ['09:00'],
        mode: 'notification',
        startDate: '2026-01-01',
        endDate: null,
        scheduleKind: 'daily',
        weekdays: [],
        intervalHours: null,
        intervalAnchor: null,
        monthlyDay: null,
        shortMonthPolicy: 'last',
      }),
    );
    expect(saveScheduled).toHaveBeenCalledWith(
      type,
      'New',
      '',
      ['09:00'],
      'notification',
      '2026-01-01',
      null,
      'daily',
      [],
      null,
      null,
      null,
      'last',
      null,
      null,
    );
    await ReactTestRenderer.act(() => view.unmount());
    subscription.mockRestore();
  },
);
