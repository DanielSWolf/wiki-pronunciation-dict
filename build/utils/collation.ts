import { Language } from '../language';

export const englishCollator = new Intl.Collator('en');

export function getCollator(language: Language): Intl.Collator {
  return new Intl.Collator(language);
}
