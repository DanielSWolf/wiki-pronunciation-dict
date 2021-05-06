import { IpaLetter, ipaLetters } from './ipa-letters';
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
type IpaToken = LocationlessIpaToken & { location: ParserLocation };

type LocationlessIpaToken =
  | { type: 'letter'; value: IpaLetter }
  | { type: 'diacritic'; value: Diacritic }
  | { type: 'suprasegmental'; value: Suprasegmental };

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

  // Remove surrounding /.../ and [...] as well as whitespace.
  // Be lenient about matching pairs.
  while (
    input.startsWith('/') ||
    input.startsWith('[') ||
    input.startsWith(' ')
  ) {
    input = input.substring(1);
  }
  while (input.endsWith('/') || input.endsWith(']') || input.endsWith(' ')) {
    input = input.substring(0, input.length - 1);
  }

  // Make sure there is a pronunciation
  if (input === '' || input === '…') return ok([]);

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
      tokens: IpaToken[];
      substringLength: number;
    } | null = null;
    for (
      let substringLength = Math.min(
        maxTokenMapKeyLength,
        input.length - index,
      );
      match === null && substringLength > 0;
      substringLength--
    ) {
      const end = index + substringLength;
      const substring = input.substring(index, end);
      const location = { input, start: index, end };
      const locationlessTokens = tokenMap.get(substring);
      if (locationlessTokens) {
        match = {
          tokens: locationlessTokens.map(locationlessToken => ({
            ...locationlessToken,
            location,
          })),
          substringLength,
        };
      } else if (isWhitespace(substring)) {
        match = { tokens: [], substringLength };
      }
    }

    if (match === null) {
      return err({
        type: IpaParserErrorType.UnexpectedCharacter,
        location: { input, start: index, end: index + 1 },
      });
    }

    result.push(...match.tokens);
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

/** Map from string representations to a sequence of tokens */
const tokenMap = createFlatMap<string, LocationlessIpaToken[]>([
  //////////////////////////////////////////////////////////////////////////////
  // IPA letters

  ...ipaLetters.map<[string[], LocationlessIpaToken[]]>(letter => [
    [letter],
    [{ type: 'letter', value: letter }],
  ]),

  // Map Latin small letter turned e (U+01DD) to Latin small letter schwa (U+0259)
  [['ǝ'], [{ type: 'letter', value: 'ə' }]],
  // Map Latin small letter g (U+0067) to Latin small letter script g (U+0261)
  [['g'], [{ type: 'letter', value: 'ɡ' }]],

  //////////////////////////////////////////////////////////////////////////////
  // IPA diacritics

  [['\u0325', '\u030A', '˳'], [{ type: 'diacritic', value: 'voiceless' }]],
  [['\u032C', 'ˬ'], [{ type: 'diacritic', value: 'voiced' }]],
  [['ʰ'], [{ type: 'diacritic', value: 'aspirated' }]],
  [['\u0339'], [{ type: 'diacritic', value: 'moreRounded' }]],
  [['\u031C'], [{ type: 'diacritic', value: 'lessRounded' }]],
  [['\u031F', '˖'], [{ type: 'diacritic', value: 'advanced' }]],
  [['\u0320', 'ˍ'], [{ type: 'diacritic', value: 'retracted' }]],
  [['\u0308'], [{ type: 'diacritic', value: 'centralized' }]],
  [['\u033D', '˟'], [{ type: 'diacritic', value: 'midCentralized' }]],
  [['\u0329', '\u030D'], [{ type: 'diacritic', value: 'syllabic' }]],
  [['\u032F', '\u0311'], [{ type: 'diacritic', value: 'nonSyllabic' }]],
  [['\u02DE'], [{ type: 'diacritic', value: 'rhoticity' }]],
  [['\u0324', 'ʱ'], [{ type: 'diacritic', value: 'breathyVoiced' }]],
  [['\u0330', '˷'], [{ type: 'diacritic', value: 'creakyVoiced' }]],
  [['\u033C'], [{ type: 'diacritic', value: 'linguolabial' }]],
  [['ʷ'], [{ type: 'diacritic', value: 'labialized' }]],
  [['ʲ'], [{ type: 'diacritic', value: 'palatalized' }]],
  [['ˠ'], [{ type: 'diacritic', value: 'velarized' }]],
  [['ˤ'], [{ type: 'diacritic', value: 'pharyngealized' }]],
  [['\u0334'], [{ type: 'diacritic', value: 'velarizedOrPharyngealized' }]],
  [['\u031D', '˔'], [{ type: 'diacritic', value: 'raised' }]],
  [['\u031E', '˕'], [{ type: 'diacritic', value: 'lowered' }]],
  [['\u0318'], [{ type: 'diacritic', value: 'advancedTongueRoot' }]],
  [['\u0319'], [{ type: 'diacritic', value: 'retractedTongueRoot' }]],
  [['\u032A'], [{ type: 'diacritic', value: 'dental' }]],
  [['\u033A', '˽'], [{ type: 'diacritic', value: 'apical' }]],
  [['\u033B'], [{ type: 'diacritic', value: 'laminal' }]],
  [['\u0303'], [{ type: 'diacritic', value: 'nasalized' }]],
  [['ⁿ'], [{ type: 'diacritic', value: 'nasalRelease' }]],
  [['ˡ'], [{ type: 'diacritic', value: 'lateralRelease' }]],
  [['\u031A', '˺'], [{ type: 'diacritic', value: 'noAudibleRelease' }]],

  // Non-standard diacritics
  [['ˀ'], [{ type: 'diacritic', value: 'glottalized' }]],
  [['ᵊ'], [{ type: 'diacritic', value: 'midCentralVowelRelease' }]],

  //////////////////////////////////////////////////////////////////////////////
  // Suprasegmentals

  [['ˈ', "'", '’'], [{ type: 'suprasegmental', value: 'primaryStress' }]],
  [['ˌ', ','], [{ type: 'suprasegmental', value: 'secondaryStress' }]],
  [['ː', ':'], [{ type: 'suprasegmental', value: 'long' }]],
  [['ˑ'], [{ type: 'suprasegmental', value: 'halfLong' }]],
  [['\u0306'], [{ type: 'suprasegmental', value: 'extraShort' }]],
  [['|'], [{ type: 'suprasegmental', value: 'minorGroup' }]],
  [['‖'], [{ type: 'suprasegmental', value: 'majorGroup' }]],
  [['.'], [{ type: 'suprasegmental', value: 'syllableBreak' }]],
  [['\u035C', '\u0361', '‿'], [{ type: 'suprasegmental', value: 'linking' }]],

  // The iconic pitch variation marks are a stub. There are many more possible combinations.
  // Should we actually need them one day, we'd have to extend this section.
  [['\u030B', '˥'], [{ type: 'suprasegmental', value: 'extraHigh' }]],
  [['\u0301', '˦'], [{ type: 'suprasegmental', value: 'high' }]],
  [['\u0304', '˧'], [{ type: 'suprasegmental', value: 'mid' }]],
  [['\u0300', '˨'], [{ type: 'suprasegmental', value: 'low' }]],
  [['\u030F', '˩'], [{ type: 'suprasegmental', value: 'extraLow' }]],
  [['ꜜ'], [{ type: 'suprasegmental', value: 'downstep' }]],
  [['ꜛ'], [{ type: 'suprasegmental', value: 'upstep' }]],
  [['\u030C', '˩˥'], [{ type: 'suprasegmental', value: 'rising' }]],
  [['\u0302', '˥˩'], [{ type: 'suprasegmental', value: 'falling' }]],
  [['\u1DC4', '˧˥'], [{ type: 'suprasegmental', value: 'highRising' }]],
  [['\u1DC5', '˩˧'], [{ type: 'suprasegmental', value: 'lowRising' }]],
  [['\u1DC8', '˧˦˨'], [{ type: 'suprasegmental', value: 'risingFalling' }]],
  [['↗'], [{ type: 'suprasegmental', value: 'globalRise' }]],
  [['↘'], [{ type: 'suprasegmental', value: 'globalFall' }]],

  // Non-standard suprasegmentals
  [['ˣ'], [{ type: 'suprasegmental', value: 'gemination' }]],

  //////////////////////////////////////////////////////////////////////////////
  // Ligatures

  ...([
    ['ʣ', 'd', 'z'],
    ['ʤ', 'd', 'ʒ'],
    ['ʥ', 'd', 'ʑ'],
    ['ʦ', 't', 's'],
    ['ʧ', 't', 'ʃ'],
    ['ʨ', 't', 'ɕ'],
  ] as const).map<[string[], LocationlessIpaToken[]]>(
    ([ligature, firstLetter, secondLetter]) => [
      [ligature],
      [
        { type: 'letter', value: firstLetter },
        { type: 'suprasegmental', value: 'linking' },
        { type: 'letter', value: secondLetter },
      ],
    ],
  ),

  //////////////////////////////////////////////////////////////////////////////
  // Misc.

  [['\u200C'], []], // Zero width non-joiner
]);

const maxTokenMapKeyLength = Math.max(
  ...[...tokenMap.keys()].map(key => key.length),
);
