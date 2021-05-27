import { IpaLetter, isIpaLetter } from '../ipa/ipa-letters';
import {
  excludeSymbol,
  GraphemeRule,
  LanguageLookup,
  PhonemeRule,
} from './language-lookup';

// prettier-ignore
const frenchGraphemes = [
  '’',
  'a', 'à', 'â', 'æ', 'b', 'c', 'ç', 'd', 'e', 'é', 'è', 'ê', 'ë', 'f', 'g',
  'h', 'i', 'î', 'ï', 'j', 'k', 'l', 'm', 'n', 'o', 'ô', 'œ', 'p', 'q', 'r',
  's', 't', 'u', 'ù', 'û', 'ü', 'v', 'w', 'x', 'y', 'ÿ', 'z',
] as const;

type FrenchGrapheme = typeof frenchGraphemes[number];

// prettier-ignore
const frenchPhonemes = [
  'p', 'b', 't', 'd', 'k', 'ɡ', 'm', 'n', 'ɲ', 'ŋ', 'f', 'v', 's', 'z', 'ʃ',
  'ʒ', 'ʁ', 'j', 'l', 'w', 'ɥ', 'i', 'y', 'u', 'e', 'ø', 'o', 'ə', 'ɛ', 'ɛ̃',
  'œ', 'œ̃', 'ɔ', 'ɔ̃', 'a', 'ɑ', 'ɑ̃',
] as const;

type FrenchPhoneme = typeof frenchPhonemes[number];

export const languageLookupFr: LanguageLookup<FrenchGrapheme, FrenchPhoneme> = {
  language: 'fr',
  graphemes: [...frenchGraphemes],
  phonemes: [...frenchPhonemes],
  graphemeRules: [
    // Silently exclude multi-word entries
    [' ', excludeSymbol],
    ['-', excludeSymbol],
    [',', excludeSymbol],
    ['.', excludeSymbol],

    // Silently exclude digits
    ...[...Array(10).keys()].map<GraphemeRule<FrenchGrapheme>>(i => [
      String(i),
      excludeSymbol,
    ]),

    // Use typographic apostrophes
    ["'", ['’']],

    // Map each grapheme onto itself
    ...frenchGraphemes.map<GraphemeRule<FrenchGrapheme>>(grapheme => [
      grapheme,
      [grapheme],
    ]),
  ],
  phonemeRules: [
    // Drop glottal stop
    [[{ letter: 'ʔ' }], []],

    // Drop silent h
    [[{ letter: 'h' }], []],

    // Handle nasalized phonemes
    [[{ letter: 'ɛ', diacritics: { nasalized: true } }], ['ɛ̃']],
    [[{ letter: 'œ', diacritics: { nasalized: true } }], ['œ̃']],
    [[{ letter: 'ɔ', diacritics: { nasalized: true } }], ['ɔ̃']],
    [[{ letter: 'ɑ', diacritics: { nasalized: true } }], ['ɑ̃']],

    // Substitute phonemes
    [[{ letter: 'r' }], ['ʁ']],
    [[{ letter: 'ʀ' }], ['ʁ']],
    [[{ letter: 'ɾ' }], ['ʁ']],
    [[{ letter: 'ʎ' }], ['j']],
    [[{ letter: 'ɪ' }], ['i']],
    [[{ letter: 'ʏ' }], ['y']],
    [[{ letter: 'ʊ' }], ['u']],

    // Map each single-letter phoneme onto itself
    ...frenchPhonemes
      .filter((phoneme): phoneme is FrenchPhoneme & IpaLetter =>
        isIpaLetter(phoneme),
      )
      .map<PhonemeRule<FrenchPhoneme>>(phoneme => [
        [{ letter: phoneme }],
        [phoneme],
      ]),
  ],
};
