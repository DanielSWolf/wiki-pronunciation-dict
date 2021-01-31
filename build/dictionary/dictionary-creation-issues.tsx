import React from 'react';
import { Cell, Issue, IssueSeverity } from '../issue-logging';
import { Language } from '../language';
import { Frequencies, Metadata } from '../lookups/metadata';
import { toCompactJson } from '../utils/to-compact-json';
import { WordPronunciation } from '../pronunciation-sources.ts/pronunciation-source';

abstract class DictionaryCreationIssueBase implements Issue {
  abstract message: string;

  severity = IssueSeverity.Normal;

  constructor(protected language: Language) {}

  get logFileName() {
    return `language-${this.language}`;
  }

  abstract cells: Cell[];
}

export class LanguageNotSupportedByNodeIssue extends DictionaryCreationIssueBase {
  message = 'Language is not supported by Node.';
  severity = IssueSeverity.High;
  cells = [];
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

export class InvalidPhonemeInPronunciationIssue extends DictionaryCreationIssueBase {
  message = 'Invalid phoneme in pronunciation.';

  constructor(
    private wordPronunciation: WordPronunciation,
    private invalidPhoneme: string,
    private metadata: Metadata,
  ) {
    super(wordPronunciation.language);
  }

  get cells() {
    return [
      {
        title: 'Pronunciation',
        value: this.wordPronunciation.pronunciation,
      },
      {
        title: 'Invalid phoneme',
        value: this.invalidPhoneme,
      },
      {
        title: 'Valid phonemes',
        value: <code>{toCompactJson(this.metadata.phonemes)}</code>,
      },
      {
        title: 'Word',
        value: this.wordPronunciation.word,
      },
    ];
  }
}

export class InvalidGraphemeInWordIssue extends DictionaryCreationIssueBase {
  message = 'Invalid grapheme in word.';

  constructor(
    private wordPronunciation: WordPronunciation,
    private normalizedWord: string,
    private invalidGrapheme: string,
    private metadata: Metadata,
  ) {
    super(wordPronunciation.language);
  }

  get cells() {
    return [
      {
        title: 'Word',
        value: this.wordPronunciation.word,
      },
      {
        title: 'Normalized word',
        value: this.normalizedWord,
      },
      {
        title: 'Invalid grapheme',
        value: this.invalidGrapheme,
      },
      {
        title: 'Valid graphemes',
        value: <code>{toCompactJson(this.metadata.graphemes)}</code>,
      },
    ];
  }
}
