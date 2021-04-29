import { zip } from 'lodash';
import { IpaLetter } from '../ipa/ipa-letters';
import {
  Diacritic,
  IpaParserErrorType,
  IpaSegment,
  parseIpaString,
  ParserLocation,
  Suprasegmental,
} from '../ipa/ipa-parser';
import { log } from '../issue-logging';
import { excludeSymbol, LanguageLookup } from '../languages/language-lookup';
import { WordPronunciation } from '../pronunciation-sources.ts/pronunciation-source';
import { InvalidCharacterInWordIssue } from './issues/invalid-character-in-word-issue';
import { PronunciationNormalizationIssue } from './issues/pronunciation-normalization-issue';

/** A declarative predicate for matching an IPA segment */
export interface IpaSegmentMatcher {
  /** The desired IPA letter */
  letter: IpaLetter;

  /**
   * The desired diacritics.
   * Any additional diacritics on a given segment are ignored.
   */
  diacritics?: Partial<Record<Diacritic, boolean>>;

  /**
   * The desired suprasegmentals to appear before the IPA letter.
   * Any additional suprasegmentals before the letter are ignored.
   */
  left?: Partial<Record<Suprasegmental, boolean>>;

  /**
   * The desired suprasegmentals to appear after the IPA letter.
   * Any additional suprasegmentals after the letter are ignored.
   */
  right?: Partial<Record<Suprasegmental, boolean>>;
}

function normalizeWord<TGrapheme extends string>(
  wordPronunciation: WordPronunciation,
  languageLookup: LanguageLookup<TGrapheme, any>,
): string | null {
  const lowerCaseWord = wordPronunciation.word
    .normalize('NFC')
    .toLocaleLowerCase(languageLookup.language);

  // Ignore incomplete words
  if (lowerCaseWord.startsWith('-') || lowerCaseWord.endsWith('-')) {
    return null;
  }

  const graphemes: TGrapheme[] = [];
  let index = 0;
  while (index < lowerCaseWord.length) {
    const graphemeRule = languageLookup.graphemeRules.find(
      ([expectedInputSequence, _result]) => {
        const substring = lowerCaseWord.substring(
          index,
          index + expectedInputSequence.length,
        );
        return substring === expectedInputSequence;
      },
    );
    if (graphemeRule === undefined) {
      // No rule matches the input string
      log(
        new InvalidCharacterInWordIssue(
          wordPronunciation,
          lowerCaseWord,
          lowerCaseWord[index],
        ),
      );
      return null;
    }

    if (graphemeRule[1] === excludeSymbol) {
      // Silently exclude the word
      return null;
    }

    // Add the graphemes to the result
    graphemes.push(...graphemeRule[1]);

    index += graphemeRule[0].length;
  }

  return graphemes.join('');
}

/** Compatible with IpaParserError */
export interface PronunciationNormalizationError {
  /** The type of the error */
  type: IpaParserErrorType | PronunciationNormalizationErrorType;

  /** The location where the error occurred within the input string */
  location: ParserLocation;
}

export enum PronunciationNormalizationErrorType {
  /** The IPA segment isn't supported by the current language */
  UnsupportedIpaSegment = 'unsupportedIpaSegment',
}

export function normalizeWordPronunciation(
  wordPronunciation: WordPronunciation,
  languageLookup: LanguageLookup<any, any>,
): WordPronunciation[] {
  const word = normalizeWord(wordPronunciation, languageLookup);
  if (word === null) return [];

  const pronunciations = normalizePronunciation(
    wordPronunciation,
    languageLookup,
  );
  return pronunciations.map(pronunciation => ({
    sourceEdition: wordPronunciation.sourceEdition,
    language: wordPronunciation.language,
    word,
    pronunciation,
  }));
}

function normalizePronunciation<TPhoneme extends string>(
  wordPronunciation: WordPronunciation,
  languageLookup: LanguageLookup<any, TPhoneme>,
): string[] {
  const segmentsResult = parseIpaString(wordPronunciation.pronunciation);
  if (segmentsResult.isErr()) {
    log(
      new PronunciationNormalizationIssue(
        wordPronunciation,
        segmentsResult.error,
      ),
    );
    return [];
  }

  const segmentSequenceAlternatives = segmentsResult.value;
  return segmentSequenceAlternatives
    .map(segments =>
      segmentsToPhonemes(segments, wordPronunciation, languageLookup),
    )
    .filter(Boolean)
    .map(phonemes => phonemes!.join(' '));
}

function segmentsToPhonemes<TPhoneme extends string>(
  segments: IpaSegment[],
  wordPronunciation: WordPronunciation,
  languageLookup: LanguageLookup<any, TPhoneme>,
): TPhoneme[] | null {
  const phonemes: TPhoneme[] = [];
  let index = 0;
  while (index < segments.length) {
    const phonemeRule = languageLookup.phonemeRules.find(
      ([matcherSequence, _result]) => {
        const slice = segments.slice(index, index + matcherSequence.length);
        if (slice.length < matcherSequence.length) return false;
        return zip(slice, matcherSequence).every(([segment, matcher]) =>
          segmentMatches(segment!, matcher!),
        );
      },
    );
    if (phonemeRule === undefined) {
      // No rule matches the input segments
      log(
        new PronunciationNormalizationIssue(wordPronunciation, {
          type: PronunciationNormalizationErrorType.UnsupportedIpaSegment,
          location: segments[index].letterLocation,
        }),
      );
      return null;
    }

    if (phonemeRule[1] === excludeSymbol) {
      // Silently exclude the word
      return null;
    }

    // Add the phonemes to the result
    phonemes.push(...phonemeRule[1]);

    index += phonemeRule[0].length;
  }

  return phonemes;
}

function segmentMatches(
  segment: IpaSegment,
  matcher: IpaSegmentMatcher,
): boolean {
  if (matcher.letter !== segment.letter) return false;
  if (matcher.diacritics) {
    for (const diacritic of Object.keys(matcher.diacritics) as Diacritic[]) {
      if (segment.diacritics.has(diacritic) !== matcher.diacritics[diacritic]) {
        return false;
      }
    }
  }
  if (matcher.left) {
    for (const suprasegmental of Object.keys(
      matcher.left,
    ) as Suprasegmental[]) {
      if (segment.left.has(suprasegmental) !== matcher.left[suprasegmental]) {
        return false;
      }
    }
  }
  if (matcher.right) {
    for (const suprasegmental of Object.keys(
      matcher.right,
    ) as Suprasegmental[]) {
      if (segment.right.has(suprasegmental) !== matcher.right[suprasegmental]) {
        return false;
      }
    }
  }

  return true;
}
