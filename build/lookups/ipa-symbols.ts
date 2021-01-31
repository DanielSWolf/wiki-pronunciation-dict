/**
 * All segmental (non-decorated) IPA symbols
 */
// prettier-ignore
export const ipaSymbols = new Set([
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

  // Other symbols
  'ʍ', 'w', 'ɥ', 'ʜ', 'ʢ', 'ʡ', 'ɕ', 'ʑ', 'ɺ', 'ɧ',

  // Vowels
  'i', 'y', 'ɨ', 'ʉ', 'ɯ', 'u', 'ɪ', 'ʏ', 'ʊ', // close
  'e', 'ø', 'ɘ', 'ɵ', 'ɤ', 'o', 'ə', // close-mid
  'ɛ', 'œ', 'ɜ', 'ɞ', 'ʌ', 'ɔ', 'æ', 'ɐ', // open-mid
  'a', 'ɶ', 'ɑ', 'ɒ', // open
]);

/**
 * IPA symbols that are irrelevant for ASR
 */
// prettier-ignore
export const nonEssentialIpaSymbols = new Set([
  // Diacritics
  '\u02F3', '\u0325', // voiceless
  '\u02EC', '\u032C', // voiced
  '\u02B0', // aspirated
  '\u0339', // more rounded
  '\u031C', // less rounded
  '\u02D6', '\u031F', // advanced
  '\u02CD', '\u0320', // retracted
  '\u0308', // centralized
  '\u02DF', '\u033D', // mid-centralized
  '\u02CC', '\u0329', // syllabic
  '\u032F', // non-syllabic
  '\u02DE', // rhoticity
  '\u0324', // breathy voiced
  '\u02F7', '\u0330', // creaky voiced
  '\u033C', // linguolabial
  '\u02B7', // labialized
  '\u02B2', // palatalized
  '\u02E0', // velarized
  '\u02E4', // pharyngealized
  '\u0334', // velarized or pharyngealized
  '\u02D4', '\u031D', // raised
  '\u02D5', '\u031E', // lowered
  '\u0318', // advanced tongue root
  '\u0319', // retracted tongue root
  '\u032A', // dental
  '\u02FD', '\u033A', // apical
  '\u033B', // laminal
  '\u0303', // nasalized
  '\u207F', // nasal release
  '\u02E1', // lateral release
  '\u02FA', '\u031A', // no audible release

  // Suprasegmentals
  'ˈ', 'ˌ', 'ː', 'ˑ', '\u0306', '|', '‖', '.', '‿',

  // Tone levels
  '\u030B', '˥', // extra high
  '\u0301', '˦', // high
  '\u0304', '˧', // mid
  '\u0300', '˨', // low
  '\u030F', '˩', // extra low
  'ꜜ', // downstep
  'ꜛ', // upstep

  // Tone contours
  // Note: The symbols for rising, falling, high rising, and low falling are composed of the symbols
  // already listed under tone levels.
  '\u030C', // rising
  '\u0302', // falling
  '\u1DC4', // high rising
  '\u1DC5', // low rising
  '\u1DC8', // rising-falling
  '↗', // global rise
  '↘', // global fall
]);
