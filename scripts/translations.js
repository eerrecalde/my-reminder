const fs = require('fs');
const en = require('../src/translations/en.json');
const es = require('../src/translations/es.json');

function missing(reference, translated, path = '') {
  return Object.keys(reference).flatMap(key => {
    const name = path ? `${path}.${key}` : key;
    if (translated?.[key] == null || translated[key] === '') return [name];
    if (typeof reference[key] === 'object' && reference[key] !== null) {
      return missing(reference[key], translated[key], name);
    }
    return [];
  });
}
const absent = missing(en, es);
if (absent.length) {
  console.error(`Missing Spanish translations: ${absent.join(', ')}`);
  process.exitCode = 1;
}
for (const [language, data, path] of [
  ['English', en, 'android/app/src/main/res/values/strings.xml'],
  ['Spanish', es, 'android/app/src/main/res/values-es/strings.xml'],
]) {
  const escape = value =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"');
  const content =
    '<resources>\n' +
    Object.entries(data.android)
      .filter(([, value]) => value != null && value !== '')
      .map(
        ([key, value]) =>
          `    <string name="${key}">${escape(value)}</string>\n`,
      )
      .join('') +
    '</resources>\n';
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(path) || fs.readFileSync(path, 'utf8') !== content) {
      console.error(
        `${language} Android resources are out of date; run npm run translations:generate`,
      );
      process.exitCode = 1;
    }
  } else fs.writeFileSync(path, content);
}
