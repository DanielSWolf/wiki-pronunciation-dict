import { Language } from '../language';
import { LanguageLookup } from './language-lookup';

export function getLanguageLookup(
  language: Language,
): LanguageLookup<any, any> | null {
  switch (language) {
    default:
      return null;
  }
}
