import { createWriteStream, emptyDirSync, writeFileSync } from 'fs-extra';
import { pick } from 'lodash';
import { join as joinPaths } from 'path';
import { dictionariesDir } from '../directories';
import { toCompactJson } from '../utils/to-compact-json';
import { Dictionary } from './create-dictionary';

export function writeDictionaryFiles(dictionaries: Dictionary[]) {
  emptyDirSync(dictionariesDir);

  for (const dictionary of dictionaries) {
    writeDictionaryFile(dictionary);
  }
  writeMetadataFile(dictionaries);
}

function writeDictionaryFile(dictionary: Dictionary) {
  const stream = createWriteStream(
    joinPaths(
      dictionariesDir,
      `dictionry-${dictionary.metadata.language}.json`,
    ),
  );
  try {
    stream.write('{\n');
    for (const [word, pronunciations] of dictionary.data) {
      stream.write(
        `  ${JSON.stringify(word)}: [${pronunciations
          .map(p => JSON.stringify(p))
          .join(', ')}],\n`,
      );
    }
    stream.write('};\n');
  } finally {
    stream.end();
  }
}

function writeMetadataFile(dictionaries: Dictionary[]) {
  const path = joinPaths(dictionariesDir, 'metadata.json');
  const metadata = dictionaries.map(dictionary => dictionary.metadata);
  const reducedMetadata = pick(
    metadata,
    'language',
    'description',
    'graphemes',
    'phonemes',
  );
  writeFileSync(path, toCompactJson(reducedMetadata));
}
