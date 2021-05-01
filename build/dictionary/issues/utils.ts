import { IpaParserErrorType } from '../../ipa/ipa-parser';
import { PronunciationNormalizationErrorType } from '../normalization';

export function errorTypeToMessage(
  errorType: IpaParserErrorType | PronunciationNormalizationErrorType,
): string {
  switch (errorType) {
    case IpaParserErrorType.UnexpectedCharacter:
      return 'Unexpected character: not a common IPA symbol.';
    case IpaParserErrorType.IncompletePronunciation:
      return 'Incomplete pronunciation.';
    case IpaParserErrorType.IllegalDiacriticPosition:
      return 'Illegal diacritic position.';
    case PronunciationNormalizationErrorType.UnsupportedIpaSegment:
      return 'IPA segment not supported in target language.';
  }
}
