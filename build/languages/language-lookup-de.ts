import {
  excludeSymbol,
  GraphemeRule,
  LanguageLookup,
  PhonemeRule,
} from './language-lookup';

// prettier-ignore
const germanGraphemes = [
  '’',
  'a', 'ä', 'b', 'c', 'd', 'e', 'é', 'è', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
  'm', 'n', 'o', 'ö', 'p', 'q', 'r', 's', 'ß', 't', 'u', 'ü', 'v', 'w', 'x',
  'y', 'z',
] as const;

type GermanGrapheme = typeof germanGraphemes[number];

// prettier-ignore
const germanPhonemes = [
  'p', 'b', 't', 'd', 'k', 'ɡ', 'm', 'n', 'ŋ', 'ʀ', 'f', 'v', 's', 'z', 'ʃ',
  'ʒ', 'ç', 'x', 'h', 'j', 'l', 'i', 'y', 'u', 'ɪ', 'ʏ', 'ʊ', 'e', 'ø', 'o',
  'ə', 'ɛ', 'œ', 'ɔ', 'ɐ', 'a',
] as const;

type GermanPhoneme = typeof germanPhonemes[number];

export const languageLookupDe: LanguageLookup<GermanGrapheme, GermanPhoneme> = {
  language: 'de',
  graphemes: [...germanGraphemes],
  phonemes: [...germanPhonemes],
  graphemeRules: [
    // Silently exclude multi-word entries
    [' ', excludeSymbol],
    ['-', excludeSymbol],
    [',', excludeSymbol],
    ['.', excludeSymbol],

    // Silently exclude digits
    ...[...Array(10).keys()].map<GraphemeRule<GermanGrapheme>>(i => [
      String(i),
      excludeSymbol,
    ]),

    // Use typographic apostrophes
    ["'", ['’']],

    // Map each grapheme onto itself
    ...germanGraphemes.map<GraphemeRule<GermanGrapheme>>(grapheme => [
      grapheme,
      [grapheme],
    ]),
  ],
  phonemeRules: [
    // Drop glottal stop
    [[{ letter: 'ʔ' }], []],

    // Drop alveolar lateral flap
    [[{ letter: 'ɺ' }], []],

    // Substitute phonemes
    [[{ letter: 'ɢ' }], ['ɡ']],
    [[{ letter: 'ɱ' }], ['m']],
    [[{ letter: 'r' }], ['ʀ']],
    [[{ letter: 'ɾ' }], ['ʀ']],
    [[{ letter: 'ʁ' }], ['ʀ']],
    [[{ letter: 'ɹ' }], ['ʀ']],
    [[{ letter: 'ʋ' }], ['v']],
    [[{ letter: 'w' }], ['v']],
    [[{ letter: 'ɸ' }], ['f']],
    [[{ letter: 'θ' }], ['s']],
    [[{ letter: 'ð' }], ['s']],
    [[{ letter: 'ɕ' }], ['ç']],
    [[{ letter: 'χ' }], ['x']],
    [[{ letter: 'ʎ' }], ['j']],
    [[{ letter: 'ɘ' }], ['ə']],
    [[{ letter: 'ɜ' }], ['ɛ']],
    [[{ letter: 'æ' }], ['ɛ']],
    [[{ letter: 'ɒ' }], ['ɔ']],
    [[{ letter: 'ɑ' }], ['a']],
    [[{ letter: 'ʌ' }], ['a']],

    // Map each phoneme onto itself
    ...germanPhonemes.map<PhonemeRule<GermanPhoneme>>(phoneme => [
      [{ letter: phoneme }],
      [phoneme],
    ]),
  ],
};
