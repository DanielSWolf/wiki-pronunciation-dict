import { uniq } from 'lodash';
import { err, ok, Result } from 'neverthrow';
import inspect from 'object-inspect';

export type ParserResult<T> = Result<ParserSuccess<T>, ParserError>;

/**
 * A function that knows how to extract a value of a given type from a string.
 */
export type Parser<T> = (
  /** The input string */
  input: string,

  /** The start index within the string */
  start: number,
) => ParserResult<T>;

export interface ParserSuccess<TValue> {
  /** The extracted value */
  value: TValue;

  /**
   * The index within the input string of the first character that was not consumed by the parser
   */
  end: number;
}

export interface ParserError {
  /**
   * A list of human-readable descriptions of things that could have been -- but weren't -- valid
   * continuations of the input string.
   */
  expected: string[];

  /**
   * The index within the input string of the first character that was not consumed by the parser
   */
  end: number;
}

/** A parser function with additional properties containing combinator methods */
export type ExtendedParser<T> = Parser<T> & ParserExtension<T>;

/** Methods that can be called on a parser */
interface ParserExtension<T> {
  /**
   * Applies a transformation to the value of this parser, which may fail with an array of expected
   * strings
   */
  tryMap<TOut>(
    this: Parser<T>,
    transform: (value: T) => Result<TOut, string[]>,
  ): ExtendedParser<TOut>;

  /** Applies a transformation to the value of this parser */
  map<TOut>(
    this: Parser<T>,
    transform: (value: T) => TOut,
  ): ExtendedParser<TOut>;

  /** Overrides this parser's array of expected strings in case of failure */
  describe(this: Parser<T>, descriptions: string[]): ExtendedParser<T>;

  /** Applies the specified parser before this one, ignoring its value */
  after(this: Parser<T>, prefixParser: Parser<any>): ExtendedParser<T>;

  /** Applies the specified parser after this one, ignoring its value */
  before(this: Parser<T>, suffixParser: Parser<any>): ExtendedParser<T>;

  /** Applies the specified parsers before and after this one, ignoring their values */
  between(
    this: Parser<T>,
    prefixParser: Parser<any>,
    suffixParser: Parser<any>,
  ): ExtendedParser<T>;
}

/** Matches nothing */
export const nothing: ExtendedParser<void> = extend((input, start) =>
  ok({ value: undefined, end: start }),
);

/** Matches the end of the input */
export const end: ExtendedParser<void> = extend((input, start) =>
  start === input.length
    ? ok({ value: undefined, end: start })
    : err({ expected: ['end of input'], end: start }),
);

/**
 * Matches any `count` UTF-16 code units.
 *
 * The resulting value is a string of length `count`, which may or may not contain `count` full
 * Unicode code points.
 */
export const codeUnits = (count: number): ExtendedParser<string> =>
  extend((input, start) => {
    const end = start + count;
    return end <= input.length
      ? ok({ value: input.substring(start, end), end })
      : err({
          expected: [count !== 1 ? `${count} characters` : '1 character'],
          end: start,
        });
  });

/**
 * Matches any `count` Unicode code points.
 *
 * The length of the resulting string is greater than or equal to `count`.
 */
export const codePoints = (count: number): ExtendedParser<string> =>
  extend((input, start) => {
    let value: string = '';
    let codePointCount = 0;
    // Iterate over code points
    for (const codePoint of input.substring(start)) {
      if (codePointCount === count) break;

      value += codePoint;
      codePointCount++;
    }

    return codePointCount === count
      ? ok({ value, end: start + value.length })
      : err({
          expected: [count !== 1 ? `${count} characters` : '1 character'],
          end: start,
        });
  });

/** Matches the specified string. */
export const str = (s: string): ExtendedParser<string> =>
  extend((input, start) => {
    const result = codeUnits(s.length)(input, start);
    return result.isOk() && result.value.value === s
      ? ok({ value: s, end: result.value.end })
      : err({ expected: [inspect(s)], end: start });
  });

/** Matches the specified regular expression. */
export const regex = (regex: RegExp): ExtendedParser<string> =>
  extend((input, start) => {
    if (regex.global) {
      throw new Error(
        `Expected non-global regular expression, got ${inspect(regex)}.`,
      );
    }

    const substring = input.substring(start);
    const match = substring.match(regex);
    if (match === null || match.index !== 0) {
      return err({
        expected: [`string matching ${inspect(regex)}`],
        end: start,
      });
    }

    const value = match[0];
    return ok({ value, end: start + value.length });
  });

/** Matches one or more whitespace characters */
export const whitespace: ExtendedParser<string> = extend((input, start) => {
  let index = start;
  while (index < input.length && ' \t\r\n'.includes(input[index])) index++;
  return index > start
    ? ok({ value: input.substring(start, index), end: index })
    : err({ expected: ['whitespace'], end: start });
});

/** Applies the first matching parser out of a homogenous list. */
export function alt<TValue>(
  ...parsers: Parser<TValue>[]
): ExtendedParser<TValue>;

/** Applies the first matching parser out of a heterogenous list. */
export function alt<TValues extends any[]>(
  ...parsers: { [TIndex in keyof TValues]: Parser<TValues[TIndex]> }
): ExtendedParser<TupleUnion<TValues>>;

export function alt(...parsers: any): ExtendedParser<any> {
  if (parsers.length === 0) {
    throw new Error('Expected at least on parser, got 0.');
  }

  return extend((input, start) => {
    let bestEnd: number = 0;
    let bestExpected: string[] = [];
    for (const parser of parsers) {
      const result = parser(input, start);
      if (result.isOk()) return result;

      if (result.error.end > bestEnd) {
        bestEnd = result.error.end;
        bestExpected = [...result.error.expected];
      } else if (result.error.end === bestEnd) {
        bestExpected.push(...result.error.expected);
      }
    }
    return err({ expected: uniq(bestExpected), end: bestEnd });
  });
}

type TupleUnion<T extends any[]> = T extends [infer TFirst, ...infer TRest]
  ? TFirst | TupleUnion<TRest>
  : never;

/** Applies the parser only if it matches */
export const opt = <T>(parser: Parser<T>): ExtendedParser<T | void> =>
  alt(parser, nothing);

/** Applies the specified parsers in order, returning their values as an array */
export const seq = <TResults extends any[]>(
  ...parsers: { [TIndex in keyof TResults]: Parser<TResults[TIndex]> }
): ExtendedParser<TResults> =>
  extend((input, start) => {
    const values = ([] as unknown) as TResults;
    let index = start;
    for (const parser of parsers) {
      const result = parser(input, index);
      if (result.isErr()) return err(result.error);

      values.push(result.value.value);
      index = result.value.end;
    }
    return ok({ value: values, end: index });
  });

/** Applies the specified parsers in order, returning their values as an object */
export const seqObj = <TResults extends object>(
  parsers: { [TKey in keyof TResults]: Parser<TResults[TKey]> },
): ExtendedParser<TResults> =>
  extend((input, start) => {
    const values = {} as TResults;
    let index = start;
    for (const key of Object.keys(parsers) as (keyof TResults)[]) {
      const parser = parsers[key];
      const result = parser(input, index);
      if (result.isErr()) return err(result.error);

      values[key] = result.value.value;
      index = result.value.end;
    }
    return ok({ value: values, end: index });
  });

interface ListOptions {
  min?: number;
  max?: number;
  count?: number;
  separatorParser?: Parser<any>;
}

export function list<T>(
  parser: Parser<T>,
  options?: Pick<ListOptions, 'min' | 'max' | 'separatorParser'>,
): ExtendedParser<T[]>;

export function list<T>(
  parser: Parser<T>,
  options?: Pick<ListOptions, 'count' | 'separatorParser'>,
): ExtendedParser<T[]>;

/** Matches a list of items with an optional separator */
export function list<T>(
  parser: Parser<T>,
  options?: ListOptions,
): ExtendedParser<T[]> {
  return extend((input, start) => {
    const min = options?.min ?? options?.count ?? 0;
    const max = options?.max ?? options?.count ?? Number.MAX_SAFE_INTEGER;
    if (min > max) {
      throw new Error(`min (${min}) must not be greater than max (${max}).`);
    }

    const separatorParser = options?.separatorParser ?? nothing;
    let inputIndex = start;
    const values: T[] = [];
    for (let valueIndex = 0; valueIndex < max; valueIndex++) {
      const itemParser =
        valueIndex === 0 ? parser : extend(parser).after(separatorParser);
      const result = itemParser(input, inputIndex);
      if (result.isErr()) {
        return values.length < min
          ? err(result.error)
          : ok({ value: values, end: inputIndex });
      } else {
        values.push(result.value.value);
        inputIndex = result.value.end;
      }
    }
    return ok({ value: values, end: inputIndex });
  });
}

export function extend<T>(parser: Parser<T>): ExtendedParser<T> {
  const extension: ParserExtension<T> = {
    /** If the current parser succeeds: transforms the value or fails */
    tryMap(transform) {
      return extend((input, start) => {
        const result = this(input, start);
        if (result.isErr()) return err(result.error);

        const mappedResult = transform(result.value.value);
        return mappedResult.isOk()
          ? ok({ value: mappedResult.value, end: result.value.end })
          : err({ expected: mappedResult.error, end: start });
      });
    },

    /** If the current parser succeeds: transforms the value */
    map(transform) {
      return extend(this).tryMap(value => ok(transform(value)));
    },

    /** Changes the 'expected' string array returned on failure */
    describe(descriptions) {
      return extend((input, start) =>
        this(input, start).mapErr(error => ({
          expected: descriptions,
          end: error.end,
        })),
      );
    },

    /** Applies the specified parser before the current one, discarding its value */
    after(prefixParser) {
      return seqObj({ prefix: prefixParser, main: this }).map(
        values => values.main,
      );
    },

    /** Applies the specified parser after the current one, discarding its value */
    before(suffixParser) {
      return seqObj({ main: this, suffix: suffixParser }).map(
        values => values.main,
      );
    },

    /**
     * Applies the specified parsers before and after the current one, discarding their values
     */
    between(prefixParser, suffixParser) {
      return seqObj({
        prefix: prefixParser,
        main: this,
        suffix: suffixParser,
      }).map(values => values.main);
    },
  };

  const parserCopy = parser.bind(null);
  return Object.assign(parserCopy, extension);
}
