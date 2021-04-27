import { IpaSegmentMatcher } from '../dictionary/normalization';
import { Language } from '../language';

/** Symbol used to indicate that the current word or pronunciation should be silently excluded */
export const excludeSymbol = Symbol('exclude');

/**
 * A tuple mapping from a lower-case input sequences to the resulting grapheme sequence
 */
export type GraphemeRule<TGrapheme> = [
  inputSequence: string,
  result: TGrapheme[] | typeof excludeSymbol,
];

/**
 * A tuple mapping from an input sequences of IPA segment matchers to the resulting phoneme sequence
 */
export type PhonemeRule<TPhoneme> = [
  inputSequence: IpaSegmentMatcher[],
  result: TPhoneme[] | typeof excludeSymbol,
];

export interface LanguageLookup<
  TGrapheme extends string,
  TPhoneme extends string
> {
  /** The language in question */
  language: Language;

  /** The English name of the language */
  languageName: string;

  /** The graphemes used in the language */
  graphemes: TGrapheme[];

  /** The phonemes used in the language */
  phonemes: TPhoneme[];

  /** List of rules for converting a lower-case word string into language-specific graphemes */
  graphemeRules: GraphemeRule<TGrapheme>[];

  /** List of rules for converting a sequence of IPA segments into language-specific phonemes */
  phonemeRules: PhonemeRule<TPhoneme>[];
}
