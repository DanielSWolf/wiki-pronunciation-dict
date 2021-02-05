import { createWriteStream, emptyDirSync, writeFileSync } from 'fs-extra';
import { pick } from 'lodash';
import { join as joinPaths } from 'path';
import { dictionariesDir } from '../directories';
import { Metadata } from '../lookups/metadata';
import { englishCollator, getCollator } from '../utils/collation';
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
  const metadata = dictionaries.map(dictionary =>
    transformLanguageMetadata(dictionary.metadata),
  );
  writeFileSync(path, toCompactJson(metadata));
}

function transformLanguageMetadata(metadata: Metadata) {
  const { language, description } = metadata;

  // Order graphemes using language-specific sorting rules
  const graphemes = [...metadata.graphemes].sort(getCollator(language).compare);

  // Order phonemes using English sorting rules
  const phonemes = [...metadata.phonemes].sort(englishCollator.compare);

  return { language, description, graphemes, phonemes };
}
