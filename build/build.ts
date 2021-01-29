import { writeDictionaryFiles } from './dictionary/write-dictionary-files';
import { pronunciationSourceWiktionaryEn } from './pronunciation-sources.ts/pronunciation-source-wiktionary-en';
import { pronunciationSourceWiktionaryDe } from './pronunciation-sources.ts/pronunciation-source-wiktionary-de';
import { runAsyncMain } from './utils/run-async-main';
import { wiktionaryEditionToString } from './wiktionary/wiktionary-edition';
import { WordPronunciation } from './pronunciation-sources.ts/pronunciation-source';
import { createIssueLogFiles } from './issue-logging';
import { createDictionaries } from './dictionary/create-dictionaries';

const pronunciationSources = [
  pronunciationSourceWiktionaryEn,
  pronunciationSourceWiktionaryDe,
];

async function main() {
  try {
    const wordPronunciations: WordPronunciation[] = [];
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

    console.log('Creating dictionaries.');
    const dictionaries = createDictionaries(wordPronunciations);

    console.log('Writing dictionary files.');
    writeDictionaryFiles(dictionaries);

    console.log('Creating issue log files.');
    await createIssueLogFiles();
  } catch (error) {
    console.error(error, error.stack);
    process.exit(1);
  }
}

runAsyncMain(main);
