import { toCompactJson } from './utils/to-compact-json';
import { readFileSync, writeFileSync, emptyDirSync } from 'fs-extra';
import { dictionariesDir, outlyersDir } from './directories';
import { join as joinPaths } from 'path';
import glob from 'glob';

// This script creates files listing dictionary entries with suspiciously short and suspiciously
// long pronunciations.

const maxShortCount = 500;
const maxLongCount = 800;

emptyDirSync(outlyersDir);

const dictionaryFileNames = glob.sync('??.json', { cwd: dictionariesDir });
for (const dictionaryFileName of dictionaryFileNames) {
  const dictionaryFilePath = joinPaths(dictionariesDir, dictionaryFileName);
  console.log(`Processing ${dictionaryFilePath}.`);

  const entries = Object.entries<string[]>(
    JSON.parse(readFileSync(dictionaryFilePath, 'utf-8')),
  )
    .flatMap(([word, pronunciations]) =>
      pronunciations.map(pronunciation => {
        const phonemeCount = pronunciation.split(' ').length;
        const ratio = phonemeCount / word.length;
        return { word, pronunciation, ratio };
      }),
    )
    .sort((a, b) => a.word.length - b.word.length)
    .sort((a, b) => a.ratio - b.ratio)
    .map(({ word, pronunciation }) => [word, pronunciation]);

  const outlyers = {
    short: entries.slice(0, maxShortCount),
    long: [...entries].reverse().slice(0, maxLongCount),
  };

  writeFileSync(
    joinPaths(outlyersDir, dictionaryFileName),
    toCompactJson(outlyers),
  );
}
