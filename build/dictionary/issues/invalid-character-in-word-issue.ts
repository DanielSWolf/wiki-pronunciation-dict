import { WordPronunciation } from '../../pronunciation-sources.ts/pronunciation-source';
import { DictionaryCreationIssueBase } from './dictionary-creation-issue-base';

export class InvalidCharacterInWordIssue extends DictionaryCreationIssueBase {
  message = 'Invalid character in word.';

  constructor(
    private wordPronunciation: WordPronunciation,
    private lowerCaseWord: string,
    private invalidCharacter: string,
  ) {
    super(wordPronunciation.language);
  }

  get cells() {
    return [
      {
        title: 'Invalid character',
        value: JSON.stringify(this.invalidCharacter),
      },
      {
        title: 'Word',
        value: this.wordPronunciation.word,
      },
      {
        title: 'Normalized word',
        value: this.lowerCaseWord,
      },
    ];
  }
}
