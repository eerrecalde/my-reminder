import en from './en.json';
import es from './es.json';

// Keep English as the fallback for any untranslated entries.
export const translations = {
  en,
  es: {
    ...en,
    ...es,
    app: { ...en.app, ...es.app },
    setup: { ...en.setup, ...es.setup },
    sound: { ...en.sound, ...es.sound },
    android: { ...en.android, ...es.android },
  },
};
