import inspect from 'object-inspect';
import { Language } from '../../language';
import { DictionaryCreationIssueBase } from './dictionary-creation-issue-base';

export class InvalidPhoiblePhonemeIssue extends DictionaryCreationIssueBase {
  constructor(
    language: Language,
    private phoiblePhoneme: string,
    private phoibleMessage: string,
  ) {
    super(language);
  }

  get message() {
    return `Invalid Phoible phoneme. ${this.phoibleMessage}`;
  }

  get cells() {
    return [
      {
        title: 'Phoneme',
        value: inspect(this.phoiblePhoneme),
      },
    ];
  }
}
