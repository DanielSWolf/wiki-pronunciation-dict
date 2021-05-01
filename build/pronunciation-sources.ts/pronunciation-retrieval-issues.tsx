import inspect from 'object-inspect';
import React from 'react';
import { Cell, Issue, IssueSeverity } from '../issue-logging';
import { WiktionaryLine } from '../wiktionary/wiktionary-page-parser';

abstract class PronunciationRetrievalIssueBase implements Issue {
  abstract message: string;

  severity = IssueSeverity.Normal;

  constructor(protected line: WiktionaryLine) {}

  get logFileName() {
    return `wiktionary-${this.line.edition}`;
  }

  get cells(): Cell[] {
    return [
      {
        title: 'Position',
        value: (
          <a href={`https://de.wiktionary.org/wiki/${this.line.pageTitle}`}>
            {this.line.pageTitle}, line {this.line.index + 1}
          </a>
        ),
        comparisonValues: [this.line.pageTitle, this.line.index],
      },
      { title: 'Code', value: <code>{this.line.text}</code> },
    ];
  }
}

export class UnexpectedLanguageLineFormatIssue extends PronunciationRetrievalIssueBase {
  message = 'Unexpected language line format.';
}

export class MismatchingRedundantWordInfoIssue extends PronunciationRetrievalIssueBase {
  message = 'Mismatching redundant word info.';
}

export class UnsupportedLanguageNameIssue extends PronunciationRetrievalIssueBase {
  message = 'Unsupported language name.';
  constructor(private languageName: string, line: WiktionaryLine) {
    super(line);
  }
  get cells() {
    return [
      ...super.cells,
      { title: 'Language name', value: this.languageName },
    ];
  }
}

export class UnsupportedLanguageCodeIssue extends PronunciationRetrievalIssueBase {
  message = 'Unsupported language code.';
  constructor(private languageCode: string, line: WiktionaryLine) {
    super(line);
  }
  get cells() {
    return [
      ...super.cells,
      { title: 'Language code', value: this.languageCode },
    ];
  }
}

export class PronunciationOutsideOfLanguageSectionIssue extends PronunciationRetrievalIssueBase {
  message = 'Pronunciation outside of language section.';
  get type() {
    return PronunciationOutsideOfLanguageSectionIssue;
  }
}

export class UnexpectedPronunciationLineFormatIssue extends PronunciationRetrievalIssueBase {
  message = 'Unexpected pronunciation line format.';
  get type() {
    return UnexpectedPronunciationLineFormatIssue;
  }
}

export class MissingTemplateArgumentIssue<
  TTemplate extends object
> extends PronunciationRetrievalIssueBase {
  message = 'Missing template argument.';
  constructor(
    private template: TTemplate,
    private expectedArgumentName: keyof TTemplate,
    line: WiktionaryLine,
  ) {
    super(line);
  }
  get cells() {
    return [
      ...super.cells,
      { title: 'Expected argument', value: this.expectedArgumentName },
      {
        title: 'Arguments',
        value: <code>{inspect(this.template)}</code>,
      },
    ];
  }
}

export class PronunciationOutsideOfPronunciationSectionIssue extends PronunciationRetrievalIssueBase {
  message = 'Pronunciation outside of pronunciation section.';
  get type() {
    return PronunciationOutsideOfPronunciationSectionIssue;
  }
}
