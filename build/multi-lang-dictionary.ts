import { orderBy } from "lodash";
import { Language } from "./language";
import { isPronunciationRetrievalError, PronunciationResult } from "./pronunciation-sources.ts/pronunciation-source";
import { DefaultMap } from "./utils/default-map";

export type MultiLangDictionary = ReadonlyMap<Language, SingleLangDictionary>;

export type SingleLangDictionary = ReadonlyMap<string, PronunciationList>;

export type PronunciationList = string[];

export function createMultiLangDictionary(pronunciationResults: PronunciationResult[]): MultiLangDictionary {
  // Map from language to word to pronunciation to count (of that pronunciation)
  const languages = new DefaultMap<Language, DefaultMap<string, DefaultMap<string, number>>>(
    () => new DefaultMap<string, DefaultMap<string, number>>(
      () => new DefaultMap<string, number>(
        () => 0,
      ),
    ),
  );

  // Transfer pronunciation results to data structure
  for (const result of pronunciationResults) {
    if (isPronunciationRetrievalError(result)) continue;

    const wordPronunciations = languages.get(result.language).get(result.word);
    wordPronunciations.set(result.pronunciation, wordPronunciations.get(result.pronunciation) + 1);
  }

  // Create output format
  return new Map(
    orderBy([...languages], ([_, words]) => words.size, 'desc')
      .map(([language, words]) => [language, createSingleLangDict(words)]),
  );
}

function createSingleLangDict(
  // Map from word to pronunciation to count (of that pronunciation)
  words: ReadonlyMap<string, ReadonlyMap<string, number>>,
): SingleLangDictionary {
  return new Map(
    [...words].sort(([a], [b]) => a.localeCompare(b, 'en'))
      .map(([word, pronunciations]) => [word, createPronunciationList(pronunciations)]),
  );
}

function createPronunciationList(
  // Map from pronunciation to count (of that pronunciation)
  pronunciations: ReadonlyMap<string, number>,
): PronunciationList {
  return orderBy([...pronunciations], ([_, count]) => count, 'desc')
    .map(([pronunciation]) => pronunciation);
}
