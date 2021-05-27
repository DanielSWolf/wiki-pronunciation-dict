import { Language } from '../language';
import { LanguageLookup } from './language-lookup';
import { languageLookupDe } from './language-lookup-de';
import { languageLookupEn } from './language-lookup-en';
import { languageLookupFr } from './language-lookup-fr';
import { languageLookupIt } from './language-lookup-it';

export function getLanguageLookup(
  language: Language,
): LanguageLookup<any, any> | null {
  switch (language) {
    case 'de':
      return languageLookupDe;
    case 'en':
      return languageLookupEn;
    case 'it':
      return languageLookupIt;
    case 'fr':
      return languageLookupFr;
    default:
      return null;
  }
}
