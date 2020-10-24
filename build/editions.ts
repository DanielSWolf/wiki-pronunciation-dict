import { getName } from '@cospired/i18n-iso-languages';

/** A Wiktionary edition */
export type Edition =  'en' | 'de';

export const editions: Edition[] = [/*'en',*/ 'de'];

export function editionToString(edition: Edition): string {
  return `${getName(edition, 'en')} Wiktionary edition`;
}
