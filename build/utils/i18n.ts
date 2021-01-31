import { Language } from '../language';

/**
 * Indicates whether the specified language is supported by Node for collation and locale-aware case
 * transformation.
 */
export function nodeSupportsLanguage(language: Language) {
  const supportedForCollation = Intl.Collator.supportedLocalesOf(
    language,
  ).some(supportedLocale => supportedLocale.startsWith(language));
  if (!supportedForCollation) return false;

  try {
    ''.toLocaleLowerCase(language);
  } catch {
    return false;
  }

  return true;
}
