import { WordPronunciation } from '../../pronunciation-sources.ts/pronunciation-source';
import { PronunciationNormalizationError } from '../normalization';
import { DictionaryCreationIssueBase } from './dictionary-creation-issue-base';
import { errorTypeToMessage } from './utils';

export class PronunciationNormalizationIssue extends DictionaryCreationIssueBase {
  constructor(
    private wordPronunciation: WordPronunciation,
    private error: PronunciationNormalizationError,
  ) {
    super(wordPronunciation.language);
  }

  get message() {
    return errorTypeToMessage(this.error.type);
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
