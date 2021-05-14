import { Language } from '../language';
import { DefaultMap } from '../utils/default-map';
import { WiktionaryEdition } from '../wiktionary/wiktionary-edition';
import { PronunciationSource, WordPronunciation } from './pronunciation-source';

type BlocklistEntry = [
  edition: `${WiktionaryEdition}`,
  language: Language,
  word: string,
  pronunciation: string,
];

// This is a list of known bad Wiktionary entries.
const blocklist: BlocklistEntry[] = [
  //////////////////////////////////////////////////////////////////////////////
  // Not fixed in Wiktionary

  //////////////////////////////////////////////////////////////////////////////
  // Fixed in Wiktionary, but not yet part of a dump

  ['de', 'de', 'äbblichem', 'm̩'],
  ['de', 'de', 'äbblichen', 'n̩'],
  ['de', 'de', 'äbblicher', 'ɐ'],
  ['de', 'de', 'äbbliches', 'əs'],
  ['de', 'de', 'Mendesantilopen', 'ˈ n'],
  ['de', 'de', 'Speedcubings', 's'],
  ['de', 'en', 'endpoint', 'ˈend'],
  ['en', 'en', 'autonepiophilia', '/ˈɔː.təʊ/'],
  ['en', 'en', 'because', '/kəz/'],
  ['en', 'en', 'biodegradable', '/ˌbaɪ/'],
  ['en', 'en', 'biodegradable', '/baɪ/'],
  ['en', 'en', 'coloring', '/ˈkʌl.ɚ/'],
  ['en', 'en', 'dawned', '/dɑn/'],
  ['en', 'en', 'dawned', '/dɔːn/'],
  ['en', 'en', 'goathouse', '[ɡoʊ(ʔ)t̚]'],
  ['en', 'en', 'goathouse', '[ɡoʊʔ(t̚)]'],
  ['en', 'en', 'goathouse', '/ɡɐ̟ʉt/'],
  ['en', 'en', 'goathouse', '/ɡoːt/'],
  ['en', 'en', 'goathouse', '/ɡoʊt/'],
  ['en', 'en', 'have', '/ə/'],
  ['en', 'en', 'karaoke', '[æ]'],
  ['en', 'en', 'karaoke', '[æ]'],
  ['en', 'en', 'karaoke', '[ɑː]'],
  ['en', 'en', 'karaoke', '[ɑː]'],
  ['en', 'en', 'karaoke', '[e̞]'],
  ['en', 'en', 'karaoke', '[e̞]'],
  ['en', 'en', 'karaoke', '[eɪ]'],
  ['en', 'en', 'karaoke', '[eɪ]'],
  ['en', 'en', 'karaoke', '[ɛ]'],
  ['en', 'en', 'karaoke', '[ɛ]'],
  ['en', 'en', 'karaoke', '[iː]'],
  ['en', 'en', 'karaoke', '[iː]'],
  ['en', 'en', 'something', '[sʌ̃ː]'],
  ['en', 'en', 'toches', '/k/'],
  ['en', 'en', 'toches', '/x/'],
  ['fr', 'de', 'Chlorwasserstoffsäure', 'ˈzaltsˌzɔɪ̯ʀə'],
  ['fr', 'de', 'Feldflasche', 'vɔrt'],
  ['fr', 'de', 'Flugzeugträger', 'vɔrt'],
  ['fr', 'de', 'französischer', 'ˈʃpɪt͡sɐ'],
  ['fr', 'de', 'Kerzenlicht', 'vɔrt'],
  ['fr', 'de', 'Perchlorethylens', 'ˈʦaɪ̯tn̩'],
  ['fr', 'en', 'aerodynamics', 'ˈnæ.mɪks'],
  ['fr', 'en', 'backbite', 'ˌbɑɪt'],
  ['fr', 'en', 'bloodsport', 'blʌd.'],
  ['fr', 'en', 'bushing', 'bʊʃ'],
  ['fr', 'en', 'carvings', 'kɑːv'],
  ['fr', 'en', 'carvings', 'kɑɹv'],
  ['fr', 'en', 'certainly', 'li'],
  ['fr', 'en', 'chatting', 'tʃæt'],
  ['fr', 'en', 'disdainful', 'fəl'],
  ['fr', 'en', 'disobedient', 'ənt'],
  ['fr', 'en', 'eigenvector', 'ˌvɛk.tɜː'],
  ['fr', 'en', 'encampment', 'mənt'],
  ['fr', 'en', 'hilarity', 'ə.ti'],
  ['fr', 'en', 'instances', 'ɛ'],
  ['fr', 'en', 'lighthearted', 'ˌhɑːr.təd'],
  ['fr', 'en', 'permafrost', 'fɹɒst'],
  ['fr', 'en', 'psychoanalytic', 'ˌæ.nᵊl.ˈɪ.tɪk'],
  ['fr', 'en', 'repentant', 'ˈhæp.i'],
  ['fr', 'en', 'sorceress', 'rəs'],
  ['fr', 'en', 'stairway', 'ˌweɪ'],
  ['fr', 'en', 'sunbird', 'ˌbɜːd'],
  ['fr', 'en', 'thunderstorm', 'ˌstɔrm'],
  ['fr', 'en', 'translucent', 'sᵊnt'],
  ['fr', 'en', 'troublesome', 'səm'],
  ['it', 'en', 'posh', 'en'],
  ['it', 'en', 'prolix', 'en'],

  //////////////////////////////////////////////////////////////////////////////
  // Unclear how to fix in Wiktionary

  ['en', 'en', 'aquatic', '/w/'],
  ['en', 'en', 'can', '/æ/'],
  ['fr', 'en', 'beuk', 'ut'],

  //////////////////////////////////////////////////////////////////////////////
  // Not fixable in Wiktionary
];

export class BlocklistingPronunciationSource implements PronunciationSource {
  // An efficient copy of the edition-relevant part of the blocklist
  private blockSet = new DefaultMap(
    (_language: Language) =>
      new DefaultMap((_word: string) => new Set<string>()),
  );

  constructor(private source: PronunciationSource) {
    for (const [edition, language, word, pronunciation] of blocklist) {
      if (edition === source.edition) {
        this.blockSet
          .getOrCreate(language)
          .getOrCreate(word)
          .add(pronunciation);
      }
    }
  }

  get edition() {
    return this.source.edition;
  }

  async *getPronunciations(): AsyncIterable<WordPronunciation> {
    for await (const wordPronunciation of this.source.getPronunciations()) {
      const blocked = this.blockSet
        .get(wordPronunciation.language)
        ?.get(wordPronunciation.word)
        ?.has(wordPronunciation.pronunciation);
      if (!blocked) yield wordPronunciation;
    }
  }
}
