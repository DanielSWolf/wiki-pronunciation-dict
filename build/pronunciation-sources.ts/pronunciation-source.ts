import { Language } from '../language';
import { WiktionaryEdition } from '../wiktionary/wiktionary-edition';

/** A word-pronunciation pair for a given language */
export interface WordPronunciation {
  sourceEdition: WiktionaryEdition;
  language: Language;
  word: string;
  pronunciation: string;
}

export interface PronunciationSource {
  edition: WiktionaryEdition;
  getPronunciations(): AsyncIterable<WordPronunciation>;
}
