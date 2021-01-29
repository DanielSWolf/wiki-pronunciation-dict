import { orderBy } from 'lodash';
import { Language } from './language';
import { WordPronunciation } from './pronunciation-sources.ts/pronunciation-source';
import { DefaultMap } from './utils/default-map';

export type MultiLangDictionary = ReadonlyMap<Language, SingleLangDictionary>;

export type SingleLangDictionary = ReadonlyMap<string, PronunciationList>;

export type PronunciationList = string[];

export function createMultiLangDictionary(
  wordPronunciations: WordPronunciation[],
): MultiLangDictionary {
  // Map from language to word to pronunciation to count (of that pronunciation)
  const languages = new DefaultMap<
    Language,
    DefaultMap<string, DefaultMap<string, number>>
  >(
    () =>
      new DefaultMap<string, DefaultMap<string, number>>(
        () => new DefaultMap<string, number>(() => 0),
      ),
  );

  // Transfer word pronunciations to data structure
  for (const wordPronunciation of wordPronunciations) {
    const pronunciationCounts = languages
      .get(wordPronunciation.language)
      .get(wordPronunciation.word);
    pronunciationCounts.set(
      wordPronunciation.pronunciation,
      pronunciationCounts.get(wordPronunciation.pronunciation) + 1,
    );
  }

  // Create output format
  return new Map(
    orderBy(
      [...languages],
      ([_, words]) => words.size,
      'desc',
    ).map(([language, words]) => [
      language,
      createSingleLangDict(language, words),
    ]),
  );
}

function getCollator(language: string) {
  try {
    return new Intl.Collator(language);
  } catch {
    // Ignore invalid language codes
    return new Intl.Collator();
  }
}

function createSingleLangDict(
  language: string,

  // Map from word to pronunciation to count (of that pronunciation)
  words: ReadonlyMap<string, ReadonlyMap<string, number>>,
): SingleLangDictionary {
  const collator = getCollator(language);
  return new Map(
    [...words]
      .sort(([a], [b]) => collator.compare(a, b))
      .map(([word, pronunciations]) => [
        word,
        createPronunciationList(pronunciations),
      ]),
  );
}

function createPronunciationList(
  // Map from pronunciation to count (of that pronunciation)
  pronunciations: ReadonlyMap<string, number>,
): PronunciationList {
  return orderBy([...pronunciations], ([_, count]) => count, 'desc').map(
    ([pronunciation]) => pronunciation,
  );
}
