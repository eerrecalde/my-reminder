const fs = require('fs');
const { execFileSync } = require('child_process');

test('Android resources match complete English and Spanish translations', () => {
  execFileSync('node', ['scripts/translations.js', '--check'], {
    stdio: 'pipe',
  });
  const english = fs.readFileSync(
    'android/app/src/main/res/values/strings.xml',
    'utf8',
  );
  const spanish = fs.readFileSync(
    'android/app/src/main/res/values-es/strings.xml',
    'utf8',
  );
  expect(english).toContain('Your medicine is due');
  expect(english).toContain('Your reminder is due');
  expect(spanish).toContain('Es hora de tomar tu medicamento');
  expect(spanish).toContain('Es hora de tu recordatorio');
  expect(spanish).toContain('Posponer 10 minutos');
});

test('completeness check identifies missing weekday translations', () => {
  const os = require('os');
  const path = require('path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'translations-'));
  try {
    fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'src/translations'), { recursive: true });
    fs.copyFileSync(
      'scripts/translations.js',
      path.join(dir, 'scripts/translations.js'),
    );
    fs.copyFileSync(
      'src/translations/en.json',
      path.join(dir, 'src/translations/en.json'),
    );
    const es = JSON.parse(fs.readFileSync('src/translations/es.json', 'utf8'));
    es.app.weekdays[2] = '';
    fs.writeFileSync(
      path.join(dir, 'src/translations/es.json'),
      JSON.stringify(es),
    );
    expect(() =>
      execFileSync('node', ['scripts/translations.js', '--check'], {
        cwd: dir,
        stdio: 'pipe',
      }),
    ).toThrow(/app.weekdays.2/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('generation omits missing Spanish resources so Android can use English', () => {
  const os = require('os');
  const path = require('path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'translations-'));
  try {
    for (const folder of [
      'scripts',
      'src/translations',
      'android/app/src/main/res/values',
      'android/app/src/main/res/values-es',
    ])
      fs.mkdirSync(path.join(dir, folder), { recursive: true });
    fs.copyFileSync(
      'scripts/translations.js',
      path.join(dir, 'scripts/translations.js'),
    );
    fs.copyFileSync(
      'src/translations/en.json',
      path.join(dir, 'src/translations/en.json'),
    );
    const es = JSON.parse(fs.readFileSync('src/translations/es.json', 'utf8'));
    es.android.reminder_due = '';
    fs.writeFileSync(
      path.join(dir, 'src/translations/es.json'),
      JSON.stringify(es),
    );
    expect(() =>
      execFileSync('node', ['scripts/translations.js'], {
        cwd: dir,
        stdio: 'pipe',
      }),
    ).toThrow(/android.reminder_due/);
    expect(
      fs.readFileSync(
        path.join(dir, 'android/app/src/main/res/values-es/strings.xml'),
        'utf8',
      ),
    ).not.toContain('name="reminder_due"');
    expect(
      fs.readFileSync(
        path.join(dir, 'android/app/src/main/res/values/strings.xml'),
        'utf8',
      ),
    ).toContain('Your medicine is due');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
