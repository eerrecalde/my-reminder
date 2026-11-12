import en from './en.json';
import es from './es.json';

function withFallback(reference: unknown, translated: unknown): unknown {
  if (Array.isArray(reference)) {
    return reference.map((value, index) =>
      withFallback(
        value,
        Array.isArray(translated) ? translated[index] : undefined,
      ),
    );
  }
  if (reference && typeof reference === 'object') {
    const entries = Object.entries(reference).map(([key, value]) => [
      key,
      withFallback(
        value,
        (translated as Record<string, unknown> | null)?.[key],
      ),
    ]);
    return Object.fromEntries(entries);
  }
  return translated == null || translated === '' ? reference : translated;
}

export const translations = {
  en,
  es: withFallback(en, es) as typeof en,
};
