import { Language } from '../language';
import { LanguageLookup } from './language-lookup';
import { languageLookupDe } from './language-lookup-de';

export function getLanguageLookup(
  language: Language,
): LanguageLookup<any, any> | null {
  switch (language) {
    case 'de':
      return languageLookupDe;
    default:
      return null;
  }
}
