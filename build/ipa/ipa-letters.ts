// prettier-ignore
export const consonants = [
  // Pulmonic consonants
  'p', 'b', 't', 'd', 'ʈ', 'ɖ', 'c', 'ɟ', 'k', 'ɡ', 'q', 'ɢ', 'ʔ', // plosives
  'm', 'ɱ', 'n', 'ɳ', 'ɲ', 'ŋ', 'ɴ', // nasals
  'ʙ', 'r', 'ʀ', // trills
  'ⱱ', 'ɾ', 'ɽ', // taps/flaps
  'ɸ', 'β', 'f', 'v', 'θ', 'ð', 's', 'z', 'ʃ', 'ʒ', 'ʂ', 'ʐ', 'ç', 'ʝ', 'x', 'ɣ', 'χ', 'ʁ', 'ħ', 'ʕ', 'h', 'ɦ', // fricatives
  'ɬ', 'ɮ', // lateral fricatives
  'ʋ', 'ɹ', 'ɻ', 'j', 'ɰ', // approximants
  'l', 'ɭ', 'ʎ', 'ʟ', // lateral approximants

  // Non-pulmonic consonants
  'ʘ', 'ǀ', 'ǃ', 'ǂ', 'ǁ', // clicks
  'ɓ', 'ɗ', 'ʄ', 'ɠ', 'ʛ', // voiced implosives
  'ʼ', // Ejective

  // Other consonants
  'ʍ', 'w', 'ɥ', 'ʜ', 'ʢ', 'ʡ', 'ɕ', 'ʑ', 'ɺ', 'ɧ',
] as const;

export type Consonant = typeof consonants[number];

// prettier-ignore
export const vowels = [
  'i', 'y', 'ɨ', 'ʉ', 'ɯ', 'u', 'ɪ', 'ʏ', 'ʊ', // close
  'e', 'ø', 'ɘ', 'ɵ', 'ɤ', 'o', 'ə', // close-mid
  'ɛ', 'œ', 'ɜ', 'ɞ', 'ʌ', 'ɔ', 'æ', 'ɐ', // open-mid
  'a', 'ɶ', 'ɑ', 'ɒ', // open
] as const;

export type Vowel = typeof vowels[number];

export type IpaLetter = Consonant | Vowel;

export const ipaLetters = [...consonants, ...vowels];

const ipaLetterSet = new Set(ipaLetters);

export function isIpaLetter(value: string): value is IpaLetter {
  return ipaLetterSet.has(value as any);
}
