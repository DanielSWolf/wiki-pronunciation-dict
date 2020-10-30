import { Line } from './page-parser';

export interface ParseError {
  line: Line;
  code: string;
  data?: any;
}

export function unexpectedLanguageLineFormatError(line: Line): ParseError {
  return {
    line,
    code: 'unexpected-language-line-format',
  }
}

export function mismatchingRedundantWordInfoError(line: Line): ParseError {
  return {
    line,
    code: 'mismatching-redundant-word-info',
  }
}

export function unsupportedLanguageNameError(languageName: string, line: Line): ParseError {
  return {
    line,
    code: 'unsupported-language-name',
    data: languageName,
  }
}

export function pronunciationOutsideOfLanguageSectionError(line: Line): ParseError {
  return {
    line,
    code: 'pronunciation-outside-of-language-section',
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

export function pronunciationOutsideOfPronunciationBlockError(line: Line): ParseError {
  return {
    line,
    code: 'pronunciation-outside-of-pronunciation-block',
  }
}
