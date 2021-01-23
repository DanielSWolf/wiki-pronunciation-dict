import { Language } from '../language';
import { PronunciationRetrievalError } from './pronunciation-retrieval-errors';
import { WiktionaryEdition } from '../wiktionary/wiktionary-edition';

/** A word-pronunciation pair for a given language */
export interface WordPronunciation {
  sourceEdition: WiktionaryEdition;
  language: Language;
  word: string;
  pronunciation: string;
}

export type PronunciationResult =
  | WordPronunciation
  | PronunciationRetrievalError;

export function isPronunciationRetrievalError(
  result: PronunciationResult,
): result is PronunciationRetrievalError {
  return 'code' in result;
}

export interface PronunciationSource {
  edition: WiktionaryEdition;
  getPronunciations(): AsyncIterable<PronunciationResult>;
}
