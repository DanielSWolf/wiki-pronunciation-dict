import { emptyDirSync, writeFileSync } from 'fs-extra';
import { join as joinPaths } from 'path';
import { dictionariesDir } from '../directories';
import { LanguageLookup } from '../languages/language-lookup';
import { englishCollator, getCollator } from '../utils/collation';
import { toCompactJson } from '../utils/to-compact-json';
import { Dictionary, DictionaryData } from './create-dictionary';
import { getName } from '@cospired/i18n-iso-languages';

export function writeDictionaryFiles(dictionaries: Dictionary[]) {
  emptyDirSync(dictionariesDir);

  for (const dictionary of dictionaries) {
    writeDataFile(`${dictionary.language}-raw.json`, dictionary.rawData);
    if (dictionary.data !== undefined) {
      writeDataFile(`${dictionary.language}.json`, dictionary.data);

      writeMetadataFile(
        `${dictionary.language}-metadata.json`,
        dictionary.languageLookup,
      );
    }
  }
}

function writeDataFile(fileName: string, data: DictionaryData) {
  let result = '{\n';

  let index = 0;
  for (const [word, pronunciations] of data) {
    const wordString = JSON.stringify(word);
    const pronunciationsString = pronunciations
      .map(p => JSON.stringify(p))
      .join(', ');
    const separator = index < data.size - 1 ? ',' : '';
    result += `  ${wordString}: [${pronunciationsString}]${separator}\n`;
    index++;
  }
  result += '}\n';

  writeFileSync(joinPaths(dictionariesDir, fileName), result);
}

function writeMetadataFile(
  fileName: string,
  languageLookup: LanguageLookup<any, any>,
) {
  const { language } = languageLookup;

  const languageName = getName(language, 'en');

  // Order graphemes using language-specific sorting rules
  const graphemes = [...languageLookup.graphemes].sort(
    getCollator(languageLookup.language).compare,
  );

  // Order phonemes using English sorting rules
  const phonemes = [...languageLookup.phonemes].sort(englishCollator.compare);

  const path = joinPaths(dictionariesDir, fileName);
  writeFileSync(
    path,
    toCompactJson({ language, languageName, graphemes, phonemes }),
  );
}
