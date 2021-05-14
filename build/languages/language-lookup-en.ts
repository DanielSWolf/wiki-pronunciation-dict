import {
  excludeSymbol,
  GraphemeRule,
  LanguageLookup,
  PhonemeRule,
} from './language-lookup';

// prettier-ignore
const englishGraphemes = [
  '’',
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
  'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
] as const;

type EnglishGrapheme = typeof englishGraphemes[number];

// prettier-ignore
const englishPhonemes = [
  'p', 'b', 't', 'd', 'k', 'ɡ', 'm', 'n', 'ŋ', 'f', 'v', 'θ', 'ð', 's', 'z',
  'ʃ', 'ʒ', 'h', 'ɹ', 'j', 'l', 'w', 'i', 'u', 'ɪ', 'ʊ', 'e', 'ə', 'ɛ', 'ɜ',
  'ɔ', 'æ', 'a', 'ɑ', 'ɒ'
] as const;

type EnglishPhoneme = typeof englishPhonemes[number];

export const languageLookupEn: LanguageLookup<
  EnglishGrapheme,
  EnglishPhoneme
> = {
  language: 'en',
  graphemes: [...englishGraphemes],
  phonemes: [...englishPhonemes],
  graphemeRules: [
    // Silently exclude multi-word entries
    [' ', excludeSymbol],
    ['-', excludeSymbol],
    [',', excludeSymbol],
    ['.', excludeSymbol],

    // Silently exclude digits
    ...[...Array(10).keys()].map<GraphemeRule<EnglishGrapheme>>(i => [
      String(i),
      excludeSymbol,
    ]),

    // Use typographic apostrophes
    ["'", ['’']],

    // Substitute phonemes
    ['à', ['a']],
    ['â', ['a']],
    ['ä', ['a']],
    ['æ', ['a', 'e']],
    ['ç', ['c']],
    ['é', ['e']],
    ['è', ['e']],
    ['ë', ['e']],
    ['î', ['i']],
    ['ñ', ['n']],
    ['ö', ['o']],
    ['œ', ['o', 'e']],
    ['ü', ['u']],

    // Map each grapheme onto itself
    ...englishGraphemes.map<GraphemeRule<EnglishGrapheme>>(grapheme => [
      grapheme,
      [grapheme],
    ]),
  ],
  phonemeRules: [
    // Drop glottal stop
    [[{ letter: 'ʔ' }], []],

    // Substitute phonemes
    [[{ letter: 'ʈ' }], ['t']],
    [[{ letter: 'ɾ' }], ['d']],
    [[{ letter: 'c' }], ['k']],
    [[{ letter: 'ɱ' }], ['m']],
    [[{ letter: 'r' }], ['ɹ']],
    [[{ letter: 'ʁ' }], ['ɹ']],
    [[{ letter: 'ɻ' }], ['ɹ']],
    [[{ letter: 'ʍ' }], ['w']],
    [[{ letter: 'ɨ' }], ['ɪ']],
    [[{ letter: 'ʉ' }], ['ʊ']],
    [[{ letter: 'ɯ' }], ['ʊ']],
    [[{ letter: 'ɘ' }], ['ə']],
    [[{ letter: 'ɵ' }], ['ə']],
    [
      [{ letter: 'o' }, { letter: 'ʊ' }],
      ['ə', 'ʊ'],
    ],
    [[{ letter: 'o' }], ['ɔ']],
    [[{ letter: 'ʌ' }], ['a']],
    [[{ letter: 'ɐ' }], ['a']],

    // Map each phoneme onto itself
    ...englishPhonemes.map<PhonemeRule<EnglishPhoneme>>(phoneme => [
      [{ letter: phoneme }],
      [phoneme],
    ]),
  ],
};
