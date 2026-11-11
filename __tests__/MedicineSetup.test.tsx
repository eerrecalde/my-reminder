import { PillAction } from '../src/PillAction';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { BackHandler, Text, TextInput } from 'react-native';
import { MedicineSetup } from '../src/MedicineSetup';

function findAction(view: ReactTestRenderer.ReactTestRenderer, title: string) {
  return (
    view.root
      .findAllByType(PillAction)
      .find(button => button.props.title === title) ??
    view.root.findAll(
      node =>
        node.props.accessibilityRole === 'button' &&
        typeof node.props.accessibilityLabel === 'string' &&
        (node.props.accessibilityLabel === title ||
          node.props.accessibilityLabel.startsWith(`${title}:`)),
    )[0]
  );
}

async function chooseFrequency(
  view: ReactTestRenderer.ReactTestRenderer,
  label: string,
) {
  const selector = view.root.findAll(
    node =>
      node.props.accessibilityRole === 'button' &&
      (node.props.accessibilityLabel?.startsWith('Repeat: ') ||
        node.props.accessibilityLabel?.startsWith('Repetir: ')),
  )[0];
  await ReactTestRenderer.act(() => selector.props.onPress());
  const option = view.root.findAll(
    node =>
      node.props.accessibilityRole === 'radio' &&
      node
        .findAllByType(Text)
        .some(
          text =>
            text.props.children === label ||
            (Array.isArray(text.props.children) &&
              text.props.children.includes(label)),
        ),
  )[0];
  await ReactTestRenderer.act(() => option.props.onPress());
}

test('requires a name and previews three daily reminders before saving', async () => {
  const save = jest.fn();
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    view = ReactTestRenderer.create(
      <MedicineSetup
        onExit={() => {}}
        language="en"
        now={new Date(2026, 5, 1, 12)}
        onSave={save}
        selectTime={async () => '09:00'}
      />,
    );
  });
  const press = async (title: string) => {
    await ReactTestRenderer.act(() => findAction(view, title).props.onPress());
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
  await chooseFrequency(view, 'Every day');
  await press('Select a time');
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
  const selectTime = jest
    .fn()
    .mockResolvedValueOnce('09:00')
    .mockResolvedValueOnce('21:30');
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    view = ReactTestRenderer.create(
      <MedicineSetup
        onExit={() => {}}
        language="en"
        onSave={save}
        selectTime={selectTime}
      />,
    );
  });
  const press = async (title: string) => {
    await ReactTestRenderer.act(async () => {
      await findAction(view, title).props.onPress();
    });
  };
  await press('Medicine');
  await ReactTestRenderer.act(() =>
    view.root.findAllByType(TextInput)[0].props.onChangeText('Aspirin'),
  );
  await press('Next');
  await chooseFrequency(view, 'Every day');
  await press('Select a time');
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
      <MedicineSetup onExit={() => {}} language="es" onSave={jest.fn()} />,
    );
  });
  await ReactTestRenderer.act(() =>
    view.root
      .findAllByType(PillAction)
      .find(button => button.props.title === 'Medicamento')!
      .props.onPress(),
  );
  await ReactTestRenderer.act(() =>
    view.root.findAllByType(TextInput)[0].props.onChangeText('Medicamento'),
  );
  await ReactTestRenderer.act(() =>
    view.root
      .findAllByType(PillAction)
      .find(button => button.props.title === 'Continuar')!
      .props.onPress(),
  );
  await chooseFrequency(view, 'Todos los días');
  expect(
    view.root.findAllByProps({
      accessibilityRole: 'button',
      accessibilityLabel: 'Elegir una hora',
    }).length > 0,
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
      <MedicineSetup
        onExit={() => {}}
        language="en"
        onSave={save}
        now={new Date(2026, 5, 1, 8)}
        selectTime={async () => '09:00'}
      />,
    );
  });
  await ReactTestRenderer.act(() =>
    view.root
      .findAllByType(PillAction)
      .find(button => button.props.title === 'Medicine')!
      .props.onPress(),
  );
  await ReactTestRenderer.act(() =>
    view.root.findAllByType(TextInput)[0].props.onChangeText('Aspirin'),
  );
  const press = (title: string) =>
    view.root
      .findAllByType(PillAction)
      .find(button => button.props.title === title)!
      .props.onPress();
  await ReactTestRenderer.act(() => press('Next'));
  await ReactTestRenderer.act(async () =>
    findAction(view, 'Select a time').props.onPress(),
  );
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
      <MedicineSetup
        onExit={() => {}}
        language="en"
        onSave={save}
        now={new Date(2026, 5, 1, 8)}
        selectTime={async () => '09:00'}
      />,
    );
  });
  const press = async (title: string) => {
    await ReactTestRenderer.act(() => findAction(view, title).props.onPress());
  };
  await press('Reminder');
  expect(view.root.findAllByType(TextInput)).toHaveLength(1);
  await ReactTestRenderer.act(() =>
    view.root.findByType(TextInput).props.onChangeText('Water'),
  );
  await press('Next');
  await press('Select a time');
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
        <MedicineSetup
          onExit={() => {}}
          language="en"
          onSave={save}
          now={new Date(2026, 5, 1, 8)}
          selectTime={async () => '09:00'}
        />,
      );
    });
    const press = async (title: string) => {
      await ReactTestRenderer.act(() =>
        view.root
          .findAllByType(PillAction)
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
    await ReactTestRenderer.act(async () =>
      findAction(view, 'Select a time').props.onPress(),
    );
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
        onExit={() => {}}
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
        .findAllByType(PillAction)
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

test.each([
  [
    'en',
    'Reminder',
    'Next',
    'Set end date',
    'Review',
    'Final reminder',
    'Save reminder',
  ],
  [
    'es',
    'Medicamento',
    'Continuar',
    'Elegir fecha de fin',
    'Revisar',
    'Último recordatorio',
    'Guardar medicamento',
  ],
] as const)(
  'selects and previews an inclusive end date in %s',
  async (language, type, next, setEnd, review, finalLabel, saveLabel) => {
    const save = jest.fn();
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      view = ReactTestRenderer.create(
        <MedicineSetup
          onExit={() => {}}
          language={language}
          now={new Date(2026, 5, 1, 12)}
          onSave={save}
          selectTime={async () => '09:00'}
          selectDate={async () => '2026-06-03'}
        />,
      );
    });
    const press = async (title: string) => {
      await ReactTestRenderer.act(async () => {
        await findAction(view, title).props.onPress();
      });
    };
    await press(type);
    await ReactTestRenderer.act(() =>
      view.root.findAllByType(TextInput)[0].props.onChangeText('Example'),
    );
    await press(next);
    await chooseFrequency(
      view,
      language === 'en' ? 'Every day' : 'Todos los días',
    );
    await press(setEnd);
    await press(language === 'en' ? 'Select a time' : 'Elegir una hora');
    await press(review);
    expect(
      view.root
        .findAllByType(Text)
        .some(text => text.props.children === finalLabel),
    ).toBe(true);
    await press(saveLabel);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: '2026-06-01',
        endDate: '2026-06-03',
      }),
    );
  },
);

test.each([
  ['en', 'Medicine', 'Next', 'Review', 'Back'],
  ['es', 'Medicamento', 'Continuar', 'Revisar', 'Volver'],
])(
  'back moves through setup and preserves the name in %s',
  async (language, type, next, review, back) => {
    const exit = jest.fn();
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      view = ReactTestRenderer.create(
        <MedicineSetup
          language={language as 'en' | 'es'}
          onExit={exit}
          onSave={jest.fn()}
          now={new Date(2026, 5, 1, 8)}
          selectTime={async () => '09:00'}
        />,
      );
    });
    const pressAction = (title: string) =>
      ReactTestRenderer.act(() => findAction(view, title).props.onPress());
    const pressBack = () =>
      ReactTestRenderer.act(() =>
        view.root
          .findByProps({
            accessibilityRole: 'button',
            accessibilityLabel: back,
          })
          .props.onPress(),
      );
    await pressAction(type);
    await ReactTestRenderer.act(() =>
      view.root.findAllByType(TextInput)[0].props.onChangeText('Aspirin'),
    );
    await pressAction(next);
    await ReactTestRenderer.act(async () =>
      findAction(
        view,
        language === 'en' ? 'Select a time' : 'Elegir una hora',
      ).props.onPress(),
    );
    await pressAction(review);
    await pressBack();
    await pressBack();
    expect(view.root.findAllByType(TextInput)[0].props.value).toBe('Aspirin');
    expect(exit).not.toHaveBeenCalled();
    await pressBack();
    expect(exit).not.toHaveBeenCalled();
    await pressBack();
    expect(exit).toHaveBeenCalledTimes(1);
    await ReactTestRenderer.act(() => view.unmount());
  },
);

test('system Back moves through setup and exits from the first step', async () => {
  let handler: Parameters<typeof BackHandler.addEventListener>[1] | undefined;
  const remove = jest.fn();
  const listener = jest
    .spyOn(BackHandler, 'addEventListener')
    .mockImplementation((_event, callback) => {
      handler = callback;
      return { remove };
    });
  const exit = jest.fn();
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    view = ReactTestRenderer.create(
      <MedicineSetup language="en" onExit={exit} onSave={jest.fn()} />,
    );
  });
  await ReactTestRenderer.act(() =>
    view.root
      .findAllByType(PillAction)
      .find(button => button.props.title === 'Reminder')!
      .props.onPress(),
  );
  await ReactTestRenderer.act(() => {
    expect(handler!({ type: 'hardwareBackPress', timeStamp: 0 })).toBe(true);
  });
  expect(exit).not.toHaveBeenCalled();
  expect(
    view.root
      .findAllByType(PillAction)
      .some(button => button.props.title === 'Medicine'),
  ).toBe(true);
  await ReactTestRenderer.act(() => {
    expect(handler!({ type: 'hardwareBackPress', timeStamp: 0 })).toBe(true);
  });
  expect(exit).toHaveBeenCalledTimes(1);
  await ReactTestRenderer.act(() => view.unmount());
  expect(remove).toHaveBeenCalled();
  listener.mockRestore();
});

test.each([
  [
    'en',
    'Reminder',
    'Next',
    'Once',
    'Date',
    'Change time',
    'Review',
    'Save reminder',
  ],
  [
    'en',
    'Medicine',
    'Next',
    'Once',
    'Date',
    'Change time',
    'Review',
    'Save medicine',
  ],
  [
    'es',
    'Recordatorio',
    'Continuar',
    'Una vez',
    'Fecha',
    'Cambiar hora',
    'Revisar',
    'Guardar recordatorio',
  ],
  [
    'es',
    'Medicamento',
    'Continuar',
    'Una vez',
    'Fecha',
    'Cambiar hora',
    'Revisar',
    'Guardar medicamento',
  ],
])(
  'creates one future occurrence for %s %s',
  async (
    language,
    type,
    next,
    once,
    dateLabel,
    timeLabel,
    review,
    saveLabel,
  ) => {
    const save = jest.fn();
    const selectDate = jest.fn().mockResolvedValue('2026-06-04');
    const selectTime = jest.fn().mockResolvedValue('18:10');
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      view = ReactTestRenderer.create(
        <MedicineSetup
          onExit={() => {}}
          language={language as 'en' | 'es'}
          now={new Date(2026, 5, 1, 12)}
          onSave={save}
          selectDate={selectDate}
          selectTime={selectTime}
        />,
      );
    });
    const press = async (title: string) =>
      ReactTestRenderer.act(async () => {
        await findAction(view, title).props.onPress();
      });
    await press(type);
    await ReactTestRenderer.act(() =>
      view.root.findAllByType(TextInput)[0].props.onChangeText('Test'),
    );
    await press(next);
    expect(
      findAction(view, language === 'en' ? 'Repeat' : 'Repetir').props
        .accessibilityLabel,
    ).toContain(once);
    await press(dateLabel);
    expect(timeLabel).toBeTruthy();
    await press(language === 'en' ? 'Select a time' : 'Elegir una hora');
    await press(review);
    expect(
      view.root
        .findAllByType(Text)
        .some(
          text =>
            text.props.children ===
            (language === 'en' ? 'Reminder time' : 'Hora del recordatorio'),
        ),
    ).toBe(true);
    await press(saveLabel);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduleKind: 'daily',
        startDate: '2026-06-04',
        endDate: '2026-06-04',
        times: ['18:10'],
        type:
          type === 'Medicine' || type === 'Medicamento'
            ? 'medicine'
            : 'reminder',
      }),
    );
    await ReactTestRenderer.act(() => view.unmount());
  },
);

test('a one-off reminder in the past cannot be reviewed or saved', async () => {
  const save = jest.fn();
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    view = ReactTestRenderer.create(
      <MedicineSetup
        onExit={() => {}}
        language="en"
        now={new Date(2026, 5, 1, 12)}
        onSave={save}
        selectDate={async () => '2026-06-01'}
        selectTime={async () => '09:00'}
      />,
    );
  });
  const press = (title: string) =>
    ReactTestRenderer.act(() => findAction(view, title).props.onPress());
  await press('Reminder');
  await ReactTestRenderer.act(() =>
    view.root.findByType(TextInput).props.onChangeText('Test'),
  );
  await press('Next');
  await press('Date');
  await press('Select a time');
  await press('Review');
  expect(
    view.root
      .findAllByType(Text)
      .some(text => text.props.children === 'Choose a future date and time.'),
  ).toBe(true);
  expect(save).not.toHaveBeenCalled();
  await ReactTestRenderer.act(() => view.unmount());
});

test('editing a saved one-off shows Once and preserves its date and time', async () => {
  const save = jest.fn();
  let view!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    view = ReactTestRenderer.create(
      <MedicineSetup
        onExit={() => {}}
        language="en"
        now={new Date(2026, 5, 1, 12)}
        onSave={save}
        initial={{
          type: 'reminder',
          name: 'Visit',
          instructions: '',
          mode: 'alarm',
          scheduleKind: 'daily',
          startDate: '2026-06-04',
          endDate: '2026-06-04',
          times: ['18:10'],
        }}
      />,
    );
  });
  const press = (title: string) =>
    ReactTestRenderer.act(() => findAction(view, title).props.onPress());
  await press('Reminder');
  await press('Next');
  expect(findAction(view, 'Repeat').props.accessibilityLabel).toBe(
    'Repeat: Once',
  );
  await press('Review');
  await press('Save reminder');
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      mode: 'alarm',
      startDate: '2026-06-04',
      endDate: '2026-06-04',
      times: ['18:10'],
    }),
  );
  await ReactTestRenderer.act(() => view.unmount());
});

test.each([
  [
    'en',
    'Reminder',
    'Next',
    'Change time',
    'Remove time',
    'Review',
    'Save reminder',
  ],
  [
    'es',
    'Recordatorio',
    'Continuar',
    'Cambiar hora',
    'Quitar hora',
    'Revisar',
    'Guardar recordatorio',
  ],
])(
  'changes and removes the intended daily time in %s',
  async (language, type, next, change, remove, review, saveLabel) => {
    const save = jest.fn();
    const selectTime = jest.fn().mockResolvedValue('10:30');
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      view = ReactTestRenderer.create(
        <MedicineSetup
          onExit={() => {}}
          language={language as 'en' | 'es'}
          now={new Date(2026, 5, 1, 8)}
          onSave={save}
          selectTime={selectTime}
          initial={{
            type: 'reminder',
            name: 'Water',
            instructions: '',
            mode: 'notification',
            times: ['09:00', '21:00'],
          }}
        />,
      );
    });
    const press = (title: string) =>
      ReactTestRenderer.act(() =>
        view.root
          .findAllByType(PillAction)
          .find(button => button.props.title === title)!
          .props.onPress(),
      );
    const field = (label: string) =>
      view.root.findAll(
        node =>
          node.props.accessibilityRole === 'button' &&
          node.props.accessibilityLabel === label,
      )[0];
    await press(type);
    await press(next);
    await ReactTestRenderer.act(async () => {
      await field(`${change}: 09:00`).props.onPress();
    });
    expect(selectTime).toHaveBeenCalledWith('09:00');
    expect(field(`${change}: 10:30`)).toBeDefined();
    await ReactTestRenderer.act(() =>
      field(`${remove}: 21:00`).props.onPress(),
    );
    expect(
      view.root.findAll(
        node =>
          node.props.accessibilityRole === 'button' &&
          node.props.accessibilityLabel === `${remove}: 10:30`,
      ),
    ).toHaveLength(0);
    await press(review);
    await press(saveLabel);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ times: ['10:30'] }),
    );
    await ReactTestRenderer.act(() => view.unmount());
  },
);

test.each([
  [
    'en',
    'Reminder',
    'Next',
    'Once',
    'Review',
    'Select a time for this reminder.',
  ],
  [
    'en',
    'Medicine',
    'Next',
    'Every day',
    'Review',
    'Select a time for this reminder.',
  ],
  [
    'en',
    'Reminder',
    'Next',
    'Every X hours',
    'Review',
    'Select a time for this reminder.',
  ],
  [
    'es',
    'Recordatorio',
    'Continuar',
    'Una vez',
    'Revisar',
    'Elige una hora para este recordatorio.',
  ],
  [
    'es',
    'Medicamento',
    'Continuar',
    'Todos los días',
    'Revisar',
    'Elige una hora para este recordatorio.',
  ],
  [
    'es',
    'Recordatorio',
    'Continuar',
    'Cada X horas',
    'Revisar',
    'Elige una hora para este recordatorio.',
  ],
] as const)(
  '%s %s requires an explicitly selected time for %s',
  async (language, type, next, frequency, review, message) => {
    const save = jest.fn();
    let view!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      view = ReactTestRenderer.create(
        <MedicineSetup
          language={language}
          onExit={() => {}}
          onSave={save}
          selectTime={async () => null}
        />,
      );
    });
    const press = async (title: string) =>
      ReactTestRenderer.act(async () =>
        findAction(view, title).props.onPress(),
      );
    await press(type);
    await ReactTestRenderer.act(() =>
      view.root.findAllByType(TextInput)[0].props.onChangeText('Example'),
    );
    await press(next);
    if (frequency !== 'Once' && frequency !== 'Una vez')
      await chooseFrequency(view, frequency);
    await press(review);
    expect(
      view.root
        .findAllByType(Text)
        .some(node => node.props.children === message),
    ).toBe(true);
    const timeField = view.root.findAll(
      node =>
        node.props.accessibilityRole === 'button' &&
        typeof node.props.accessibilityLabel === 'string' &&
        (node.props.accessibilityLabel.includes('Select a time') ||
          node.props.accessibilityLabel.includes('Elegir una hora')),
    )[0];
    await ReactTestRenderer.act(async () => timeField.props.onPress());
    await press(review);
    expect(
      view.root
        .findAllByType(Text)
        .some(node => node.props.children === message),
    ).toBe(true);
    expect(save).not.toHaveBeenCalled();
    await ReactTestRenderer.act(() => view.unmount());
  },
);
