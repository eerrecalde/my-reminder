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
  await press('Medicine');
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
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'medicine',
      mode: 'notification',
      name: 'Aspirin',
      instructions: '',
      times: ['09:00'],
    }),
  );
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
  await press('Medicine');
  await ReactTestRenderer.act(() =>
    view.root.findAllByType(TextInput)[0].props.onChangeText('Aspirin'),
  );
  await press('Next');
  await press('Add a time');
  await press('Review');
  await press('Save medicine');
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'medicine',
      mode: 'notification',
      name: 'Aspirin',
      instructions: '',
      times: ['09:00', '21:30'],
    }),
  );
});

test('shows the schedule controls in Spanish', async () => {
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    view = ReactTestRenderer.create(
      <MedicineSetup language="es" onSave={jest.fn()} />,
    );
  });
  await ReactTestRenderer.act(() =>
    view.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Medicamento')!
      .props.onPress(),
  );
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
  const alarm = view.root.findAll(
    option =>
      option.props.accessibilityRole === 'radio' &&
      option.props.accessibilityLabel === 'Alarma',
  )[0];
  await ReactTestRenderer.act(() => alarm.props.onPress());
  expect(
    view.root.findAll(
      option =>
        option.props.accessibilityRole === 'radio' &&
        option.props.accessibilityLabel === 'Alarma',
    )[0].props.accessibilityState.checked,
  ).toBe(true);
});

test('ignores repeated saves until the first save completes', async () => {
  let finish!: () => void;
  const pending = new Promise<void>(resolve => {
    finish = resolve;
  });
  const save = jest.fn().mockReturnValue(pending);
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    view = ReactTestRenderer.create(
      <MedicineSetup language="en" onSave={save} />,
    );
  });
  await ReactTestRenderer.act(() =>
    view.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Medicine')!
      .props.onPress(),
  );
  await ReactTestRenderer.act(() =>
    view.root.findAllByType(TextInput)[0].props.onChangeText('Aspirin'),
  );
  const press = (title: string) =>
    view.root
      .findAllByType(Button)
      .find(button => button.props.title === title)!
      .props.onPress();
  await ReactTestRenderer.act(() => press('Next'));
  await ReactTestRenderer.act(() => press('Review'));
  await ReactTestRenderer.act(() => {
    press('Save medicine');
    press('Save medicine');
  });
  expect(save).toHaveBeenCalledTimes(1);
  await ReactTestRenderer.act(async () => {
    finish();
    await pending;
  });
});

test('creates a reminder without medicine instructions', async () => {
  const save = jest.fn();
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    view = ReactTestRenderer.create(
      <MedicineSetup language="en" onSave={save} />,
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
  await press('Reminder');
  expect(view.root.findAllByType(TextInput)).toHaveLength(1);
  await ReactTestRenderer.act(() =>
    view.root.findByType(TextInput).props.onChangeText('Water'),
  );
  await press('Next');
  await press('Review');
  expect(
    view.root
      .findAllByType(Text)
      .some(text => text.props.children === 'Reminder'),
  ).toBe(true);
  await press('Save reminder');
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'reminder',
      mode: 'notification',
      name: 'Water',
      instructions: '',
      times: ['09:00'],
    }),
  );
});

test.each(['Reminder', 'Medicine'])(
  'selects and reviews alarm for %s',
  async type => {
    const save = jest.fn();
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      view = ReactTestRenderer.create(
        <MedicineSetup language="en" onSave={save} />,
      );
    });
    const press = async (title: string) => {
      await ReactTestRenderer.act(() =>
        view.root
          .findAllByType(Button)
          .find(b => b.props.title === title)!
          .props.onPress(),
      );
    };
    await press(type);
    await ReactTestRenderer.act(() =>
      view.root.findAllByType(TextInput)[0].props.onChangeText('Test'),
    );
    await press('Next');
    await ReactTestRenderer.act(() =>
      view.root
        .findAll(
          option =>
            option.props.accessibilityRole === 'radio' &&
            option.props.accessibilityLabel === 'Alarm',
        )[0]
        .props.onPress(),
    );
    expect(
      view.root.findAll(
        option =>
          option.props.accessibilityRole === 'radio' &&
          option.props.accessibilityLabel === 'Alarm',
      )[0].props.accessibilityState.checked,
    ).toBe(true);
    await press('Review');
    expect(
      view.root
        .findAllByType(Text)
        .some(t => t.props.children === 'Reminder: Alarm'),
    ).toBe(true);
    await press(type === 'Medicine' ? 'Save medicine' : 'Save reminder');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'alarm' }),
    );
  },
);

test('editing preserves dosage instructions when changing medicine to reminder', async () => {
  const save = jest.fn();
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    view = ReactTestRenderer.create(
      <MedicineSetup
        language="en"
        onSave={save}
        initial={{
          type: 'medicine',
          name: 'Aspirin',
          instructions: 'With food',
          times: ['09:00'],
          mode: 'alarm',
        }}
      />,
    );
  });
  const press = async (title: string) =>
    ReactTestRenderer.act(() =>
      view.root
        .findAllByType(Button)
        .find(b => b.props.title === title)!
        .props.onPress(),
    );
  await press('Reminder');
  await press('Next');
  await press('Review');
  await press('Save reminder');
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'reminder',
      name: 'Aspirin',
      instructions: 'With food',
      times: ['09:00'],
      mode: 'alarm',
    }),
  );
});
