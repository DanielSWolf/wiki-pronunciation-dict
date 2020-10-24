import { Line } from './page-parser';

export interface ParseError {
  line: Line;
  code: string;
  data?: any;
}

export function unsupportedLanguageNameError(languageName: string, line: Line): ParseError {
  return {
    line,
    code: 'unsupported-language-name',
    data: languageName,
  }
}

export function missingLanguageBeforePronunciationError(line: Line): ParseError {
  return {
    line,
    code: 'missing-language-before-pronunciation',
  }
}

export function unexpectedPronunciationLineFormatError(line: Line): ParseError {
  return {
    line,
    code: 'unexpected-pronunciation-line-format',
  }
}

export function unexpectedTemplateArgumentCountError(args: string[], line: Line): ParseError {
  return {
    line,
    code: 'unexpected-template-argument-count',
    data: args,
  }
}
