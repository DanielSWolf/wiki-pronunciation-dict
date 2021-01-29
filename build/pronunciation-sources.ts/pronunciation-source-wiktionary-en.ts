import { PronunciationSource, WordPronunciation } from './pronunciation-source';
import { join as joinPaths } from 'path';
import streamProgressbar from 'stream-progressbar';
import splitStream from 'split2';
import { downloadsDir } from '../directories';
import { createReadStream, existsSync, statSync } from 'fs-extra';
import { downloadFile } from '../utils/download-file';
import { WiktionaryEdition } from '../wiktionary/wiktionary-edition';
import { isNotNullish } from '../utils/is-not-nullish';

// The pronunciation source for the English Wiktionary, based on Wiktextract.
//
// Wiktextract (https://github.com/tatuylonen/wiktextract) is a Python package that parses the
// English Wiktionary edition. What sets it apart from similar projects is that it evaluates the
// many Lua scripts used in that edition. This is essential for extracting many of the
// pronunciations.

async function getWiktextractFilePath(): Promise<string> {
  const url =
    'https://kaikki.org/dictionary/All%20languages%20combined/kaikki.org-dictionary-all.json.bz2';
  const filePath = joinPaths(downloadsDir, 'wiktextract-all.json');
  await downloadFile(url, filePath, {
    description: 'Wiktextract data file',
    decompressBzip2: true,
    skipIfExists: true,
  });

  return filePath;
}

/** The information wiktextract returns for a given word */
interface WordRecord {
  word: string;
  lang_code: string;
  sounds?: Array<{
    /** IPA pronunciation */
    ipa?: string;

    /** "English pronunciation", see https://en.wiktionary.org/wiki/Appendix:English_pronunciation */
    enpr?: string;
  }>;
}

async function* getWiktextractPronunciations(): AsyncIterable<WordPronunciation> {
  const wiktextractFilePath = await getWiktextractFilePath();
  const lineStream = createReadStream(wiktextractFilePath)
    .pipe(
      streamProgressbar(':bar :percent processed (:etas remaining)', {
        total: statSync(wiktextractFilePath).size,
      }),
    )
    .pipe(splitStream());
  for await (const line of lineStream) {
    const wordRecord: WordRecord = JSON.parse(line);

    // We're only interested in common languages
    if (wordRecord.lang_code.length !== 2) continue;

    const pronunciations = (wordRecord.sounds ?? [])
      // We're ignoring enPR pronunciations for the time being.
      // Almost all words with enPR have IPA, too.
      .map(sound => sound.ipa?.replace(/^\[|\]$/g, ''))
      .filter(isNotNullish);
    for (const pronunciation of pronunciations) {
      yield {
        sourceEdition: WiktionaryEdition.English,
        language: wordRecord.lang_code,
        word: wordRecord.word,
        pronunciation: pronunciation,
      };
    }
  }
}

export const pronunciationSourceWiktionaryEn: PronunciationSource = {
  edition: WiktionaryEdition.English,
  getPronunciations: getWiktextractPronunciations,
};
