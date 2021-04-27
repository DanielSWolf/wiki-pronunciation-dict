import { IpaLetter, ipaLetters, isIpaLetter } from './ipa-letters';
import { err, ok, Result } from 'neverthrow';
import { decomposeIpaString } from './decompose-ipa-string';
import { createFlatMap } from '../utils/flat-map';
import { isEqual } from 'lodash';

/**
 * An IPA segment parsed from an IPA string.
 * See https://en.wikipedia.org/wiki/Segment_(linguistics)
 */
export interface IpaSegment {
  /** The IPA letter */
  letter: IpaLetter;

  /** The location of the IPA letter within the input string */
  letterLocation: ParserLocation;

  /** All diacritics belonging to the segment, along with their locations within the input string */
  diacritics: Map<Diacritic, ParserLocation>;

  /** All suprasegmentals before the segment, along with their locations within the input string */
  left: Map<Suprasegmental, ParserLocation>;

  /** All suprasegmentals after the segment, along with their locations within the input string */
  right: Map<Suprasegmental, ParserLocation>;
}

/** A location within an input string */
export interface ParserLocation {
  /** The input string */
  input: string;

  /** The start index within the input string */
  start: number;

  /** The exclusive end index within the input string */
  end: number;
}

/** An error that occurred trying to parse an IPA string */
export interface IpaParserError {
  /** The type of the error */
  type: IpaParserErrorType;

  /** The location where the error occurred within the input string */
  location: ParserLocation;
}

/** The type of a parser error */
export enum IpaParserErrorType {
  /** The input string is not enclosed in '[]' or '//' pairs */
  MissingDelimiters = 'missingDelimiters',

  /** The input string contains a character that is not a common IPA symbol */
  UnexpectedCharacter = 'unexpectedCharacter',

  /** The input string appears to contain only the beginning or end of a pronunciation */
  IncompletePronunciation = 'incompletePronunciation',

  /** A diacritic symbol was encountered at a position other than immediately following a letter */
  IllegalDiacriticPosition = 'illegalDiacriticPosition',
}

/** All valid [[Diacritic]] values */
const diacritics = [
  'voiceless',
  'voiced',
  'aspirated',
  'moreRounded',
  'lessRounded',
  'advanced',
  'retracted',
  'centralized',
  'midCentralized',
  'syllabic',
  'nonSyllabic',
  'rhoticity',
  'breathyVoiced',
  'creakyVoiced',
  'linguolabial',
  'labialized',
  'palatalized',
  'velarized',
  'pharyngealized',
  'velarizedOrPharyngealized',
  'raised',
  'lowered',
  'advancedTongueRoot',
  'retractedTongueRoot',
  'dental',
  'apical',
  'laminal',
  'nasalized',
  'nasalRelease',
  'lateralRelease',
  'noAudibleRelease',

  /** Non-standard. See https://en.wikipedia.org/wiki/Glottalization. */
  'glottalized',

  /** Non-standard. See https://en.wikipedia.org/wiki/%C6%8F */
  'midCentralVowelRelease',
] as const;

/**
 * An IPA diacritic.
 * See https://en.wikipedia.org/wiki/International_Phonetic_Alphabet#Diacritics
 */
export type Diacritic = typeof diacritics[number];

/** All valid [[Suprasegmental]] values */
const suprasegmentals = [
  'primaryStress',
  'secondaryStress',
  'long',
  'halfLong',
  'extraShort',
  'minorGroup',
  'majorGroup',
  'syllableBreak',
  'linking',
  'extraHigh',
  'high',
  'mid',
  'low',
  'extraLow',
  'downstep',
  'upstep',
  'rising',
  'falling',
  'highRising',
  'lowRising',
  'risingFalling',
  'globalRise',
  'globalFall',

  /** Non-standard. See https://en.wikipedia.org/wiki/Finnish_phonology#Sandhi. */
  'gemination',
] as const;

/**
 * An IPA suprasegmental.
 * See https://en.wikipedia.org/wiki/International_Phonetic_Alphabet#Suprasegmentals
 */
export type Suprasegmental = typeof suprasegmentals[number];

/** An IPA letter, diacritic, or suprasegmental, as found when lexing an IPA string */
type IpaToken =
  | { type: 'letter'; value: IpaLetter; location: ParserLocation }
  | { type: 'diacritic'; value: Diacritic; location: ParserLocation }
  | { type: 'suprasegmental'; value: Suprasegmental; location: ParserLocation };

/**
 * Parses an IPA string into IPA segments.
 * @param input - An IPA pronunciation string as used on Wiktionary
 * @returns A list of zero or more parsed pronunciations, each consisting of one or more IPA
 *   segments.
 */
export function parseIpaString(
  input: string,
): Result<IpaSegment[][], IpaParserError> {
  // Perform IPA-specific decomposition
  input = decomposeIpaString(input);

  // Trim surrounding whitespace
  input = input.trim();

  // Make sure there is a pronunciation
  if (input === '') return ok([]);

  // Remove surrounding /.../ and [...]
  if (
    (input.startsWith('/') && input.endsWith('/')) ||
    (input.startsWith('[') && input.endsWith(']'))
  ) {
    input = input.substring(1, input.length - 1);
  } else {
    return err({
      type: IpaParserErrorType.MissingDelimiters,
      location: {
        input,
        start: 0,
        end: input.length,
      },
    });
  }

  // Make sure pronunciation is complete
  if (input.startsWith('-')) {
    // Incomplete pronunciation: only suffix is specified
    return err({
      type: IpaParserErrorType.IncompletePronunciation,
      location: { input, start: 0, end: 1 },
    });
  } else if (input.endsWith('-')) {
    // Incomplete pronunciation: only prefix is specified
    return err({
      type: IpaParserErrorType.IncompletePronunciation,
      location: {
        input,
        start: input.length - 1,
        end: input.length,
      },
    });
  }

  const inputAlternatives = getAlternatives(input);
  const resultAlternatives: IpaSegment[][] = [];
  for (const inputAlternative of inputAlternatives) {
    const tokensResult = lexSimpleIpaString(inputAlternative);
    if (tokensResult.isErr()) return err(tokensResult.error);

    const segmentsResult = tokensToSegments(tokensResult.value);
    if (segmentsResult.isErr()) return err(segmentsResult.error);

    const segments = segmentsResult.value;
    const empty = segments.length > 0;
    const alreadyKnown = resultAlternatives.some(knownResult =>
      segmentListsAreEquivalent(knownResult, segments),
    );
    if (empty && !alreadyKnown) {
      resultAlternatives.push(segments);
    }
  }

  return ok(resultAlternatives);
}

/** Indicates whether two arrays of IPA segments are identical except for metadata */
function segmentListsAreEquivalent(a: IpaSegment[], b: IpaSegment[]): boolean {
  const simplify = (segments: IpaSegment[]) =>
    segments.map(segment => [
      segment.letter,
      [...segment.diacritics.keys()],
      [...segment.left.keys()],
      [...segment.right.keys()],
    ]);
  return isEqual(simplify(a), simplify(b));
}

function tokensToSegments(
  tokens: IpaToken[],
): Result<IpaSegment[], IpaParserError> {
  const segments: IpaSegment[] = [];

  let diacritics = new Map<Diacritic, ParserLocation>();
  let suprasegmentals = new Map<Suprasegmental, ParserLocation>();
  let lastType: IpaToken['type'] | null = null;
  for (const token of tokens) {
    switch (token.type) {
      case 'letter':
        diacritics = new Map();
        const oldSuprasegmentals = suprasegmentals;
        suprasegmentals = new Map();
        segments.push({
          letter: token.value,
          letterLocation: token.location,
          diacritics,
          left: oldSuprasegmentals,
          right: suprasegmentals,
        });
        break;
      case 'diacritic':
        if (lastType !== 'letter' && lastType !== 'diacritic') {
          return err({
            type: IpaParserErrorType.IllegalDiacriticPosition,
            location: token.location,
          });
        }
        diacritics.set(token.value, token.location);
        break;
      case 'suprasegmental':
        suprasegmentals.set(token.value, token.location);
        break;
    }
    lastType = token.type;
  }
  return ok(segments);
}

/** All IPA letters by their string representation. (This one is trivial) */
const letterMap = new Map<string, IpaLetter>(
  ipaLetters.map(letter => [letter, letter]),
);

/** All IPA diacritics by their string representation(s). */
const diacriticMap = createFlatMap<string, Diacritic>([
  [['\u0325', '\u030A', '˳'], 'voiceless'],
  [['\u032C', 'ˬ'], 'voiced'],
  [['ʰ'], 'aspirated'],
  [['\u0339'], 'moreRounded'],
  [['\u031C'], 'lessRounded'],
  [['\u031F', '˖'], 'advanced'],
  [['\u0320', 'ˍ'], 'retracted'],
  [['\u0308'], 'centralized'],
  [['\u033D', '˟'], 'midCentralized'],
  [['\u0329', '\u030D'], 'syllabic'],
  [['\u032F'], 'nonSyllabic'],
  [['\u02DE'], 'rhoticity'],
  [['\u0324', 'ʱ'], 'breathyVoiced'],
  [['\u0330', '˷'], 'creakyVoiced'],
  [['\u033C'], 'linguolabial'],
  [['ʷ'], 'labialized'],
  [['ʲ'], 'palatalized'],
  [['ˠ'], 'velarized'],
  [['ˤ'], 'pharyngealized'],
  [['\u0334'], 'velarizedOrPharyngealized'],
  [['\u031D', '˔'], 'raised'],
  [['\u031E', '˕'], 'lowered'],
  [['\u0318'], 'advancedTongueRoot'],
  [['\u0319'], 'retractedTongueRoot'],
  [['\u032A'], 'dental'],
  [['\u033A', '˽'], 'apical'],
  [['\u033B'], 'laminal'],
  [['\u0303'], 'nasalized'],
  [['ⁿ'], 'nasalRelease'],
  [['ˡ'], 'lateralRelease'],
  [['\u031A', '˺'], 'noAudibleRelease'],

  // Non-standard diacritics
  [['ˀ'], 'glottalized'],
  [['ᵊ'], 'midCentralVowelRelease'],
]);

/** All IPA suprasegmentals by their string representation(s). */
const suprasegmentalMap = createFlatMap<string, Suprasegmental>([
  [['ˈ', "'"], 'primaryStress'],
  [['ˌ'], 'secondaryStress'],
  [['ː'], 'long'],
  [['ˑ'], 'halfLong'],
  [['\u0306'], 'extraShort'],
  [['|'], 'minorGroup'],
  [['‖'], 'majorGroup'],
  [['.'], 'syllableBreak'],
  [['\u035C', '\u0361', '‿'], 'linking'],

  // The iconic pitch variation marks are a stub. There are many more possible combinations.
  // Should we actually need them one day, we'd have to extend this section.
  [['\u030B', '˥'], 'extraHigh'],
  [['\u0301', '˦'], 'high'],
  [['\u0304', '˧'], 'mid'],
  [['\u0300', '˨'], 'low'],
  [['\u030F', '˩'], 'extraLow'],
  [['ꜜ'], 'downstep'],
  [['ꜛ'], 'upstep'],
  [['\u030C', '˩˥'], 'rising'],
  [['\u0302', '˥˩'], 'falling'],
  [['\u1DC4', '˧˥'], 'highRising'],
  [['\u1DC5', '˩˧'], 'lowRising'],
  [['\u1DC8', '˧˦˨'], 'risingFalling'],
  [['↗'], 'globalRise'],
  [['↘'], 'globalFall'],

  // Non-standard suprasegmentals
  [['ˣ'], 'gemination'],
]);

const maxMapKeyLength = Math.max(
  ...[
    ...letterMap.keys(),
    ...diacriticMap.keys(),
    ...suprasegmentalMap.keys(),
  ].map(key => key.length),
);

/**
 * Takes a "simple" IPA string and converts it into structured tokens.
 *
 * "Simple" here means that:
 * - surrounding brackets or slashes must already be trimmed
 * - embedded parentheses must already be applied
 * - the input string must already be decomposed using `decomposeIpaString()`.
 */
function lexSimpleIpaString(input: string): Result<IpaToken[], IpaParserError> {
  const result: IpaToken[] = [];
  let index = 0;
  while (index < input.length) {
    // Try to find the token with the longest input length
    let match: {
      token: IpaToken | null;
      substringLength: number;
    } | null = null;
    for (
      let substringLength = Math.min(maxMapKeyLength, input.length - index);
      match === null && substringLength > 0;
      substringLength--
    ) {
      const end = index + substringLength;
      const substring = input.substring(index, end);
      const location = { input, start: index, end };
      if (letterMap.has(substring)) {
        match = {
          token: {
            type: 'letter',
            value: letterMap.get(substring)!,
            location,
          },
          substringLength,
        };
      } else if (diacriticMap.has(substring)) {
        match = {
          token: {
            type: 'diacritic',
            value: diacriticMap.get(substring)!,
            location,
          },
          substringLength,
        };
      } else if (suprasegmentalMap.has(substring)) {
        match = {
          token: {
            type: 'suprasegmental',
            value: suprasegmentalMap.get(substring)!,
            location,
          },
          substringLength,
        };
      } else if (isWhitespace(substring)) {
        match = { token: null, substringLength };
      }
    }

    if (match === null) {
      return err({
        type: IpaParserErrorType.UnexpectedCharacter,
        location: { input, start: index, end: index + 1 },
      });
    }

    if (match.token !== null) {
      result.push(match.token);
    }
    index += match.substringLength;
  }

  return ok(result);
}

function isWhitespace(s: string) {
  return /^\s*$/.test(s);
}

/**
 * Splits alternative spellings:
 * "/ˈbaf(ə)lmənt/" is split into "/ˈbaflmənt/" and "/ˈbafəlmənt/".
 */
function getAlternatives(string: string): string[] {
  const optionalRegex = /\((.*?)\)|⁽(.*?)⁾/g;
  const minimalVersion = string.replaceAll(optionalRegex, '');
  const maximalVersion = string.replaceAll(optionalRegex, '$1$2');
  return minimalVersion === maximalVersion
    ? [minimalVersion]
    : [minimalVersion, maximalVersion];
}
