import { IpaLetter, isIpaLetter } from '../ipa/ipa-letters';
import {
  excludeSymbol,
  GraphemeRule,
  LanguageLookup,
  PhonemeRule,
} from './language-lookup';

// prettier-ignore
const italianGraphemes = [
  '’',
  'a', 'à', 'b', 'c', 'd', 'e', 'é', 'è', 'f', 'g', 'h', 'i', 'ì', 'j', 'k',
  'l', 'm', 'n', 'o', 'ò', 'p', 'q', 'r', 's', 't', 'u', 'ù', 'v', 'w', 'x',
  'y', 'z',
] as const;

type ItalianGrapheme = typeof italianGraphemes[number];

// prettier-ignore
const italianPhonemes = [
  'p', 'pː', 'b', 'bː', 't', 'tː', 'd', 'dː', 'k', 'kː', 'ɡ', 'ɡː', 'm', 'mː',
  'n', 'nː', 'ɲ', 'r', 'rː', 'f', 'fː', 'v', 'vː', 's', 'sː', 'z', 'ʃ', 'ʒ',
  'j', 'l', 'lː', 'ʎ', 'w', 'i', 'u', 'e', 'o', 'ɛ', 'ɔ', 'a',
] as const;

type ItalianPhoneme = typeof italianPhonemes[number];

export const languageLookupIt: LanguageLookup<
  ItalianGrapheme,
  ItalianPhoneme
> = {
  language: 'it',
  graphemes: [...italianGraphemes],
  phonemes: [...italianPhonemes],
  graphemeRules: [
    // Silently exclude multi-word entries
    [' ', excludeSymbol],
    ['-', excludeSymbol],
    [',', excludeSymbol],
    ['.', excludeSymbol],

    // Silently exclude digits
    ...[...Array(10).keys()].map<GraphemeRule<ItalianGrapheme>>(i => [
      String(i),
      excludeSymbol,
    ]),

    // Use typographic apostrophes
    ["'", ['’']],

    // Map each grapheme onto itself
    ...italianGraphemes.map<GraphemeRule<ItalianGrapheme>>(grapheme => [
      grapheme,
      [grapheme],
    ]),
  ],
  phonemeRules: [
    // Drop silent /h/ (voiceless glottal fricative)
    [[{ letter: 'h' }], []],

    // Treat /ʎʎ/ as /ʎ/
    [[{ letter: 'ʎ' }, { letter: 'ʎ' }], ['ʎ']],

    // Handle gemination
    [[{ letter: 'p', right: { long: true } }], ['pː']],
    [[{ letter: 'p' }, { letter: 'p' }], ['pː']],
    [[{ letter: 'b', right: { long: true } }], ['bː']],
    [[{ letter: 'b' }, { letter: 'b' }], ['bː']],
    [[{ letter: 't', right: { long: true } }], ['tː']],
    [[{ letter: 't' }, { letter: 't' }], ['tː']],
    [[{ letter: 'd', right: { long: true } }], ['dː']],
    [[{ letter: 'd' }, { letter: 'd' }], ['dː']],
    [[{ letter: 'k', right: { long: true } }], ['kː']],
    [[{ letter: 'k' }, { letter: 'k' }], ['kː']],
    [[{ letter: 'ɡ', right: { long: true } }], ['ɡː']],
    [[{ letter: 'ɡ' }, { letter: 'ɡ' }], ['ɡː']],
    [[{ letter: 'm', right: { long: true } }], ['mː']],
    [[{ letter: 'm' }, { letter: 'm' }], ['mː']],
    [[{ letter: 'n', right: { long: true } }], ['nː']],
    [[{ letter: 'n' }, { letter: 'n' }], ['nː']],
    [[{ letter: 'r', right: { long: true } }], ['rː']],
    [[{ letter: 'r' }, { letter: 'r' }], ['rː']],
    [[{ letter: 'f', right: { long: true } }], ['fː']],
    [[{ letter: 'f' }, { letter: 'f' }], ['fː']],
    [[{ letter: 'v', right: { long: true } }], ['vː']],
    [[{ letter: 'v' }, { letter: 'v' }], ['vː']],
    [[{ letter: 's', right: { long: true } }], ['sː']],
    [[{ letter: 's' }, { letter: 's' }], ['sː']],
    [[{ letter: 'l', right: { long: true } }], ['lː']],
    [[{ letter: 'l' }, { letter: 'l' }], ['lː']],

    // Substitute phonemes
    [[{ letter: 'c' }], ['k']],
    [[{ letter: 'ɱ' }], ['m']],
    [[{ letter: 'ŋ' }], ['ɲ']],
    [[{ letter: 'ɾ' }], ['r']],
    [[{ letter: 'ʁ' }], ['r']],
    [[{ letter: 'ɪ' }], ['i']],
    [[{ letter: 'y' }], ['u']],
    [[{ letter: 'ʊ' }], ['u']],
    [[{ letter: 'ø' }], ['e']],

    // Map each phoneme onto itself
    ...italianPhonemes
      .filter((phoneme): phoneme is ItalianPhoneme & IpaLetter =>
        isIpaLetter(phoneme),
      )
      .map<PhonemeRule<ItalianPhoneme>>(phoneme => [
        [{ letter: phoneme }],
        [phoneme],
      ]),
  ],
};
