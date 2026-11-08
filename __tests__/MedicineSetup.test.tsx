import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Button, Text, TextInput } from 'react-native';
import { MedicineSetup } from '../src/MedicineSetup';

test('requires a name and previews three daily reminders before saving', async () => {
  const save = jest.fn();
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    view = ReactTestRenderer.create(
      <MedicineSetup
        language="en"
        now={new Date(2026, 5, 1, 12)}
        onSave={save}
      />,
    );
  });
  const press = async (title: string) => {
    await ReactTestRenderer.act(() =>
      view.root
        .findAllByType(Button)
        .find(button => button.props.title === title)!
        .props.onPress(),
    );
  };
  await press('Next');
  expect(
    view.root
      .findAllByType(Text)
      .some(text => text.props.children === 'Enter a medicine name'),
  ).toBe(true);
  await ReactTestRenderer.act(() =>
    view.root.findAllByType(TextInput)[0].props.onChangeText('Aspirin'),
  );
  await press('Next');
  await press('Review');
  expect(
    view.root
      .findAllByType(Text)
      .some(text => text.props.children === 'Next three reminders'),
  ).toBe(true);
  await press('Save medicine');
  expect(save).toHaveBeenCalledWith({
    name: 'Aspirin',
    instructions: '',
    times: ['09:00'],
  });
});

test('lets the user add a second daily time using the time selector', async () => {
  const save = jest.fn();
  const selectTime = jest.fn().mockResolvedValue('21:30');
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    view = ReactTestRenderer.create(
      <MedicineSetup language="en" onSave={save} selectTime={selectTime} />,
    );
  });
  const press = async (title: string) => {
    await ReactTestRenderer.act(async () => {
      await view.root
        .findAllByType(Button)
        .find(button => button.props.title === title)!
        .props.onPress();
    });
  };
  await ReactTestRenderer.act(() =>
    view.root.findAllByType(TextInput)[0].props.onChangeText('Aspirin'),
  );
  await press('Next');
  await press('Add a time');
  await press('Review');
  await press('Save medicine');
  expect(save).toHaveBeenCalledWith({
    name: 'Aspirin',
    instructions: '',
    times: ['09:00', '21:30'],
  });
});

test('shows the schedule controls in Spanish', async () => {
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    view = ReactTestRenderer.create(
      <MedicineSetup language="es" onSave={jest.fn()} />,
    );
  });
  await ReactTestRenderer.act(() =>
    view.root.findAllByType(TextInput)[0].props.onChangeText('Medicamento'),
  );
  await ReactTestRenderer.act(() =>
    view.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Continuar')!
      .props.onPress(),
  );
  expect(
    view.root
      .findAllByType(Button)
      .some(button => button.props.title === 'Agregar una hora'),
  ).toBe(true);
  expect(
    view.root
      .findAllByType(Text)
      .some(text => text.props.children === 'Recordatorio: Notificación'),
  ).toBe(true);
});
