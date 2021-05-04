import { Language } from '../language';
import { LanguageLookup } from './language-lookup';
import { languageLookupDe } from './language-lookup-de';
import { languageLookupIt } from './language-lookup-it';

export function getLanguageLookup(
  language: Language,
): LanguageLookup<any, any> | null {
  switch (language) {
    case 'de':
      return languageLookupDe;
    case 'it':
      return languageLookupIt;
    default:
      return null;
  }
}
