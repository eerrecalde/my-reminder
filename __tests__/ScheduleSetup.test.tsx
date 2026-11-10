import { PillAction } from '../src/PillAction';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text, TextInput } from 'react-native';
import { MedicineSetup } from '../src/MedicineSetup';

test.each([
  [
    'en',
    'Reminder',
    'Next',
    'Selected weekdays',
    'Review',
    'Save reminder',
    'weekday',
  ],
  [
    'es',
    'Recordatorio',
    'Continuar',
    'Días de la semana',
    'Revisar',
    'Guardar recordatorio',
    'weekday',
  ],
  [
    'en',
    'Medicine',
    'Next',
    'Every X hours',
    'Review',
    'Save medicine',
    'interval',
  ],
  [
    'es',
    'Medicamento',
    'Continuar',
    'Cada X horas',
    'Revisar',
    'Guardar medicamento',
    'interval',
  ],
  ['en', 'Reminder', 'Next', 'Monthly', 'Review', 'Save reminder', 'monthly'],
  [
    'es',
    'Recordatorio',
    'Continuar',
    'Mensual',
    'Revisar',
    'Guardar recordatorio',
    'monthly',
  ],
] as const)(
  '%s can create %s with %s schedule',
  async (language, type, next, label, review, saveLabel, kind) => {
    const save = jest.fn();
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      view = ReactTestRenderer.create(
        <MedicineSetup
          onExit={() => {}}
          language={language}
          now={new Date(2026, 0, 1, 12)}
          onSave={save}
          selectTime={async () => '09:00'}
        />,
      );
    });
    const button = async (title: string) =>
      ReactTestRenderer.act(async () => {
        await view.root
          .findAllByType(PillAction)
          .find(b => b.props.title === title)!
          .props.onPress();
      });
    await button(type);
    await ReactTestRenderer.act(() =>
      view.root.findAllByType(TextInput)[0].props.onChangeText('Test'),
    );
    await button(next);
    await ReactTestRenderer.act(() =>
      view.root
        .findAll(
          node =>
            node.props.accessibilityRole === 'button' &&
            node.props.accessibilityState?.expanded === false,
        )[0]
        .props.onPress(),
    );
    const option = view.root.findAll(
      node =>
        node.props.accessibilityRole === 'radio' &&
        node
          .findAllByType(Text)
          .some(
            t =>
              Array.isArray(t.props.children) &&
              t.props.children.includes(label),
          ),
    )[0];
    expect(option).toBeDefined();
    await ReactTestRenderer.act(() => option!.props.onPress());
    await ReactTestRenderer.act(async () => {
      const action = view.root.findAll(
        node =>
          node.props.accessibilityRole === 'button' &&
          typeof node.props.accessibilityLabel === 'string' &&
          (node.props.accessibilityLabel.includes('Select a time') ||
            node.props.accessibilityLabel.includes('Elegir una hora')),
      )[0];
      await action.props.onPress();
    });
    await button(review);
    await button(saveLabel);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ scheduleKind: kind, name: 'Test' }),
    );
  },
);

test('discarding invalid interval and monthly settings allows another schedule to be saved', async () => {
  const save = jest.fn();
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    view = ReactTestRenderer.create(
      <MedicineSetup
        onExit={() => {}}
        language="en"
        now={new Date(2026, 0, 1)}
        onSave={save}
        selectTime={async () => '09:00'}
      />,
    );
  });
  const button = async (title: string) =>
    ReactTestRenderer.act(async () => {
      await view.root
        .findAllByType(PillAction)
        .find(b => b.props.title === title)!
        .props.onPress();
    });
  const choose = async (label: string) => {
    await ReactTestRenderer.act(() =>
      view.root
        .findAll(
          node =>
            node.props.accessibilityRole === 'button' &&
            node.props.accessibilityState?.expanded === false,
        )[0]
        .props.onPress(),
    );
    await ReactTestRenderer.act(() =>
      view.root
        .findAll(
          node =>
            node.props.accessibilityRole === 'radio' &&
            node
              .findAllByType(Text)
              .some(
                t =>
                  Array.isArray(t.props.children) &&
                  t.props.children.includes(label),
              ),
        )[0]
        .props.onPress(),
    );
  };
  await button('Reminder');
  await ReactTestRenderer.act(() =>
    view.root.findAllByType(TextInput)[0].props.onChangeText('Water'),
  );
  await button('Next');
  await choose('Every X hours');
  await ReactTestRenderer.act(() =>
    view.root
      .findAllByType(TextInput)
      .find(
        input => input.props.accessibilityLabel === 'Hours between reminders',
      )!
      .props.onChangeText(''),
  );
  await choose('Monthly');
  await ReactTestRenderer.act(() =>
    view.root
      .findAllByType(TextInput)
      .find(input => input.props.accessibilityLabel === 'Day of month (1–31)')!
      .props.onChangeText('99'),
  );
  await choose('Every day');
  await ReactTestRenderer.act(async () =>
    view.root
      .findAll(node => node.props.accessibilityLabel === 'Select a time')[0]
      .props.onPress(),
  );
  await button('Review');
  await button('Save reminder');
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      scheduleKind: 'daily',
      intervalHours: null,
      intervalAnchor: null,
      monthlyDay: null,
    }),
  );
});
