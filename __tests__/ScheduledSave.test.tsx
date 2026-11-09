import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Button } from 'react-native';
import App from '../App';
import { MedicineSetup } from '../src/MedicineSetup';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

test.each([false, true])(
  'passes the selected schedule to native when editing is %s',
  async editing => {
    const repo = require('../src/reminderRepository');
    const saveScheduled = jest.fn().mockResolvedValue(undefined);
    const editScheduled = jest.fn().mockResolvedValue(undefined);
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
            times: ['09:00'],
          },
        ],
        todayDoses: [],
        history: [],
        upcoming: [],
      }),
      saveScheduled,
      editScheduled,
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
        .findAllByType(Button)
        .find(b => b.props.title === (editing ? 'Edit' : 'Add reminder'))!
        .props.onPress(),
    );
    await ReactTestRenderer.act(async () =>
      view.root.findByType(MedicineSetup).props.onSave({
        type: 'reminder',
        name: 'Water',
        instructions: '',
        times: ['09:00'],
        mode: 'notification',
        startDate: '2026-01-01',
        endDate: null,
        scheduleKind: 'monthly',
        weekdays: [],
        intervalHours: null,
        intervalAnchor: null,
        monthlyDay: 31,
        shortMonthPolicy: 'skip',
      }),
    );
    const expected = [
      'reminder',
      'Water',
      '',
      ['09:00'],
      'notification',
      '2026-01-01',
      null,
      'monthly',
      [],
      null,
      null,
      31,
      'skip',
    ];
    expect(editing ? editScheduled : saveScheduled).toHaveBeenCalledWith(
      ...(editing ? ['r', ...expected] : expected),
    );
    await ReactTestRenderer.act(() => view.unmount());
  },
);
