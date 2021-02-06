import React from 'react';
import { Cell, Issue, IssueSeverity } from '../issue-logging';
import { Language } from '../language';
import { Metadata } from '../lookups/metadata';
import { toCompactJson } from '../utils/to-compact-json';
import { WordPronunciation } from '../pronunciation-sources.ts/pronunciation-source';
import {
  getPhoibleData,
  PhoibleInventory,
  PhoibleInventoryId,
  PhoibleLanguageRecord,
} from './phoible';

abstract class DictionaryCreationIssueBase implements Issue {
  abstract message: string;

  severity = IssueSeverity.Normal;

  constructor(protected language: Language) {}

  get logFileName() {
    return `language-${this.language}`;
  }

  abstract cells: Cell[];
}

export interface Distributions {
  graphemeDistribution: Distribution;
  phonemeDistribution: Distribution;
}

/** A frequency distribution, sorted by descending frequency. */
export type Distribution = Map<string, number>;

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
    private distributions: Distributions,
    private phoibleLanguageRecord: PhoibleLanguageRecord,
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
            {renderGraphemeStatistics(this.distributions.graphemeDistribution)}
            {renderPhonemeStatistics(
              this.phoibleLanguageRecord,
              this.distributions.phonemeDistribution,
            )}
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
  ) {
    super(wordPronunciation.language);
  }

  get cells() {
    return [
      {
        title: 'Invalid phoneme',
        value: JSON.stringify(this.invalidPhoneme),
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

export class InvalidGraphemeInWordIssue extends DictionaryCreationIssueBase {
  message = 'Invalid grapheme in word.';

  constructor(
    private wordPronunciation: WordPronunciation,
    private normalizedWord: string,
    private invalidGrapheme: string,
  ) {
    super(wordPronunciation.language);
  }

  get cells() {
    return [
      {
        title: 'Invalid grapheme',
        value: JSON.stringify(this.invalidGrapheme),
      },
      {
        title: 'Word',
        value: this.wordPronunciation.word,
      },
      {
        title: 'Normalized word',
        value: this.normalizedWord,
      },
    ];
  }
}

function renderGraphemeStatistics(distribution: Distribution) {
  return (
    <table
      className="table table-bordered"
      style={{ width: 'auto !important' }}
    >
      <tr>
        <th>Grapheme</th>
        <th className="text-right">Frequency</th>
      </tr>
      {[...distribution].map(([grapheme, frequency]) => (
        <tr>
          <td>{JSON.stringify(grapheme)}</td>
          <td>{frequency.toFixed(5)}</td>
        </tr>
      ))}
    </table>
  );
}

function renderPhonemeStatistics(
  phoibleLanguageRecord: PhoibleLanguageRecord,
  distribution: Distribution,
) {
  const inventories: PhoibleInventory[] = [
    ...phoibleLanguageRecord.inventories.values(),
  ];

  // Collect all distinct phonemes Phoible knows for this language and add them to the distribution
  const phoiblePhonemes = new Set(
    inventories.flatMap(inventory =>
      inventory.entries.map(entry => entry.phoneme),
    ),
  );
  const extendedDistribution = new Map(distribution);
  for (const phoneme of phoiblePhonemes) {
    if (!extendedDistribution.has(phoneme)) {
      extendedDistribution.set(phoneme, 0);
    }
  }

  return (
    <table
      className="table table-bordered"
      style={{ width: 'auto !important' }}
    >
      <tr>
        <th>Phoneme</th>
        <th className="text-right">Frequency</th>
        {inventories.map(inventory => (
          <th>
            <a
              href={`https://phoible.org/inventories/view/${inventory.inventoryId}`}
            >
              {inventory.inventoryName}
            </a>
          </th>
        ))}
      </tr>
      {[...extendedDistribution].map(([phoneme, frequency]) => (
        <tr>
          <td>{JSON.stringify(phoneme)}</td>
          <td>{frequency.toFixed(5)}</td>
          {inventories.map(inventory => (
            <td>{renderPhonemeCoverage(phoneme, inventory)}</td>
          ))}
        </tr>
      ))}
    </table>
  );
}

function renderPhonemeCoverage(phoneme: string, inventory: PhoibleInventory) {
  const hasExactMatch = inventory.entries.some(
    entry => entry.phoneme === phoneme,
  );
  if (hasExactMatch) {
    return <p className="text-success">✔</p>;
  }

  const partialMatches = inventory.entries
    .filter(entry => entry.phoneme.includes(phoneme))
    .map(entry => entry.phoneme);
  const allophoneMatches = inventory.entries
    .filter(entry => entry.allophones.includes(phoneme))
    .map(entry => entry.phoneme);
  const looseMatchesString = [
    ...(partialMatches.length > 0
      ? [
          `part of ${partialMatches
            .map(match => JSON.stringify(match))
            .join(', ')}`,
        ]
      : []),
    ...(allophoneMatches.length > 0
      ? [
          `allophone of ${allophoneMatches
            .map(match => JSON.stringify(match))
            .join(', ')}`,
        ]
      : []),
  ].join('; ');
  if (looseMatchesString) {
    return <p className="text-warning">{looseMatchesString}</p>;
  }

  return <p className="text-danger">-</p>;
}
