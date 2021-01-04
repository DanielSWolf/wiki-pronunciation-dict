import { getName } from '@cospired/i18n-iso-languages';

/** A Wiktionary edition */
export enum WiktionaryEdition {
  English = 'en',
  German = 'de',
}

export function wiktionaryEditionToString(edition: WiktionaryEdition): string {
  return `${getName(edition, 'en')} Wiktionary edition`;
}
