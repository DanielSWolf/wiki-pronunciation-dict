import { editions, editionToString } from "./editions";
import { parseWiktionaryEdition } from "./edition-parser";
import { ParseResult } from "./page-parser";
import { createStats } from "./stats";

async function main() {
  try {
    const parseResults: ParseResult[] = [];
    for (const edition of editions) {
      console.log(`Parsing ${editionToString(edition)}.`);
      for (const result of await parseWiktionaryEdition(edition)) {
        parseResults.push(result);
      }
    }

    createStats(parseResults);
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
