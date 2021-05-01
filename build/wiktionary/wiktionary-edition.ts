import { getName } from '@cospired/i18n-iso-languages';

/** A Wiktionary edition */
export enum WiktionaryEdition {
  English = 'en',
  French = 'fr',
  German = 'de',
  Italian = 'it',
}

export function wiktionaryEditionToString(edition: WiktionaryEdition): string {
  return `${getName(edition, 'en')} Wiktionary edition`;
}
