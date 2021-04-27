import { log } from '../issue-logging';
import { Language } from '../language';
import { WordPronunciation } from '../pronunciation-sources.ts/pronunciation-source';
import { getPhoibleData } from './phoible';
import { LanguageLookup } from '../languages/language-lookup';
import { getLanguageLookup } from '../languages/get-language-lookup';
import { MissingLanguageLookupIssue } from './issues/missing-language-lookup-issue';
import { normalizeWordPronunciation } from './normalization';
import { DefaultMap } from '../utils/default-map';
import { englishCollator, getCollator } from '../utils/collation';
import { sortMap } from '../utils/sort-map';

export type Dictionary =
  | (RawDictionary & Partial<Record<keyof NormalizedDictionary, undefined>>)
  | (RawDictionary & NormalizedDictionary);

interface RawDictionary {
  language: Language;

  /** Original pronunciations by original word spellings */
  rawData: DictionaryData;
}

interface NormalizedDictionary {
  /** Normalized pronunciations by normalized word spellings */
  data: DictionaryData;

  /** Information about the language. */
  languageLookup: LanguageLookup<any, any>;
}

export type DictionaryData = Map<string, string[]>;

export async function createDictionary(
  language: Language,
  wordPronunciations: WordPronunciation[],
): Promise<Dictionary> {
  const rawData = getData(wordPronunciations, language, wordPronunciation => [
    wordPronunciation,
  ]);

  const languageLookup = getLanguageLookup(language);
  if (languageLookup === null) {
    const phoibleData = await getPhoibleData();
    log(
      new MissingLanguageLookupIssue(language, wordPronunciations, phoibleData),
    );
    return { language, rawData };
  }

  const data = getData(wordPronunciations, language, wordPronunciation =>
    normalizeWordPronunciation(wordPronunciation, languageLookup),
  );
  return { language, rawData, data, languageLookup };
}

function getData(
  wordPronunciations: WordPronunciation[],
  language: Language,
  normalize: (wordPronunciation: WordPronunciation) => WordPronunciation[],
): Map<string, string[]> {
  // Group normalized pronunciations by word
  const pronunciationsByWord = new DefaultMap<string, Set<string>>(
    () => new Set(),
  );
  for (const wordPronunciation of wordPronunciations) {
    const normalizedWordPronunciations = normalize(wordPronunciation);
    for (const normalizedWordPronunciation of normalizedWordPronunciations) {
      pronunciationsByWord
        .getOrCreate(normalizedWordPronunciation.word)
        .add(normalizedWordPronunciation.pronunciation);
    }
  }

  // Sort by word
  const languageCollator = getCollator(language);
  sortMap(pronunciationsByWord, (a, b) => languageCollator.compare(a[0], b[0]));

  // Sort pronunciations
  return new Map(
    [...pronunciationsByWord].map(([word, pronunciations]) => [
      word,
      [...pronunciations].sort(englishCollator.compare),
    ]),
  );
}
