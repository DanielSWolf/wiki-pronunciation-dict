import { err, ok, Err, Ok } from 'neverthrow';
import {
  codeUnits,
  codePoints,
  end,
  nothing,
  str,
  regex,
  alt,
  seq,
  opt,
  whitespace,
  seqObj,
  list,
  Parser,
  ExtendedParser,
  extend,
} from '../../build/utils/parser-combinator';

describe('nothing', () => {
  it('succeeds with an empty string', () => {
    expect(nothing('', 0)).toEqual(ok({ value: undefined, end: 0 }));
  });

  it('succeeds at the start of a string', () => {
    expect(nothing('foo', 0)).toEqual(ok({ value: undefined, end: 0 }));
  });

  it('succeeds in the middle of a string', () => {
    expect(nothing('foo', 1)).toEqual(ok({ value: undefined, end: 1 }));
  });

  it('succeeds at the end of a string', () => {
    expect(nothing('foo', 3)).toEqual(ok({ value: undefined, end: 3 }));
  });
});

describe('end', () => {
  it('succeeds with an empty string', () => {
    expect(end('', 0)).toEqual(ok({ value: undefined, end: 0 }));
  });

  it('succeeds at the end of a string', () => {
    expect(end('test', 4)).toEqual(ok({ value: undefined, end: 4 }));
  });

  it('fails at the start of a string', () => {
    expect(end('test', 0)).toEqual(err({ expected: ['end of input'], end: 0 }));
  });

  it('fails in the middle of a string', () => {
    expect(end('test', 2)).toEqual(err({ expected: ['end of input'], end: 2 }));
  });
});

describe('codeUnits', () => {
  it('succeeds if the specified number of characters is left', () => {
    expect(codeUnits(0)('', 0)).toEqual(ok({ value: '', end: 0 }));
    expect(codeUnits(0)('test', 2)).toEqual(ok({ value: '', end: 2 }));
    expect(codeUnits(0)('test', 4)).toEqual(ok({ value: '', end: 4 }));

    expect(codeUnits(1)('bar', 0)).toEqual(ok({ value: 'b', end: 1 }));
    expect(codeUnits(1)('bar', 2)).toEqual(ok({ value: 'r', end: 3 }));

    expect(codeUnits(2)('bar', 0)).toEqual(ok({ value: 'ba', end: 2 }));
    expect(codeUnits(2)('bar', 1)).toEqual(ok({ value: 'ar', end: 3 }));

    expect(codeUnits(3)('bar', 0)).toEqual(ok({ value: 'bar', end: 3 }));
  });

  it('disregards Unicode code point boundaries', () => {
    expect(codeUnits(1)('😀', 0)).toEqual(ok({ value: '😀'[0], end: 1 }));
  });

  it('fails if the specified number of characters is not left', () => {
    expect(codeUnits(1)('bar', 3)).toEqual(
      err({ expected: ['1 character'], end: 3 }),
    );
    expect(codeUnits(3)('bar', 1)).toEqual(
      err({ expected: ['3 characters'], end: 1 }),
    );
    expect(codeUnits(100)('bar', 0)).toEqual(
      err({ expected: ['100 characters'], end: 0 }),
    );
  });
});

describe('codePoints', () => {
  describe('if the specified number of Unicode code points is left', () => {
    it('succeeds', () => {
      // NOTE: Each of the fruit emojis contains of 2 UTF-16 code units
      expect(codePoints(0)('', 0)).toEqual(ok({ value: '', end: 0 }));
      expect(codePoints(0)('test🍋🍍🍎', 10)).toEqual(
        ok({ value: '', end: 10 }),
      );

      expect(codePoints(1)('test🍋🍍🍎', 0)).toEqual(
        ok({ value: 't', end: 1 }),
      );
      expect(codePoints(1)('test🍋🍍🍎', 8)).toEqual(
        ok({ value: '🍎', end: 10 }),
      );

      expect(codePoints(2)('test🍋🍍🍎', 3)).toEqual(
        ok({ value: 't🍋', end: 6 }),
      );
    });
  });

  describe('if the specified number of Unicode code points is not left', () => {
    it('fails', () => {
      // NOTE: Each of the fruit emojis contains of 2 UTF-16 code units
      expect(codePoints(1)('test🍋🍍🍎', 10)).toEqual(
        err({ expected: ['1 character'], end: 10 }),
      );
      expect(codePoints(2)('test🍋🍍🍎', 8)).toEqual(
        err({ expected: ['2 characters'], end: 8 }),
      );
      expect(codePoints(100)('bar', 0)).toEqual(
        err({ expected: ['100 characters'], end: 0 }),
      );
    });
  });
});

describe('str', () => {
  describe('if input contains the specified string at the start position', () => {
    it('succeeds', () => {
      expect(str('st🍋')('test🍋🍍🍎', 2)).toEqual(
        ok({ value: 'st🍋', end: 6 }),
      );
    });
  });

  describe("if the specified string doesn't exist at the start position", () => {
    it('fails', () => {
      expect(str('test')('a test', 1)).toEqual(
        err({ expected: ["'test'"], end: 1 }),
      );
    });

    it('fails even if a prefix can be matched', () => {
      expect(str('test')('rite', 2)).toEqual(
        err({ expected: ["'test'"], end: 2 }),
      );
    });
  });
});

describe('regex', () => {
  describe('if the regex matches the specified string at the start position', () => {
    it('succeeds', () => {
      expect(regex(/fo+/)('bar foo baz', 4)).toEqual(
        ok({ value: 'foo', end: 7 }),
      );
      expect(regex(/baz$/)('foo baz', 4)).toEqual(ok({ value: 'baz', end: 7 }));
    });
  });

  describe("if the regex doesn't match the specified string at the start position", () => {
    it('fails', () => {
      expect(regex(/fo+/)('fee baz', 0)).toEqual(
        err({ expected: ['string matching /fo+/'], end: 0 }),
      );
    });

    it('fails even if the regex matches later', () => {
      expect(regex(/fo+/)('bar foo baz', 0)).toEqual(
        err({ expected: ['string matching /fo+/'], end: 0 }),
      );
    });
  });
});

describe('whitespace', () => {
  describe('if at least one whitespace character exists at the start position', () => {
    it('succeeds with all consecutive whitespace characters', () => {
      expect(whitespace('foo \n\t\r\n test', 4)).toEqual(
        ok({ value: '\n\t\r\n ', end: 9 }),
      );
    });
  });

  describe('if no whitespace characters exists at the start position', () => {
    it('fails', () => {
      expect(whitespace('foo ', 2)).toEqual(
        err({ expected: ['whitespace'], end: 2 }),
      );
    });
  });
});

describe('alt', () => {
  describe('if at least one parser succeeds', () => {
    it('succeeds', () => {
      expect(
        alt(str('no'), str('nope'), str('yes'), str('nah'))('yes', 0),
      ).toBeInstanceOf(Ok);
    });

    it('returns the result of the first successful parser', () => {
      expect(
        alt(
          str('test').map(() => true),
          str('test').map(() => false),
        )('my test', 3),
      ).toEqual(ok({ value: true, end: 7 }));
    });

    it('removes duplicate expected values', () => {
      expect(alt(str('foo'), str('bar'), str('foo'))('baz', 0)).toEqual(
        err({ expected: ["'foo'", "'bar'"], end: 0 }),
      );
    });
  });

  describe('if all parsers fail', () => {
    it('fails', () => {
      expect(alt(str('no'), str('nope'))('yes', 2)).toBeInstanceOf(Err);
    });

    it('returns the results of the parsers that came furthest', () => {
      expect(
        alt(
          str('foobar'),
          seq(str('foo'), str('bar')),
          seq(str('foo'), str('blubb')),
          str('blubb'),
        )('my foobaz', 3),
      ).toEqual(err({ expected: ["'bar'", "'blubb'"], end: 6 }));
    });
  });

  it('throws if no parsers were specified', () => {
    expect(() => alt()('test', 0)).toThrow(
      'Expected at least on parser, got 0.',
    );
  });
});

describe('opt', () => {
  describe('if the parser succeeds', () => {
    it("succeeds with the parser's result", () => {
      expect(opt(str('test'))('my test', 3)).toEqual(
        ok({ value: 'test', end: 7 }),
      );
    });
  });

  describe('if the parser fails', () => {
    it('succeeds with void value', () => {
      expect(opt(str('nope'))('my test', 3)).toEqual(
        ok({ value: undefined, end: 3 }),
      );
    });
  });
});

const int = regex(/\d+/).map(parseInt).describe(['an integer']);

describe('seq', () => {
  describe('if all parsers succeed', () => {
    it("succeeds with an array of all parsers' values", () => {
      expect(seq(int, whitespace, int)('test 42 10', 5)).toEqual(
        ok({ value: [42, ' ', 10], end: 10 }),
      );
    });

    it('succeeds with an empty array if no parsers were specified', () => {
      expect(seq()('test', 2)).toEqual(ok({ value: [], end: 2 }));
    });
  });

  describe('if any parser fails', () => {
    it('fails with the result of the failing parser', () => {
      expect(seq(int, whitespace, int)('test 42', 5)).toEqual(
        err({ expected: ['whitespace'], end: 7 }),
      );
    });
  });
});

describe('seqObj', () => {
  describe('if all parsers succeed', () => {
    it("succeeds with an object of all parsers' values", () => {
      expect(
        seqObj({ n1: int, ws: whitespace, n2: int })('test 42 10', 5),
      ).toEqual(ok({ value: { n1: 42, ws: ' ', n2: 10 }, end: 10 }));
    });

    it('succeeds with an empty object if no parsers were specified', () => {
      expect(seqObj({})('test', 2)).toEqual(ok({ value: {}, end: 2 }));
    });
  });

  describe('if any parser fails', () => {
    it('fails with the result of the failing parser', () => {
      expect(
        seqObj({ n1: int, ws: whitespace, n2: int })('test 42', 5),
      ).toEqual(err({ expected: ['whitespace'], end: 7 }));
    });
  });
});

const name = regex(/[A-Z][a-z]+/).describe(['a name']);

describe('list', () => {
  describe('without options', () => {
    describe('if parser fails', () => {
      it('succeeds with an empty array', () => {
        expect(list(name)('Anne', 1)).toEqual(ok({ value: [], end: 1 }));
      });
    });

    describe('if parser succeeds once', () => {
      it('succeeds with a 1-element array', () => {
        expect(list(name)('AnneBernard123', 4)).toEqual(
          ok({ value: ['Bernard'], end: 11 }),
        );
      });
    });

    describe('if parser succeeds 3 times', () => {
      it('succeeds with a 3-element array', () => {
        expect(list(name)('AnneBernardClaireDavid007', 4)).toEqual(
          ok({ value: ['Bernard', 'Claire', 'David'], end: 22 }),
        );
      });
    });
  });

  describe('with min=2 and max=3', () => {
    describe('if parser fails', () => {
      it('fails', () => {
        expect(list(name, { min: 2, max: 3 })('Anne', 1)).toEqual(
          err({ expected: ['a name'], end: 1 }),
        );
      });
    });

    describe('if parser succeeds once', () => {
      it('fails', () => {
        expect(list(name, { min: 2, max: 3 })('AnneBernard123', 4)).toEqual(
          err({ expected: ['a name'], end: 11 }),
        );
      });
    });

    describe('if parser succeeds 2 times', () => {
      it('succeeds', () => {
        expect(
          list(name, { min: 2, max: 3 })('AnneBernardClaire007', 4),
        ).toEqual(ok({ value: ['Bernard', 'Claire'], end: 17 }));
      });
    });

    describe('if parser succeeds 3 times', () => {
      it('succeeds', () => {
        expect(
          list(name, { min: 2, max: 3 })('AnneBernardClaireDavid123', 4),
        ).toEqual(ok({ value: ['Bernard', 'Claire', 'David'], end: 22 }));
      });
    });

    describe('if parser could succeed 4 times', () => {
      it('succeeds with 3-element array', () => {
        expect(
          list(name, { min: 2, max: 3 })('AnneBernardClaireDavidEve123', 4),
        ).toEqual(ok({ value: ['Bernard', 'Claire', 'David'], end: 22 }));
      });
    });
  });

  describe('with count=2', () => {
    describe('if parser fails', () => {
      it('fails', () => {
        expect(list(name, { count: 2 })('Anne', 1)).toEqual(
          err({ expected: ['a name'], end: 1 }),
        );
      });
    });

    describe('if parser succeeds once', () => {
      it('fails', () => {
        expect(list(name, { count: 2 })('AnneBernard123', 4)).toEqual(
          err({ expected: ['a name'], end: 11 }),
        );
      });
    });

    describe('if parser succeeds 2 times', () => {
      it('succeeds', () => {
        expect(list(name, { count: 2 })('AnneBernardClaire007', 4)).toEqual(
          ok({ value: ['Bernard', 'Claire'], end: 17 }),
        );
      });
    });

    describe('if parser could succeed 3 times', () => {
      it('succeeds with 2-element array', () => {
        expect(
          list(name, { count: 2 })('AnneBernardClaireDavid123', 4),
        ).toEqual(ok({ value: ['Bernard', 'Claire'], end: 17 }));
      });
    });
  });

  describe('with separatorParser', () => {
    it('parses separators between elements', () => {
      expect(
        list(int, { separatorParser: whitespace })('list: 2 4 6   ', 6),
      ).toEqual(ok({ value: [2, 4, 6], end: 11 }));
    });
  });
});

const failAfterOne: ExtendedParser<any> = extend((input, start) =>
  err({ expected: ['failing'], end: start + 1 }),
);

describe('extend', () => {
  let parser: Parser<number>;
  let extendedParser: ExtendedParser<number>;

  beforeEach(() => {
    parser = (input, start) => ok({ value: 42, end: start });
    extendedParser = extend(parser);
  });

  it('returns a function with extension methods', () => {
    expect(typeof extendedParser.map).toBe('function');
  });

  it("doesn't modify the original parser", () => {
    expect(extendedParser).not.toBe(parser);

    expect(extendedParser).toHaveProperty('map');
    expect(parser).not.toHaveProperty('map');
  });

  describe('#tryMap', () => {
    describe('if the original parser fails', () => {
      it("doesn't call the callback", () => {
        const callback = jest.fn();
        failAfterOne.tryMap(callback)('test', 0);
        expect(callback).not.toHaveBeenCalled();
      });

      it("fails with the original parser's result", () => {
        const callback = jest.fn();
        expect(failAfterOne.tryMap(callback)('test', 2)).toEqual(
          err({ expected: ['failing'], end: 3 }),
        );
      });
    });

    describe('if the original parser succeeds', () => {
      it('calls the callback with the value', () => {
        const callback = jest.fn().mockReturnValue(ok('x'));
        str('s').tryMap(callback)('test', 2);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith('s');
      });

      describe('if the callback returns a success value', () => {
        it('succeeds with the callback value', () => {
          const callback = jest.fn().mockReturnValue(ok(42));
          expect(str('s').tryMap(callback)('test', 2)).toEqual(
            ok({ value: 42, end: 3 }),
          );
        });
      });

      describe('if the callback returns an error', () => {
        it('fails with the expected strings returned by the callback', () => {
          const callback = jest.fn().mockReturnValue(err(['foo', 'bar']));
          expect(str('s').tryMap(callback)('test', 2)).toEqual(
            err({ expected: ['foo', 'bar'], end: 2 }),
          );
        });
      });
    });
  });

  describe('#map', () => {
    describe('if the original parser fails', () => {
      it("doesn't call the callback", () => {
        const callback = jest.fn();
        failAfterOne.map(callback)('test', 0);
        expect(callback).not.toHaveBeenCalled();
      });

      it("fails with the original parser's result", () => {
        const callback = jest.fn();
        expect(failAfterOne.map(callback)('test', 2)).toEqual(
          err({ expected: ['failing'], end: 3 }),
        );
      });
    });

    describe('if the original parser succeeds', () => {
      it('calls the callback with the value', () => {
        const callback = jest.fn().mockReturnValue('x');
        str('s').map(callback)('test', 2);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith('s');
      });

      it("succeeds with the callback's return value", () => {
        const callback = jest.fn().mockReturnValue(42);
        expect(str('s').map(callback)('test', 2)).toEqual(
          ok({ value: 42, end: 3 }),
        );
      });
    });
  });

  describe('#describe', () => {
    describe('if the original parser fails', () => {
      it("fails at the original parser's end position with the specified expected strings", () => {
        expect(failAfterOne.describe(['foo', 'bar'])('test', 2)).toEqual(
          err({ expected: ['foo', 'bar'], end: 3 }),
        );
      });
    });

    describe('if the original parser succeeds', () => {
      it("succeeds with the original parser's return value", () => {
        expect(str('s').describe(['foo', 'bar'])('test', 2)).toEqual(
          ok({ value: 's', end: 3 }),
        );
      });
    });
  });

  describe('#after', () => {
    describe('if the prefix parser fails', () => {
      it("doesn't call the original parser", () => {
        const fn = jest.fn();
        nothing.map(fn).after(failAfterOne)('test', 2);
        expect(fn).not.toHaveBeenCalled();
      });

      it("fails with the prefix parser's result", () => {
        expect(nothing.after(failAfterOne)('test', 2)).toEqual(
          err({ expected: ['failing'], end: 3 }),
        );
      });
    });

    describe('if the prefix parser succeeds', () => {
      describe('if the original parser fails', () => {
        it("fails with the original parser's result", () => {
          expect(failAfterOne.after(str('s'))('test', 2)).toEqual(
            err({ expected: ['failing'], end: 4 }),
          );
        });
      });

      describe('if the original parser succeeds', () => {
        it("succeeds with the original parser's result", () => {
          expect(str('t').after(str('s'))('test', 2)).toEqual(
            ok({ value: 't', end: 4 }),
          );
        });
      });
    });
  });

  describe('#before', () => {
    describe('if the original parser fails', () => {
      it("doesn't call the suffix parser", () => {
        const fn = jest.fn();
        failAfterOne.before(nothing.map(fn))('test', 2);
        expect(fn).not.toHaveBeenCalled();
      });

      it("fails with the original parser's result", () => {
        expect(failAfterOne.before(nothing)('test', 2)).toEqual(
          err({ expected: ['failing'], end: 3 }),
        );
      });
    });

    describe('if the original parser succeeds', () => {
      describe('if the suffix parser fails', () => {
        it("fails with the suffix parser's result", () => {
          expect(str('s').before(failAfterOne)('test', 2)).toEqual(
            err({ expected: ['failing'], end: 4 }),
          );
        });
      });

      describe('if the suffix parser succeeds', () => {
        it("succeeds with the original parser's value at the suffix parser's end position", () => {
          expect(str('s').before(str('t'))('test', 2)).toEqual(
            ok({ value: 's', end: 4 }),
          );
        });
      });
    });
  });

  describe('#between', () => {
    describe('if the prefix parser fails', () => {
      it("doesn't call the original parser", () => {
        const fn = jest.fn();
        nothing.map(fn).between(failAfterOne, nothing)('test', 2);
        expect(fn).not.toHaveBeenCalled();
      });

      it("fails with the prefix parser's result", () => {
        expect(nothing.between(failAfterOne, nothing)('test', 2)).toEqual(
          err({ expected: ['failing'], end: 3 }),
        );
      });
    });

    describe('if the prefix parser succeeds', () => {
      describe('if the original parser fails', () => {
        it("fails with the original parser's result", () => {
          expect(failAfterOne.between(str('s'), nothing)('test', 2)).toEqual(
            err({ expected: ['failing'], end: 4 }),
          );
        });
      });

      describe('if the original parser succeeds', () => {
        describe('if the suffix parser fails', () => {
          it("fails with the suffix parser's result", () => {
            expect(str('s').between(nothing, failAfterOne)('test', 2)).toEqual(
              err({ expected: ['failing'], end: 4 }),
            );
          });
        });

        describe('if the suffix parser succeeds', () => {
          it("succeeds with the original parser's value at the suffix parser's end position", () => {
            expect(str('s').between(str('e'), str('t'))('test', 1)).toEqual(
              ok({ value: 's', end: 4 }),
            );
          });
        });
      });
    });
  });
});
