import { stripIndent } from 'common-tags';
import { createWriteStream, emptyDirSync, writeFileSync } from "fs-extra";
import { join as joinPaths } from 'path';
import { MultiLangDictionary } from "./multi-lang-dictionary";

export function generateSources(multiLangDictionary: MultiLangDictionary) {
  const sourceDir = 'src';
  emptyDirSync(sourceDir);

  // Create data files
  for (const [language, singleLangDictionary] of multiLangDictionary) {
    const stream = createWriteStream(joinPaths(sourceDir, `data-${language}.js`));
    try {
      stream.write('module.exports = {\n');
      for (const [word, pronunciations] of singleLangDictionary) {
        stream.write(`  ${JSON.stringify(word)}: [${pronunciations.map(p => JSON.stringify(p)).join(', ')}],\n`);
      }
      stream.write('};\n');
    } finally {
      stream.end();
    }
  }

  // Create index.js
  const languages = [...multiLangDictionary.keys()];
  writeFileSync(
    joinPaths(sourceDir, 'index.js'),
    'exports.getDictionary = function(language) {\n'
    + '  switch(language) {\n'
    + languages.map(language => `    case '${language}': return require('data-${language}');\n`).join('')
    + '    default: return {};\n'
    + '  }\n'
    + '}\n'
    + '\n'
    + 'exports.getAllDictionaries = function() {\n'
    + '  return {\n'
    + languages.map(language => `    '${language}': require('data-${language}'),\n`).join('')
    + '  };\n'
    + '};\n',
  );

  // Create index.d.ts
  writeFileSync(
    joinPaths(sourceDir, 'index.d.ts'),
    stripIndent`
      export declare type Dictionary = {
        [word in string]?: string[];
      };
      export declare function getDictionary(language: string): Dictionary;
      export declare type MultiDictionary = {
          [language in string]?: Dictionary;
      };
      export declare function getAllDictionaries(): MultiDictionary;
    `
  )
}
