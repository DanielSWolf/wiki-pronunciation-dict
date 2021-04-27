import { IpaParserErrorType } from '../../ipa/ipa-parser';
import { WordPronunciation } from '../../pronunciation-sources.ts/pronunciation-source';
import {
  PronunciationNormalizationError,
  PronunciationNormalizationErrorType,
} from '../normalization';
import { DictionaryCreationIssueBase } from './dictionary-creation-issue-base';

export class PronunciationNormalizationIssue extends DictionaryCreationIssueBase {
  constructor(
    private wordPronunciation: WordPronunciation,
    private error: PronunciationNormalizationError,
  ) {
    super(wordPronunciation.language);
  }

  get message() {
    switch (this.error.type) {
      case IpaParserErrorType.MissingDelimiters:
        return "Missing '[]' or '//' delimiters.";
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

  get cells() {
    const { location } = this.error;
    return [
      {
        title: 'Invalid IPA symbol',
        value: JSON.stringify(
          location.input.substring(location.start, location.end),
        ),
      },
      {
        title: 'Pronunciation',
        value: this.wordPronunciation.pronunciation,
      },
      {
        title: 'Word',
        value: this.wordPronunciation.word,
      },
    ];
  }
}
