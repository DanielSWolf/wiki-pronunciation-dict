import { editions, editionToString } from "./editions";
import { parseWiktionaryEdition } from "./edition-parser";
import { ParseResult } from "./page-parser";
import { generateStats } from "./generate-stats";
import { createMultiLangDictionary, MultiLangDictionary } from "./multi-lang-dictionary";
import { generateSources } from './generate-sources';

function omitSparseLanguages(multiLangDictionary: MultiLangDictionary): MultiLangDictionary {
  const minWordCount = 500;
  return new Map([...multiLangDictionary].filter(([_, words]) => words.size >= minWordCount));
}

async function main() {
  try {
    const parseResults: ParseResult[] = [];
    for (const edition of editions) {
      console.log(`Parsing ${editionToString(edition)}.`);
      for (const result of await parseWiktionaryEdition(edition)) {
        parseResults.push(result);
      }
    }

    generateStats(parseResults);

    const multiLangDictionary = omitSparseLanguages(createMultiLangDictionary(parseResults));

    generateSources(multiLangDictionary);
  } catch (error) {
    console.error(error, error.stack);
    process.exit(1);
  }
}

// Prevent Node from exiting prematurely.
// See https://stackoverflow.com/questions/46914025
const maxInt32 = 2 ** 31 - 1;
const timeoutId = setTimeout(() => {}, maxInt32);
main().then(() => clearTimeout(timeoutId));
