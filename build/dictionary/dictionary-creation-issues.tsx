import React from 'react';
import { Cell, Issue, IssueSeverity } from '../issue-logging';
import { Language } from '../language';
import { Frequencies, Metadata } from './create-dictionary';
import { toCompactJson } from '../utils/to-compact-json';

abstract class DictionaryCreationIssueBase implements Issue {
  abstract message: string;

  severity = IssueSeverity.Normal;

  constructor(protected language: Language) {}

  get logFileName() {
    return `language-${this.language}`;
  }

  abstract cells: Cell[];
}

export class MissingMetadataIssue extends DictionaryCreationIssueBase {
  message = 'Missing metadata for language.';
  severity = IssueSeverity.High;

  constructor(
    private generatedMetadata: Metadata,
    private frequencies: Frequencies,
  ) {
    super(generatedMetadata.language);
  }

  get cells() {
    return [
      {
        title: 'Info',
        value: (
          <>
            <p>
              There is no metadata for this language. The following metadata has
              been automatically generated but is probably too exhaustive.
            </p>
            <pre className="pre-scrollable" style={{ overflowX: 'scroll' }}>
              {toCompactJson(this.generatedMetadata)}
            </pre>
          </>
        ),
      },
    ];
  }
}
