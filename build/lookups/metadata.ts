import { Language } from '../language';

export interface Metadata {
  language: Language;
  description: string;
  graphemes: string[];
  phonemes: string[];
  graphemeReplacements: Replacement[];
  phonemeReplacements: Replacement[];
}

export type Replacement = [RegExp, string];

export const knownMetadataByLanguage = new Map<Language, Metadata>();
