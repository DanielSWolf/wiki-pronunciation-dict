import { createDictionary, Dictionary } from './create-dictionary';
import { WordPronunciation } from '../pronunciation-sources.ts/pronunciation-source';
import { createGroupedMap } from '../utils/create-grouped-map';
import { orderBy } from 'lodash';
import { isNotNullish } from '../utils/is-not-nullish';
import { unsupportedLanguages } from '../lookups/unsupported-languages';
import { nodeSupportsLanguage } from '../utils/i18n';
import { log } from '../issue-logging';
import { LanguageNotSupportedByNodeIssue } from './dictionary-creation-issues';

const minWordCountPerDictionary = 10000;

export function createDictionaries(
  wordPronunciations: WordPronunciation[],
): Dictionary[] {
  const wordPronunciationsByLanguage = createGroupedMap(
    wordPronunciations,
    wordPronunciation => wordPronunciation.language,
  );
  const dictionaries = [...wordPronunciationsByLanguage]
    .filter(([language, wordPronunciations]) => {
      const distinctWords = new Set(
        wordPronunciations.map(wordPronunciation => wordPronunciation.word),
      );
      // Omit languages with too few words
      if (distinctWords.size < minWordCountPerDictionary) return false;

      // Omit unsupported languages
      if (unsupportedLanguages.includes(language)) return false;

      // Omit languages with unsupported language code
      if (!nodeSupportsLanguage(language)) {
        log(new LanguageNotSupportedByNodeIssue(language));
        return false;
      }

      return true;
    })
    .map(([language, wordPronunciations]) =>
      createDictionary(language, wordPronunciations),
    )
    .filter(isNotNullish);

  return orderBy(
    dictionaries,
    [
      dictionary => (dictionary.metadata.language === 'en' ? 0 : 1), // Put English dictionary first
      dictionary => dictionary.data.size, // Sort the rest by descending size
    ],
    ['asc', 'desc'],
  );
}
