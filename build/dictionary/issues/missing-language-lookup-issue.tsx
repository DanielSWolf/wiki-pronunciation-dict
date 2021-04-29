import { IssueSeverity, log } from '../../issue-logging';
import { Language } from '../../language';
import { WordPronunciation } from '../../pronunciation-sources.ts/pronunciation-source';
import { DictionaryCreationIssueBase } from './dictionary-creation-issue-base';
import React from 'react';
import { DefaultMap } from '../../utils/default-map';
import { parseIpaString } from '../../ipa/ipa-parser';
import { getCollator } from '../../utils/collation';
import { ipaLetters } from '../../ipa/ipa-letters';
import { PhoibleData } from '../phoible';
import inspect from 'object-inspect';
import { zip } from 'lodash';
import { sortMap } from '../../utils/sort-map';
import { InvalidPhoiblePhonemeIssue } from './invalid-phoible-phoneme-issue';

export class MissingLanguageLookupIssue extends DictionaryCreationIssueBase {
  message = 'Missing language lookup for language.';
  severity = IssueSeverity.High;

  constructor(
    language: Language,
    private wordPronunciations: WordPronunciation[],
    private phoibleData: PhoibleData,
  ) {
    super(language);
  }

  get cells() {
    return [
      {
        title: 'Info',
        value: (
          <>
            <p>
              There is no language lookup for this language. Create a language
              lookup for this language based on the following statistics.
            </p>
            {this.renderGraphemeStatistics()}
            {this.renderPhonemeStatistics()}
          </>
        ),
      },
    ];
  }

  private renderGraphemeStatistics() {
    // Assemble frequency distribution for graphemes
    const graphemeDistribution = new DefaultMap<string, number>(() => 0);
    for (const { word } of this.wordPronunciations) {
      const lowerCaseWord = word
        .normalize('NFC')
        .toLocaleLowerCase(this.language);
      for (const grapheme of lowerCaseWord) {
        graphemeDistribution.set(
          grapheme,
          graphemeDistribution.getOrCreate(grapheme) + 1,
        );
      }
    }

    // Sort distribution by grapheme, according to the language's sorting rules
    const collator = getCollator(this.language);
    sortMap(graphemeDistribution, (a, b) => collator.compare(a[0], b[0]));

    // Render table
    return (
      <table
        className="table table-bordered"
        style={{ width: 'auto !important' }}
      >
        <tr>
          <th>Grapheme</th>
          <th className="text-right">Count</th>
        </tr>
        {[...graphemeDistribution].map(([grapheme, count]) => (
          <tr>
            <td>{grapheme}</td>
            <td className="text-right">{count.toLocaleString('en')}</td>
          </tr>
        ))}
      </table>
    );
  }

  private renderPhonemeStatistics() {
    // Reduce each word pronunciation to a sequence of IPA letters
    const reducedWordPronunciations: string[] = this.wordPronunciations
      .map(wordPronunciation => wordPronunciation.pronunciation)
      .flatMap(pronunciation => {
        const segmentSequencesResult = parseIpaString(pronunciation);
        if (segmentSequencesResult.isErr()) return [];

        return segmentSequencesResult.value.map(ipaSegmentSequence =>
          ipaSegmentSequence.map(segment => segment.letter).join(''),
        );
      });

    // Get the Phoible inventories for this language
    const inventories = this.phoibleData.get(this.language);
    if (inventories === undefined) {
      return `No Phoible data found for language ${inspect(this.language)}.`;
    }

    // Create a lookup that maps each Phoible phoneme to a reduced version
    // consisting only of IPA letters
    const reducedPhoiblePhonemesByPhoneme = new Map<string, string>(
      inventories.flatMap(inventory =>
        inventory.corePhonemes.flatMap(phonemeString => {
          const segmentSequencesResult = parseIpaString(phonemeString, {
            expectDelimiters: false,
          });
          if (segmentSequencesResult.isErr()) {
            log(
              new InvalidPhoiblePhonemeIssue(
                this.language,
                phonemeString,
                inspect(segmentSequencesResult.error),
              ),
            );
            return [];
          }

          const segmentSequences = segmentSequencesResult.value;
          return segmentSequences.map(
            segmentSequence =>
              [
                phonemeString,
                segmentSequence.map(segment => segment.letter).join(''),
              ] as const,
          );
        }),
      ),
    );

    // Collect reduced versions of all phoneme candidates:
    // ... from Phoible
    const reducedPhonemeCandidates = new Set<string>(
      reducedPhoiblePhonemesByPhoneme.values(),
    );
    // ... from word pronunciations
    for (const reducedPronunciation of reducedWordPronunciations) {
      for (const codePoint of reducedPronunciation) {
        reducedPhonemeCandidates.add(codePoint);
      }
    }

    // Assemble frequency distribution for all reduced phoneme candidates
    const reducedPhonemeDistribution = new Map<string, number>(
      [...reducedPhonemeCandidates].map(phoneme => [phoneme, 0]),
    );
    for (const reducedPronunciation of reducedWordPronunciations) {
      for (const reducedPhonemeCandidate of reducedPhonemeCandidates) {
        if (reducedPronunciation.includes(reducedPhonemeCandidate)) {
          reducedPhonemeDistribution.set(
            reducedPhonemeCandidate,
            reducedPhonemeDistribution.get(reducedPhonemeCandidate)! + 1,
          );
        }
      }
    }

    // Sort distribution by phoneme in IPA order
    sortMap(reducedPhonemeDistribution, (a, b) =>
      compareByIpaLetters(a[0], b[0]),
    );

    // Render table
    return (
      <table
        className="table table-bordered"
        style={{ width: 'auto !important' }}
      >
        <tr>
          <th>Reduced phoneme</th>
          <th className="text-right">Count</th>
          {inventories.map(inventory => (
            <th>
              <a href={`https://phoible.org/inventories/view/${inventory.id}`}>
                {inventory.name}
              </a>
            </th>
          ))}
        </tr>
        {[...reducedPhonemeDistribution].map(([reducedPhoneme, count]) => (
          <tr>
            <td>{reducedPhoneme}</td>
            <td className="text-right">{count.toLocaleString('en')}</td>
            {inventories.map(inventory => (
              <td>
                {inventory.corePhonemes
                  .filter(
                    phoneme =>
                      reducedPhoiblePhonemesByPhoneme.get(phoneme) ===
                      reducedPhoneme,
                  )
                  .join(', ')}
              </td>
            ))}
          </tr>
        ))}
      </table>
    );
  }
}

/** Assumes that a and b consist only of IPA letters */
function compareByIpaLetters(a: string, b: string): number {
  for (const [letterA, letterB] of zip([...a], [...b])) {
    if (letterA === undefined) return -1;
    if (letterB === undefined) return 1;

    const indexA = ipaLetters.indexOf(letterA as any);
    const indexB = ipaLetters.indexOf(letterB as any);
    if (indexA < indexB) return -1;
    if (indexA > indexB) return 1;
  }

  return 0;
}
