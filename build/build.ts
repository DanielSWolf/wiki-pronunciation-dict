import { generateStats } from "./generate-stats";
import { createMultiLangDictionary, MultiLangDictionary } from "./multi-lang-dictionary";
import { generateSources } from './generate-sources';
import { pronunciationSourceWiktionaryDe } from "./pronunciation-sources.ts/pronunciation-source-wiktionary-de";
import { PronunciationResult } from "./pronunciation-sources.ts/pronunciation-source";
import { runAsyncMain } from "./utils/run-async-main";

function omitSparseLanguages(multiLangDictionary: MultiLangDictionary): MultiLangDictionary {
  const minWordCount = 500;
  return new Map([...multiLangDictionary].filter(([_, words]) => words.size >= minWordCount));
}

const pronunciationSources = [
  pronunciationSourceWiktionaryDe,
]

async function main() {
  try {
    const pronunciationResults: PronunciationResult[] = [];
    for (const pronunciationSource of pronunciationSources) {
      console.log(`Loading pronunciations from ${pronunciationSource.name}.`);
      await pronunciationSource.getPronunciations(result => pronunciationResults.push(result));
    }

    generateStats(pronunciationResults);

    const multiLangDictionary = omitSparseLanguages(createMultiLangDictionary(pronunciationResults));

    generateSources(multiLangDictionary);
  } catch (error) {
    console.error(error, error.stack);
    process.exit(1);
  }
}

runAsyncMain(main);
