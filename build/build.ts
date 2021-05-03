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

const pronunciationSources = [
  pronunciationSourceWiktionaryEn,
  pronunciationSourceWiktionaryDe,
  pronunciationSourceWiktionaryFr,
  pronunciationSourceWiktionaryIt,
];

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

    timeAction('creating issue log files', () => createIssueLogFiles());
  } catch (error) {
    console.error(error, error.stack);
    process.exit(1);
  }
}

runAsyncMain(main);
