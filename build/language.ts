import { getName } from '@cospired/i18n-iso-languages';

/** An ISO 639-1 language code */
export type Language = string;

export function getLanguageName(language: Language) {
  return getName(language, 'en') ?? `<${language}>`;
}
