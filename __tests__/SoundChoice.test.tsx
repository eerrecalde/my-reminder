import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import { SoundChoice } from '../src/SoundChoice';
import { reminderRepository } from '../src/reminderRepository';

jest.mock('../src/reminderRepository', () => ({
  reminderRepository: {
    selectSound: jest.fn(),
    soundInfo: jest.fn(),
  },
}));
const picker = reminderRepository.selectSound as jest.Mock;
const info = reminderRepository.soundInfo as jest.Mock;

beforeEach(() => {
  picker.mockReset();
  info.mockReset();
});

test('selects silent and can restore the inherited sound', async () => {
  picker.mockResolvedValue('');
  const change = jest.fn();
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    view = ReactTestRenderer.create(
      <SoundChoice
        mode="notification"
        value={null}
        onChange={change}
        language="en"
      />,
    );
  });
  const button = view.root.findAll(
    node =>
      node.props.accessibilityLabel === 'Notification sound: Default sound',
  )[0];
  await ReactTestRenderer.act(async () => {
    await button.props.onPress();
  });
  expect(change).toHaveBeenCalledWith('');
  await ReactTestRenderer.act(() =>
    view.update(
      <SoundChoice
        mode="notification"
        value=""
        onChange={change}
        language="en"
      />,
    ),
  );
  expect(
    view.root.findAll(
      node => node.props.accessibilityLabel === 'Notification sound: Silent',
    ),
  ).not.toHaveLength(0);
  const reset = view.root
    .findAll(node => node.props.accessibilityRole === 'button')
    .find(node =>
      node
        .findAllByType(Text)
        .some(text => text.props.children === 'Use default sound'),
    )!;
  await ReactTestRenderer.act(() => reset.props.onPress());
  expect(change).toHaveBeenLastCalledWith(null);
  await ReactTestRenderer.act(() => view.unmount());
});

test('explains an unavailable sound in Spanish', async () => {
  info.mockResolvedValue({ available: false, title: null });
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    view = ReactTestRenderer.create(
      <SoundChoice
        mode="alarm"
        value="content://missing"
        onChange={() => {}}
        language="es"
      />,
    );
  });
  expect(
    view.root
      .findAllByType(Text)
      .some(
        node =>
          node.props.children ===
          'Este sonido ya no está disponible. Se usará el sonido predeterminado.',
      ),
  ).toBe(true);
  await ReactTestRenderer.act(() => view.unmount());
});

test('keeps the two choices when changing mode and saves them together', async () => {
  const { MedicineSetup } = require('../src/MedicineSetup');
  const { PillAction } = require('../src/PillAction');
  picker
    .mockResolvedValueOnce('')
    .mockResolvedValueOnce('content://sound/alarm');
  info.mockResolvedValue({ available: true, title: 'Bell' });
  const save = jest.fn();
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    view = ReactTestRenderer.create(
      <MedicineSetup
        language="en"
        onExit={() => {}}
        onSave={save}
        now={new Date(2026, 5, 1, 12)}
        initial={{
          type: 'reminder',
          name: 'Water',
          instructions: '',
          mode: 'notification',
          scheduleKind: 'daily',
          startDate: '2026-06-04',
          endDate: '2026-06-04',
          times: ['18:10'],
        }}
      />,
    );
  });
  const press = async (title: string) => {
    const button =
      view.root
        .findAllByType(PillAction)
        .find(node => node.props.title === title) ??
      view.root.findAll(node => node.props.accessibilityLabel === title)[0];
    await ReactTestRenderer.act(async () => {
      await button.props.onPress();
    });
  };
  await press('Reminder');
  await press('Next');
  await press('Notification sound: Default sound');
  const selectMode = async (label: string) => {
    const radio = view.root.findAll(
      node =>
        node.props.accessibilityRole === 'radio' &&
        node.props.accessibilityLabel === label,
    )[0];
    await ReactTestRenderer.act(() => radio.props.onPress());
  };
  await selectMode('Alarm');
  await press('Alarm sound: Default sound');
  await selectMode('Notification');
  expect(
    view.root.findAll(
      node => node.props.accessibilityLabel === 'Notification sound: Silent',
    ).length,
  ).toBeGreaterThan(0);
  await press('Review');
  await press('Save reminder');
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      notificationSound: '',
      alarmSound: 'content://sound/alarm',
    }),
  );
  await ReactTestRenderer.act(() => view.unmount());
});
