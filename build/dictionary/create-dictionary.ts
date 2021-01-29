import { getName } from '@cospired/i18n-iso-languages';
import { orderBy, pick } from 'lodash';
import { log } from '../issue-logging';
import { Language } from '../language';
import { WordPronunciation } from '../pronunciation-sources.ts/pronunciation-source';
import { DefaultMap } from '../utils/default-map';
import { MissingMetadataIssue } from './dictionary-creation-issues';

export interface Dictionary {
  language: Language;
  data: Map<string, string[]>;
  metadata: Metadata;
}

export interface Metadata {
  description: string;
  graphemes: string[];
  phonemes: string[];
}

export interface QuantifiedMetadata extends Metadata {
  graphemeFrequencies: number[];
  phonemeFrequencies: number[];
}

const knownMetadataLookup = new Map<Language, Metadata>();

const unsupportedLanguages: Language[] = [
  // Dead languages
  'la', // Latin

  // Languages with too many graphemes
  'ja', // Japanese
  'zh', // Chinese
  'ko', // Korean
];

export function createDictionary(
  language: Language,
  wordPronunciations: WordPronunciation[],
): Dictionary | null {
  if (unsupportedLanguages.includes(language)) return null;

  const metadata = getMetadata(language, wordPronunciations);

  const pronunciationsByWord = new DefaultMap<string, string[]>(() => []);
  for (const wordPronunciation of wordPronunciations) {
    pronunciationsByWord
      .get(wordPronunciation.word)
      .push(wordPronunciation.pronunciation);
  }

  const languageCollator = getCollator(language);
  const sortedWords = [...pronunciationsByWord.keys()].sort(
    languageCollator.compare,
  );
  const data = new Map<string, string[]>(
    sortedWords.map(word => {
      const pronunciations = pronunciationsByWord.get(word)!;
      const sortedPronunciations = [...pronunciations].sort(
        englishCollator.compare,
      );
      return [word, sortedPronunciations];
    }),
  );

  return { language, data, metadata };
}

function getMetadata(
  language: Language,
  wordPronunciations: WordPronunciation[],
): Metadata {
  const knownMetadata = knownMetadataLookup.get(language);
  if (knownMetadata) return knownMetadata;

  const generatedMetadata = generateDummyMetadata(language, wordPronunciations);
  log(
    new MissingMetadataIssue(language, wordPronunciations, generatedMetadata),
  );
  return pick(generatedMetadata, 'description', 'graphemes', 'phonemes');
}

function generateDummyMetadata(
  language: Language,
  wordPronunciations: WordPronunciation[],
): QuantifiedMetadata {
  const description = getName(language, 'en') ?? language;

  const graphemeStats = getCharacterStats(
    (function* () {
      const words = new Set(
        [...wordPronunciations].map(
          wordPronunciation => wordPronunciation.word,
        ),
      );
      for (const word of words) {
        const graphemes = [...word];
        yield* graphemes;
      }
    })(),
  );

  const phonemeStats = getCharacterStats(
    (function* () {
      for (const wordPronunciation of wordPronunciations) {
        const phonemes = [...wordPronunciation.pronunciation];
        yield* phonemes;
      }
    })(),
  );

  return {
    description,
    graphemes: graphemeStats.characters,
    graphemeFrequencies: graphemeStats.frequencies,
    phonemes: phonemeStats.characters,
    phonemeFrequencies: phonemeStats.frequencies,
  };
}

const englishCollator = new Intl.Collator();

function getCollator(language: string) {
  try {
    return new Intl.Collator(language);
  } catch {
    // Ignore invalid language codes
    return englishCollator;
  }
}

function getCharacterStats(characters: Iterable<string>) {
  const characterCounts = new DefaultMap<string, number>(() => 0);
  let totalCharacterCount = 0;
  for (const character of characters) {
    characterCounts.set(character, characterCounts.get(character) + 1);
    totalCharacterCount++;
  }
  const sortedCharacterCounts = orderBy(
    [...characterCounts],
    ([character, count]) => count,
    'desc',
  );
  return {
    characters: sortedCharacterCounts.map(([character, count]) => character),
    frequencies: sortedCharacterCounts.map(
      ([character, count]) => count / totalCharacterCount,
    ),
  };
}
