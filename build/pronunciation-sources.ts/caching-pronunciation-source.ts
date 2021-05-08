import { existsSync, readFileSync, writeFileSync } from 'fs';
import { ensureDirSync } from 'fs-extra';
import { join as joinPaths } from 'path';
import { cacheDir } from '../directories';
import { Language } from '../language';
import { toCompactJson } from '../utils/to-compact-json';
import { PronunciationSource, WordPronunciation } from './pronunciation-source';

type Cache = Array<[language: Language, word: string, pronunciation: string]>;

export class CachingPronunciationSource implements PronunciationSource {
  constructor(private source: PronunciationSource) {}

  get edition() {
    return this.source.edition;
  }

  async *getPronunciations(): AsyncIterable<WordPronunciation> {
    const cachePath = joinPaths(cacheDir, `${this.source.edition}.json`);
    if (existsSync(cachePath)) {
      const cache: Cache = JSON.parse(readFileSync(cachePath, 'utf-8'));
      for (const [language, word, pronunciation] of cache) {
        yield {
          sourceEdition: this.edition,
          language,
          word,
          pronunciation,
        };
      }
    } else {
      const cache: Cache = [];
      for await (const wordPronunciation of this.source.getPronunciations()) {
        yield wordPronunciation;
        cache.push([
          wordPronunciation.language,
          wordPronunciation.word,
          wordPronunciation.pronunciation,
        ]);
      }

      ensureDirSync(cacheDir);
      writeFileSync(cachePath, toCompactJson(cache));
    }
  }
}
