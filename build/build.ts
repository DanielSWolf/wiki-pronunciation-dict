import { writeDictionaryFiles } from './dictionary/write-dictionary-files';
import { pronunciationSourceWiktionaryEn } from './pronunciation-sources.ts/pronunciation-source-wiktionary-en';
import { pronunciationSourceWiktionaryDe } from './pronunciation-sources.ts/pronunciation-source-wiktionary-de';
import { runAsyncMain } from './utils/run-async-main';
import { wiktionaryEditionToString } from './wiktionary/wiktionary-edition';
import { WordPronunciation } from './pronunciation-sources.ts/pronunciation-source';
import { createIssueLogFiles } from './issue-logging';
import { createDictionaries } from './dictionary/create-dictionaries';
import { pronunciationSourceWiktionaryFr } from './pronunciation-sources.ts/pronunciation-source-wiktionary-fr';
import { pronunciationSourceWiktionaryIt } from './pronunciation-sources.ts/pronunciation-source-wiktionary-it';
import { timeAction } from './utils/time-action';
import { CachingPronunciationSource } from './pronunciation-sources.ts/caching-pronunciation-source';
import { BlocklistingPronunciationSource } from './pronunciation-sources.ts/blocklisting-pronunciation-source';
import ejs from 'ejs';
import { readFileSync, writeFileSync } from 'fs';
import { getLanguageName } from './language';
import QuickChart from 'quickchart-js';
import { WiktionaryEdition } from './wiktionary/wiktionary-edition';
import { join as joinPaths } from 'path';
import { dictionariesDir } from './directories';

const pronunciationSources = [
  pronunciationSourceWiktionaryEn,
  pronunciationSourceWiktionaryDe,
  pronunciationSourceWiktionaryFr,
  pronunciationSourceWiktionaryIt,
]
  .map(
    pronunciationSource => new CachingPronunciationSource(pronunciationSource),
  )
  .map(
    pronunciationSource =>
      new BlocklistingPronunciationSource(pronunciationSource),
  );

async function main() {
  try {
    const wordPronunciations: WordPronunciation[] = [];
    await timeAction('loading pronunciations', async () => {
      for (const pronunciationSource of pronunciationSources) {
        console.log(
          `Loading pronunciations from ${wiktionaryEditionToString(
            pronunciationSource.edition,
          )}.`,
        );
        for await (const pronunciation of pronunciationSource.getPronunciations()) {
          wordPronunciations.push(pronunciation);
        }
      }
    });

    const dictionaries = await timeAction('creating dictionaries', () =>
      createDictionaries(wordPronunciations),
    );

    timeAction('writing dictionary files', () =>
      writeDictionaryFiles(dictionaries),
    );

    timeAction('writing README file', () => {
      const template = readFileSync('README.ejs.md', 'utf-8');
      writeFileSync(
        'README.md',
        ejs.render(template, {
          dictionaries: dictionaries.filter(
            dictionary => dictionary.languageLookup,
          ),
          wordPronunciations,
          getLanguageName,
          WiktionaryEdition,
          QuickChart,
          nodeVersion: process.versions.node.replace(/^v/, ''),
          deJson: readFileSync(joinPaths(dictionariesDir, 'de.json'), 'utf-8'),
          deMetadataJson: readFileSync(
            joinPaths(dictionariesDir, 'de-metadata.json'),
            'utf-8',
          ),
        }),
      );
    });

    timeAction('creating issue log files', () => createIssueLogFiles());
  } catch (error) {
    console.error(error, error.stack);
    process.exit(1);
  }
}

runAsyncMain(main);
