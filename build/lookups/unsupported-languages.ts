import { Language } from '../language';

export const unsupportedLanguages: Language[] = [
  // Dead languages
  'la', // Latin

  // Obsolete language codes
  'sh', // Serbo-Croatian

  // Languages with too many graphemes
  'ja', // Japanese
  'zh', // Chinese
  'ko', // Korean
];
