import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import { SoundChoice } from '../src/SoundChoice';
import { MedicineSetup } from '../src/MedicineSetup';
import { PillAction } from '../src/PillAction';

jest.mock('../src/translations/es.json', () => {
  const actual = jest.requireActual('../src/translations/es.json');
  return {
    ...actual,
    sound: { ...actual.sound, alarm: '' },
    setup: {
      ...actual.setup,
      weekdays: ['', ...actual.setup.weekdays.slice(1)],
    },
  };
});

test('shows English when Spanish sound text is missing', async () => {
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    view = ReactTestRenderer.create(
      <SoundChoice
        mode="alarm"
        value={null}
        onChange={() => {}}
        language="es"
      />,
    );
  });
  expect(
    view.root
      .findAllByType(Text)
      .some(text => text.props.children === 'Alarm sound'),
  ).toBe(true);
});

test('shows an English weekday when its Spanish translation is missing', async () => {
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    view = ReactTestRenderer.create(
      <MedicineSetup
        language="es"
        onExit={() => {}}
        onSave={() => {}}
        initial={{
          type: 'medicine',
          name: 'Test',
          instructions: '',
          times: ['09:00'],
          mode: 'notification',
          scheduleKind: 'weekday',
          weekdays: [1],
        }}
      />,
    );
  });
  await ReactTestRenderer.act(() =>
    view.root
      .findAllByType(PillAction)
      .find(button => button.props.title === 'Medicamento')!
      .props.onPress(),
  );
  await ReactTestRenderer.act(() =>
    view.root
      .findAllByType(PillAction)
      .find(button => button.props.title === 'Continuar')!
      .props.onPress(),
  );
  expect(
    view.root
      .findAllByType(Text)
      .some(text => text.props.children === 'Monday'),
  ).toBe(true);
});
