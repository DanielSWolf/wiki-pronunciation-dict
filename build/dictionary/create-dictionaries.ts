import { createDictionary, Dictionary } from './create-dictionary';
import { WordPronunciation } from '../pronunciation-sources.ts/pronunciation-source';
import { createGroupedMap } from '../utils/create-grouped-map';
import { orderBy } from 'lodash';

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
      return distinctWords.size >= minWordCountPerDictionary;
    })
    .map(([language, wordPronunciations]) =>
      createDictionary(language, wordPronunciations),
    )
    .filter((dictionary): dictionary is Dictionary => dictionary !== null);

  return orderBy(
    dictionaries,
    [
      dictionary => (dictionary.language === 'en' ? 0 : 1), // Put English dictionary first
      dictionary => dictionary.data.size, // Sort the rest by descending size
    ],
    ['asc', 'desc'],
  );
}
