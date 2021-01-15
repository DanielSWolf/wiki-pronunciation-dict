import { createWriteStream, emptyDirSync } from "fs-extra";
import { join as joinPaths } from 'path';
import { dataDir } from './directories';
import { MultiLangDictionary } from "./multi-lang-dictionary";

export function generateDataFiles(multiLangDictionary: MultiLangDictionary) {
  emptyDirSync(dataDir);

  for (const [language, singleLangDictionary] of multiLangDictionary) {
    const stream = createWriteStream(joinPaths(dataDir, `data-${language}.json`));
    try {
      stream.write('{\n');
      for (const [word, pronunciations] of singleLangDictionary) {
        stream.write(`  ${JSON.stringify(word)}: [${pronunciations.map(p => JSON.stringify(p)).join(', ')}],\n`);
      }
      stream.write('};\n');
    } finally {
      stream.end();
    }
  }
}
