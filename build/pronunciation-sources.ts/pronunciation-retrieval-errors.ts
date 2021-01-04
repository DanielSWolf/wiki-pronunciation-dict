import { WiktionaryLine } from '../wiktionary/wiktionary-page-parser';

export interface PronunciationRetrievalError {
  line: WiktionaryLine;
  code: string;
  data?: any;
}

export function unexpectedLanguageLineFormatError(line: WiktionaryLine): PronunciationRetrievalError {
  return {
    line,
    code: 'unexpected-language-line-format',
  }
}

export function mismatchingRedundantWordInfoError(line: WiktionaryLine): PronunciationRetrievalError {
  return {
    line,
    code: 'mismatching-redundant-word-info',
  }
}

export function unsupportedLanguageNameError(languageName: string, line: WiktionaryLine): PronunciationRetrievalError {
  return {
    line,
    code: 'unsupported-language-name',
    data: languageName,
  }
}

export function unsupportedLanguageCodeError(languageCode: string, line: WiktionaryLine): PronunciationRetrievalError {
  return {
    line,
    code: 'unsupported-language-code',
    data: languageCode,
  }
}

export function pronunciationOutsideOfLanguageSectionError(line: WiktionaryLine): PronunciationRetrievalError {
  return {
    line,
    code: 'pronunciation-outside-of-language-section',
  }
}

export function unexpectedPronunciationLineFormatError(line: WiktionaryLine): PronunciationRetrievalError {
  return {
    line,
    code: 'unexpected-pronunciation-line-format',
  }
}

export function unexpectedTemplateArgumentCountError(args: string[], line: WiktionaryLine): PronunciationRetrievalError {
  return {
    line,
    code: 'unexpected-template-argument-count',
    data: args,
  }
}

export function pronunciationOutsideOfPronunciationSectionError(line: WiktionaryLine): PronunciationRetrievalError {
  return {
    line,
    code: 'pronunciation-outside-of-pronunciation-section',
  }
}
