import { IssueSeverity } from '../../issue-logging';
import { DictionaryCreationIssueBase } from './dictionary-creation-issue-base';

export class LanguageNotSupportedByNodeIssue extends DictionaryCreationIssueBase {
  message = 'Language is not supported by Node.';
  severity = IssueSeverity.High;
  cells = [];
}
