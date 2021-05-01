import {
  findTemplates,
  parseWiktionaryPage,
  WiktionaryLine,
} from '../wiktionary/wiktionary-page-parser';
import { WiktionaryEdition } from '../wiktionary/wiktionary-edition';
import { PronunciationSource, WordPronunciation } from './pronunciation-source';
import {
  parseWiktionaryDump,
  WiktionaryPage,
} from '../wiktionary/wiktionary-dump-parser';
import { log } from '../issue-logging';
import {
  MismatchingRedundantWordInfoIssue,
  MissingTemplateArgumentIssue,
} from './pronunciation-retrieval-issues';
import { chunk } from 'lodash';

function* parsePronunciationLine(
  page: WiktionaryPage,
  line: WiktionaryLine,
): Iterable<WordPronunciation> {
  const pairs: [string, string][] = (() => {
    if (line.text.startsWith('*')) {
      // Line format: * <pronunciations>
      return [[page.title, line.text] as [string, string]];
    } else {
      // Line format: '''<expression>''' <pronunciations> ['''<expression>''' <pronunciations>]...
      const elements = line.text.split("'''").slice(1);
      const result = chunk(elements, 2).filter(
        (tuple): tuple is [string, string] => tuple.length === 2,
      );

      if (result.length > 0 && result[0][0] !== page.title) {
        log(new MismatchingRedundantWordInfoIssue(line));
        return result.slice(1);
      }

      return result;
    }
  })();

  for (const [word, pronunciationsString] of pairs) {
    const pronunciationTemplates = findTemplates<'pron' | 'lang' | 'l'>(
      'pron',
      ['pron', 'lang'],
      pronunciationsString,
    );

    for (const template of pronunciationTemplates) {
      const pronunciation = template.pron;
      const language = template.lang ?? template.l;

      if (!pronunciation) {
        // Some articles contain empty pronunciation placeholders
        break;
      }

      if (!language) {
        log(new MissingTemplateArgumentIssue(template, 'lang', line));
        break;
      }

      yield {
        sourceEdition: page.edition,
        language,
        word,
        pronunciation,
      };
    }
  }
}

async function* getPronunciationsFromPage(
  page: WiktionaryPage,
): AsyncIterable<WordPronunciation> {
  if (page.isSpecial) return;

  for (const line of parseWiktionaryPage(page)) {
    if (line.text.includes('{{pron|')) {
      yield* parsePronunciationLine(page, line);
    }
  }
}

export const pronunciationSourceWiktionaryFr: PronunciationSource = {
  edition: WiktionaryEdition.French,
  getPronunciations: async function* () {
    for await (const page of parseWiktionaryDump(WiktionaryEdition.French)) {
      yield* getPronunciationsFromPage(page);
    }
  },
};
