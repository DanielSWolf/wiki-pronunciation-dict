import { err, ok } from 'neverthrow';
import { IpaLetter } from '../../build/ipa/ipa-letters';
import {
  Diacritic,
  IpaSegment,
  parseIpaString,
  ParserErrorType,
  ParserLocation,
  Suprasegmental,
} from '../../build/ipa/ipa-parser';

describe('parseIpaString', () => {
  describe('succeeds with zero pronunciations for empty or whitespace input', () => {
    for (const input of ['', ' ', ' \t\r\n']) {
      test(JSON.stringify(input), () => {
        expect(parseIpaString(input)).toEqual(ok([]));
      });
    }
  });

  it('parses simple IPA strings', () => {
    expect(parseIpaString('[abc]')).toEqual(
      ok([
        [s('a', ['abc', 0, 1]), s('b', ['abc', 1, 2]), s('c', ['abc', 2, 3])],
      ]),
    );
  });

  it('fails on unsupported characters', () => {
    expect(parseIpaString('[abc?]')).toEqual(
      err({
        type: ParserErrorType.UnexpectedCharacter,
        location: l('abc?', 3, 4),
      }),
    );
  });

  describe('supports both [...] and /.../ delimiters', () => {
    test.each(['[a]', '/a/'])('%p', input => {
      expect(parseIpaString(input)).toEqual(ok([[s('a', ['a', 0, 1])]]));
    });
  });

  describe('fails if no valid delimiters are given', () => {
    test.each(['abc', '[abc', 'abc]', '/abc', 'abc/'])('%s', input => {
      expect(parseIpaString(input)).toEqual(
        err({
          type: ParserErrorType.MissingDelimiters,
          location: l(input, 0, input.length),
        }),
      );
    });
  });

  describe('fails on incomplete pronunciations', () => {
    test.each([
      ['/ˈkleɪ-/', l('ˈkleɪ-', 5, 6)],
      ['/-əʃ/', l('-əʃ', 0, 1)],
      ['[ɪk-]', l('ɪk-', 2, 3)],
      ['[-ɾi]', l('-ɾi', 0, 1)],
    ])('%s', (input, location) => {
      expect(parseIpaString(input)).toEqual(
        err({
          type: ParserErrorType.IncompletePronunciation,
          location,
        }),
      );
    });
  });

  it('ignores whitespace throughout', () => {
    expect(parseIpaString(' \t[\r\na b ] ')).toEqual(
      ok([[s('a', ['\r\na b ', 2, 3]), s('b', ['\r\na b ', 4, 5])]]),
    );
  });

  describe('parses diacritics and suprasegmentals', () => {
    test.each([
      [
        '[kl̥eɪ]',
        [
          s('k', ['kl̥eɪ', 0, 1]),
          s('l', ['kl̥eɪ', 1, 2], {
            diacritics: { voiceless: ['kl̥eɪ', 2, 3] },
          }),
          s('e', ['kl̥eɪ', 3, 4]),
          s('ɪ', ['kl̥eɪ', 4, 5]),
        ],
      ],
      [
        '[pʰɹ̠̊ɪm]',
        [
          s('p', ['pʰɹ̠̊ɪm', 0, 1], {
            diacritics: { aspirated: ['pʰɹ̠̊ɪm', 1, 2] },
          }),
          s('ɹ', ['pʰɹ̠̊ɪm', 2, 3], {
            diacritics: {
              retracted: ['pʰɹ̠̊ɪm', 3, 4],
              voiceless: ['pʰɹ̠̊ɪm', 4, 5],
            },
          }),
          s('ɪ', ['pʰɹ̠̊ɪm', 5, 6]),
          s('m', ['pʰɹ̠̊ɪm', 6, 7]),
        ],
      ],
      [
        '[ɛsˈtiːm]',
        [
          s('ɛ', ['ɛsˈtiːm', 0, 1]),
          s('s', ['ɛsˈtiːm', 1, 2], {
            right: { primaryStress: ['ɛsˈtiːm', 2, 3] },
          }),
          s('t', ['ɛsˈtiːm', 3, 4], {
            left: { primaryStress: ['ɛsˈtiːm', 2, 3] },
          }),
          s('i', ['ɛsˈtiːm', 4, 5], {
            right: { long: ['ɛsˈtiːm', 5, 6] },
          }),
          s('m', ['ɛsˈtiːm', 6, 7], {
            left: { long: ['ɛsˈtiːm', 5, 6] },
          }),
        ],
      ],
      [
        '/æbˈdək.ʃn̩/',
        [
          s('æ', ['æbˈdək.ʃn̩', 0, 1]),
          s('b', ['æbˈdək.ʃn̩', 1, 2], {
            right: { primaryStress: ['æbˈdək.ʃn̩', 2, 3] },
          }),
          s('d', ['æbˈdək.ʃn̩', 3, 4], {
            left: { primaryStress: ['æbˈdək.ʃn̩', 2, 3] },
          }),
          s('ə', ['æbˈdək.ʃn̩', 4, 5]),
          s('k', ['æbˈdək.ʃn̩', 5, 6], {
            right: { syllableBreak: ['æbˈdək.ʃn̩', 6, 7] },
          }),
          s('ʃ', ['æbˈdək.ʃn̩', 7, 8], {
            left: { syllableBreak: ['æbˈdək.ʃn̩', 6, 7] },
          }),
          s('n', ['æbˈdək.ʃn̩', 8, 9], {
            diacritics: { syllabic: ['æbˈdək.ʃn̩', 9, 10] },
          }),
        ],
      ],
      [
        '[t̠ɹ̠̊˔ʷɪi̯]',
        [
          s('t', ['t̠ɹ̠̊˔ʷɪi̯', 0, 1], {
            diacritics: { retracted: ['t̠ɹ̠̊˔ʷɪi̯', 1, 2] },
          }),
          s('ɹ', ['t̠ɹ̠̊˔ʷɪi̯', 2, 3], {
            diacritics: {
              retracted: ['t̠ɹ̠̊˔ʷɪi̯', 3, 4],
              voiceless: ['t̠ɹ̠̊˔ʷɪi̯', 4, 5],
              raised: ['t̠ɹ̠̊˔ʷɪi̯', 5, 6],
              labialized: ['t̠ɹ̠̊˔ʷɪi̯', 6, 7],
            },
          }),
          s('ɪ', ['t̠ɹ̠̊˔ʷɪi̯', 7, 8]),
          s('i', ['t̠ɹ̠̊˔ʷɪi̯', 8, 9], {
            diacritics: {
              nonSyllabic: ['t̠ɹ̠̊˔ʷɪi̯', 9, 10],
            },
          }),
        ],
      ],
      [
        '[d̠͡ɹ̠˔ʷʌɡ]',
        [
          s('d', ['d̠͡ɹ̠˔ʷʌɡ', 0, 1], {
            diacritics: { retracted: ['d̠͡ɹ̠˔ʷʌɡ', 1, 2] },
            right: { linking: ['d̠͡ɹ̠˔ʷʌɡ', 2, 3] },
          }),
          s('ɹ', ['d̠͡ɹ̠˔ʷʌɡ', 3, 4], {
            diacritics: {
              retracted: ['d̠͡ɹ̠˔ʷʌɡ', 4, 5],
              raised: ['d̠͡ɹ̠˔ʷʌɡ', 5, 6],
              labialized: ['d̠͡ɹ̠˔ʷʌɡ', 6, 7],
            },
            left: { linking: ['d̠͡ɹ̠˔ʷʌɡ', 2, 3] },
          }),
          s('ʌ', ['d̠͡ɹ̠˔ʷʌɡ', 7, 8]),
          s('ɡ', ['d̠͡ɹ̠˔ʷʌɡ', 8, 9]),
        ],
      ],
    ])('%p', (input, expectedPronunciation) => {
      expect(parseIpaString(input)).toEqual(ok([expectedPronunciation]));
    });
  });

  describe('fails on diacritics at illegal positions', () => {
    test('at start of pronunciation', () => {
      expect(parseIpaString('/\u0308a/')).toEqual(
        err({
          type: ParserErrorType.IllegalDiacriticPosition,
          location: l('\u0308a', 0, 1),
        }),
      );
    });

    test('after suprasegmental', () => {
      expect(parseIpaString('/ɑːʰ/')).toEqual(
        err({
          type: ParserErrorType.IllegalDiacriticPosition,
          location: l('ɑːʰ', 2, 3),
        }),
      );
    });
  });

  describe('if the input contains optional parts', () => {
    it('returns a minimal and a maximal version', () => {
      expect(parseIpaString('[ɑː(ɹ)m(ɪ)d⁽ʰ⁾]')).toEqual(
        ok([
          [
            s('ɑ', ['ɑːmd', 0, 1], { right: { long: ['ɑːmd', 1, 2] } }),
            s('m', ['ɑːmd', 2, 3], { left: { long: ['ɑːmd', 1, 2] } }),
            s('d', ['ɑːmd', 3, 4]),
          ],
          [
            s('ɑ', ['ɑːɹmɪdʰ', 0, 1], { right: { long: ['ɑːɹmɪdʰ', 1, 2] } }),
            s('ɹ', ['ɑːɹmɪdʰ', 2, 3], { left: { long: ['ɑːɹmɪdʰ', 1, 2] } }),
            s('m', ['ɑːɹmɪdʰ', 3, 4]),
            s('ɪ', ['ɑːɹmɪdʰ', 4, 5]),
            s('d', ['ɑːɹmɪdʰ', 5, 6], {
              diacritics: { aspirated: ['ɑːɹmɪdʰ', 6, 7] },
            }),
          ],
        ]),
      );
    });

    it('returns only one version if minimal and maximal results would be identical except for metadata', () => {
      expect(parseIpaString('[ɑː(ː)m( )d]')).toEqual(
        ok([
          [
            s('ɑ', ['ɑːmd', 0, 1], { right: { long: ['ɑːmd', 1, 2] } }),
            s('m', ['ɑːmd', 2, 3], { left: { long: ['ɑːmd', 1, 2] } }),
            s('d', ['ɑːmd', 3, 4]),
          ],
        ]),
      );
    });
  });
});

type CompactParserLocation = [input: string, start: number, end: number];

/** Creates a location */
function l(...[input, start, end]: CompactParserLocation): ParserLocation {
  return { input, start, end };
}

/** Creates a segment */
function s(
  letter: IpaLetter,
  letterLocation: CompactParserLocation,
  options?: {
    diacritics?: Partial<Record<Diacritic, CompactParserLocation>>;
    left?: Partial<Record<Suprasegmental, CompactParserLocation>>;
    right?: Partial<Record<Suprasegmental, CompactParserLocation>>;
  },
): IpaSegment {
  function toLocationMap(object: any) {
    return new Map<any, any>(
      Object.entries(object ?? {}).map(([key, location]) => [
        key,
        l(...(location as CompactParserLocation)),
      ]),
    );
  }
  return {
    letter,
    letterLocation: l(...letterLocation),
    diacritics: toLocationMap(options?.diacritics),
    left: toLocationMap(options?.left),
    right: toLocationMap(options?.right),
  };
}
