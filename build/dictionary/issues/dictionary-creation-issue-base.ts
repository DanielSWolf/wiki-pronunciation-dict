import { Cell, Issue, IssueSeverity } from '../../issue-logging';
import { Language } from '../../language';

export abstract class DictionaryCreationIssueBase implements Issue {
  abstract message: string;

  severity = IssueSeverity.Normal;

  constructor(protected language: Language) {}

  get logFileName() {
    return `language-${this.language}`;
  }

  abstract cells: Cell[];
}
