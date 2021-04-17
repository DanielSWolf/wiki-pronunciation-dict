import { decomposeIpaString } from '../../build/ipa/decompose-ipa-string';
import { ipaLetters } from '../../build/ipa/ipa-letters';

function inspectString(s: string): string {
  const hex = [...s]
    .map(
      codePoint =>
        'U+' +
        codePoint.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0'),
    )
    .join(' ');
  return `${JSON.stringify(s)} (${hex})`;
}

describe('decomposeIpaString', () => {
  it("doesn't affect IPA letters", () => {
    for (const letter of ipaLetters) {
      expect(decomposeIpaString(letter)).toBe(letter);
    }
  });

  for (const [input, expected] of [
    ['\u025A', '\u0259\u02DE'], // ɚ
    ['\u025D', '\u025C\u02DE'], // ɝ
    ['\u00E5', '\u0061\u030A'], // å
    ['\u00EB', '\u0065\u0308'], // ë
  ]) {
    it(`converts ${inspectString(input)} to ${inspectString(expected)}`, () => {
      expect(decomposeIpaString('test ' + input + input)).toBe(
        'test ' + expected + expected,
      );
    });
  }
});
