import { emptyDirSync, writeFileSync } from 'fs-extra';
import { join as joinPaths } from 'path';
import { dictionariesDir } from '../directories';
import { LanguageLookup } from '../languages/language-lookup';
import { englishCollator, getCollator } from '../utils/collation';
import { toCompactJson } from '../utils/to-compact-json';
import { Dictionary, DictionaryData } from './create-dictionary';
import { DefaultMap } from '../utils/default-map';
import { sortMap } from '../utils/sort-map';
import inspect from 'object-inspect';
import { getLanguageName } from '../language';

export function writeDictionaryFiles(dictionaries: Dictionary[]) {
  emptyDirSync(dictionariesDir);

  for (const dictionary of dictionaries) {
    writeDataFile(`${dictionary.language}-raw.json`, dictionary.rawData);
    if (dictionary.data !== undefined) {
      writeDataFile(`${dictionary.language}.json`, dictionary.data);

      writeMetadataFile(
        `${dictionary.language}-metadata.json`,
        dictionary.languageLookup,
        dictionary.data,
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
  data: DictionaryData,
) {
  const { language } = languageLookup;

  const languageName = getLanguageName(language);

  // Order graphemes using language-specific sorting rules
  const graphemes = [...languageLookup.graphemes].sort(
    getCollator(languageLookup.language).compare,
  );

  // Order phonemes using English sorting rules
  const phonemes = [...languageLookup.phonemes].sort(englishCollator.compare);

  const graphemeDistribution = Object.fromEntries(
    getGraphemeDistribution(languageLookup, data),
  );
  const phonemeDistribution = Object.fromEntries(
    getPhonemeDistribution(languageLookup, data),
  );

  const path = joinPaths(dictionariesDir, fileName);
  writeFileSync(
    path,
    toCompactJson({
      language,
      languageName,
      graphemes,
      phonemes,
      graphemeDistribution,
      phonemeDistribution,
    }),
  );
}

function getGraphemeDistribution(
  languageLookup: LanguageLookup<any, any>,
  data: DictionaryData,
): ReadonlyMap<string, number> {
  const graphemeSet = new Set(languageLookup.graphemes);

  const result = new DefaultMap<string, number>(() => 0);
  for (const word of data.keys()) {
    for (const grapheme of [...word]) {
      if (!graphemeSet.has(grapheme)) {
        const context = { language: languageLookup.language, word };
        throw new Error(
          `Invalid grapheme ${inspect(grapheme)}. ${inspect(context)}`,
        );
      }

      result.set(grapheme, result.getOrCreate(grapheme) + 1);
    }
  }

  // Order by descending frequency
  sortMap(result, (a, b) => b[1] - a[1]);
  return result;
}

function getPhonemeDistribution(
  languageLookup: LanguageLookup<any, any>,
  data: DictionaryData,
): ReadonlyMap<string, number> {
  const phonemeSet = new Set(languageLookup.phonemes);

  const result = new DefaultMap<string, number>(() => 0);
  for (const [word, pronunciations] of data.entries()) {
    for (const pronunciation of pronunciations) {
      for (const phoneme of pronunciation.split(' ')) {
        if (!phonemeSet.has(phoneme)) {
          const context = {
            language: languageLookup.language,
            word,
            pronunciation,
          };
          throw new Error(
            `Invalid phoneme ${inspect(phoneme)}. ${inspect(context)}`,
          );
        }

        result.set(phoneme, result.getOrCreate(phoneme) + 1);
      }
    }
  }

  // Order by descending frequency
  sortMap(result, (a, b) => b[1] - a[1]);
  return result;
}
