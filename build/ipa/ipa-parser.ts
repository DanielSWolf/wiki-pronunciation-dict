import { IpaLetter, isIpaLetter } from './ipa-letters';
import {
  alt,
  codePoints,
  ExtendedParser,
  ParserResult,
  str,
} from '../utils/parser-combinator';
import { err, ok } from 'neverthrow';

enum Diacritic {
  Voiceless = 'voiceless',
  Voiced = 'voiced',
  Aspirated = 'aspirated',
  MoreRounded = 'moreRounded',
  LessRounded = 'lessRounded',
  Advanced = 'advanced',
  Retracted = 'retracted',
  Centralized = 'centralized',
  MidCentralized = 'midCentralized',
  Syllabic = 'syllabic',
  NonSyllabic = 'nonSyllabic',
  Rhoticity = 'rhoticity',
  BreathyVoiced = 'breathyVoiced',
  CreakyVoiced = 'creakyVoiced',
  Linguolabial = 'linguolabial',
  Labialized = 'labialized',
  Palatalized = 'palatalized',
  Velarized = 'velarized',
  Pharyngealized = 'pharyngealized',
  VelarizedOrPharyngealized = 'velarizedOrPharyngealized',
  Raised = 'raised',
  Lowered = 'lowered',
  AdvancedTongueRoot = 'advancedTongueRoot',
  RetractedTongueRoot = 'retractedTongueRoot',
  Dental = 'dental',
  Apical = 'apical',
  Laminal = 'laminal',
  Nasalized = 'nasalized',
  NasalRelease = 'nasalRelease',
  LateralRelease = 'lateralRelease',
  NoAudibleRelease = 'noAudibleRelease',

  /** Non-standard. See https://en.wikipedia.org/wiki/Glottalization. */
  Glottalized = 'glottalized',

  /** Non-standard. See https://en.wikipedia.org/wiki/%C6%8F */
  MidCentralVowelRelease = 'midCentralVowelRelease',
}

enum Suprasegmental {
  PrimaryStress = 'primaryStress',
  SecondaryStress = 'secondaryStress',
  Long = 'long',
  HalfLong = 'halfLong',
  ExtraShort = 'extraShort',
  MinorGroup = 'minorGroup',
  MajorGroup = 'majorGroup',
  SyllableBreak = 'syllableBreak',
  Linking = 'linking',
  ExtraHigh = 'extraHigh',
  High = 'high',
  Mid = 'mid',
  Low = 'low',
  ExtraLow = 'extraLow',
  Downstep = 'downstep',
  Upstep = 'upstep',
  Rising = 'rising',
  Falling = 'falling',
  HighRising = 'highRising',
  LowRising = 'lowRising',
  RisingFalling = 'risingFalling',
  GlobalRise = 'globalRise',
  GlobalFall = 'globalFall',

  /** Non-standard. See https://en.wikipedia.org/wiki/Finnish_phonology#Sandhi. */
  Gemination = 'gemination',
}

type IpaFragment =
  | { type: 'letter'; value: IpaLetter }
  | { type: 'diacritic'; value: Diacritic }
  | { type: 'suprasegmental'; value: Suprasegmental };

const ipaLetterParser: ExtendedParser<IpaLetter> = codePoints(
  1,
).tryMap(codePoint =>
  isIpaLetter(codePoint) ? ok(codePoint) : err(['an IPA letter']),
);

const diacriticParser: ExtendedParser<Diacritic> = alt(
  alt(str('\u0325'), str('\u030A'), str('˳')).map(() => Diacritic.Voiceless),
  alt(str('\u032C'), str('ˬ')).map(() => Diacritic.Voiced),
  str('ʰ').map(() => Diacritic.Aspirated),
  str('\u0339').map(() => Diacritic.MoreRounded),
  str('\u031C').map(() => Diacritic.LessRounded),
  alt(str('\u031F'), str('˖')).map(() => Diacritic.Advanced),
  alt(str('\u0320'), str('ˍ')).map(() => Diacritic.Retracted),
  str('\u0308').map(() => Diacritic.Centralized),
  alt(str('\u033D'), str('˟')).map(() => Diacritic.MidCentralized),
  alt(str('\u0329'), str('\u030D'), str('ˌ')).map(() => Diacritic.Syllabic),
  str('\u032F').map(() => Diacritic.NonSyllabic),
  str('\u02DE').map(() => Diacritic.Rhoticity),
  alt(str('\u0324'), str('ʱ')).map(() => Diacritic.BreathyVoiced),
  alt(str('\u0330'), str('˷')).map(() => Diacritic.CreakyVoiced),
  str('\u033C').map(() => Diacritic.Linguolabial),
  str('ʷ').map(() => Diacritic.Labialized),
  str('ʲ').map(() => Diacritic.Palatalized),
  str('ˠ').map(() => Diacritic.Velarized),
  str('ˤ').map(() => Diacritic.Pharyngealized),
  str('\u0334').map(() => Diacritic.VelarizedOrPharyngealized),
  alt(str('\u031D'), str('˔')).map(() => Diacritic.Raised),
  alt(str('\u031E'), str('˕')).map(() => Diacritic.Lowered),
  str('\u0318').map(() => Diacritic.AdvancedTongueRoot),
  str('\u0319').map(() => Diacritic.RetractedTongueRoot),
  str('\u032A').map(() => Diacritic.Dental),
  alt(str('\u033A'), str('˽')).map(() => Diacritic.Apical),
  str('\u033B').map(() => Diacritic.Laminal),
  str('\u0303').map(() => Diacritic.Nasalized),
  str('ⁿ').map(() => Diacritic.NasalRelease),
  str('ˡ').map(() => Diacritic.LateralRelease),
  alt(str('\u031A'), str('˺')).map(() => Diacritic.NoAudibleRelease),

  // Non-standard diacritics
  str('ˀ').map(() => Diacritic.Glottalized),
  str('ᵊ').map(() => Diacritic.MidCentralVowelRelease),
);

const suprasegmentalParser: ExtendedParser<Suprasegmental> = alt(
  alt(str('ˈ'), str("'")).map(() => Suprasegmental.PrimaryStress),
  str('ˌ').map(() => Suprasegmental.SecondaryStress),
  str('ː').map(() => Suprasegmental.Long),
  str('ˑ').map(() => Suprasegmental.HalfLong),
  str('\u0306').map(() => Suprasegmental.ExtraShort),
  str('|').map(() => Suprasegmental.MinorGroup),
  str('‖').map(() => Suprasegmental.MajorGroup),
  str('.').map(() => Suprasegmental.SyllableBreak),
  alt(str('\u035C'), str('\u0361'), str('‿')).map(() => Suprasegmental.Linking),

  // The iconic pitch variation marks are a stub. There are many more possible combinations.
  // Should we actually need them one day, we'd have to extend this section.
  alt(str('\u030B'), str('˥')).map(() => Suprasegmental.ExtraHigh),
  alt(str('\u0301'), str('˦')).map(() => Suprasegmental.High),
  alt(str('\u0304'), str('˧')).map(() => Suprasegmental.Mid),
  alt(str('\u0300'), str('˨')).map(() => Suprasegmental.Low),
  alt(str('\u030F'), str('˩')).map(() => Suprasegmental.ExtraLow),
  str('ꜜ').map(() => Suprasegmental.Downstep),
  str('ꜛ').map(() => Suprasegmental.Upstep),
  alt(str('\u030C'), str('˩˥')).map(() => Suprasegmental.Rising),
  alt(str('\u0302'), str('˥˩')).map(() => Suprasegmental.Falling),
  alt(str('\u1DC4'), str('˧˥')).map(() => Suprasegmental.HighRising),
  alt(str('\u1DC5'), str('˩˧')).map(() => Suprasegmental.LowRising),
  alt(str('\u1DC8'), str('˧˦˨')).map(() => Suprasegmental.RisingFalling),
  alt(str('↗')).map(() => Suprasegmental.GlobalRise),
  alt(str('↘')).map(() => Suprasegmental.GlobalFall),

  // Non-standard suprasegmentals
  str('ˣ').map(() => Suprasegmental.Gemination),
).describe(['a suprasegmental mark']);

const ipaFragmentParser: ExtendedParser<IpaFragment> = alt(
  ipaLetterParser.map(value => ({ type: 'letter', value } as const)),
  diacriticParser.map(value => ({ type: 'diacritic', value } as const)),
  suprasegmentalParser.map(
    value => ({ type: 'suprasegmental', value } as const),
  ),
);

interface IpaSegment {
  letter: IpaLetter;
  diacritics: Diacritic[];
  leftSuprasegmentals: Suprasegmental[];
  rightSuprasegmentals: Suprasegmental[];
}

function parseIpa(input: string): ParserResult<IpaSegment[]> {
  const resultSegments: IpaSegment[] = [];

  let index = 0;
  let diacritics: Diacritic[] = [];
  let suprasegmentals: Suprasegmental[] = [];
  for (const codePoint of input) {
    const fragmentResult = ipaFragmentParser(input, index);
    if (fragmentResult.isErr()) return err(fragmentResult.error);

    const fragment = fragmentResult.value.value;
    if (fragment.type === 'letter') {
      const nextSuprasegmentals: Suprasegmental[] = [];
      resultSegments.push({
        letter: fragment.value,
        diacritics,
        leftSuprasegmentals: suprasegmentals,
        rightSuprasegmentals: nextSuprasegmentals,
      });
      diacritics = [];
      suprasegmentals = nextSuprasegmentals;
    } else if (fragment.type === 'diacritic') {
      // Diacritics only make sense after the first letter
      if (resultSegments.length === 0) {
        return err({
          expected: ['an IPA letter', 'a suprasegmental mark'],
          end: index,
        });
      }

      diacritics.push(fragment.value);
    } else if (fragment.type === 'suprasegmental') {
      suprasegmentals.push(fragment.value);
    }

    index += codePoint.length;
  }

  return ok({ value: resultSegments, end: index });
}
