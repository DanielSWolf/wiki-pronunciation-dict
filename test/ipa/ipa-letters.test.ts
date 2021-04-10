import { consonants, ipaLetters, vowels } from '../../build/ipa/ipa-letters';

describe.each([
  ['consonants', consonants],
  ['vowels', vowels],
  ['ipaLetters', ipaLetters],
])('%s', (_, letters) => {
  test('each letter is in canonical composed form (NFC)', () => {
    for (const letter of letters) {
      expect(letter.normalize('NFC')).toBe(letter);
    }
  });

  test('each letter has exactly 1 UTF-16 code unit', () => {
    for (const letter of letters) {
      expect(letter.length).toBe(1);
    }
  });
});
