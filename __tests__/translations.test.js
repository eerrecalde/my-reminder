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
