import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Button, Text, TextInput } from 'react-native';
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
          language={language}
          now={new Date(2026, 0, 1, 12)}
          onSave={save}
        />,
      );
    });
    const button = async (title: string) =>
      ReactTestRenderer.act(async () => {
        await view.root
          .findAllByType(Button)
          .find(b => b.props.title === title)!
          .props.onPress();
      });
    await button(type);
    await ReactTestRenderer.act(() =>
      view.root.findAllByType(TextInput)[0].props.onChangeText('Test'),
    );
    await button(next);
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
    await button(review);
    await button(saveLabel);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ scheduleKind: kind, name: 'Test' }),
    );
  },
);
