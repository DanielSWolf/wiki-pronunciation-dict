import { generateStats } from "./generate-stats";
import { createMultiLangDictionary, MultiLangDictionary } from "./multi-lang-dictionary";
import { generateSources } from './generate-sources';
import { pronunciationSourceWiktionaryEn } from "./pronunciation-sources.ts/pronunciation-source-wiktionary-en";
import { pronunciationSourceWiktionaryDe } from "./pronunciation-sources.ts/pronunciation-source-wiktionary-de";
import { PronunciationResult } from "./pronunciation-sources.ts/pronunciation-source";
import { runAsyncMain } from "./utils/run-async-main";
import { wiktionaryEditionToString } from "./wiktionary/wiktionary-edition";

function omitSparseLanguages(multiLangDictionary: MultiLangDictionary): MultiLangDictionary {
  const minWordCount = 500;
  return new Map([...multiLangDictionary].filter(([_, words]) => words.size >= minWordCount));
}

const pronunciationSources = [
  pronunciationSourceWiktionaryEn,
  pronunciationSourceWiktionaryDe,
]

async function main() {
  try {
    const pronunciationResults: PronunciationResult[] = [];
    for (const pronunciationSource of pronunciationSources) {
      console.log(`Loading pronunciations from ${wiktionaryEditionToString(pronunciationSource.edition)}.`);
      for await (const pronunciation of pronunciationSource.getPronunciations()) {
        pronunciationResults.push(pronunciation);
      }
    }

    console.log('Generating statistics.');
    generateStats(pronunciationResults);

    const multiLangDictionary = omitSparseLanguages(createMultiLangDictionary(pronunciationResults));

    console.log('Generating source files.');
    generateSources(multiLangDictionary);
  } catch (error) {
    console.error(error, error.stack);
    process.exit(1);
  }
}

runAsyncMain(main);
